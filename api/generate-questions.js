import { chatCompletion } from './lib/ai-providers.js';
import { questionCache } from './lib/cache.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false
    });
  }

  try {
    const { techStack, level } = req.body;

    // Validate request body
    if (!techStack || !level) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: techStack and level',
        retryable: false
      });
    }

    // Check cache first
    const cacheKey = questionCache.generateKey(techStack, level);
    const cachedQuestions = questionCache.get(cacheKey);
    if (cachedQuestions) {
      console.log('📦 Returning cached questions for:', techStack, level);
      return res.status(200).json({ questions: cachedQuestions, cached: true });
    }

    // Check if mock mode is enabled
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('🎭 Mock mode enabled - returning sample questions');
      const mockQuestions = [
        { id: 1, text: `What are the key features of ${techStack} that make it suitable for modern development?` },
        { id: 2, text: `Can you explain the difference between synchronous and asynchronous operations in ${techStack}?` },
        { id: 3, text: `How would you handle error management in a ${techStack} application?` },
        { id: 4, text: `What are some best practices for ${level} developers working with ${techStack}?` },
        { id: 5, text: `Describe a challenging project you've worked on using ${techStack} and how you approached it.` }
      ];
      return res.status(200).json({ questions: mockQuestions });
    }

    // Construct prompt for OpenAI
    const prompt = `Generate five spoken-ready interview questions on ${level} ${techStack} concepts. Focus on theory and concepts, not code. Make questions suitable for verbal answers. 

Return ONLY a valid JSON object in this exact format (no other text):
{
  "questions": [
    {"id": 1, "text": "question text"},
    {"id": 2, "text": "question text"},
    {"id": 3, "text": "question text"},
    {"id": 4, "text": "question text"},
    {"id": 5, "text": "question text"}
  ]
}`;

    // Call AI API with universal provider
    const messages = [
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Generate interview questions that are clear, concise, and suitable for spoken delivery. Return only valid JSON, no markdown formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    let responseText = await chatCompletion(messages, {
      temperature: 0.7
    });

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Remove markdown code blocks and special tokens if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^<s>\s*/g, '')  // Remove <s> token at start
      .replace(/\s*<\/s>$/g, '') // Remove </s> token at end
      .replace(/^\[INST\].*?\[\/INST\]/g, '') // Remove instruction tokens
      .trim();

    // Parse the response
    const parsed = JSON.parse(responseText);
    const questions = parsed.questions || parsed;

    // Ensure we have exactly 5 questions
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error('Invalid response format from AI');
    }

    // Cache the questions
    questionCache.set(cacheKey, questions);

    // Return questions
    return res.status(200).json({ questions });

  } catch (error) {
    console.error('========================================');
    console.error('💥 GENERATE QUESTIONS API ERROR:');
    console.error('├─ Error Type:', error.constructor.name);
    console.error('├─ Status Code:', error.status || 'N/A');
    console.error('├─ Message:', error.message);
    console.error('├─ Tech Stack:', techStack);
    console.error('├─ Level:', level);
    console.error('└─ Timestamp:', new Date().toISOString());
    console.error('========================================');

    // Handle specific errors with better messaging
    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT_ALL_MODELS',
        message: 'All AI models are currently busy. Please try again in 1-2 minutes.',
        retryable: true,
        retryAfter: 60
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        error: 'API_ERROR',
        message: 'Service configuration error. Please contact support.',
        retryable: false
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'AI service is temporarily unavailable. Please try again.',
        retryable: true
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate questions. Please try again.',
      retryable: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
