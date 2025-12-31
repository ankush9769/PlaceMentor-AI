import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize providers based on environment variables
let groqClient = null;
let googleClient = null;
let openrouterClient = null;

if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here') {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-google-api-key-here') {
  googleClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

if (process.env.OPENROUTER_API_KEY) {
  openrouterClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://prep-master-ai.vercel.app',
      'X-Title': 'AI Interview Simulator',
    },
  });
}

/**
 * Universal AI chat completion function
 * Automatically uses the configured provider
 */
export async function chatCompletion(messages, options = {}) {
  const provider = process.env.AI_PROVIDER || 'openrouter';
  
  console.log(`🤖 Using AI provider: ${provider}`);

  try {
    switch (provider) {
      case 'groq':
        return await groqCompletion(messages, options);
      
      case 'google':
        return await googleCompletion(messages, options);
      
      case 'openrouter':
      default:
        return await openrouterCompletion(messages, options);
    }
  } catch (error) {
    console.error(`❌ ${provider} failed:`, error.message);
    throw error;
  }
}

/**
 * Groq completion (Free, very fast)
 */
async function groqCompletion(messages, options = {}) {
  if (!groqClient) {
    throw new Error('Groq API key not configured. Get one at https://console.groq.com');
  }

  const completion = await groqClient.chat.completions.create({
    model: options.model || 'llama-3.3-70b-versatile', // Updated active model
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2000,
  });

  return completion.choices[0]?.message?.content;
}

/**
 * Google Gemini completion (Free tier: 60 req/min)
 */
async function googleCompletion(messages, options = {}) {
  if (!googleClient) {
    throw new Error('Google API key not configured. Get one at https://aistudio.google.com/app/apikey');
  }

  const model = googleClient.getGenerativeModel({ 
    model: options.model || 'gemini-1.5-flash' 
  });

  // Convert messages to Gemini format
  const prompt = messages.map(m => {
    if (m.role === 'system') return `System: ${m.content}`;
    if (m.role === 'user') return `User: ${m.content}`;
    return m.content;
  }).join('\n\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * OpenRouter completion (fallback to free models)
 */
async function openrouterCompletion(messages, options = {}) {
  if (!openrouterClient) {
    throw new Error('OpenRouter API key not configured');
  }

  const FALLBACK_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
  ];

  let lastError = null;
  
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`🔄 Trying model: ${model}`);
      
      const completion = await openrouterClient.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        console.log(`✅ Success with model: ${model}`);
        return response;
      }
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.message);
      lastError = error;
      if (error.status !== 429) continue;
    }
  }
  
  throw lastError || new Error('All OpenRouter models failed');
}

export default chatCompletion;
