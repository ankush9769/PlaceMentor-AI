import React from 'react';
import '../styles/components/QuestionDisplay.css';

const QuestionDisplay = ({ question, currentIndex, totalQuestions, onReplayAudio, isPlayingAudio }) => {
  return (
    <div className="question-display">
      <div className="question-header">
        <span className="question-number">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <button 
          className={`replay-audio-btn ${isPlayingAudio ? 'playing' : ''}`}
          onClick={() => onReplayAudio && onReplayAudio(question.text)}
          disabled={isPlayingAudio}
          title="Replay question audio"
        >
          {isPlayingAudio ? (
            <>
              <span className="audio-icon">🔊</span>
              <span className="audio-text">Playing...</span>
            </>
          ) : (
            <>
              <span className="audio-icon">🔊</span>
              <span className="audio-text">Replay</span>
            </>
          )}
        </button>
      </div>
      <div className="question-text" style={{ color: '#ffffff' }}>
        {question.text}
      </div>
    </div>
  );
};

export default QuestionDisplay;
