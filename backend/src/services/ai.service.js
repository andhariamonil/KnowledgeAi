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
          content: `You are an internal knowledge assistant for an organization.
Answer questions using ONLY the provided context documents.
If the answer is not in the context, say: "I couldn't find relevant information in the knowledge base for this question."
Be concise, accurate, and mention which source(s) you used.
Format your answer clearly. Do not make up information.`,
        },
        {
          role: 'user',
          content: `CONTEXT DOCUMENTS:\n\n${contextBlock}\n\n---\n\nQUESTION: ${question}\n\nPlease answer based only on the context above.`,
        },
      ],
      temperature: 0.3,
      max_tokens:  1024,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('Empty response from Groq');

    console.log(`✅ Groq answered (${completion.usage?.total_tokens || '?'} tokens)`);
    return answer;

  } catch (err) {
    console.error('❌ Groq error:', err.message);

    // Handle specific Groq errors
    if (err.message?.includes('rate limit') || err.status === 429) {
      return `I'm receiving too many requests right now. Please wait a moment and try again.\n\n**Raw context:**\n${contexts[0]?.content?.slice(0, 300)}…`;
    }
    if (err.message?.includes('invalid_api_key') || err.status === 401) {
      return `AI service authentication failed. Please check your GROQ_API_KEY in the backend .env file.\n\nGet a free key at: https://console.groq.com`;
    }

    return buildFallbackAnswer(question, contexts);
  }
}

function buildFallbackAnswer(question, contexts) {
  if (!contexts?.length) {
    return "I couldn't find any relevant information in the knowledge base for this question. Please make sure documents have been uploaded and indexed.";
  }
  const top = contexts[0];
  return `Based on **${top.source}**:\n\n${top.content.slice(0, 600)}${top.content.length > 600 ? '…' : ''}`;
}

module.exports = { embedText, embedBatch, generateAnswer, localEmbed };