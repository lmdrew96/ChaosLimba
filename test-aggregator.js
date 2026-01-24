// Simple integration test for Feedback Aggregator
const { FeedbackAggregator } = require('./src/lib/ai/aggregator');

async function testAggregator() {
  console.log('🧪 Testing Feedback Aggregator...\n');

  // Mock data
  const mockGrammarResult = {
    correctedText: 'Eu merg la piață.',
    errors: [{
      type: 'preposition_error',
      learner_production: 'la',
      correct_form: 'la',
      confidence: 0.85,
      category: 'grammar'
    }],
    grammarScore: 85
  };

  const mockSemanticResult = {
    similarity: 0.9,
    semanticMatch: true,
    threshold: 0.75,
    fallbackUsed: false
  };

  // Test 1: Text Input Path
  console.log('📝 Test 1: Text Input Path');
  try {
    const textInput = {
      inputType: 'text',
      grammarResult: mockGrammarResult,
      semanticResult: mockSemanticResult,
      userId: 'test-user',
      sessionId: 'test-session'
    };

    const textResult = await FeedbackAggregator.aggregateFeedback(textInput);
    console.log('✅ Text aggregation successful');
    console.log(`   Overall Score: ${textResult.overallScore}`);
    console.log(`   Processing Time: ${textResult.processingTime}ms`);
    console.log(`   Error Patterns: ${textResult.errorPatterns.length}`);
    console.log(`   Component Status:`, textResult.componentResults);
  } catch (error) {
    console.error('❌ Text aggregation failed:', error.message);
  }

  console.log('\n🎤 Test 2: Speech Input Path');
  try {
    const speechInput = {
      inputType: 'speech',
      grammarResult: mockGrammarResult,
      pronunciationResult: FeedbackAggregator.createMockPronunciationResult(75),
      semanticResult: mockSemanticResult,
      intonationResult: FeedbackAggregator.createMockIntonationResult(true),
      userId: 'test-user',
      sessionId: 'test-session'
    };

    const speechResult = await FeedbackAggregator.aggregateFeedback(speechInput);
    console.log('✅ Speech aggregation successful');
    console.log(`   Overall Score: ${speechResult.overallScore}`);
    console.log(`   Processing Time: ${speechResult.processingTime}ms`);
    console.log(`   Error Patterns: ${speechResult.errorPatterns.length}`);
    console.log(`   Component Status:`, speechResult.componentResults);
  } catch (error) {
    console.error('❌ Speech aggregation failed:', error.message);
  }

  console.log('\n🎯 Test 3: Weighted Score Calculation');
  try {
    // Test text input with known scores: Grammar 80, Semantic 80
    // Expected: (80 * 0.6) + (80 * 0.4) = 80
    const scoreTestInput = {
      inputType: 'text',
      grammarResult: { ...mockGrammarResult, grammarScore: 80, errors: [] },
      semanticResult: { ...mockSemanticResult, similarity: 0.8 }
    };

    const scoreResult = await FeedbackAggregator.aggregateFeedback(scoreTestInput);
    console.log(`✅ Score calculation: ${scoreResult.overallScore} (expected: 80)`);
    
    if (scoreResult.overallScore === 80) {
      console.log('   ✅ Weighted scoring working correctly');
    } else {
      console.log(`   ⚠️  Unexpected score (expected 80, got ${scoreResult.overallScore})`);
    }
  } catch (error) {
    console.error('❌ Score calculation failed:', error.message);
  }

  console.log('\n🏁 Integration test complete!');
}

// Run the test
testAggregator().catch(console.error);
