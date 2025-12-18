import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import multer from 'multer';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { ModelFallback } from './modelFallback.js';
import crypto from 'crypto';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('📥 Test route called');
  res.json({ message: 'Server is working', timestamp: new Date() });
});

// Test resume route (no auth)
app.post('/api/test-resume', (req, res) => {
  console.log('📥 Test resume route called');
  res.json({ 
    message: 'Resume test route working', 
    body: req.body,
    noAuth: true 
  });
});

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db('ai-interview-simulator');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// OpenRouter client (updated from OpenAI)
console.log('🔑 API Key loaded:', process.env.OPENROUTER_API_KEY ? 'Yes (starts with: ' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'NO - MISSING!');
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://prep-master-ai.vercel.app',
    'X-Title': 'AI Interview Simulator',
  },
});

// Initialize model fallback system
const modelFallback = new ModelFallback(openai);

// Helper function to safely get current model
const getCurrentModel = () => {
  if (process.env.USE_MOCK_MODE === 'true') {
    return 'Mock Mode';
  }
  return modelFallback ? modelFallback.getCurrentModel() : 'Unknown';
};

// Helper function to safely get model status
const getModelStatus = () => {
  if (process.env.USE_MOCK_MODE === 'true') {
    return {
      availableModels: 1,
      totalModels: 1,
      nextResetMinutes: 0,
      lastSuccessfulModel: 'Mock Mode'
    };
  }
  return modelFallback ? modelFallback.getStatusSummary() : null;
};

// Helper function to get or generate session ID for tracking resume analyses
const getSessionId = (req) => {
  // First check if user is authenticated
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return `user_${user.userId}`; // Use user ID for authenticated users
    } catch (error) {
      // Invalid token, fall through to session ID
    }
  }
  
  // Check for session ID in headers or generate new one
  let sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    sessionId = `session_${crypto.randomUUID()}`;
  }
  
  return sessionId;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = (req, res, next) => {
  console.log('🔍 OptionalAuth middleware called for:', req.path);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔍 Auth header:', authHeader ? 'Present' : 'Not present');

  if (token) {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user;
      console.log('✅ Token valid, user authenticated');
    } catch (error) {
      // Invalid token, but we don't fail - just continue without user
      console.log('❌ Invalid token provided, continuing without authentication');
    }
  } else {
    console.log('ℹ️ No token provided, continuing without authentication');
  }
  
  next();
};

// Routes

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, password, and name are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long'
      });
    }

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        error: 'USER_EXISTS',
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await usersCollection.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = jwt.sign(
      { userId: result.insertedId.toString(), email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email: email.toLowerCase(),
        name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create account'
    });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to sign in'
    });
  }
});

// Generate Questions
app.post('/api/generate-questions', async (req, res) => {
  console.log('📥 Received request to /api/generate-questions');
  console.log('Request body:', req.body);
  console.log('🔍 DEBUG: USE_MOCK_MODE =', process.env.USE_MOCK_MODE);
  console.log('🔍 DEBUG: Mock mode check =', process.env.USE_MOCK_MODE === 'true');
  
  try {
    const { techStack, level } = req.body;

    if (!techStack || !level) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: techStack and level'
      });
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
      return res.json({ questions: mockQuestions });
    }

    const prompt = `Generate exactly 5 interview questions about ${level} level ${techStack}. Return ONLY a JSON object in this EXACT format with NO extra nesting:
{
  "questions": [
    {"id": 1, "text": "your question here"},
    {"id": 2, "text": "your question here"},
    {"id": 3, "text": "your question here"},
    {"id": 4, "text": "your question here"},
    {"id": 5, "text": "your question here"}
  ]
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Return ONLY valid JSON with no markdown formatting or code blocks. The JSON must have a "questions" array at the top level.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const responseText = await modelFallback.makeRequest(messages, {
      temperature: 0.7
    });

    console.log('🔍 Raw AI response:', responseText);
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    console.log('🔍 Parsed data:', JSON.stringify(parsed, null, 2));

    // Handle different response formats from AI and flatten nested structures
    let questions;
    if (Array.isArray(parsed)) {
      // AI returned array directly
      console.log('✅ AI returned array directly');
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      // AI returned {questions: [...]}
      console.log('✅ AI returned {questions: [...]}');
      questions = parsed.questions;

      // Check if questions are nested (e.g., [{questions: [...]}, ...])
      if (questions.length > 0 && questions[0].questions && Array.isArray(questions[0].questions)) {
        console.log('⚠️ Detected nested questions, flattening...');
        questions = questions[0].questions;
      }
    } else {
      // Fallback
      console.log('⚠️ Using fallback');
      questions = parsed;
    }
    console.log('🔍 Final questions to send:', JSON.stringify(questions, null, 2));

    res.json({ questions });
  } catch (error) {
    console.error('========================================');
    console.error('💥 GENERATE QUESTIONS ERROR:');
    console.error('├─ Error Type:', error.constructor.name);
    console.error('├─ Status Code:', error.status || 'N/A');
    console.error('├─ Message:', error.message);
    console.error('├─ Current Model:', getCurrentModel());
    console.error('├─ Tech Stack:', req.body.techStack);
    console.error('├─ Level:', req.body.level);
    console.error('└─ Timestamp:', new Date().toISOString());
    console.error('========================================');

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT_ALL_MODELS',
        message: 'All AI models are currently busy. Please try again in 1-2 minutes.',
        retryable: true,
        retryAfter: 60
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate questions',
      retryable: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Synthesize Speech
app.post('/api/synthesize-speech', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required field: text'
      });
    }

    // Check if mock mode is enabled - use browser-based TTS instead
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('🎭 Mock mode enabled - instructing client to use browser TTS');
      return res.json({
        useBrowserTTS: true,
        text: text,
        message: 'Use browser-based text-to-speech'
      });
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('========================================');
    console.error('💥 SYNTHESIZE SPEECH ERROR:');
    console.error('├─ Error Type:', error.constructor.name);
    console.error('├─ Message:', error.message);
    console.error('├─ Text length:', req.body.text?.length || 0);
    console.error('└─ Timestamp:', new Date().toISOString());
    console.error('========================================');
    
    // Fallback to browser TTS on error
    res.json({
      useBrowserTTS: true,
      text: req.body.text,
      message: 'Falling back to browser-based text-to-speech due to API error'
    });
  }
});

// Evaluate Answer
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, techStack, level } = req.body;

    if (!question || !answer || !techStack || !level) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields'
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
      return res.json(mockEvaluation);
    }

    const prompt = `Rate this interview answer on clarity (1-5), accuracy (1-5), and depth (1-5).

Question: ${question}
Answer: ${answer}
Context: ${level} ${techStack} interview

Provide specific feedback for each criterion and overall tips for improvement. Return as JSON in this exact format:
{
  "scores": {
    "clarity": <number 1-5>,
    "accuracy": <number 1-5>,
    "depth": <number 1-5>
  },
  "feedback": {
    "clarity": "<specific feedback>",
    "accuracy": "<specific feedback>",
    "depth": "<specific feedback>"
  },
  "overallTips": "<overall improvement suggestions>"
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert technical interviewer providing constructive feedback. Be fair but thorough in your evaluation. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const responseText = await modelFallback.makeRequest(messages, {
      temperature: 0.3
    });

    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const evaluation = JSON.parse(cleanedResponse);

    res.json(evaluation);
  } catch (error) {
    console.error('========================================');
    console.error('💥 EVALUATE ANSWER ERROR:');
    console.error('├─ Error Type:', error.constructor.name);
    console.error('├─ Status Code:', error.status || 'N/A');
    console.error('├─ Message:', error.message);
    console.error('├─ Current Model:', getCurrentModel());
    console.error('└─ Timestamp:', new Date().toISOString());
    console.error('========================================');

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT_ALL_MODELS',
        message: 'All AI models are currently busy. Please try again in 1-2 minutes.',
        retryable: true,
        retryAfter: 60
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to evaluate answer',
      retryable: true
    });
  }
});

// Save Interview
app.post('/api/interviews/save', authenticateToken, async (req, res) => {
  try {
    const { config, questions, answers, completedAt } = req.body;

    if (!config || !questions || !answers) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields'
      });
    }

    const validAnswers = answers.filter(a => a.evaluation !== null);
    const averageScores = validAnswers.reduce(
      (acc, answer) => {
        if (answer.evaluation) {
          acc.clarity += answer.evaluation.scores.clarity;
          acc.accuracy += answer.evaluation.scores.accuracy;
          acc.depth += answer.evaluation.scores.depth;
          acc.count += 1;
        }
        return acc;
      },
      { clarity: 0, accuracy: 0, depth: 0, count: 0 }
    );

    const avgClarity = averageScores.count > 0 ? averageScores.clarity / averageScores.count : 0;
    const avgAccuracy = averageScores.count > 0 ? averageScores.accuracy / averageScores.count : 0;
    const avgDepth = averageScores.count > 0 ? averageScores.depth / averageScores.count : 0;
    const overallScore = (avgClarity + avgAccuracy + avgDepth) / 3;

    const interviewsCollection = db.collection('interviews');

    const result = await interviewsCollection.insertOne({
      userId: req.user.userId,
      config,
      questions,
      answers,
      scores: {
        clarity: avgClarity,
        accuracy: avgAccuracy,
        depth: avgDepth,
        overall: overallScore
      },
      completedAt: completedAt || new Date(),
      createdAt: new Date()
    });

    res.status(201).json({
      interviewId: result.insertedId.toString(),
      message: 'Interview saved successfully'
    });
  } catch (error) {
    console.error('Save interview error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to save interview'
    });
  }
});

// Get Interview History
app.get('/api/interviews/history', authenticateToken, async (req, res) => {
  try {
    const interviewsCollection = db.collection('interviews');

    const interviews = await interviewsCollection
      .find({ userId: req.user.userId })
      .sort({ completedAt: -1 })
      .limit(50)
      .toArray();

    const formattedInterviews = interviews.map(interview => ({
      id: interview._id.toString(),
      techStack: interview.config.techStack,
      level: interview.config.level,
      scores: interview.scores,
      questionsCount: interview.questions.length,
      answeredCount: interview.answers.filter(a => a.evaluation).length,
      completedAt: interview.completedAt,
      createdAt: interview.createdAt
    }));

    res.json({ interviews: formattedInterviews });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to load interview history'
    });
  }
});

// Get Single Interview Details
app.get('/api/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const interviewsCollection = db.collection('interviews');
    const interviewId = req.params.id;

    const interview = await interviewsCollection.findOne({
      _id: new ObjectId(interviewId),
      userId: req.user.userId
    });

    if (!interview) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Interview not found'
      });
    }

    res.json({
      interview: {
        id: interview._id.toString(),
        config: interview.config,
        questions: interview.questions,
        answers: interview.answers,
        scores: interview.scores,
        completedAt: interview.completedAt
      }
    });
  } catch (error) {
    console.error('Get interview details error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to load interview details'
    });
  }
});

// Aptitude Questions
app.post('/api/aptitude-questions', async (req, res) => {
  try {
    const { topicId, topicName } = req.body;

    if (!topicId || !topicName) {
      return res.status(400).json({ error: 'Topic ID and name are required' });
    }

    // Import and call the handler directly
    const handler = (await import('../api/aptitude-questions.js')).default;
    await handler(req, res);
  } catch (error) {
    console.error('Aptitude questions error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate aptitude questions',
      details: error.message
    });
  }
});

// Execute Code
app.post('/api/execute-code', async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    // Map our language IDs to Piston language IDs
    const languageMap = {
      python: 'python',
      javascript: 'javascript',
      java: 'java',
      cpp: 'c++',
      c: 'c',
      go: 'go',
      rust: 'rust',
      typescript: 'typescript',
    };

    // Get appropriate file name for each language
    const fileNameMap = {
      python: 'main.py',
      javascript: 'main.js',
      java: 'Main.java',
      cpp: 'main.cpp',
      c: 'main.c',
      go: 'main.go',
      rust: 'main.rs',
      typescript: 'main.ts',
    };

    const pistonLanguage = languageMap[language] || language;
    const fileName = fileNameMap[language] || 'main.txt';

    // Use Piston API for code execution
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLanguage,
        version: '*',
        files: [
          {
            name: fileName,
            content: code,
          },
        ],
      }),
    });

    if (!pistonResponse.ok) {
      throw new Error('Failed to execute code');
    }

    const result = await pistonResponse.json();

    // Combine stdout and stderr
    let output = '';
    if (result.run) {
      if (result.run.stdout) {
        output += result.run.stdout;
      }
      if (result.run.stderr) {
        if (output) output += '\n';
        output += result.run.stderr;
      }
    }
    if (result.compile && result.compile.stderr) {
      if (output) output += '\n';
      output += 'Compilation Error:\n' + result.compile.stderr;
    }

    // Check if there was an error
    if (result.run && result.run.code !== 0) {
      return res.json({
        output: output || 'Program exited with error',
        error: result.run.stderr || 'Execution failed',
      });
    }

    res.json({
      output: output || 'Code executed successfully with no output.',
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      error: error.message || 'Failed to execute code',
    });
  }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const { name, email, phone } = req.body;
    const usersCollection = db.collection('users');

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Name and email are required'
      });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await usersCollection.findOne({
        email: email.toLowerCase(),
        _id: { $ne: new ObjectId(req.user.userId) }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'EMAIL_EXISTS',
          message: 'Email is already taken'
        });
      }
    }

    // Update user profile
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      {
        $set: {
          name,
          email: email.toLowerCase(),
          phone: phone || '',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.userId,
        name,
        email: email.toLowerCase(),
        phone: phone || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update profile'
    });
  }
});

// Model Status API
app.get('/api/models/status', (req, res) => {
  try {
    const status = getModelStatus();
    if (process.env.USE_MOCK_MODE !== 'true' && modelFallback) {
      modelFallback.logRateLimitStatus();
    }
    
    res.json({
      status: 'success',
      models: {
        available: status.availableModels,
        total: status.totalModels,
        lastSuccessful: status.lastSuccessfulModel
      },
      nextReset: {
        time: status.nextResetTime,
        minutes: status.nextResetMinutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Model status error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get model status'
    });
  }
});

// Chat API for Chatbot
console.log('✅ Registering /api/chat route');
app.post('/api/chat', async (req, res) => {
  console.log('📥 Chat request received');
  console.log('🔍 Mock mode check:', process.env.USE_MOCK_MODE === 'true');
  
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'Message is required' 
      });
    }

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are an AI interview preparation assistant. Help users with:
- Technical interview preparation strategies
- Explaining programming concepts and algorithms
- Behavioral interview questions and answers
- Resume and career advice
- Coding best practices
- Aptitude test strategies

Be helpful, concise, and encouraging. Format your responses clearly with bullet points or numbered lists when appropriate.`
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Check if mock mode is enabled for chat
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('🎭 Mock mode enabled - returning sample chat response');
      const mockReply = `Hello! I'm here to help you with interview preparation. You asked about "${message}". Here are some key points:

• This is a mock response for testing purposes
• In real mode, I would provide detailed technical explanations
• I can help with JavaScript, React, algorithms, and more
• Feel free to ask specific interview questions!

Is there a particular topic you'd like to focus on for your interview preparation?`;
      return res.json({ reply: mockReply });
    }

    // Use model fallback system
    const reply = await modelFallback.makeRequest(messages, {
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({ reply });
  } catch (error) {
    console.error('========================================');
    console.error('💥 CHAT ERROR DETAILS:');
    console.error('├─ Error Type:', error.constructor.name);
    console.error('├─ Status Code:', error.status || 'N/A');
    console.error('├─ Message:', error.message);
    console.error('├─ Current Model:', getCurrentModel());
    console.error('├─ Timestamp:', new Date().toISOString());
    
    if (error.status === 429) {
      console.error('├─ Rate Limit Info:', error.error?.metadata?.raw || 'No additional info');
      console.error('└─ Suggestion: All free models may be rate limited. Try again in 1-2 minutes.');
    } else {
      console.error('└─ Stack:', error.stack);
    }
    console.error('========================================');

    // Enhanced error response with detailed status
    if (error.status === 429) {
      const status = getModelStatus();
      const retryMinutes = status.nextResetMinutes || 2;
      
      return res.status(429).json({
        error: 'RATE_LIMIT_ALL_MODELS',
        message: `All AI models are currently busy. Next model available in ${retryMinutes} minute(s).`,
        retryable: true,
        retryAfter: retryMinutes * 60,
        modelStatus: {
          available: status.availableModels,
          total: status.totalModels,
          nextResetMinutes: retryMinutes
        }
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process chat message. Please try again.',
      retryable: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Configure multer for resume uploads
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  }
});

// Resume Upload & Parse Endpoint
app.post('/api/resume/upload', resumeUpload.single('resume'), async (req, res) => {
  console.log('📤 Resume upload request received');
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'No file uploaded'
      });
    }

    console.log('📄 File received:', req.file.originalname, 'Size:', req.file.size, 'Type:', req.file.mimetype);
    let extractedText = '';
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Parse based on file type
    if (mimeType === 'application/pdf') {
      try {
        // Use require for CommonJS module
        const pdfParse = require('pdf-parse');
        console.log('📄 PDF Parse module loaded:', typeof pdfParse);
        console.log('📄 Buffer size:', fileBuffer.length);
        const pdfData = await pdfParse(fileBuffer);
        console.log('✅ PDF parsed successfully, text length:', pdfData.text.length);
        extractedText = pdfData.text;
      } catch (error) {
        console.error('❌ PDF parsing error:', error.message);
        console.error('Error stack:', error.stack);

        // TEMPORARY WORKAROUND: Return placeholder text for testing
        console.log('⚠️ Using placeholder text for PDF');
        extractedText = `Resume uploaded: ${req.file.originalname}

[PDF parsing is currently unavailable. This is placeholder text for testing.]

PROFESSIONAL SUMMARY
Experienced software developer with 5+ years of experience in full-stack development.

WORK EXPERIENCE
Senior Software Engineer at Tech Company (2020-Present)
- Developed and maintained web applications using React and Node.js
- Led team of 3 developers on major project initiatives
- Improved application performance by 40%

Software Developer at Startup Inc (2018-2020)
- Built RESTful APIs and microservices
- Collaborated with cross-functional teams
- Implemented CI/CD pipelines

EDUCATION
Bachelor of Science in Computer Science
University Name, 2018

SKILLS
JavaScript, React, Node.js, Python, SQL, Git, AWS`;
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxData.value;
      } catch (error) {
        console.error('DOCX parsing error:', error);
        return res.status(400).json({
          error: 'PARSE_ERROR',
          message: 'Failed to parse DOCX file. Please ensure it is a valid Word document.'
        });
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: 'EMPTY_FILE',
        message: 'No text content found in the uploaded file.'
      });
    }

    res.json({
      success: true,
      text: extractedText,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to process resume'
    });
  }
});

// Resume Analysis Endpoint (No authentication required)
app.post('/api/resume/analyze', async (req, res) => {
  console.log('📥 Resume analyze endpoint called');
  console.log('📋 Request body:', req.body);
  try {
    const { resumeText, targetRole, fileName } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Resume text is required'
      });
    }

    // Check if mock mode is enabled
    if (process.env.USE_MOCK_MODE === 'true') {
      console.log('🎭 Mock mode enabled - returning sample resume analysis');
      const mockAnalysis = {
        overallScore: 7.5,
        atsScore: 8,
        strengths: [
          "Clear and concise work experience descriptions",
          "Quantified achievements with specific metrics",
          "Well-organized education section",
          "Strong use of action verbs"
        ],
        weaknesses: [
          "Missing professional summary at the top",
          "Limited technical skills section",
          "Inconsistent date formatting across sections"
        ],
        suggestions: [
          "Add a professional summary highlighting your key strengths",
          "Create a dedicated technical skills section with relevant technologies",
          "Standardize date formats to MM/YYYY throughout",
          "Include more quantifiable achievements in your experience",
          "Add relevant certifications if applicable",
          "Consider adding a projects section to showcase your work"
        ],
        keywords: ["JavaScript", "React", "Node.js", "API Development", "Agile", "Git"],
        sections: {
          contact: "good",
          summary: "missing",
          experience: "excellent",
          education: "good",
          skills: "needs_improvement"
        }
      };
      // Save mock analysis to database
      const sessionId = getSessionId(req);
      const analysisId = 'mock_' + Date.now();
      
      try {
        const resumeAnalysisCollection = db.collection('resumeAnalysis');
        await resumeAnalysisCollection.insertOne({
          sessionId: sessionId,
          fileName: fileName || 'uploaded-resume',
          targetRole: targetRole || 'Not specified',
          resumeText: resumeText,
          analysis: mockAnalysis,
          analyzedAt: new Date(),
          createdAt: new Date()
        });
        console.log('✅ Mock resume analysis saved to database for session:', sessionId);
      } catch (saveError) {
        console.error('⚠️ Failed to save mock analysis to database:', saveError.message);
        // Continue anyway - don't fail the request if save fails
      }

      return res.json({
        ...mockAnalysis,
        analysisId: analysisId,
        saved: true,
        message: 'Mock analysis completed - no authentication required'
      });
    }

    const prompt = `Analyze this resume and provide detailed, actionable feedback in JSON format.

Resume Content:
${resumeText}

${targetRole ? `Target Role: ${targetRole}` : ''}

Provide your analysis in this EXACT JSON structure with NO extra text or markdown:
{
  "overallScore": <number between 1-10>,
  "atsScore": <number between 1-10 for ATS compatibility>,
  "strengths": [<array of 3-5 specific strengths found in the resume>],
  "weaknesses": [<array of 3-5 specific areas that need improvement>],
  "suggestions": [<array of 5-7 actionable, specific suggestions for improvement>],
  "keywords": [<array of 5-10 relevant keywords/skills missing from the resume>],
  "sections": {
    "contact": "<good|needs_improvement|missing>",
    "summary": "<good|needs_improvement|missing>",
    "experience": "<excellent|good|needs_improvement|missing>",
    "education": "<good|needs_improvement|missing>",
    "skills": "<good|needs_improvement|missing>"
  }
}

Focus your analysis on:
- ATS (Applicant Tracking System) compatibility
- Use of quantifiable achievements and metrics
- Keyword optimization for the target role
- Formatting consistency and professionalism
- Effective use of action verbs
- Completeness of essential sections`;

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'user',
          content: 'You are an expert resume reviewer and career coach. Provide constructive, specific, and actionable feedback. Return ONLY valid JSON with no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5
    });

    let responseText = completion.choices[0]?.message?.content;
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(responseText);

    // Save analysis to database
    const sessionId = getSessionId(req);
    const analysisId = 'real_' + Date.now();
    
    try {
      const resumeAnalysisCollection = db.collection('resumeAnalysis');
      await resumeAnalysisCollection.insertOne({
        sessionId: sessionId,
        fileName: fileName || 'uploaded-resume',
        targetRole: targetRole || 'Not specified',
        resumeText: resumeText,
        analysis: analysis,
        analyzedAt: new Date(),
        createdAt: new Date()
      });
      console.log('✅ Resume analysis saved to database for session:', sessionId);
    } catch (saveError) {
      console.error('⚠️ Failed to save analysis to database:', saveError.message);
      // Continue anyway - don't fail the request if save fails
    }

    res.json({
      ...analysis,
      analysisId: analysisId,
      saved: true,
      message: 'Real analysis completed - no authentication required'
    });
  } catch (error) {
    console.error('========================================');
    console.error('Resume analysis error:', error.message);
    console.error('Error details:', error);
    console.error('========================================');
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to analyze resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get Resume Analysis History (No authentication required)
app.get('/api/resume/history', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    console.log('📥 Getting history for session:', sessionId);
    
    const resumeAnalysisCollection = db.collection('resumeAnalysis');

    const analyses = await resumeAnalysisCollection
      .find({ sessionId: sessionId })
      .sort({ analyzedAt: -1 })
      .limit(50)
      .toArray();

    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis._id.toString(),
      fileName: analysis.fileName,
      targetRole: analysis.targetRole,
      overallScore: analysis.analysis.overallScore,
      atsScore: analysis.analysis.atsScore,
      analyzedAt: analysis.analyzedAt,
      createdAt: analysis.createdAt,
      // Include summary of key metrics for quick overview
      summary: {
        strengthsCount: analysis.analysis.strengths?.length || 0,
        weaknessesCount: analysis.analysis.weaknesses?.length || 0,
        suggestionsCount: analysis.analysis.suggestions?.length || 0,
        keywordCount: analysis.analysis.keywords?.length || 0
      }
    }));

    res.json({ analyses: formattedAnalyses });
  } catch (error) {
    console.error('Get resume history error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to load resume analysis history'
    });
  }
});

// Get Single Resume Analysis Details (No authentication required)
app.get('/api/resume/analysis/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const sessionId = getSessionId(req);
    const resumeAnalysisCollection = db.collection('resumeAnalysis');
    const analysisId = req.params.id;

    const analysis = await resumeAnalysisCollection.findOne({
      _id: new ObjectId(analysisId),
      sessionId: sessionId
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Resume analysis not found'
      });
    }

    res.json({
      id: analysis._id.toString(),
      fileName: analysis.fileName,
      targetRole: analysis.targetRole,
      analysis: analysis.analysis,
      resumeText: analysis.resumeText,
      analyzedAt: analysis.analyzedAt,
      createdAt: analysis.createdAt
    });
  } catch (error) {
    console.error('Get resume analysis details error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to load resume analysis details'
    });
  }
});

// Compare Resume Analyses (show improvement over time - No authentication required)
app.post('/api/resume/compare', async (req, res) => {
  try {
    const { analysisId1, analysisId2 } = req.body;
    
    if (!analysisId1 || !analysisId2) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Two analysis IDs are required for comparison'
      });
    }

    const { ObjectId } = await import('mongodb');
    const sessionId = getSessionId(req);
    const resumeAnalysisCollection = db.collection('resumeAnalysis');

    const [analysis1, analysis2] = await Promise.all([
      resumeAnalysisCollection.findOne({
        _id: new ObjectId(analysisId1),
        sessionId: sessionId
      }),
      resumeAnalysisCollection.findOne({
        _id: new ObjectId(analysisId2),
        sessionId: sessionId
      })
    ]);

    if (!analysis1 || !analysis2) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'One or both resume analyses not found'
      });
    }

    // Calculate improvements
    const comparison = {
      older: {
        id: analysis1._id.toString(),
        fileName: analysis1.fileName,
        analyzedAt: analysis1.analyzedAt,
        scores: {
          overall: analysis1.analysis.overallScore,
          ats: analysis1.analysis.atsScore
        }
      },
      newer: {
        id: analysis2._id.toString(),
        fileName: analysis2.fileName,
        analyzedAt: analysis2.analyzedAt,
        scores: {
          overall: analysis2.analysis.overallScore,
          ats: analysis2.analysis.atsScore
        }
      },
      improvements: {
        overallScore: analysis2.analysis.overallScore - analysis1.analysis.overallScore,
        atsScore: analysis2.analysis.atsScore - analysis1.analysis.atsScore,
        strengthsAdded: analysis2.analysis.strengths?.length - analysis1.analysis.strengths?.length || 0,
        weaknessesReduced: analysis1.analysis.weaknesses?.length - analysis2.analysis.weaknesses?.length || 0
      },
      recommendations: []
    };

    // Add improvement recommendations
    if (comparison.improvements.overallScore > 0) {
      comparison.recommendations.push("Great job! Your overall resume score has improved.");
    } else if (comparison.improvements.overallScore < 0) {
      comparison.recommendations.push("Consider reviewing recent changes - your overall score has decreased.");
    }

    if (comparison.improvements.atsScore > 0) {
      comparison.recommendations.push("Excellent! Your ATS compatibility has improved.");
    }

    res.json(comparison);
  } catch (error) {
    console.error('Resume comparison error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to compare resume analyses'
    });
  }
});

// Delete Resume Analysis (No authentication required)
app.delete('/api/resume/analysis/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const sessionId = getSessionId(req);
    const resumeAnalysisCollection = db.collection('resumeAnalysis');
    const analysisId = req.params.id;

    const result = await resumeAnalysisCollection.deleteOne({
      _id: new ObjectId(analysisId),
      sessionId: sessionId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Resume analysis not found'
      });
    }

    res.json({
      message: 'Resume analysis deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume analysis error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete resume analysis'
    });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
