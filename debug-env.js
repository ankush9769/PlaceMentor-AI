// Debug script to check environment variables
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variable Debug:');
console.log('================================');
console.log('USE_MOCK_MODE value:', process.env.USE_MOCK_MODE);
console.log('USE_MOCK_MODE type:', typeof process.env.USE_MOCK_MODE);
console.log('Is it "true"?:', process.env.USE_MOCK_MODE === 'true');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);

// Test the condition
if (process.env.USE_MOCK_MODE === 'true') {
  console.log('✅ Mock mode condition would be TRUE');
} else {
  console.log('❌ Mock mode condition would be FALSE');
}

console.log('\nAll environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('USE_') || key.startsWith('NODE_') || key.startsWith('OPENROUTER_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });