import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://prep-master-ai.vercel.app',
    'X-Title': 'AI Interview Simulator',
  },
});

console.log('Testing OpenRouter API...');
console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'Loaded' : 'MISSING');

async function test() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'google/gemma-3-4b-it:free',
      messages: [
        { role: 'user', content: 'Say hello!' }
      ],
    });

    console.log('✅ SUCCESS! OpenRouter is working!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

test();
