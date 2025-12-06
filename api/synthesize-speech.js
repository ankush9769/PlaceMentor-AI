import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const { text } = req.body;

    // Validate request body
    if (!text) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required field: text',
        retryable: false
      });
    }

    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send audio data
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error synthesizing speech:', error);

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
      message: 'Failed to synthesize speech. Please try again.',
      retryable: true
    });
  }
}
