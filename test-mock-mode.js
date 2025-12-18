// Test script to check if mock mode is working
import fetch from 'node-fetch';

async function testMockMode() {
  console.log('🧪 Testing Mock Mode...\n');
  
  // Test 1: Generate Questions
  console.log('1️⃣ Testing /api/generate-questions');
  try {
    const response = await fetch('http://localhost:3001/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        techStack: 'JavaScript',
        level: 'beginner'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success - Questions generated');
      console.log('📝 First question:', data.questions[0]?.text?.substring(0, 50) + '...');
      console.log('🔍 Mock mode working:', data.questions[0]?.text?.includes('JavaScript'));
    } else {
      console.log('❌ Failed:', data.message);
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Test 2: Evaluate Answer
  console.log('2️⃣ Testing /api/evaluate-answer');
  try {
    const response = await fetch('http://localhost:3001/api/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is JavaScript?',
        answer: 'JavaScript is a programming language',
        techStack: 'JavaScript',
        level: 'beginner'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success - Answer evaluated');
      console.log('📊 Scores:', data.scores);
      console.log('🔍 Mock mode working:', typeof data.scores.clarity === 'number');
    } else {
      console.log('❌ Failed:', data.message);
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Test 3: Chat (should NOT use mock mode)
  console.log('3️⃣ Testing /api/chat (should use real API)');
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, what is JavaScript?',
        conversationHistory: []
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success - Chat response received');
      console.log('💬 Response:', data.reply?.substring(0, 100) + '...');
    } else {
      console.log('❌ Failed:', data.message);
      if (data.error === 'RATE_LIMIT_ALL_MODELS') {
        console.log('🔍 This is expected - chat uses real API, not mock mode');
      }
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }
}

// Run the test
testMockMode();