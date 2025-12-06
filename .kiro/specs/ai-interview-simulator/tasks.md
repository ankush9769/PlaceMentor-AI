# Implementation Plan

- [x] 1. Initialize project structure and dependencies



  - Create React app with TypeScript support
  - Set up Express backend in `/api` directory for Vercel serverless functions
  - Install dependencies: express, openai SDK, cors
  - Configure environment variables for OpenAI API key
  - Set up basic folder structure: `/src/components`, `/src/types`, `/src/utils`, `/api`


  - _Requirements: 8.4_

- [ ] 2. Implement core TypeScript interfaces and types
  - Create type definitions for InterviewConfig, Question, Answer, Evaluation, APIError


  - Define prop types for all major components
  - _Requirements: 1.1, 2.3, 5.1_

- [ ] 3. Build backend API endpoints
- [ ] 3.1 Implement POST /api/generate-questions endpoint
  - Accept techStack and level in request body
  - Construct prompt for OpenAI GPT-4: "Generate five spoken-ready interview questions on {level} {techStack} concepts. Focus on theory and concepts, not code. Make questions suitable for verbal answers. Return as JSON array with numbered questions."
  - Call OpenAI API and parse response into Question array
  - Return JSON response with questions array
  - Implement error handling for OpenAI API failures
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2_

- [ ]* 3.2 Write property test for question generation
  - **Property 1: Question generation returns exactly five questions**


  - **Validates: Requirements 2.1, 8.2**

- [ ]* 3.3 Write property test for code-free questions
  - **Property 2: Generated questions are code-free**
  - **Validates: Requirements 2.2**



- [ ] 3.4 Implement POST /api/synthesize-speech endpoint
  - Accept question text in request body
  - Call OpenAI TTS API with text using 'alloy' voice
  - Stream audio response (audio/mpeg) directly to client
  - Set appropriate content-type headers
  - Implement error handling for TTS failures
  - _Requirements: 3.1, 3.2_

- [ ] 3.5 Implement POST /api/evaluate-answer endpoint
  - Accept question, answer, techStack, and level in request body
  - Construct evaluation prompt for GPT-4: "Rate this interview answer on clarity (1-5), accuracy (1-5), and depth (1-5). Question: {question}. Answer: {answer}. Context: {level} {techStack} interview. Provide specific feedback for each criterion and overall tips for improvement. Return as JSON."
  - Parse GPT response into Evaluation object with scores and feedback
  - Return JSON response with evaluation
  - Implement error handling and validation
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.3_

- [ ]* 3.6 Write property test for evaluation structure
  - **Property 10: Evaluation includes all three criteria with valid scores**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 3.7 Write property test for evaluation feedback
  - **Property 11: Evaluation provides non-empty feedback**
  - **Validates: Requirements 5.3**




- [ ]* 3.8 Write property test for stateless backend
  - **Property 17: Backend processes requests statelessly**
  - **Validates: Requirements 8.1, 8.3**

- [ ]* 3.9 Write property test for concurrent requests
  - **Property 18: Concurrent requests are handled independently**
  - **Validates: Requirements 8.5**

- [ ] 4. Create configuration form component
- [ ] 4.1 Build ConfigurationForm component
  - Create dropdown for tech stack selection (Python, JavaScript, Java, TypeScript, React, Node.js)
  - Create radio buttons for difficulty level (junior, mid-level, senior)
  - Create number input for time limit with min=5, max=60
  - Add form validation for all fields
  - Create "Start Interview" button
  - Implement onStartInterview callback with config object
  - Style with video-call aesthetic
  - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [ ]* 4.2 Write property test for time limit validation
  - **Property 4: Time limit validation accepts valid range**
  - **Validates: Requirements 1.4**

- [ ]* 4.3 Write property test for valid configuration
  - **Property 5: Valid configuration initiates interview with correct parameters**
  - **Validates: Requirements 1.5**

- [ ]* 4.4 Write property test for invalid configuration errors
  - **Property 22: Invalid configuration shows validation errors**
  - **Validates: Requirements 10.5**



- [ ] 5. Implement interview interface core components
- [ ] 5.1 Create InterviewInterface component
  - Set up component state: questions, currentQuestionIndex, answers, timeRemaining, isListening, transcript
  - Implement useEffect to fetch questions on mount using config
  - Store questions in state maintaining original order
  - Create layout with video-call styling: question display area, controls section, feedback panel
  - _Requirements: 2.5, 6.1, 9.4_

- [x]* 5.2 Write property test for question order preservation


  - **Property 3: Questions maintain sequential order**
  - **Validates: Requirements 2.5, 9.4**

- [ ] 5.3 Create Timer component
  - Accept initialTime prop in seconds
  - Implement countdown using setInterval
  - Display time in MM:SS format
  - Call onExpire callback when reaching zero
  - Style prominently in interview interface


  - _Requirements: 6.2, 9.3_

- [ ]* 5.4 Write property test for timer countdown
  - **Property 13: Timer counts down correctly**
  - **Validates: Requirements 6.2, 9.3**

- [ ] 5.5 Create MicrophoneButton component
  - Accept isListening, onToggle, disabled props
  - Display microphone icon with visual feedback (color change, pulse animation)
  - Toggle recording state on click
  - Disable button when appropriate (during audio playback, when disabled prop is true)
  - _Requirements: 6.3_

- [ ]* 5.6 Write property test for microphone icon state
  - **Property 15: Microphone icon reflects recording state**
  - **Validates: Requirements 6.3**

- [ ] 5.7 Create QuestionDisplay component
  - Display current question text
  - Show question progress indicator (e.g., "Question 2 of 5")
  - Style for readability
  - _Requirements: 6.5_

- [ ]* 5.8 Write property test for question progress display
  - **Property 14: Question progress indicator shows current position**
  - **Validates: Requirements 6.5**

- [ ] 6. Implement audio playback functionality
- [ ] 6.1 Add TTS audio playback to InterviewInterface
  - Create hidden HTML5 audio element
  - When question changes, call /api/synthesize-speech with question text
  - Load audio data into audio element
  - Play audio automatically
  - Display question text simultaneously with audio playback
  - Disable microphone button during playback
  - Enable microphone button when audio ends (onended event)
  - Handle audio loading and playback errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 6.2 Write property test for audio playback trigger
  - **Property 6: Audio playback triggers for questions**
  - **Validates: Requirements 3.1, 3.3, 7.2**

- [ ] 7. Implement speech recognition functionality
- [ ] 7.1 Add speech-to-text capture to InterviewInterface
  - Check browser support for Web Speech API (window.SpeechRecognition or window.webkitSpeechRecognition)
  - Initialize SpeechRecognition with continuous=true, interimResults=true
  - Start recognition when microphone button is clicked
  - Update transcript state in real-time as speech is recognized (onresult event)
  - Display transcript in UI
  - Stop recognition when user clicks microphone again or submits answer
  - Handle permission denied error: show error message and enable text input fallback
  - Handle browser not supported: show text input fallback
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 7.2 Write property test for speech input activation
  - **Property 7: Speech input activation triggers recognition**
  - **Validates: Requirements 4.1**

- [ ]* 7.3 Write property test for transcript UI updates
  - **Property 8: Transcript updates reflect in UI**


  - **Validates: Requirements 4.3**

- [ ] 8. Implement answer submission and evaluation
- [ ] 8.1 Add answer submission to InterviewInterface
  - Create "Submit Answer" button
  - On submit, send transcript to /api/evaluate-answer with question, answer, techStack, level
  - Store answer and evaluation in answers array
  - Display loading state during evaluation
  - Handle network errors with retry option
  - _Requirements: 4.4, 10.2_

- [ ]* 8.2 Write property test for answer submission
  - **Property 9: Answer submission sends transcript to API**
  - **Validates: Requirements 4.4**

- [ ]* 8.3 Write property test for network error retry
  - **Property 21: Network errors provide retry options**
  - **Validates: Requirements 10.2**

- [ ] 8.2 Create EvaluationDisplay component
  - Accept evaluation prop with scores and feedback
  - Display clarity, accuracy, and depth scores separately with labels
  - Display feedback for each criterion
  - Display overall tips
  - Style with clear visual hierarchy
  - _Requirements: 5.4, 5.5_

- [ ]* 8.3 Write property test for evaluation display
  - **Property 12: Evaluation results display all scores separately**
  - **Validates: Requirements 5.5**

- [ ] 9. Implement retry functionality
- [ ] 9.1 Add retry capability to InterviewInterface
  - Display retry button after evaluation is shown


  - On retry click: clear current answer and evaluation from state, replay question audio, reset transcript
  - Ensure retry doesn't affect subsequent questions or overall interview state
  - Allow new answer to be evaluated independently
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.2 Write property test for retry behavior
  - **Property 16: Retry resets state and allows independent evaluation**
  - **Validates: Requirements 7.3, 7.4, 7.5**

- [ ] 10. Implement interview progression logic
- [ ] 10.1 Add automatic question advancement
  - After evaluation is displayed (and user has reviewed it), automatically advance to next question after a brief delay or on "Next" button click
  - Increment currentQuestionIndex
  - Reset transcript and evaluation state for new question
  - Trigger audio playback for new question


  - _Requirements: 9.1_

- [ ]* 10.2 Write property test for auto-advance
  - **Property 19: Interview advances automatically after evaluation**
  - **Validates: Requirements 9.1**

- [ ] 10.3 Create ResultsSummary component
  - Accept questions and answers arrays as props
  - Display all questions with their answers, scores, and feedback
  - Calculate and display average scores across all criteria
  - Provide "Start New Interview" button that calls onRestart callback
  - Style for easy review of performance
  - _Requirements: 9.2, 9.5_

- [ ]* 10.4 Write property test for completion summary
  - **Property 20: Completion triggers summary display**
  - **Validates: Requirements 9.2**

- [ ] 10.5 Add interview completion logic to InterviewInterface
  - When currentQuestionIndex reaches 5 (all questions answered), transition to results view
  - When timer expires, end interview and show results for completed questions only
  - Pass questions and answers to ResultsSummary component
  - _Requirements: 9.2, 9.3_

- [ ] 11. Create main App component and routing
- [ ] 11.1 Build App component
  - Manage application state: interviewConfig, currentView ('config' | 'interview' | 'results')
  - Render ConfigurationForm when currentView is 'config'
  - Render InterviewInterface when currentView is 'interview', passing config
  - Handle view transitions based on user actions
  - Implement restart functionality that resets to config view
  - Add global styles for video-call aesthetic
  - _Requirements: 1.5, 9.5_

- [ ] 12. Add responsive design and styling
  - Implement responsive CSS for desktop and mobile layouts
  - Use CSS Grid or Flexbox for adaptive layouts
  - Test on various screen sizes
  - Ensure video-call aesthetic is maintained across devices
  - Add loading states and transitions
  - _Requirements: 6.1, 6.4_

- [ ] 13. Implement comprehensive error handling
  - Add error boundaries for React components
  - Implement try-catch blocks around all API calls
  - Display user-friendly error messages for all error types
  - Add retry buttons for recoverable errors
  - Handle OpenAI API rate limits with appropriate messaging
  - Log errors to console for debugging
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Configure for Vercel deployment
  - Create vercel.json with configuration for serverless functions
  - Set function timeout to 30 seconds
  - Configure build command and output directory
  - Add .env.example file documenting required environment variables
  - Create deployment documentation
  - _Requirements: 8.4_

- [ ] 15. Final testing and polish
  - Test complete interview flow end-to-end
  - Verify all error scenarios are handled gracefully
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Verify mobile responsiveness
  - Test with various tech stacks and difficulty levels
  - Ensure all UI feedback is clear and helpful
  - _Requirements: All_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
