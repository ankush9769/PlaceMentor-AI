import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://prep-master-ai.vercel.app',
    'X-Title': 'AI Interview Simulator',
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false
    });
  }

  try {
    const { question, answer, techStack, level } = req.body;

    // Validate request body
    if (!question || !answer || !techStack || !level) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: question, answer, techStack, and level',
        retryable: false
      });
    }

    // Check if mock mode is enabled
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('🎭 Mock mode enabled - returning sample evaluation');
      const mockEvaluation = {
        scores: {
          clarity: Math.floor(Math.random() * 2) + 3, // 3-4
          accuracy: Math.floor(Math.random() * 2) + 3, // 3-4
          depth: Math.floor(Math.random() * 2) + 3 // 3-4
        },
        feedback: {
          clarity: "Your answer was well-structured and easy to follow. Consider adding more specific examples to enhance clarity.",
          accuracy: "The technical concepts you mentioned are correct. You could improve by providing more detailed explanations.",
          depth: "Good coverage of the topic. To demonstrate deeper understanding, try discussing edge cases or advanced scenarios."
        },
        overallTips: `Great job on your ${level} level ${techStack} answer! Focus on providing concrete examples and discussing real-world applications to strengthen your responses.`
      };
      return res.status(200).json(mockEvaluation);
    }

    // Construct evaluation prompt
    const prompt = `Rate this interview answer on clarity (1-5), accuracy (1-5), and depth (1-5).

Question: ${question}
Answer: ${answer}
Context: ${level} ${techStack} interview

Provide specific feedback for each criterion and overall tips for improvement. Return ONLY valid JSON in this exact format (no other text):
{
  "scores": {
    "clarity": 4,
    "accuracy": 3,
    "depth": 4
  },
  "feedback": {
    "clarity": "specific feedback here",
    "accuracy": "specific feedback here",
    "depth": "specific feedback here"
  },
  "overallTips": "overall improvement suggestions here"
}`;

    // Call OpenRouter API
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer providing constructive feedback. Be fair but thorough in your evaluation. Scores should be: 1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent. Return only valid JSON, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    });

    let responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the response
    const evaluation = JSON.parse(responseText);

    // Validate evaluation structure
    if (!evaluation.scores || !evaluation.feedback || !evaluation.overallTips) {
      throw new Error('Invalid evaluation format from OpenAI');
    }

    // Ensure scores are within valid range
    const { clarity, accuracy, depth } = evaluation.scores;
    if (clarity < 1 || clarity > 5 || accuracy < 1 || accuracy > 5 || depth < 1 || depth > 5) {
      throw new Error('Invalid score values from OpenAI');
    }

    // Return evaluation
    return res.status(200).json(evaluation);

  } catch (error) {
    console.error('Error evaluating answer:', error);

    // Handle specific OpenAI errors
    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'Too many requests. Please wait a moment and try again.',
        retryable: true
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
      message: 'Failed to evaluate answer. Please try again.',
      retryable: true
    });
  }
}
