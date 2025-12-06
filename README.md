# AI Interview Simulator

A web-based AI interview simulator that conducts spoken technical interviews using AI. Practice your interview skills with voice-based questions and get detailed feedback on your answers.

## Features

- 🔐 **User Authentication** - Secure signup/signin with JWT tokens
- 👤 **Personal Dashboard** - Track your progress and view statistics
- 📚 **Interview History** - Review all past interviews with detailed scores
- 🎯 **Customizable Interviews** - Select tech stack, difficulty level, and time limit
- 🗣️ **Voice Interaction** - Answer questions using speech recognition
- 🔊 **Text-to-Speech** - Questions are spoken aloud for realistic practice
- 📊 **AI Evaluation** - Get detailed feedback on clarity, accuracy, and depth
- 🎨 **Video-Call UI** - Beautiful, modern interface mimicking real interviews
- 🔄 **Retry Questions** - Practice until you're satisfied with your answer
- 📱 **Responsive Design** - Works perfectly on desktop and mobile

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Vercel Serverless Functions
- **AI:** OpenAI GPT-4 + TTS API
- **Speech:** Web Speech API

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MongoDB:**
   - **Option A: Local MongoDB**
     - Install MongoDB locally: https://www.mongodb.com/try/download/community
     - Start MongoDB service
     - Use connection string: `mongodb://localhost:27017/ai-interview-simulator`
   
   - **Option B: MongoDB Atlas (Cloud)**
     - Create free account at https://www.mongodb.com/cloud/atlas
     - Create a cluster
     - Get your connection string
     - Use format: `mongodb+srv://username:password@cluster.mongodb.net/ai-interview-simulator`

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your configuration:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your-secret-key-for-jwt
     ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

This project is configured for deployment on Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variable `OPENAI_API_KEY` in Vercel dashboard

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── generate-questions.ts
│   ├── synthesize-speech.ts
│   └── evaluate-answer.ts
├── src/
│   ├── components/        # React components
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── .env.example          # Environment variables template
├── vercel.json           # Vercel configuration
└── package.json
```

## Requirements

- Node.js 18+
- OpenAI API key
- Modern browser with Web Speech API support (Chrome, Edge, Safari)

## License

MIT
