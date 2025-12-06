import React, { useState } from 'react';
import '../styles/components/ConfigurationForm.css';

const TECH_STACKS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'React',
  'Node.js',
  'C++',
  'Go',
  'Rust',
  'SQL'
];

const ConfigurationForm = ({ onStartInterview, onBack }) => {
  const [techStack, setTechStack] = useState('');
  const [level, setLevel] = useState('junior');
  const [timeLimit, setTimeLimit] = useState(15);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!techStack) {
      newErrors.techStack = 'Please select a technology stack';
    }

    if (timeLimit < 5 || timeLimit > 60) {
      newErrors.timeLimit = 'Time limit must be between 5 and 60 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      onStartInterview({ techStack, level, timeLimit });
    }
  };

  return (
    <div className="config-container">
      {onBack && (
        <button type="button" onClick={onBack} className="back-button">
          ← Back to Dashboard
        </button>
      )}
      <div className="config-card">
        <h1>AI Interview Simulator</h1>
        <p className="subtitle">Practice your technical interview skills with AI-powered feedback</p>

        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-group">
            <label htmlFor="techStack">Technology Stack</label>
            <select
              id="techStack"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className={errors.techStack ? 'error' : ''}
            >
              <option value="">Select a technology...</option>
              {TECH_STACKS.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
            {errors.techStack && <span className="error-message">{errors.techStack}</span>}
          </div>

          <div className="form-group">
            <label>Difficulty Level</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="level"
                  value="junior"
                  checked={level === 'junior'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span>Junior</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="level"
                  value="mid-level"
                  checked={level === 'mid-level'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span>Mid-Level</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="level"
                  value="senior"
                  checked={level === 'senior'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span>Senior</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="timeLimit">
              Time Limit: {timeLimit} minutes
            </label>
            <input
              type="range"
              id="timeLimit"
              min="5"
              max="60"
              step="5"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className={errors.timeLimit ? 'error' : ''}
            />
            <div className="range-labels">
              <span>5 min</span>
              <span>60 min</span>
            </div>
            {errors.timeLimit && <span className="error-message">{errors.timeLimit}</span>}
          </div>

          <button type="submit" className="start-button">
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationForm;
