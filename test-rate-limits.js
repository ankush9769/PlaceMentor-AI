// Test script to demonstrate rate limit handling
import fetch from 'node-fetch';

async function testChatWithRateLimit() {
  console.log('🧪 Testing rate limit handling...\n');
  
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`📤 Request ${i}: Sending chat message...`);
      
      const startTime = Date.now();
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Test message ${i}: What is JavaScript?`,
          conversationHistory: []
        })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ Success (${duration}ms): ${data.reply.substring(0, 50)}...`);
      } else {
        console.log(`❌ Failed (${response.status}): ${data.message}`);
        if (data.modelStatus) {
          console.log(`   📊 Models: ${data.modelStatus.available}/${data.modelStatus.total} available`);
          console.log(`   ⏰ Next reset: ${data.modelStatus.nextResetMinutes} minutes`);
        }
      }
      
    } catch (error) {
      console.error(`🚨 Request ${i} failed:`, error.message);
    }
    
    // Wait 2 seconds between requests
    console.log('⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run the test
testChatWithRateLimit();