// Model monitoring script
import fetch from 'node-fetch';

async function checkModelStatus() {
  try {
    const response = await fetch('http://localhost:3001/api/models/status');
    const data = await response.json();
    
    console.clear();
    console.log('🤖 AI Model Status Monitor');
    console.log('='.repeat(50));
    console.log(`📊 Available Models: ${data.models.available}/${data.models.total}`);
    console.log(`🎯 Last Successful: ${data.models.lastSuccessful || 'None yet'}`);
    
    if (data.nextReset.time) {
      const resetTime = new Date(data.nextReset.time);
      console.log(`⏰ Next Reset: ${resetTime.toLocaleTimeString()} (${data.nextReset.minutes} min)`);
    } else {
      console.log('✅ All models available!');
    }
    
    console.log(`🕐 Last Updated: ${new Date().toLocaleTimeString()}`);
    console.log('\nPress Ctrl+C to stop monitoring...');
    
  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
  }
}

// Check status every 30 seconds
console.log('🚀 Starting model status monitor...');
checkModelStatus();
setInterval(checkModelStatus, 30000);