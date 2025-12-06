# Design Document

## Overview

The AI Interview Simulator is a full-stack web application that provides realistic voice-based technical interview practice. The system uses a React frontend for the user interface, a Node.js/Express backend for API orchestration, OpenAI's GPT models for question generation and answer evaluation, OpenAI's TTS API for audio synthesis, and the browser's Web Speech API for voice input. The architecture is designed to be stateless and serverless-compatible for deployment on Vercel.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Frontend (SPA)                         │ │
│  │  - Configuration UI                                    │ │
│  │  - Video-call style Interview Interface               │ │
│  │  - Audio Playback (HTML5 Audio)                       │ │
│  │  - Speech Recognition (Web Speech API)                │ │
│  │  - Results Display                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel Serverless Functions                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Node.js/Express Backend API                    │ │
│  │  - POST /api/generate-questions                        │ │
│  │  - POST /api/synthesize-speech                         │ │
│  │  - POST /api/evaluate-answer                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI API Services                       │
│  - GPT-4 (Question Generation)                              │
│  - GPT-4 (Answer Evaluation)                                │
│  - TTS API (Audio Synthesis)                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with functional components and hooks
- CSS Modules or Tailwind CSS for styling
- HTML5 Audio API for playback
- Web Speech API (SpeechRecognition) for voice input
- Fetch API for HTTP requests

**Backend:**
- Node.js 18+ runtime
- Express.js for API routing
- OpenAI Node.js SDK for API integration
- Environment variables for API key management

**Deployment:**
- Vercel for hosting (frontend + serverless functions)
- Environment variables stored in Vercel dashboard

## Components and Interfaces

### Frontend Components

#### 1. App Component
Root component managing application state and routing between configuration and interview views.

**State:**
- `interviewConfig`: Object containing tech stack, level, and time limit
- `currentView`: Enum ('config' | 'interview' | 'results')

#### 2. ConfigurationForm Component
Collects interview parameters from the user.

**Props:**
- `onStartInterview`: Callback function receiving configuration object

**State:**
- `techStack`: String (selected technology)
- `level`: String ('junior' | 'mid-level' | 'senior')
- `timeLimit`: Number (minutes)

**UI Elements:**
- Dropdown for tech stack selection
- Radio buttons for difficulty level
- Number input for time limit
- Start button

#### 3. InterviewInterface Component
Main interview experience with video-call styling.

**Props:**
- `config`: Interview configuration object
- `onComplete`: Callback when interview finishes

**State:**
- `questions`: Array of question objects
- `currentQuestionIndex`: Number
- `answers`: Array of answer objects with evaluations
- `isListening`: Boolean
- `transcript`: String (current speech-to-text)
- `timeRemaining`: Number (seconds)
- `isLoading`: Boolean

**Child Components:**
- Timer display
- Question display area
- Microphone button with visual feedback
- Audio player (hidden, controlled programmatically)
- Answer transcript display
- Evaluation feedback panel
- Retry button
- Navigation controls

#### 4. Timer Component
Displays countdown timer.

**Props:**
- `initialTime`: Number (seconds)
- `onExpire`: Callback when time reaches zero

#### 5. MicrophoneButton Component
Voice input control with visual feedback.

**Props:**
- `isListening`: Boolean
- `onToggle`: Callback to start/stop listening
- `disabled`: Boolean

#### 6. EvaluationDisplay Component
Shows scores and feedback for an answer.

**Props:**
- `evaluation`: Object with clarity, accuracy, depth scores and tips

#### 7. ResultsSummary Component
Final summary of all questions and evaluations.

**Props:**
- `questions`: Array of questions
- `answers`: Array of answers with evaluations
- `onRestart`: Callback to start new interview

### Backend API Endpoints

#### POST /api/generate-questions

**Request Body:**
```json
{
  "techStack": "Python",
  "level": "junior"
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is the difference between a list and a tuple in Python?"
    },
    {
      "id": 2,
      "text": "Can you explain what Python's GIL is and why it matters?"
    }
    // ... 3 more questions
  ]
}
```

**Implementation:**
- Constructs prompt for OpenAI GPT-4
- Prompt template: "Generate five spoken-ready interview questions on {level} {techStack} concepts. Focus on theory and concepts, not code. Make questions suitable for verbal answers. Return as JSON array with numbered questions."
- Parses GPT response into structured JSON
- Returns question array

#### POST /api/synthesize-speech

**Request Body:**
```json
{
  "text": "What is the difference between a list and a tuple in Python?",
  "questionId": 1
}
```

**Response:**
- Binary audio data (audio/mpeg)
- Streamed directly to client

**Implementation:**
- Calls OpenAI TTS API with text
- Uses 'alloy' or 'nova' voice
- Streams audio response to client
- Sets appropriate content-type headers

#### POST /api/evaluate-answer

**Request Body:**
```json
{
  "question": "What is the difference between a list and a tuple in Python?",
  "answer": "Lists are mutable and tuples are immutable. Lists use square brackets and tuples use parentheses.",
  "techStack": "Python",
  "level": "junior"
}
```

**Response:**
```json
{
  "scores": {
    "clarity": 4,
    "accuracy": 5,
    "depth": 3
  },
  "feedback": {
    "clarity": "Your answer was clear and well-structured.",
    "accuracy": "Excellent! You correctly identified the key difference.",
    "depth": "Consider mentioning use cases or performance implications to add depth."
  },
  "overallTips": "Strong answer! To improve, discuss when to use each data structure."
}
```

**Implementation:**
- Constructs evaluation prompt for GPT-4
- Prompt template: "Rate this interview answer on clarity (1-5), accuracy (1-5), and depth (1-5). Question: {question}. Answer: {answer}. Context: {level} {techStack} interview. Provide specific feedback for each criterion and overall tips for improvement. Return as JSON."
- Parses GPT response into structured evaluation
- Returns scores and feedback

## Data Models

### Configuration
```typescript
interface InterviewConfig {
  techStack: string;
  level: 'junior' | 'mid-level' | 'senior';
  timeLimit: number; // minutes
}
```

### Question
```typescript
interface Question {
  id: number;
  text: string;
}
```

### Answer
```typescript
interface Answer {
  questionId: number;
  transcript: string;
  evaluation: Evaluation | null;
  attemptNumber: number;
}
```

### Evaluation
```typescript
interface Evaluation {
  scores: {
    clarity: number; // 1-5
    accuracy: number; // 1-5
    depth: number; // 1-5
  };
  feedback: {
    clarity: string;
    accuracy: string;
    depth: string;
  };
  overallTips: string;
}
```

### API Error Response
```typescript
interface APIError {
  error: string;
  message: string;
  retryable: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Question generation returns exactly five questions
*For any* valid interview configuration (tech stack and difficulty level), the question generation API should return exactly five questions in a single response.
**Validates: Requirements 2.1, 8.2**

### Property 2: Generated questions are code-free
*For any* generated question, the question text should not contain code syntax patterns such as brackets, semicolons, function declarations, or code blocks.
**Validates: Requirements 2.2**

### Property 3: Questions maintain sequential order
*For any* set of generated questions, when stored and presented to the user, the questions should appear in the same order they were received from the API.
**Validates: Requirements 2.5, 9.4**

### Property 4: Time limit validation accepts valid range
*For any* time limit value between 5 and 60 minutes (inclusive), the configuration form should accept the value, and for any value outside this range, the form should reject it with a validation error.
**Validates: Requirements 1.4**

### Property 5: Valid configuration initiates interview with correct parameters
*For any* valid configuration object (valid tech stack, difficulty level, and time limit), submitting the configuration should start an interview session that uses those exact parameters for question generation.
**Validates: Requirements 1.5**

### Property 6: Audio playback triggers for questions
*For any* question that needs to be presented, the system should call the TTS API with the question text and play the resulting audio through the browser audio element.
**Validates: Requirements 3.1, 3.3, 7.2**

### Property 7: Speech input activation triggers recognition
*For any* user action that activates voice input (clicking microphone button), the system should start the browser's speech recognition API and capture audio from the microphone.
**Validates: Requirements 4.1**

### Property 8: Transcript updates reflect in UI
*For any* speech-to-text conversion result, the transcribed text should be immediately displayed in the user interface.
**Validates: Requirements 4.3**

### Property 9: Answer submission sends transcript to API
*For any* completed answer transcript, when the user finishes their answer, the system should send the transcript text to the evaluation API endpoint.
**Validates: Requirements 4.4**

### Property 10: Evaluation includes all three criteria with valid scores
*For any* submitted answer, the evaluation response should contain scores for clarity, accuracy, and depth, where each score is a number between 1 and 5 (inclusive).
**Validates: Requirements 5.1, 5.2**

### Property 11: Evaluation provides non-empty feedback
*For any* evaluated answer, the evaluation response should include non-empty feedback strings for clarity, accuracy, depth, and overall tips.
**Validates: Requirements 5.3**

### Property 12: Evaluation results display all scores separately
*For any* evaluation result, the UI should display the clarity score, accuracy score, and depth score as distinct, individually visible elements.
**Validates: Requirements 5.5**

### Property 13: Timer counts down correctly
*For any* interview session with a specified time limit, the timer should count down from the initial time and trigger interview completion when reaching zero.
**Validates: Requirements 6.2, 9.3**

### Property 14: Question progress indicator shows current position
*For any* active question during the interview, the UI should display the current question number and total question count (e.g., "Question 2 of 5").
**Validates: Requirements 6.5**

### Property 15: Microphone icon reflects recording state
*For any* change in voice input state (starting or stopping recording), the microphone icon should update its visual appearance to reflect the current recording status.
**Validates: Requirements 6.3**

### Property 16: Retry resets state and allows independent evaluation
*For any* question with an existing answer and evaluation, clicking retry should clear the previous answer and evaluation, replay the question audio, and allow a new answer to be evaluated independently without affecting subsequent questions.
**Validates: Requirements 7.3, 7.4, 7.5**

### Property 17: Backend processes requests statelessly
*For any* API request (question generation, speech synthesis, or answer evaluation), the backend should process it without relying on server-side session state, accepting all necessary context in the request payload.
**Validates: Requirements 8.1, 8.3**

### Property 18: Concurrent requests are handled independently
*For any* set of simultaneous API requests from different users, each request should be processed independently without interference or shared state.
**Validates: Requirements 8.5**

### Property 19: Interview advances automatically after evaluation
*For any* question that has been answered and evaluated, if it is not the final question, the system should automatically advance to the next question.
**Validates: Requirements 9.1**

### Property 20: Completion triggers summary display
*For any* interview session where all five questions have been answered, the system should display a summary view showing all questions, answers, scores, and feedback.
**Validates: Requirements 9.2**

### Property 21: Network errors provide retry options
*For any* failed network request, the system should display an error message and provide a retry button that allows the user to reattempt the failed operation.
**Validates: Requirements 10.2**

### Property 22: Invalid configuration shows validation errors
*For any* configuration submission with invalid values (empty tech stack, invalid difficulty level, or out-of-range time limit), the system should display specific validation error messages indicating what needs to be corrected.
**Validates: Requirements 10.5**

## Error Handling

### Frontend Error Handling

**Network Errors:**
- Wrap all API calls in try-catch blocks
- Display user-friendly error messages
- Provide retry buttons for transient failures
- Log errors to console for debugging

**Speech Recognition Errors:**
- Handle permission denied: Show error message and enable text input fallback
- Handle not supported: Detect browser compatibility and show text input
- Handle no speech detected: Provide visual feedback and allow retry
- Handle network errors: Show offline message

**Audio Playback Errors:**
- Handle audio loading failures: Retry TTS request
- Handle playback errors: Show error and allow manual progression
- Provide fallback text display if audio fails

**Validation Errors:**
- Validate configuration before submission
- Show inline error messages for invalid inputs
- Prevent submission until all fields are valid
- Provide clear guidance on valid values

### Backend Error Handling

**OpenAI API Errors:**
- Rate limiting (429): Return retryable error with wait time
- Authentication errors (401): Log error, return generic message
- Service unavailable (503): Return retryable error
- Invalid requests (400): Log and return specific error message
- Timeout errors: Implement retry logic with exponential backoff

**Request Validation:**
- Validate all required fields are present
- Validate field types and formats
- Return 400 with specific validation errors
- Sanitize inputs to prevent injection

**General Error Handling:**
- Use Express error middleware for centralized handling
- Log all errors with context
- Return consistent error response format
- Never expose internal errors or API keys to client

### Error Response Format

```typescript
{
  error: string;        // Error type (e.g., "RATE_LIMIT", "VALIDATION_ERROR")
  message: string;      // User-friendly message
  retryable: boolean;   // Whether the operation can be retried
  details?: any;        // Optional additional context
}
```

## Testing Strategy

The AI Interview Simulator will employ a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Unit Testing

**Framework:** Jest with React Testing Library for frontend, Jest for backend

**Frontend Unit Tests:**
- Component rendering with various props
- User interaction handlers (button clicks, form submissions)
- State management and updates
- Error boundary behavior
- Specific edge cases:
  - Empty configuration submission
  - Microphone permission denied
  - Audio playback failure
  - Network timeout scenarios

**Backend Unit Tests:**
- API endpoint request/response handling
- OpenAI API integration with mocked responses
- Error handling for various failure scenarios
- Request validation logic
- Specific examples:
  - Question generation for "junior Python"
  - Evaluation of a well-structured answer
  - TTS synthesis for a standard question

**Integration Tests:**
- End-to-end API flows with mocked OpenAI
- Frontend-backend communication
- Complete interview flow from configuration to results

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Each property-based test will run a minimum of 100 iterations
- Tests will use fast-check's built-in generators and custom generators for domain-specific data
- Each test will be tagged with a comment referencing the design document property

**Tag Format:**
```javascript
// Feature: ai-interview-simulator, Property 1: Question generation returns exactly five questions
```

**Property-Based Tests:**

Each correctness property from the design document will be implemented as a single property-based test:

1. **Property 1 Test:** Generate random valid configurations, verify question count is always 5
2. **Property 2 Test:** Generate random questions, verify none contain code syntax patterns
3. **Property 3 Test:** Generate random question arrays, verify order preservation through storage
4. **Property 4 Test:** Generate random time limits (both valid and invalid), verify validation behavior
5. **Property 5 Test:** Generate random valid configs, verify interview starts with exact parameters
6. **Property 6 Test:** Generate random questions, verify TTS API calls and audio playback
7. **Property 7 Test:** Generate random voice input activations, verify speech recognition starts
8. **Property 8 Test:** Generate random transcripts, verify UI updates
9. **Property 9 Test:** Generate random completed transcripts, verify API submission
10. **Property 10 Test:** Generate random answers, verify evaluation structure and score ranges
11. **Property 11 Test:** Generate random answers, verify feedback is non-empty
12. **Property 12 Test:** Generate random evaluations, verify UI displays all three scores
13. **Property 13 Test:** Generate random time limits, verify countdown behavior
14. **Property 14 Test:** Generate random question indices, verify progress display format
15. **Property 15 Test:** Generate random recording state changes, verify icon updates
16. **Property 16 Test:** Generate random retry scenarios, verify state reset and independence
17. **Property 17 Test:** Generate random API requests, verify stateless processing
18. **Property 18 Test:** Generate random concurrent requests, verify independence
19. **Property 19 Test:** Generate random non-final questions, verify auto-advance
20. **Property 20 Test:** Generate random completed interviews, verify summary display
21. **Property 21 Test:** Generate random network errors, verify retry options
22. **Property 22 Test:** Generate random invalid configs, verify validation messages

**Custom Generators:**
- `arbitraryTechStack()`: Generates valid tech stack strings
- `arbitraryDifficultyLevel()`: Generates valid difficulty levels
- `arbitraryTimeLimit()`: Generates time limits (both valid and invalid ranges)
- `arbitraryQuestion()`: Generates realistic interview questions
- `arbitraryAnswer()`: Generates realistic answer transcripts
- `arbitraryEvaluation()`: Generates valid evaluation objects

### Test Coverage Goals

- Unit test coverage: >80% for critical paths
- Property-based tests: All 22 correctness properties implemented
- Integration tests: All major user flows covered
- Edge cases: Microphone denial, API failures, timeout scenarios

### Testing Workflow

1. **Development:** Write implementation first, then corresponding tests
2. **Property Tests:** Implement property-based tests as features are completed
3. **Continuous Testing:** Run unit tests on every commit
4. **Pre-deployment:** Run full test suite including property tests (100+ iterations each)

## Security Considerations

**API Key Protection:**
- Store OpenAI API key in environment variables
- Never expose API key in frontend code
- Use Vercel environment variables for deployment
- Rotate keys periodically

**Input Validation:**
- Sanitize all user inputs before sending to OpenAI
- Validate configuration parameters
- Limit answer length to prevent abuse
- Rate limit API requests per IP

**CORS Configuration:**
- Configure CORS to allow only frontend domain
- Restrict API access to authorized origins

**Content Safety:**
- Monitor for inappropriate content in answers
- Implement content filtering if needed
- Log suspicious activity

## Performance Considerations

**Frontend Optimization:**
- Lazy load components not needed initially
- Optimize audio buffering for smooth playback
- Debounce speech recognition updates
- Minimize re-renders with React.memo

**Backend Optimization:**
- Stream TTS audio responses
- Implement request timeout limits
- Use connection pooling for OpenAI API
- Cache common question sets (optional enhancement)

**Vercel Deployment:**
- Optimize bundle size for fast cold starts
- Use edge functions if available
- Monitor function execution time
- Set appropriate timeout limits

## Deployment

**Vercel Configuration:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

**Environment Variables:**
- `OPENAI_API_KEY`: OpenAI API key
- `NODE_ENV`: Environment (production/development)

**Build Process:**
1. Install dependencies: `npm install`
2. Build frontend: `npm run build`
3. Deploy to Vercel: `vercel deploy`

**Post-Deployment Verification:**
- Test question generation endpoint
- Test TTS synthesis endpoint
- Test answer evaluation endpoint
- Verify frontend loads correctly
- Test complete interview flow

## Future Enhancements

**Potential Improvements:**
- Save interview history to database
- Support multiple languages
- Add video recording of user responses
- Implement adaptive difficulty (questions get harder/easier based on performance)
- Add more detailed analytics and progress tracking
- Support custom question sets
- Add collaborative interview mode (peer practice)
- Integrate with calendar for scheduled practice sessions
