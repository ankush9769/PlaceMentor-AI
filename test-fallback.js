// Test script to verify model fallback system
import fetch from 'node-fetch';

async function testChatEndpoint() {
  try {
    console.log('🧪 Testing chat endpoint with fallback models...');
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me with JavaScript interview questions?',
        conversationHistory: []
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Chat endpoint working!');
      console.log('📝 Response:', data.reply.substring(0, 100) + '...');
    } else {
      console.log('❌ Chat endpoint failed:');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

// Run the test
testChatEndpoint();