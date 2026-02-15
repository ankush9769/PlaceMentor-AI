import React, { useState, useEffect } from 'react';
import '../styles/components/AptitudeTest.css';

const APTITUDE_TOPICS = [
  {
    id: 'time-speed-distance',
    name: 'Time, Speed & Distance',
    icon: '🚀',
    description: 'Problems on speed, time, and distance calculations',
    difficulty: 'Medium'
  },
  {
    id: 'percentage',
    name: 'Percentage',
    icon: '📊',
    description: 'Percentage calculations and applications',
    difficulty: 'Easy'
  },
  {
    id: 'simple-interest',
    name: 'Simple Interest',
    icon: '💰',
    description: 'Interest calculations and financial problems',
    difficulty: 'Easy'
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    icon: '💸',
    description: 'Compound interest and investment problems',
    difficulty: 'Medium'
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss',
    icon: '💼',
    description: 'Business profit and loss calculations',
    difficulty: 'Medium'
  },
  {
    id: 'ratio-proportion',
    name: 'Ratio & Proportion',
    icon: '⚖️',
    description: 'Ratio, proportion, and variation problems',
    difficulty: 'Easy'
  },
  {
    id: 'average',
    name: 'Average',
    icon: '📈',
    description: 'Mean, median, and average calculations',
    difficulty: 'Easy'
  },
  {
    id: 'age-problems',
    name: 'Age Problems',
    icon: '👶',
    description: 'Age-related logical problems',
    difficulty: 'Medium'
  },
  {
    id: 'work-time',
    name: 'Work & Time',
    icon: '⏰',
    description: 'Work efficiency and time management',
    difficulty: 'Medium'
  },
  {
    id: 'pipes-cisterns',
    name: 'Pipes & Cisterns',
    icon: '🚰',
    description: 'Inlet, outlet, and filling problems',
    difficulty: 'Hard'
  },
  {
    id: 'probability',
    name: 'Probability',
    icon: '🎲',
    description: 'Probability and chance calculations',
    difficulty: 'Hard'
  },
  {
    id: 'permutation-combination',
    name: 'Permutation & Combination',
    icon: '🔢',
    description: 'Arrangement and selection problems',
    difficulty: 'Hard'
  }
];

const AptitudeTest = ({ onBack, user }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load topic progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`aptitude_progress_${user?.id || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle old format (array) and convert to new format (object)
        if (Array.isArray(parsed)) {
          const converted = {};
          parsed.forEach(topicId => {
            converted[topicId] = { completed: 20, total: 20 };
          });
          setTopicProgress(converted);
          // Save in new format
          localStorage.setItem(
            `aptitude_progress_${user?.id || 'guest'}`,
            JSON.stringify(converted)
          );
        } else {
          setTopicProgress(parsed);
        }
      } catch (e) {
        console.error('Error loading progress:', e);
        setTopicProgress({});
      }
    }
  }, [user]);

  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setIsLoading(true);

    try {
      // Fetch questions for the selected topic
      const response = await fetch('/api/aptitude-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: topic.id,
          topicName: topic.name,
        }),
      });

      const data = await response.json();
      setQuestions(data.questions || []);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Use fallback questions if API fails
      setQuestions(generateFallbackQuestions(topic));
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackQuestions = (topic) => {
    // Generate 20 sample questions as fallback
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      question: `Sample ${topic.name} question ${i + 1}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      difficulty: i < 7 ? 'Easy' : i < 14 ? 'Medium' : 'Hard',
      explanation: 'This is a sample question. Real questions will be loaded from the API.'
    }));
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);

    // Calculate score
    const score = questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);

    // Update topic progress
    const newProgress = {
      ...topicProgress,
      [selectedTopic.id]: {
        completed: score,
        total: questions.length,
        lastAttempt: new Date().toISOString(),
        bestScore: Math.max(score, topicProgress[selectedTopic.id]?.bestScore || 0)
      }
    };
    
    setTopicProgress(newProgress);
    localStorage.setItem(
      `aptitude_progress_${user?.id || 'guest'}`,
      JSON.stringify(newProgress)
    );
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setQuestions([]);
    setUserAnswers({});
    setShowResults(false);
    setCurrentQuestion(0);
  };

  const calculateScore = () => {
    return questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  const getProgressPercentage = () => {
    const totalQuestions = APTITUDE_TOPICS.length * 20; // 20 questions per topic
    const completedQuestions = Object.values(topicProgress).reduce(
      (sum, progress) => sum + (progress.completed || 0),
      0
    );
    return (completedQuestions / totalQuestions) * 100;
  };

  const getTopicProgress = (topicId) => {
    const progress = topicProgress[topicId];
    if (!progress) return { completed: 0, total: 20, percentage: 0 };
    return {
      completed: progress.completed || 0,
      total: progress.total || 20,
      percentage: ((progress.completed || 0) / (progress.total || 20)) * 100
    };
  };

  const getTotalCompletedTopics = () => {
    return Object.values(topicProgress).filter(
      progress => progress.completed >= (progress.total * 0.6)
    ).length;
  };

  // Topic selection screen
  if (!selectedTopic) {
    return (
      <div className="aptitude-container">
        <div className="aptitude-header">
          <h1 className="aptitude-title">🎯 Aptitude Test</h1>
          <p className="aptitude-subtitle">Master quantitative aptitude with practice questions</p>

          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">Overall Progress</span>
              <span className="progress-value">
                {getTotalCompletedTopics()} / {APTITUDE_TOPICS.length} Topics Completed
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="progress-stats">
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </div>
        </div>

        <div className="topics-grid">
          {APTITUDE_TOPICS.map((topic) => {
            const progress = getTopicProgress(topic.id);
            const isCompleted = progress.percentage >= 60;
            return (
              <div
                key={topic.id}
                className={`topic-card ${isCompleted ? 'completed' : ''} ${progress.completed > 0 ? 'in-progress' : ''}`}
                onClick={() => handleTopicSelect(topic)}
              >
                {isCompleted && (
                  <div className="completion-badge">
                    <span className="check-icon">✓</span>
                  </div>
                )}
                <div className="topic-icon">{topic.icon}</div>
                <h3 className="topic-name">{topic.name}</h3>
                <p className="topic-description">{topic.description}</p>
                <div className="topic-meta">
                  <span className={`difficulty-badge ${topic.difficulty.toLowerCase()}`}>
                    {topic.difficulty}
                  </span>
                  <span className="question-count">20 Questions</span>
                </div>
                
                {/* Individual Topic Progress Bar */}
                {progress.completed > 0 && (
                  <div className="topic-progress">
                    <div className="topic-progress-info">
                      <span className="progress-text">
                        {progress.completed}/{progress.total} Correct
                      </span>
                      <span className="progress-percent">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                    <div className="topic-progress-bar">
                      <div
                        className="topic-progress-fill"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="aptitude-container">
        <div className="loading-screen">
          <div className="loading-spinner-large"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const score = calculateScore();
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const passed = score >= questions.length * 0.6;

    return (
      <div className="aptitude-container">
        <div className="results-container">
          <div className="results-header">
            <h2>📊 Test Results</h2>
            <p className="topic-name-result">{selectedTopic.name}</p>
          </div>

          <div className="score-card">
            <div className={`score-circle ${passed ? 'passed' : 'failed'}`}>
              <div className="score-value">{score}/{questions.length}</div>
              <div className="score-percentage">{percentage}%</div>
            </div>
            <div className="score-status">
              {passed ? (
                <>
                  <span className="status-icon">🎉</span>
                  <h3>Congratulations!</h3>
                  <p>You passed this topic</p>
                </>
              ) : (
                <>
                  <span className="status-icon">📚</span>
                  <h3>Keep Practicing!</h3>
                  <p>You need 60% to pass</p>
                </>
              )}
            </div>
          </div>

          <div className="results-breakdown">
            <h3>Question Review</h3>
            <div className="questions-review">
              {questions.map((q, index) => {
                const userAnswer = userAnswers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="review-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className={`result-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="review-question">{q.question}</p>
                    {!isCorrect && (
                      <div className="review-answer">
                        <p className="your-answer">Your answer: {q.options[userAnswer]}</p>
                        <p className="correct-answer">Correct answer: {q.options[q.correctAnswer]}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="results-actions">
            <button onClick={handleRetry} className="retry-button">
              🔄 Retry Test
            </button>
            <button onClick={handleBackToTopics} className="back-topics-button">
              📚 Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  const question = questions[currentQuestion];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="aptitude-container">
      <div className="test-header">
        <button onClick={handleBackToTopics} className="back-button">
          ← Back to Topics
        </button>
        <div className="test-info">
          <h2>{selectedTopic.icon} {selectedTopic.name}</h2>
          <div className="test-progress">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>Answered: {answeredCount}/{questions.length}</span>
          </div>
        </div>
      </div>

      <div className="progress-bar-test">
        <div className="progress-fill-test" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="question-container">
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">Question {currentQuestion + 1}</span>
            <span className={`difficulty-badge ${question.difficulty?.toLowerCase() || 'medium'}`}>
              {question.difficulty || 'Medium'}
            </span>
          </div>

          <h3 className="question-text">{question.question}</h3>

          <div className="options-list">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${userAnswers[question.id] === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(question.id, index)}
              >
                <div className="option-radio">
                  {userAnswers[question.id] === index && <div className="radio-dot"></div>}
                </div>
                <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="nav-button prev-button"
          >
            ← Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="nav-button submit-button"
              disabled={answeredCount < questions.length}
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="nav-button next-button"
            >
              Next →
            </button>
          )}
        </div>

        {answeredCount < questions.length && currentQuestion === questions.length - 1 && (
          <p className="warning-text">
            ⚠️ Please answer all questions before submitting
          </p>
        )}
      </div>
    </div>
  );
};

export default AptitudeTest;
