// Run: node src/utils/testAI.js
require('dotenv').config();

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

console.log('🔑 Groq Key:', GROQ_KEY ? `${GROQ_KEY.slice(0, 12)}...` : '❌ NOT SET');
console.log('🤖 Model:',    GROQ_MODEL);
console.log('');

// ── Test 1: Local embeddings ──────────────────────────────────────────────────
function testLocalEmbeddings() {
  console.log('=== Local Embeddings ===');
  const { localEmbed } = require('./src/services/ai.service');
  const v1 = localEmbed('JavaScript programming language');
  const v2 = localEmbed('JavaScript programming language');
  const v3 = localEmbed('cooking recipes food');

  // Cosine similarity
  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  console.log(`Vector dimensions: ${v1.length}`);
  console.log(`Same text similarity: ${cosine(v1, v2).toFixed(4)} (should be 1.0)`);
  console.log(`Different text similarity: ${cosine(v1, v3).toFixed(4)} (should be low)`);
  console.log('✅ Local embeddings working!\n');
}

// ── Test 2: Groq API ──────────────────────────────────────────────────────────
async function testGroq() {
  console.log('=== Groq API ===');

  if (!GROQ_KEY) {
    console.log('❌ GROQ_API_KEY not set in .env');
    console.log('   Get free key at: https://console.groq.com\n');
    return;
  }

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: GROQ_KEY });

    console.log('Sending test message to Groq…');
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'user', content: 'Say exactly: "Groq is working correctly!" and nothing else.' }
      ],
      max_tokens: 20,
      temperature: 0,
    });

    const response = completion.choices[0]?.message?.content;
    console.log(`✅ Groq response: "${response}"`);
    console.log(`   Tokens used: ${completion.usage?.total_tokens}`);
    console.log(`   Model: ${completion.model}\n`);

  } catch (err) {
    if (err.message?.includes('invalid_api_key') || err.status === 401) {
      console.log('❌ Invalid API key — check your GROQ_API_KEY in .env');
    } else if (err.message?.includes('rate_limit') || err.status === 429) {
      console.log('⏳ Rate limited — wait 60 seconds and try again');
    } else if (err.code === 'MODULE_NOT_FOUND') {
      console.log('❌ groq-sdk not installed — run: npm install groq-sdk');
    } else {
      console.log(`❌ Error: ${err.message}`);
    }
    console.log('');
  }
}

// ── Test 3: Full RAG test ─────────────────────────────────────────────────────
async function testFullRAG() {
  console.log('=== Full RAG Pipeline Test ===');
  try {
    const { generateAnswer, embedText } = require('./src/services/ai.service');

    // Test embedding
    const vec = await embedText('What is JavaScript?');
    console.log(`✅ embedText: ${vec.length} dimensions`);

    // Test answer generation
    const answer = await generateAnswer(
      'What is JavaScript?',
      [{ source: 'test.pdf', content: 'JavaScript is a programming language used for web development. It runs in browsers and on servers via Node.js.' }]
    );
    console.log(`✅ generateAnswer: "${answer.slice(0, 120)}…"`);

  } catch (err) {
    console.log(`❌ RAG test failed: ${err.message}`);
  }
}

async function main() {
  try {
    testLocalEmbeddings();
  } catch (err) {
    console.log('Local embed error:', err.message, '\n');
  }

  await testGroq();
  await testFullRAG();

  console.log('\n=== Available Free Groq Models ===');
  console.log('llama-3.1-8b-instant   — fastest, great for Q&A');
  console.log('llama-3.3-70b-versatile — most accurate, slower');
  console.log('mixtral-8x7b-32768     — good for long documents');
  console.log('gemma2-9b-it           — Google model, fast');
  console.log('\nSet in .env: GROQ_MODEL=llama-3.1-8b-instant');
}

main().catch(console.error);