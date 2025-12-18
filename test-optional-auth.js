// Test script to verify optional auth middleware
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = (req, res, next) => {
  console.log('🔍 OptionalAuth middleware called');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔍 Auth header:', authHeader);
  console.log('🔍 Token:', token);

  if (token) {
    try {
      const user = jwt.verify(token, 'test-secret');
      req.user = user;
      console.log('✅ Token valid, user set:', user);
    } catch (error) {
      console.log('❌ Invalid token, continuing without auth');
    }
  } else {
    console.log('ℹ️ No token provided, continuing without auth');
  }
  
  next();
};

// Test endpoint
app.post('/test', optionalAuth, (req, res) => {
  console.log('📥 Test endpoint called');
  console.log('👤 User:', req.user ? 'Authenticated' : 'Not authenticated');
  
  res.json({
    authenticated: !!req.user,
    user: req.user || null,
    message: req.user ? 'You are logged in' : 'You are not logged in, but that\'s okay'
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('Test without auth: curl -X POST http://localhost:3003/test -H "Content-Type: application/json" -d "{}"');
  console.log('Test with invalid auth: curl -X POST http://localhost:3003/test -H "Authorization: Bearer invalid" -H "Content-Type: application/json" -d "{}"');
});