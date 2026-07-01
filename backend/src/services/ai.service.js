// ── AI Service (Groq LLM + Local TF-IDF Embeddings) ──────────────────────────
// Groq: free, fast, no credit card needed → https://console.groq.com
// Embeddings: local math-based (no API needed, works offline)
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL   = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Lazy-load Groq SDK
let groqClient = null;
function getGroq() {
  if (!groqClient && GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
  }
  return groqClient;
}

// ── LOCAL EMBEDDINGS (TF-IDF inspired, 384 dims) ──────────────────────────────
// No API needed. Works offline. Deterministic — same text always gives same vector.
// Cosine similarity works correctly because vectors are L2-normalised.
//
// How it works:
//   1. Tokenise text into words
//   2. Hash each word into 2 positions in a 384-dim vector
//   3. Weight by term frequency
//   4. L2-normalise the result
//
// Accuracy: good enough for keyword+phrase matching.
// For production: swap with a proper embedding API (OpenAI, Cohere, etc.)

const DIMS = 384;

function localEmbed(text) {
  const vec   = new Float32Array(DIMS);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length === 0) return Array.from(vec);

  // Term frequency map
  const tf = {};
  for (const w of words) tf[w] = (tf[w] || 0) + 1 / words.length;

  // Hash words → vector positions
  for (const [word, freq] of Object.entries(tf)) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 0x01000193);
      h2 ^= c; h2 = Math.imul(h2, 0x811c9dc5);
    }
    vec[Math.abs(h1) % DIMS]         += freq;
    vec[Math.abs(h2) % DIMS]         += freq * 0.7;
    vec[Math.abs(h1 ^ h2) % DIMS]    += freq * 0.4;
  }

  // L2 normalise
  let norm = 0;
  for (let i = 0; i < DIMS; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec).map(v => v / norm);
}

// ── embedText ─────────────────────────────────────────────────────────────────
// Always returns a 384-dim float array. Never throws.
async function embedText(text) {
  return localEmbed(text.trim().slice(0, 1000));
}

async function embedBatch(texts) {
  return texts.map(t => localEmbed(t.trim().slice(0, 1000)));
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function wordsSimilar(a, b) {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  let diff = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) diff++;
  return diff <= 2;
}

function questionMatchesSource(question, sourceName) {
  const q = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const nameBase = sourceName.toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[_-]/g, ' ').trim();

  if (nameBase.length > 3 && q.includes(nameBase)) return true;

  const nameWords = nameBase.split(/\s+/).filter((w) => w.length > 2);
  const qWords = q.split(/\s+/).filter((w) => w.length > 2);
  if (!nameWords.length) return false;

  const matches = nameWords.filter((nw) => qWords.some((qw) => wordsSimilar(qw, nw)));
  return matches.length >= Math.max(1, Math.ceil(nameWords.length * 0.5));
}

function extractSectionHint(content) {
  const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 4)) {
    const numbered = line.match(/^(?:section\s+)?(\d+(?:\.\d+)+)\s+(.{3,80})$/i);
    if (numbered) return `Section ${numbered[1]} ${numbered[2]}`.trim();
    if (line.length < 90 && /^(?:section\s+)?\d+(?:\.\d+)+\s/.test(line)) return line;
  }
  return null;
}

async function detectUsedContexts(question, answer, contexts) {
  const indexed = contexts.map((c, i) => ({ index: i + 1, context: c }));

  let candidates = indexed.filter(({ context }) =>
    questionMatchesSource(question, context.source || context.name || '')
  );
  if (candidates.length === 0) candidates = indexed;

  const answerEmb = await embedText(answer);
  const scored = await Promise.all(
    candidates.map(async (item) => ({
      ...item,
      score: cosineSimilarity(answerEmb, await embedText(item.context.content)),
    }))
  );
  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) return [];

  const top = scored[0].score;
  const second = scored[1]?.score ?? 0;

  if (scored.length === 1 || top > second * 1.12 || top - second > 0.04) {
    return [scored[0]];
  }

  const threshold = top * 0.9;
  return scored.filter((s) => s.score >= threshold).slice(0, 3);
}

function formatSourceCitations(usedChunks) {
  if (!usedChunks.length) return '';
  const lines = usedChunks.map(({ index, context }) => {
    const file = context.source || context.name || 'Unknown';
    const section = extractSectionHint(context.content);
    const label = section ? `${file} (${section})` : file;
    return `* Source ${index}: ${label}`;
  });
  return `\n\n**Sources:**\n${lines.join('\n')}`;
}

function stripAnswerSourceNoise(body) {
  return body
    .replace(/\[\[SOURCES?:[^\]]*\]\]\s*$/i, '')
    .replace(/\[\[USED:[^\]]*\]\]\s*$/i, '')
    .replace(/\n*\*\*Sources?:\*\*[\s\S]*$/i, '')
    .trim();
}

async function finalizeAnswer(question, answer, contexts) {
  const trimmed = answer?.trim() || '';
  if (!trimmed || !contexts?.length) return { answer: trimmed, usedSources: [], usedChunks: [] };

  const body = stripAnswerSourceNoise(trimmed);
  const usedChunks = await detectUsedContexts(question, body, contexts);
  const usedSources = [...new Set(usedChunks.map((u) => u.context.source).filter(Boolean))];
  const citationBlock = formatSourceCitations(usedChunks);

  return { answer: body + citationBlock, usedSources, usedChunks };
}

// ── generateAnswer (Groq) ─────────────────────────────────────────────────────
async function generateAnswer(question, contexts) {
  const contextBlock = contexts
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
    .join('\n\n---\n\n');

  const groq = getGroq();

  if (!groq) {
    console.warn('⚠️  No GROQ_API_KEY set — returning raw context');
    return buildFallbackAnswer(question, contexts);
  }

  try {
    console.log(`🤖 Groq generating answer (${GROQ_MODEL})…`);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `you are a friendly internal knowledge assistant.
Rules:
- Use ONLY the provided context. Do not invent facts.
- Do NOT copy sentences verbatim from the documents.
- Explain the answer in simple, easy-to-understand language (like teaching a colleague).
- Start with a short direct answer, then add 2–3 clear bullet points if needed.
- Replace jargon with plain words when possible.
- If the context doesn't contain the answer, say you couldn't find it.
- Do not mention sources, filenames, or source numbers in your answer — sources are added automatically.`,
        },
        {
          role: 'user',
          content: `CONTEXT DOCUMENTS:\n\n${contextBlock}\n\n---\n\nQUESTION: ${question}\n\nUsing only the context above, answer the question in your own words. Explain simply — do not quote the document directly.`,
        },
      ],
      temperature: 0.5,
      max_tokens:  1024,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('Empty response from Groq');

    console.log(`✅ Groq answered (${completion.usage?.total_tokens || '?'} tokens)`);
    return await finalizeAnswer(question, answer, contexts);

  } catch (err) {
    console.error('❌ Groq error:', err.message);

    // Handle specific Groq errors
    if (err.message?.includes('rate limit') || err.status === 429) {
      const msg = `I'm receiving too many requests right now. Please wait a moment and try again.\n\n**Raw context:**\n${contexts[0]?.content?.slice(0, 300)}…`;
      return await finalizeAnswer(question, msg, contexts.slice(0, 1));
    }
    if (err.message?.includes('invalid_api_key') || err.status === 401) {
      return {
        answer: `AI service authentication failed. Please check your GROQ_API_KEY in the backend .env file.\n\nGet a free key at: https://console.groq.com`,
        usedSources: [],
        usedChunks: [],
      };
    }

    return await buildFallbackAnswer(question, contexts);
  }
}

async function buildFallbackAnswer(question, contexts) {
  if (!contexts?.length) {
    return {
      answer: "I couldn't find any relevant information in the knowledge base for this question. Please make sure documents have been uploaded and indexed.",
      usedSources: [],
      usedChunks: [],
    };
  }
  const top = contexts[0];
  const summary = `${top.content.slice(0, 600)}${top.content.length > 600 ? '…' : ''}`;
  return await finalizeAnswer(question, summary, [top]);
}

module.exports = { embedText, embedBatch, generateAnswer, localEmbed };