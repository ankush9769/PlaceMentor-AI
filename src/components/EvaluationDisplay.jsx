import React from 'react';
import '../styles/components/EvaluationDisplay.css';

const EvaluationDisplay = ({ evaluation }) => {
  const renderStars = (score) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= score ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="evaluation-display">
      <h3 className="evaluation-title">Your Performance</h3>
      
      <div className="scores-grid">
        <div className="score-item">
          <div className="score-label">Clarity</div>
          {renderStars(evaluation.scores.clarity)}
          <div className="score-number">{evaluation.scores.clarity}/5</div>
          <div className="score-feedback">{evaluation.feedback.clarity}</div>
        </div>

        <div className="score-item">
          <div className="score-label">Accuracy</div>
          {renderStars(evaluation.scores.accuracy)}
          <div className="score-number">{evaluation.scores.accuracy}/5</div>
          <div className="score-feedback">{evaluation.feedback.accuracy}</div>
        </div>

        <div className="score-item">
          <div className="score-label">Depth</div>
          {renderStars(evaluation.scores.depth)}
          <div className="score-number">{evaluation.scores.depth}/5</div>
          <div className="score-feedback">{evaluation.feedback.depth}</div>
        </div>
      </div>

      <div className="overall-tips">
        <div className="tips-label">💡 Tips for Improvement</div>
        <div className="tips-text">{evaluation.overallTips}</div>
      </div>
    </div>
  );
};

export default EvaluationDisplay;
