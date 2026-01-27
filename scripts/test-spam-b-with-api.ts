/**
 * Quick test script to verify SPAM-B with real HF API
 * Run with: npx tsx scripts/test-spam-b-with-api.ts
 *
 * Make sure HUGGINGFACE_API_KEY is set in your environment!
 */

import { analyzeRelevance, clearSpamBCache } from '../src/lib/ai/spamB';

async function testWithRealAPI() {
  console.log('🧪 Testing SPAM-B with Real HuggingFace API\n');

  if (!process.env.HUGGINGFACE_API_KEY && !process.env.HUGGINGFACE_API_TOKEN) {
    console.error('❌ Missing HUGGINGFACE_API_KEY or HUGGINGFACE_API_TOKEN');
    console.error('   Set it in your .env.local or environment');
    process.exit(1);
  }

  console.log('✓ HuggingFace API key found\n');

  // Test 1: Off-topic response (should be caught)
  console.log('Test 1: Off-topic Detection');
  console.log('User: "Îmi place fotbalul și muzica rock"');
  console.log('Context: ["bucătărie", "mâncare", "rețete"]');

  const result1 = await analyzeRelevance(
    'Îmi place fotbalul și muzica rock',
    { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
  );

  console.log(`  Relevance: ${(result1.relevance_score * 100).toFixed(1)}%`);
  console.log(`  Interpretation: ${result1.interpretation}`);
  console.log(`  Fallback used: ${result1.fallbackUsed}`);
  console.log(`  Processing time: ${result1.processingTime}ms`);
  if (result1.topic_analysis.suggested_redirect) {
    console.log(`  Redirect: "${result1.topic_analysis.suggested_redirect}"`);
  }
  console.log();

  // Test 2: On-topic response (should pass)
  console.log('Test 2: On-topic Detection');
  console.log('User: "Îmi place să gătesc sarmale și mămăligă"');
  console.log('Context: ["bucătărie", "mâncare", "gătit"]');

  const result2 = await analyzeRelevance(
    'Îmi place să gătesc sarmale și mămăligă',
    { main_topics: ['bucătărie', 'mâncare', 'gătit'] }
  );

  console.log(`  Relevance: ${(result2.relevance_score * 100).toFixed(1)}%`);
  console.log(`  Interpretation: ${result2.interpretation}`);
  console.log(`  Fallback used: ${result2.fallbackUsed}`);
  console.log(`  Processing time: ${result2.processingTime}ms`);
  console.log();

  // Test 3: Partially relevant
  console.log('Test 3: Partially Relevant Detection');
  console.log('User: "Îmi place să mănânc când mă uit la fotbal"');
  console.log('Context: ["bucătărie", "mâncare", "rețete"]');

  const result3 = await analyzeRelevance(
    'Îmi place să mănânc când mă uit la fotbal',
    { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
  );

  console.log(`  Relevance: ${(result3.relevance_score * 100).toFixed(1)}%`);
  console.log(`  Interpretation: ${result3.interpretation}`);
  console.log(`  Fallback used: ${result3.fallbackUsed}`);
  console.log(`  Processing time: ${result3.processingTime}ms`);
  if (result3.topic_analysis.suggested_redirect) {
    console.log(`  Redirect: "${result3.topic_analysis.suggested_redirect}"`);
  }
  console.log();

  // Summary
  console.log('📊 Summary:');
  console.log(`  Test 1 (off-topic): ${result1.interpretation} ${result1.interpretation === 'off_topic' ? '✓' : '✗'}`);
  console.log(`  Test 2 (on-topic): ${result2.interpretation} ${result2.interpretation === 'on_topic' ? '✓' : '⚠️'}`);
  console.log(`  Test 3 (partial): ${result3.interpretation} ${result3.interpretation !== 'on_topic' ? '✓' : '⚠️'}`);
  console.log(`  All using HF API: ${!result1.fallbackUsed && !result2.fallbackUsed && !result3.fallbackUsed ? '✓' : '✗'}`);
  console.log();

  if (result1.fallbackUsed || result2.fallbackUsed || result3.fallbackUsed) {
    console.log('⚠️  Some tests used fallback - check your HuggingFace API key');
  } else {
    console.log('✅ All tests used real HuggingFace API - SPAM-B is working perfectly!');
  }
}

testWithRealAPI().catch(console.error);
