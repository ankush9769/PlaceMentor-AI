import React from 'react';
import '../styles/components/QuestionDisplay.css';

const QuestionDisplay = ({ question, currentIndex, totalQuestions }) => {
  return (
    <div className="question-display">
      <div className="question-header">
        <span className="question-number">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>
      <div className="question-text" style={{ color: '#ffffff' }}>
        {question.text}
      </div>
    </div>
  );
};

export default QuestionDisplay;
