// Run this from backend folder: node src/utils/testHF.js
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

console.log('🔑 API Key:', process.env.HUGGINGFACE_API_KEY ? `${process.env.HUGGINGFACE_API_KEY.slice(0, 8)}...` : '❌ NOT SET');
console.log('');

const MODELS_TO_TEST = [
  'sentence-transformers/all-MiniLM-L6-v2',
  'BAAI/bge-small-en-v1.5',
  'sentence-transformers/paraphrase-MiniLM-L3-v2',
  'sentence-transformers/all-mpnet-base-v2',
];

async function testModel(model) {
  try {
    console.log(`Testing: ${model} ...`);
    const result = await hf.featureExtraction({
      model,
      inputs: 'Hello world test sentence',
    });
    const vec = Array.isArray(result[0]) ? result[0] : result;
    console.log(`  ✅ WORKS — vector length: ${vec.length}`);
    return true;
  } catch (err) {
    console.log(`  ❌ FAILED — ${err.message?.slice(0, 120)}`);
    return false;
  }
}

async function main() {
  console.log('=== Testing Embedding Models ===\n');
  for (const model of MODELS_TO_TEST) {
    const ok = await testModel(model);
    if (ok) {
      console.log(`\n✅ Use this in your .env:\nHF_EMBEDDING_MODEL=${model}\n`);
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n=== Testing LLM Models ===\n');
  const LLM_MODELS = [
    'HuggingFaceH4/zephyr-7b-beta',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'google/flan-t5-base',
    'facebook/blenderbot-400M-distill',
  ];

  for (const model of LLM_MODELS) {
    try {
      console.log(`Testing LLM: ${model} ...`);
      const result = await hf.textGeneration({
        model,
        inputs: 'Answer in one sentence: What is 2+2?',
        parameters: { max_new_tokens: 20, return_full_text: false },
      });
      console.log(`  ✅ WORKS — response: "${result.generated_text?.trim()}"`);
      console.log(`\n✅ Use this in your .env:\nHF_LLM_MODEL=${model}\n`);
      break;
    } catch (err) {
      console.log(`  ❌ FAILED — ${err.message?.slice(0, 120)}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(console.error);