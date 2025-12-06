import React, { useState } from 'react';
import '../styles/components/ResumeAnalysis.css';

const ResumeAnalysis = ({ onBack }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [targetRole, setTargetRole] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        setError(null);

        if (!selectedFile) return;

        // Check file type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload a PDF or DOCX file.');
            return;
        }

        // Check file size (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB. Please upload a smaller file.');
            return;
        }

        setFile(selectedFile);
        setAnalysis(null);
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            // Step 1: Upload and parse the resume
            const formData = new FormData();
            formData.append('resume', file);

            const uploadResponse = await fetch('/api/resume/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || 'Failed to upload resume');
            }

            const uploadData = await uploadResponse.json();
            setIsUploading(false);
            setIsAnalyzing(true);

            // Step 2: Analyze the resume
            const analyzeResponse = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumeText: uploadData.text,
                    targetRole: targetRole || undefined
                })
            });

            if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.json();
                throw new Error(errorData.message || 'Failed to analyze resume');
            }

            const analysisData = await analyzeResponse.json();
            setAnalysis(analysisData);
        } catch (err) {
            setError(err.message || 'An error occurred while analyzing your resume.');
        } finally {
            setIsUploading(false);
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setAnalysis(null);
        setError(null);
        setTargetRole('');
    };

    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const getSectionIcon = (status) => {
        if (status === 'excellent' || status === 'good') return '✅';
        if (status === 'needs_improvement') return '⚠️';
        return '❌';
    };

    return (
        <div className="resume-analysis-container">
            {onBack && (
                <button onClick={onBack} className="back-button-resume">
                    ← Back to Dashboard
                </button>
            )}

            <div className="resume-analysis-header">
                <h1>📄 Resume Analysis</h1>
                <p className="subtitle">Get AI-powered feedback on your resume</p>
            </div>

            {!analysis ? (
                <div className="upload-section">
                    <div
                        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div className="file-selected">
                                <div className="file-icon">📄</div>
                                <div className="file-info">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <div className="upload-icon">☁️</div>
                                <h3>Drag & drop your resume here</h3>
                                <p>or click to browse</p>
                                <div className="file-types">Supported: PDF, DOCX (Max 5MB)</div>
                            </div>
                        )}
                    </div>

                    <div className="optional-input">
                        <label htmlFor="target-role">Target Role (Optional)</label>
                        <input
                            id="target-role"
                            type="text"
                            placeholder="e.g., Software Engineer, Product Manager"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="role-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        className="analyze-button"
                        onClick={handleAnalyze}
                        disabled={!file || isUploading || isAnalyzing}
                    >
                        {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                    </button>

                    {(isUploading || isAnalyzing) && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>{isUploading ? 'Uploading and parsing your resume...' : 'Analyzing your resume with AI...'}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="results-section">
                    <div className="results-header">
                        <h2>Analysis Results</h2>
                        <button className="reset-button" onClick={handleReset}>
                            Analyze Another Resume
                        </button>
                    </div>

                    <div className="scores-grid">
                        <div className="score-card">
                            <div className="score-label">Overall Score</div>
                            <div
                                className="score-value"
                                style={{ color: getScoreColor(analysis.overallScore) }}
                            >
                                {analysis.overallScore}/10
                            </div>
                        </div>
                        <div className="score-card">
                            <div className="score-label">ATS Compatibility</div>
                            <div
                                className="score-value"
                                style={{ color: getScoreColor(analysis.atsScore) }}
                            >
                                {analysis.atsScore}/10
                            </div>
                        </div>
                    </div>

                    <div className="analysis-grid">
                        <div className="analysis-card strengths">
                            <h3>✅ Strengths</h3>
                            <ul>
                                {analysis.strengths.map((strength, index) => (
                                    <li key={index}>{strength}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="analysis-card weaknesses">
                            <h3>❌ Areas for Improvement</h3>
                            <ul>
                                {analysis.weaknesses.map((weakness, index) => (
                                    <li key={index}>{weakness}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="analysis-card suggestions">
                            <h3>💡 Suggestions</h3>
                            <ul>
                                {analysis.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="analysis-card keywords">
                            <h3>🔑 Missing Keywords</h3>
                            <div className="keywords-list">
                                {analysis.keywords.map((keyword, index) => (
                                    <span key={index} className="keyword-tag">{keyword}</span>
                                ))}
                            </div>
                        </div>

                        <div className="analysis-card sections">
                            <h3>📋 Section Analysis</h3>
                            <div className="sections-list">
                                {Object.entries(analysis.sections).map(([section, status]) => (
                                    <div key={section} className="section-item">
                                        <span className="section-icon">{getSectionIcon(status)}</span>
                                        <span className="section-name">{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                                        <span className={`section-status ${status}`}>
                                            {status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeAnalysis;
