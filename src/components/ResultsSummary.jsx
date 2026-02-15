import React from 'react';
import '../styles/components/ResultsSummary.css';

const ResultsSummary = ({ questions, answers, emotionData = [], violation = null, onRestart }) => {
  const calculateAverages = () => {
    const validAnswers = answers.filter(a => a.evaluation !== null);
    if (validAnswers.length === 0) return { clarity: 0, accuracy: 0, depth: 0, overall: 0 };

    const totals = validAnswers.reduce(
      (acc, answer) => {
        if (answer.evaluation) {
          acc.clarity += answer.evaluation.scores.clarity;
          acc.accuracy += answer.evaluation.scores.accuracy;
          acc.depth += answer.evaluation.scores.depth;
        }
        return acc;
      },
      { clarity: 0, accuracy: 0, depth: 0 }
    );

    const count = validAnswers.length;
    const clarity = totals.clarity / count;
    const accuracy = totals.accuracy / count;
    const depth = totals.depth / count;
    const overall = (clarity + accuracy + depth) / 3;

    return { clarity, accuracy, depth, overall };
  };

  const calculateEmotionStats = () => {
    if (!emotionData || emotionData.length === 0) {
      return { dominant: 'neutral', breakdown: {}, confidence: 0 };
    }

    const emotionCounts = {};
    const emotionConfidences = {};
    
    emotionData.forEach(snapshot => {
      const emotion = snapshot.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      emotionConfidences[emotion] = (emotionConfidences[emotion] || 0) + snapshot.confidence;
    });

    // Calculate dominant emotion
    const dominant = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    , 'neutral');

    // Calculate percentage breakdown
    const breakdown = {};
    Object.keys(emotionCounts).forEach(emotion => {
      breakdown[emotion] = ((emotionCounts[emotion] / emotionData.length) * 100).toFixed(1);
    });

    // Calculate average confidence for dominant emotion
    const confidence = emotionCounts[dominant] 
      ? (emotionConfidences[dominant] / emotionCounts[dominant] * 100).toFixed(1)
      : 0;

    return { dominant, breakdown, confidence };
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fearful: '😨',
      disgusted: '😖',
      neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
  };

  const averages = calculateAverages();
  const emotionStats = calculateEmotionStats();

  const getPerformanceLevel = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Needs Improvement';
  };

  const getViolationMessage = (type) => {
    const messages = {
      multiple_people: 'Multiple people detected in camera frame',
      looking_away: 'Repeatedly looking away from camera',
      no_face: 'Face not visible in camera for extended period'
    };
    return messages[type] || 'Interview integrity violation detected';
  };

  return (
    <div className="results-container">
      <div className="results-card">
        {violation ? (
          <>
            <h1 className="results-title violation-title">Interview Terminated ⚠️</h1>
            
            <div className="violation-banner">
              <div className="violation-icon">🚫</div>
              <div className="violation-content">
                <h2 className="violation-heading">Anti-Cheating Violation</h2>
                <p className="violation-reason">{getViolationMessage(violation.type)}</p>
                <p className="violation-message">{violation.message}</p>
                <p className="violation-time">Detected at: {new Date(violation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="violation-explanation">
              <h3>Why was the interview terminated?</h3>
              <p>Our AI-powered proctoring system detected suspicious activity:</p>
              <ul>
                {violation.type === 'multiple_people' && (
                  <li><strong>Multiple People:</strong> More than one person was visible in the camera frame. Interviews must be taken individually.</li>
                )}
                {violation.type === 'looking_away' && (
                  <li><strong>Looking Away:</strong> You were looking away from the camera for an extended period, suggesting possible use of external resources.</li>
                )}
                {violation.type === 'no_face' && (
                  <li><strong>Face Not Visible:</strong> Your face was not visible in the camera for too long, which could indicate you left the interview.</li>
                )}
              </ul>
              <p className="violation-note">
                <strong>Note:</strong> Interview integrity is crucial for fair assessment. Please ensure you're alone, facing the camera, and not using external resources during the interview.
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="results-title">Interview Complete! 🎉</h1>
            
            <div className="overall-score">
          <div className="overall-label">Overall Score</div>
          <div className="overall-number">{averages.overall.toFixed(1)}/5.0</div>
          <div className="overall-level">{getPerformanceLevel(averages.overall)}</div>
        </div>

        <div className="averages-grid">
          <div className="average-item">
            <div className="average-label">Clarity</div>
            <div className="average-score">{averages.clarity.toFixed(1)}</div>
          </div>
          <div className="average-item">
            <div className="average-label">Accuracy</div>
            <div className="average-score">{averages.accuracy.toFixed(1)}</div>
          </div>
          <div className="average-item">
            <div className="average-label">Depth</div>
            <div className="average-score">{averages.depth.toFixed(1)}</div>
          </div>
        </div>

        {emotionData && emotionData.length > 0 && (
          <div className="emotion-analysis">
            <h2 className="emotion-title">Facial Expression Analysis</h2>
            <div className="emotion-summary">
              <div className="dominant-emotion">
                <span className="emotion-emoji">{getEmotionEmoji(emotionStats.dominant)}</span>
                <div className="emotion-text">
                  <div className="emotion-label">Dominant Emotion</div>
                  <div className="emotion-name">{emotionStats.dominant}</div>
                  <div className="emotion-confidence">{emotionStats.confidence}% confidence</div>
                </div>
              </div>
              <div className="emotion-breakdown">
                <div className="breakdown-label">Expression Breakdown</div>
                {Object.entries(emotionStats.breakdown).map(([emotion, percentage]) => (
                  <div key={emotion} className="breakdown-item">
                    <span className="breakdown-emoji">{getEmotionEmoji(emotion)}</span>
                    <span className="breakdown-emotion">{emotion}</span>
                    <div className="breakdown-bar">
                      <div 
                        className="breakdown-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-percent">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="questions-review">
          <h2 className="review-title">Question Review</h2>
          {questions.map((question, index) => {
            const answer = answers.find(a => a.questionId === question.id);
            return (
              <div key={question.id} className="review-item">
                <div className="review-question">
                  <span className="review-number">Q{index + 1}:</span> {question.text}
                </div>
                {answer && answer.evaluation && (
                  <div className="review-scores">
                    <span className="review-score">
                      C: {answer.evaluation.scores.clarity}
                    </span>
                    <span className="review-score">
                      A: {answer.evaluation.scores.accuracy}
                    </span>
                    <span className="review-score">
                      D: {answer.evaluation.scores.depth}
                    </span>
                  </div>
                )}
                {answer && (
                  <div className="review-answer">
                    <strong>Your answer:</strong> {answer.transcript}
                  </div>
                )}
                {answer && answer.emotions && answer.emotions.length > 0 && (
                  <div className="review-emotions">
                    <strong>Expressions during answer:</strong>
                    <div className="emotion-chips">
                      {answer.emotions.slice(0, 5).map((snapshot, idx) => (
                        <span key={idx} className="emotion-chip">
                          {getEmotionEmoji(snapshot.emotion)} {snapshot.emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
          </>
        )}

        <button className="restart-button" onClick={onRestart}>
          Start New Interview
        </button>
      </div>
    </div>
  );
};

export default ResultsSummary;
