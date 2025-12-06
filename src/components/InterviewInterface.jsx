import React, { useState, useEffect, useRef } from 'react';
import Timer from './Timer';
import MicrophoneButton from './MicrophoneButton';
import QuestionDisplay from './QuestionDisplay';
import EvaluationDisplay from './EvaluationDisplay';
import '../styles/components/InterviewInterface.css';

const InterviewInterface = ({ config, onComplete, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Play audio when question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      playQuestionAudio(questions[currentQuestionIndex].text);
    }
  }, [currentQuestionIndex, questions]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          techStack: config.techStack,
          level: config.level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      setIsLoading(false);
    }
  };

  const playQuestionAudio = async (text) => {
    try {
      setIsPlayingAudio(true);
      const response = await fetch('/api/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlayingAudio(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Reset the final transcript accumulator when starting
    finalTranscriptRef.current = transcript;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let currentFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Only add final transcript once
      if (currentFinalTranscript) {
        finalTranscriptRef.current += currentFinalTranscript;
        setTranscript(finalTranscriptRef.current);
      } else {
        // Show interim results without adding to final
        setTranscript(finalTranscriptRef.current + interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable microphone permissions.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }

    stopListening();
    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestionIndex].text,
          answer: transcript,
          techStack: config.techStack,
          level: config.level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const evaluation = await response.json();
      setCurrentEvaluation(evaluation);

      const newAnswer = {
        questionId: questions[currentQuestionIndex].id,
        transcript,
        evaluation,
        attemptNumber: 1,
      };

      setAnswers((prev) => [...prev, newAnswer]);
      setShowRetry(true);
    } catch (err) {
      setError('Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setCurrentEvaluation(null);
    setShowRetry(false);
    setError(null);
    // Remove the last answer
    setAnswers((prev) => prev.slice(0, -1));
    // Replay audio
    playQuestionAudio(questions[currentQuestionIndex].text);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTranscript('');
      setCurrentEvaluation(null);
      setShowRetry(false);
      setError(null);
    } else {
      onComplete(answers, questions);
    }
  };

  const handleTimeExpire = () => {
    onComplete(answers, questions);
  };

  if (isLoading) {
    return (
      <div className="interview-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating your interview questions...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="interview-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchQuestions} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />
      
      {onBack && (
        <button onClick={onBack} className="back-button-interview">
          ← Back
        </button>
      )}
      
      <div className="interview-header">
        <Timer 
          initialTime={config.timeLimit * 60} 
          onExpire={handleTimeExpire} 
        />
        <div className="interview-info">
          <span className="tech-badge">{config.techStack}</span>
          <span className="level-badge">{config.level}</span>
        </div>
      </div>

      <div className="interview-main">
        <QuestionDisplay
          question={questions[currentQuestionIndex]}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
        />

        <div className="transcript-area">
          <div className="transcript-label">Your Answer:</div>
          <div className="transcript-text">
            {transcript || 'Click the microphone to start answering...'}
          </div>
        </div>

        {currentEvaluation && (
          <EvaluationDisplay evaluation={currentEvaluation} />
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="interview-controls">
        <MicrophoneButton
          isListening={isListening}
          onToggle={toggleListening}
          disabled={isPlayingAudio || isEvaluating || currentEvaluation !== null}
        />

        <div className="action-buttons">
          {!currentEvaluation && (
            <button
              className="submit-btn"
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || !transcript.trim() || isPlayingAudio}
            >
              {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
            </button>
          )}

          {currentEvaluation && showRetry && (
            <button className="retry-btn" onClick={handleRetry}>
              Retry Question
            </button>
          )}

          {currentEvaluation && (
            <button className="next-btn" onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewInterface;
