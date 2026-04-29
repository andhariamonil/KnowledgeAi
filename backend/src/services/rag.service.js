const { query } = require('../config/db');
const { embedText, generateAnswer } = require('./ai.service');

// ── Chunking ──────────────────────────────────────────────────────────────────
const CHUNK_SIZE    = 400; // tokens/words approx
const CHUNK_OVERLAP = 80;

/**
 * Smart text chunker: splits on paragraphs first, then by size.
 */
function chunkText(text) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 30);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    if ((current + para).split(/\s+/).length <= CHUNK_SIZE) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) chunks.push(current.trim());
      // paragraph itself too big — split by sentences
      if (words.length > CHUNK_SIZE) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        let buf = '';
        for (const sent of sentences) {
          if ((buf + ' ' + sent).split(/\s+/).length > CHUNK_SIZE) {
            if (buf) chunks.push(buf.trim());
            buf = sent;
          } else {
            buf = buf ? `${buf} ${sent}` : sent;
          }
        }
        if (buf) chunks.push(buf.trim());
        current = '';
      } else {
        current = para;
      }
    }
  }
  if (current) chunks.push(current.trim());

  // Add overlap: prepend tail of previous chunk
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const prev = chunks[i - 1];
    const overlapWords = prev.split(/\s+/).slice(-CHUNK_OVERLAP).join(' ');
    return `${overlapWords} ${chunk}`;
  });
}

// ── Indexing ──────────────────────────────────────────────────────────────────
/**
 * Index a document: chunk text → embed each chunk → store in pgvector.
 */
async function indexDocument(documentId, rawText, documentName) {
  const chunks = chunkText(rawText);
  if (chunks.length === 0) throw new Error('No content extracted from document');

  console.log(`📄 Indexing "${documentName}": ${chunks.length} chunks`);

  // Batch embed (sequential to avoid rate limits)
  const BATCH = 5;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await Promise.all(batch.map((_, j) =>
      embedChunkWithRetry(chunks[i + j])
    ));

    for (let j = 0; j < batch.length; j++) {
      const embedding = embeddings[j];
      const vectorStr = `[${embedding.join(',')}]`;
      await query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [
          documentId,
          i + j,
          batch[j],
          vectorStr,
          JSON.stringify({ source: documentName, chunkIndex: i + j }),
        ]
      );
    }
    console.log(`  Embedded chunks ${i + 1}–${Math.min(i + BATCH, chunks.length)} / ${chunks.length}`);
  }

  // Update document status + chunk count
  await query(
    `UPDATE documents SET status = 'indexed', chunk_count = $1, updated_at = NOW() WHERE id = $2`,
    [chunks.length, documentId]
  );

  return chunks.length;
}

async function embedChunkWithRetry(text, retries = 3) {
  const { embedText } = require('./ai.service');
  for (let i = 0; i < retries; i++) {
    try {
      return await embedText(text);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ── Retrieval ─────────────────────────────────────────────────────────────────
/**
 * Hybrid retrieval: semantic (cosine) + keyword (BM25/tsvector), merged by RRF.
 */
async function hybridRetrieve(questionEmbedding, questionText, workspaceId, topK = 5) {
  const vectorStr = `[${questionEmbedding.join(',')}]`;

  // 1. Semantic search via pgvector cosine similarity
  const semanticRes = await query(
    `SELECT
       dc.id, dc.content, dc.document_id, dc.metadata,
       1 - (dc.embedding <=> $1::vector) AS semantic_score,
       d.name AS doc_name, d.file_type
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE d.status = 'indexed'
       AND ($2::text = '' OR d.workspace_id = $2)
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $3`,
    [vectorStr, workspaceId || '', topK * 2]
  );

  // 2. Keyword search via full-text
  const keywordRes = await query(
    `SELECT
       dc.id, dc.content, dc.document_id, dc.metadata,
       ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', $1)) AS keyword_score,
       d.name AS doc_name, d.file_type
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE d.status = 'indexed'
       AND ($2::text = '' OR d.workspace_id = $2)
       AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', $1)
     ORDER BY keyword_score DESC
     LIMIT $3`,
    [questionText, workspaceId || '', topK * 2]
  );

  // 3. Reciprocal Rank Fusion
  const scores = {};
  const K = 60; // RRF constant

  semanticRes.rows.forEach((row, rank) => {
    scores[row.id] = (scores[row.id] || { row, score: 0 });
    scores[row.id].score += 1 / (K + rank + 1);
    scores[row.id].row = row;
  });

  keywordRes.rows.forEach((row, rank) => {
    scores[row.id] = scores[row.id] || { row, score: 0 };
    scores[row.id].score += 1 / (K + rank + 1);
  });

  const merged = Object.values(scores)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return merged.map(({ row }) => ({
    content:    row.content,
    source:     row.doc_name || row.metadata?.source || 'Unknown',
    documentId: row.document_id,
    type:       row.file_type || 'doc',
    metadata:   row.metadata,
  }));
}

// ── Full RAG Pipeline ─────────────────────────────────────────────────────────
/**
 * End-to-end: question → embed → hybrid retrieve → LLM → answer + sources
 */
async function ragQuery(question, workspaceId) {
  console.log(`🔍 RAG Query: "${question.slice(0, 60)}…"`);

  // 1. Embed question
  const questionEmbedding = await embedText(question);

  // 2. Hybrid retrieval
  const contexts = await hybridRetrieve(questionEmbedding, question, workspaceId, 5);

  if (contexts.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the knowledge base. Please make sure documents have been uploaded and indexed.",
      sources: [],
    };
  }

  // 3. Generate answer with LLM
  const answer = await generateAnswer(question, contexts);

  // 4. Deduplicate sources
  const seen = new Set();
  const sources = contexts
    .filter(c => { if (seen.has(c.source)) return false; seen.add(c.source); return true; })
    .map(c => ({ name: c.source, type: c.type, documentId: c.documentId }));

  return { answer, sources };
}

module.exports = { chunkText, indexDocument, hybridRetrieve, ragQuery };