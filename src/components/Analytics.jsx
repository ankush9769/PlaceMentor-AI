import { useState, useEffect } from 'react';
import '../styles/components/Analytics.css';

function Analytics({ onBack, onViewInterview }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, week, month
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchHistory();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        onBack();
        return;
      }

      const response = await fetch(`http://localhost:3001/api/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const response = await fetch('http://localhost:3001/api/interviews/history', {
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
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const handleShareToWhatsApp = (e, interview) => {
    e.stopPropagation();

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

  const getScoreColor = (score) => {
    if (score >= 4) return '#10b981';
    if (score >= 3) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={fetchAnalytics} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalInterviews === 0) {
    return (
      <div className="analytics-container">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h2>No Interview Data Yet</h2>
          <p>Complete some interviews to see your performance analytics</p>
          <button className="start-button" onClick={onBack}>
            Start Your First Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Performance Analytics</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{analytics.totalInterviews}</div>
          <div className="metric-label">Total Interviews</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-value">{analytics.averageScore.toFixed(1)}/5</div>
          <div className="metric-label">Average Score</div>
          <div className="metric-trend" style={{ color: getScoreColor(analytics.averageScore) }}>
            {getScoreLabel(analytics.averageScore)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-value">
            {analytics.improvement >= 0 ? '+' : ''}{analytics.improvement.toFixed(1)}%
          </div>
          <div className="metric-label">Improvement Rate</div>
          <div className="metric-trend" style={{ color: analytics.improvement >= 0 ? '#10b981' : '#ef4444' }}>
            {analytics.improvement >= 0 ? '↑ Improving' : '↓ Declining'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-value">{analytics.streak}</div>
          <div className="metric-label">Day Streak</div>
        </div>
      </div>

      {/* Performance by Category */}
      <div className="analytics-section">
        <h2>Performance Breakdown</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <h3>Clarity</h3>
            <div className="score-circle" style={{ borderColor: getScoreColor(analytics.categoryScores.clarity) }}>
              <span className="score-number">{analytics.categoryScores.clarity.toFixed(1)}</span>
              <span className="score-max">/5</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(analytics.categoryScores.clarity / 5) * 100}%`,
                  background: getScoreColor(analytics.categoryScores.clarity)
                }}
              ></div>
            </div>
          </div>
          <div className="performance-card">
            <h3>Accuracy</h3>
            <div className="score-circle" style={{ borderColor: getScoreColor(analytics.categoryScores.accuracy) }}>
              <span className="score-number">{analytics.categoryScores.accuracy.toFixed(1)}</span>
              <span className="score-max">/5</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(analytics.categoryScores.accuracy / 5) * 100}%`,
                  background: getScoreColor(analytics.categoryScores.accuracy)
                }}
              ></div>
            </div>
          </div>
          <div className="performance-card">
            <h3>Depth</h3>
            <div className="score-circle" style={{ borderColor: getScoreColor(analytics.categoryScores.depth) }}>
              <span className="score-number">{analytics.categoryScores.depth.toFixed(1)}</span>
              <span className="score-max">/5</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(analytics.categoryScores.depth / 5) * 100}%`,
                  background: getScoreColor(analytics.categoryScores.depth)
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Performance */}
      <div className="analytics-section">
        <h2>Performance by Tech Stack</h2>
        <div className="tech-stack-list">
          {analytics.techStackPerformance.map((tech) => (
            <div key={tech.stack} className="tech-stack-item">
              <div className="tech-info">
                <span className="tech-name">{tech.stack}</span>
                <span className="tech-count">{tech.count} interview{tech.count > 1 ? 's' : ''}</span>
              </div>
              <div className="tech-score-bar">
                <div 
                  className="tech-score-fill" 
                  style={{ 
                    width: `${(tech.avgScore / 5) * 100}%`,
                    background: getScoreColor(tech.avgScore)
                  }}
                >
                  <span className="tech-score-label">{tech.avgScore.toFixed(1)}/5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="analytics-section">
        <h2>📚 Personalized Recommendations</h2>
        <div className="recommendations-list">
          {analytics.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <span className="rec-icon">{rec.icon}</span>
              <div className="rec-content">
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trend */}
      <div className="analytics-section">
        <h2>Recent Performance Trend</h2>
        <div className="trend-chart">
          {analytics.recentScores.map((score, index) => (
            <div key={index} className="trend-bar-container">
              <div 
                className="trend-bar" 
                style={{ 
                  height: `${(score.avgScore / 5) * 100}%`,
                  background: getScoreColor(score.avgScore)
                }}
              ></div>
              <span className="trend-label">{score.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interview History */}
      <div className="analytics-section">
        <h2>📚 Complete Interview History</h2>
        
        {historyLoading && <div className="loading-text">Loading history...</div>}
        
        {!historyLoading && history.length === 0 && (
          <div className="empty-history">
            <p>No interview history found for the selected time range.</p>
          </div>
        )}

        {!historyLoading && history.length > 0 && (
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
}

export default Analytics;
