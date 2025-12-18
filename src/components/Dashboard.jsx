import React, { useState, useEffect } from 'react';
import '../styles/components/Dashboard.css';

const Dashboard = ({ user, onStartInterview, onLogout, onViewInterview }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleShareToWhatsApp = (e, interview) => {
    e.stopPropagation(); // Prevent triggering the view interview click

    const message = `🎯 *AI Interview Report*\n\n` +
      `📚 Technology: ${interview.techStack}\n` +
      `📊 Level: ${interview.level}\n` +
      `📅 Date: ${formatDate(interview.completedAt)}\n\n` +
      `*Performance Scores:*\n` +
      `⭐ Overall: ${interview.scores.overall.toFixed(1)}/5.0\n` +
      `💬 Clarity: ${interview.scores.clarity.toFixed(1)}/5.0\n` +
      `✅ Accuracy: ${interview.scores.accuracy.toFixed(1)}/5.0\n` +
      `🎓 Depth: ${interview.scores.depth.toFixed(1)}/5.0\n\n` +
      `📝 Questions Answered: ${interview.answeredCount}/${interview.questionsCount}\n\n` +
      `Powered by Prep Master AI 🚀`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interviews/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data = await response.json();
      setHistory(data.interviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (history.length === 0) {
      return { totalInterviews: 0, avgScore: 0, bestScore: 0 };
    }

    const totalInterviews = history.length;
    const avgScore = history.reduce((sum, interview) => sum + interview.scores.overall, 0) / totalInterviews;
    const bestScore = Math.max(...history.map(interview => interview.scores.overall));

    return { totalInterviews, avgScore, bestScore };
  };

  const stats = calculateStats();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-user">
          <h1>Welcome back, {user.name}! 👋</h1>
          <p className="user-email">{user.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.totalInterviews}</div>
          <div className="stat-label">Total Interviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.avgScore.toFixed(1)}</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.bestScore.toFixed(1)}</div>
          <div className="stat-label">Best Score</div>
        </div>
      </div>

      <button onClick={onStartInterview} className="start-new-btn">
        Start New Interview
      </button>

      <div className="history-section">
        <h2 className="history-title">Interview History</h2>
        
        {isLoading && <div className="loading-text">Loading history...</div>}
        
        {error && <div className="error-text">{error}</div>}
        
        {!isLoading && !error && history.length === 0 && (
          <div className="empty-state">
            <p>No interviews yet. Start your first interview to see your progress!</p>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div className="history-list">
            {history.map((interview) => (
              <div 
                key={interview.id} 
                className="history-item clickable"
                onClick={() => onViewInterview && onViewInterview(interview.id)}
              >
                <div className="history-main">
                  <div className="history-tech">
                    <span className="tech-badge">{interview.techStack}</span>
                    <span className="level-badge">{interview.level}</span>
                  </div>
                  <div className="history-date">{formatDate(interview.completedAt)}</div>
                </div>
                <div className="history-scores">
                  <div className="score-item">
                    <span className="score-label">Overall</span>
                    <span className="score-value" data-score={interview.scores.overall.toFixed(1)}>
                      {interview.scores.overall.toFixed(1)}
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Clarity</span>
                    <span className="score-value" data-score={interview.scores.clarity.toFixed(1)}>
                      {interview.scores.clarity.toFixed(1)}
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Accuracy</span>
                    <span className="score-value" data-score={interview.scores.accuracy.toFixed(1)}>
                      {interview.scores.accuracy.toFixed(1)}
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Depth</span>
                    <span className="score-value" data-score={interview.scores.depth.toFixed(1)}>
                      {interview.scores.depth.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="history-progress">
                  {interview.answeredCount} / {interview.questionsCount} questions answered
                </div>
                <div className="history-actions">
                  <button 
                    className="share-btn"
                    onClick={(e) => handleShareToWhatsApp(e, interview)}
                    title="Share on WhatsApp"
                  >
                    <span className="share-icon">📤</span>
                    Share on WhatsApp
                  </button>
                  <div className="view-details-hint">
                    👁️ Click to view details
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
