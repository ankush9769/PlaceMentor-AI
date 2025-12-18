// Simple test server to check mock mode
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

console.log('🔍 Environment check:');
console.log('USE_MOCK_MODE:', process.env.USE_MOCK_MODE);
console.log('Mock mode active:', process.env.USE_MOCK_MODE === 'true');

// Test endpoint
app.post('/api/generate-questions', async (req, res) => {
  console.log('📥 Request received');
  console.log('Body:', req.body);
  console.log('Mock mode check:', process.env.USE_MOCK_MODE === 'true');
  
  try {
    const { techStack, level } = req.body;

    if (!techStack || !level) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields'
      });
    }

    // Mock mode check
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('✅ Mock mode - returning sample data');
      const mockQuestions = [
        { id: 1, text: `Mock question 1 for ${techStack} ${level}` },
        { id: 2, text: `Mock question 2 for ${techStack} ${level}` },
        { id: 3, text: `Mock question 3 for ${techStack} ${level}` },
        { id: 4, text: `Mock question 4 for ${techStack} ${level}` },
        { id: 5, text: `Mock question 5 for ${techStack} ${level}` }
      ];
      return res.json({ questions: mockQuestions });
    }

    // If not mock mode, return error (no API calls)
    console.log('❌ Not in mock mode - would make API call');
    return res.status(500).json({
      error: 'API_DISABLED',
      message: 'API calls disabled in test'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});