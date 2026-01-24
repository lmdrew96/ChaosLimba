// scripts/test-grammar.ts
import 'dotenv/config';
import { analyzeGrammar } from '../src/lib/ai/grammar';

async function testGrammar() {
  console.log('🧪 Testing YOUR trained mt5-small grammar model!\n');

  const testSentences = [
    "Eu merge la magazin",           // Should fix: merge → merg
    "Copiii joaca în parc",          // Should fix: joaca → joacă  
    "Ea merge la școală",            // Already correct
    "Noi suntem fericit",            // Should fix: fericit → fericiți
    "Carte este pe masa",            // Should fix: Carte → Cartea
  ];

  for (const sentence of testSentences) {
    console.log(`\n📝 Input: "${sentence}"`);
    
    try {
      const result = await analyzeGrammar(sentence);
      
      if (result.correctedText === sentence) {
        console.log(`✅ Already correct! Score: ${result.grammarScore}/100`);
      } else {
        console.log(`✏️  Corrected: "${result.correctedText}"`);
        console.log(`📊 Score: ${result.grammarScore}/100`);
        console.log(`🔍 Errors found: ${result.errors.length}`);
        
        result.errors.forEach(err => {
          console.log(`   ❌ "${err.learner_production}" → ✅ "${err.correct_form}"`);
        });
      }
      
      console.log('---');
      
      // Wait 2 seconds between requests
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
      if (error.message.includes('503')) {
        console.log('⏳ Model is loading (cold start). Wait 30 seconds and try again.');
      }
      console.log('---');
    }
  }
  
  console.log('\n✨ Testing complete!');
}

testGrammar().catch(console.error);
