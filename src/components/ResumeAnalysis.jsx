import React, { useState, useRef } from 'react';
import axios from 'axios';
import '../styles/components/ResumeAnalysis.css';
import '../styles/components/JobRecommendations.css';

function ResumeAnalysis() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [jobRecommendations, setJobRecommendations] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      setFile(null);
      return false;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post('http://localhost:3001/api/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      console.log('✅ Analysis response received:', response.data);
      setAnalysis(response.data);
      
      // Fetch job recommendations after successful analysis
      if (response.data) {
        console.log('🔍 Triggering job recommendations fetch...');
        fetchJobRecommendations(response.data);
      }
    } catch (err) {
      // Show detailed error message from server
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to analyze resume. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get('http://localhost:3001/api/resume/history');
      setHistory(response.data.analyses || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  const fetchJobRecommendations = async (analysisData) => {
    setIsLoadingJobs(true);
    try {
      console.log('Fetching job recommendations with analysis:', analysisData);
      const response = await axios.post('http://localhost:3001/api/resume/job-recommendations', {
        resumeText: resumeText || undefined, // Optional - send if available
        analysis: {
          keywords: analysisData.keywords || [],
          strengths: analysisData.strengths || [],
          weaknesses: analysisData.weaknesses || [],
          overallScore: analysisData.overallScore,
          atsScore: analysisData.atsScore
        }
      }, {
        timeout: 30000 // 30 second timeout
      });
      console.log('Job recommendations response:', response.data);
      
      // Ensure the response has the expected structure
      if (response.data && response.data.jobs) {
        setJobRecommendations(response.data);
      } else {
        console.warn('Invalid job recommendations response structure:', response.data);
      }
    } catch (err) {
      console.error('Error fetching job recommendations:', err);
      console.error('Error response:', err.response?.data);
      // Show error message to help debug
      if (err.response?.data?.message) {
        console.warn('Job recommendations error:', err.response.data.message);
      }
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleViewAnalysis = async (analysisId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/resume/analysis/${analysisId}`);
      setAnalysis(response.data.analysis);
      setResumeText(response.data.resumeText);
      setShowHistory(false);
      
      // Fetch job recommendations for historical analysis
      if (response.data.analysis) {
        fetchJobRecommendations(response.data.analysis);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Failed to load analysis');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetUpload = () => {
    setFile(null);
    setAnalysis(null);
    setError('');
    setShowHistory(false);
    setJobRecommendations(null);
    setResumeText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (showHistory) {
    return (
      <div className="resume-analysis-container">
        <div className="resume-header">
          <h2>Resume Analysis History</h2>
          <button onClick={() => setShowHistory(false)} className="back-button">
            Back to Upload
          </button>
        </div>
        
        {loadingHistory ? (
          <div className="loading-state">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">No analysis history found</div>
        ) : (
          <div className="history-section">
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-header">
                    <div className="history-file-info">
                      <h3>{item.fileName || 'Resume Analysis'}</h3>
                      <p className="history-date">{formatDate(item.analyzedAt || item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="history-scores">
                    <div className="score-item">
                      <span className="score-label">ATS Score:</span>
                      <span className="score-value">{item.atsScore}/10</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Overall Score:</span>
                      <span className="score-value">{item.overallScore}/10</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewAnalysis(item.id)}
                    className="view-analysis-button"
                  >
                    View Full Analysis
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="resume-analysis-container">
      {!analysis ? (
        <div className="upload-section">
          <div 
            className={`upload-card ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📄</div>
            <h3>Upload Your Resume</h3>
            <p>Drag and drop your resume here or click to browse</p>
            
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="file-input"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="file-input-label">
                {file ? file.name : 'Choose File'}
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="analyze-button"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
            </button>

            <div className="upload-info">
              <p>• Supports PDF and Word (.doc, .docx)</p>
              <p>• Maximum file size: 5MB</p>
              <p>• Drag and drop enabled</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="analysis-results">
          <div className="results-header">
            <h3>📊 Analysis Results</h3>
            <button onClick={resetUpload} className="new-analysis-button">
              ✨ Analyze New Resume
            </button>
          </div>

          <div className="scores-grid">
            <div className="score-card ats-score">
              <div className="score-icon">🎯</div>
              <div className="score-content">
                <div className="score-label">ATS SCORE</div>
                <div className="score-value">{analysis.atsScore}<span className="score-max">/10</span></div>
                <div className="score-bar">
                  <div className="score-fill" style={{width: `${(analysis.atsScore / 10) * 100}%`}}></div>
                </div>
                <div className="score-description">Applicant Tracking System compatibility</div>
              </div>
            </div>

            <div className="score-card overall-score">
              <div className="score-icon">⭐</div>
              <div className="score-content">
                <div className="score-label">OVERALL SCORE</div>
                <div className="score-value">{analysis.overallScore}<span className="score-max">/10</span></div>
                <div className="score-bar">
                  <div className="score-fill" style={{width: `${(analysis.overallScore / 10) * 100}%`}}></div>
                </div>
                <div className="score-description">Comprehensive resume quality</div>
              </div>
            </div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card strengths-card">
              <div className="card-header">
                <span className="card-icon">✅</span>
                <h4>Strengths</h4>
              </div>
              <ul className="analysis-list">
                {analysis.strengths?.map((strength, index) => (
                  <li key={index} className="analysis-item">
                    <span className="item-bullet">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="analysis-card weaknesses-card">
              <div className="card-header">
                <span className="card-icon">⚠️</span>
                <h4>Areas for Improvement</h4>
              </div>
              <ul className="analysis-list">
                {analysis.weaknesses?.map((weakness, index) => (
                  <li key={index} className="analysis-item">
                    <span className="item-bullet">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="suggestions-card">
            <div className="card-header">
              <span className="card-icon">💡</span>
              <h4>Recommendations</h4>
            </div>
            <ul className="suggestions-list">
              {analysis.suggestions?.map((suggestion, index) => (
                <li key={index} className="suggestion-item">
                  <span className="suggestion-number">{index + 1}</span>
                  <span className="suggestion-text">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="keywords-card">
              <div className="card-header">
                <span className="card-icon">🔑</span>
                <h4>Missing Keywords</h4>
              </div>
              <div className="keywords-container">
                {analysis.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-badge">{keyword}</span>
                ))}
              </div>
            </div>
          )}

          {/* Job Recommendations Section */}
          <div className="job-recommendations-section">
            <div className="card-header">
              <span className="card-icon">💼</span>
              <h4>Recommended Jobs for You</h4>
            </div>
            
            {isLoadingJobs ? (
              <div className="loading-jobs">
                <div className="loading-spinner"></div>
                <p>Finding perfect job matches...</p>
              </div>
            ) : jobRecommendations?.jobs && jobRecommendations.jobs.length > 0 ? (
              <div className="jobs-grid">
                {jobRecommendations.jobs.map((job, index) => (
                  <div key={index} className="job-card">
                    <div className="job-header">
                      <div className="job-title-section">
                        <h5 className="job-title">{job.title}</h5>
                        <p className="job-company">{job.company}</p>
                      </div>
                      <div className="match-score">
                        <div className="score-circle" style={{
                          background: `conic-gradient(#00d4ff ${job.matchScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                        }}>
                          <div className="score-inner">
                            {job.matchScore}%
                          </div>
                        </div>
                        <span className="match-label">Match</span>
                      </div>
                    </div>
                    
                    <div className="job-details">
                      <div className="job-info-row">
                        <span className="info-icon">📍</span>
                        <span className="info-text">{job.location}</span>
                      </div>
                      <div className="job-info-row">
                        <span className="info-icon">💰</span>
                        <span className="info-text">{job.estimatedSalary}</span>
                      </div>
                    </div>

                    <div className="job-reasons">
                      <p className="reasons-title">Why this matches:</p>
                      <ul className="reasons-list">
                        {job.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="job-skills">
                      <p className="skills-title">Required Skills:</p>
                      <div className="skills-tags">
                        {job.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-jobs-message">
                <p>Job recommendations will appear here after analysis</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalysis;
