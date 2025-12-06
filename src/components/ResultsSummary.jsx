import React from 'react';
import '../styles/components/ResultsSummary.css';

const ResultsSummary = ({ questions, answers, onRestart }) => {
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

  const averages = calculateAverages();

  const getPerformanceLevel = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Needs Improvement';
  };

  return (
    <div className="results-container">
      <div className="results-card">
        <button onClick={onRestart} className="back-button-results">
          ← Back to Dashboard
        </button>
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
              </div>
            );
          })}
        </div>

        <button className="restart-button" onClick={onRestart}>
          Start New Interview
        </button>
      </div>
    </div>
  );
};

export default ResultsSummary;
