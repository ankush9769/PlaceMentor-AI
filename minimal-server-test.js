// Minimal server test to isolate the issue
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  console.log('📥 Test route called');
  res.json({ message: 'Server is working', timestamp: new Date() });
});

// Resume analysis route (no auth)
app.post('/api/resume/analyze', (req, res) => {
  console.log('📥 Resume analyze called');
  console.log('Body:', req.body);
  
  const { resumeText, targetRole, fileName } = req.body;
  
  if (!resumeText) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Resume text is required'
    });
  }
  
  // Mock response
  res.json({
    overallScore: 8.5,
    atsScore: 9.0,
    strengths: ['Clear structure', 'Good experience'],
    weaknesses: ['Missing skills section'],
    suggestions: ['Add technical skills', 'Include projects'],
    keywords: ['JavaScript', 'React'],
    sections: {
      contact: 'good',
      summary: 'needs_improvement',
      experience: 'good',
      education: 'good',
      skills: 'missing'
    },
    analysisId: 'test_123',
    saved: true,
    message: 'Analysis completed (test mode)'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal test server running on http://localhost:${PORT}`);
  console.log('Test routes:');
  console.log(`  GET  http://localhost:${PORT}/api/test`);
  console.log(`  POST http://localhost:${PORT}/api/resume/analyze`);
});