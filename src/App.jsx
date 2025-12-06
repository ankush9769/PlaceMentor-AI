import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import Dashboard from './components/Dashboard';
import ConfigurationForm from './components/ConfigurationForm';
import InterviewInterface from './components/InterviewInterface';
import ResultsSummary from './components/ResultsSummary';
import Profile from './components/Profile';
import CodingPractice from './components/CodingPractice';
import AptitudeTest from './components/AptitudeTest';
import Chatbot from './components/Chatbot';
import ResumeAnalysis from './components/ResumeAnalysis';

function App() {
  const [currentView, setCurrentView] = useState('signin');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [viewingInterviewId, setViewingInterviewId] = useState(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setCurrentView('dashboard');
    }
  }, []);

  const handleSignIn = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleSignUp = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentView('signin');
  };

  const handleStartInterview = (config) => {
    setInterviewConfig(config);
    setCurrentView('interview');
  };

  const handleCompleteInterview = async (answers, questions) => {
    setCompletedAnswers(answers);
    setInterviewQuestions(questions);

    // Save interview to database
    if (token && interviewConfig) {
      try {
        await fetch('/api/interviews/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            config: interviewConfig,
            questions,
            answers,
            completedAt: new Date()
          })
        });
      } catch (error) {
        console.error('Failed to save interview:', error);
      }
    }

    setCurrentView('results');
  };

  const handleBackToDashboard = () => {
    setInterviewConfig(null);
    setCompletedAnswers([]);
    setInterviewQuestions([]);
    setViewingInterviewId(null);
    setCurrentView('dashboard');
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleViewInterview = async (interviewId) => {
    setIsLoadingInterview(true);
    setViewingInterviewId(interviewId);

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load interview details');
      }

      const data = await response.json();
      const interview = data.interview;

      // Set the interview data
      setInterviewQuestions(interview.questions);
      setCompletedAnswers(interview.answers);
      setInterviewConfig(interview.config);

      // Navigate to results view
      setCurrentView('results');
    } catch (error) {
      console.error('Failed to load interview:', error);
      alert('Failed to load interview details. Please try again.');
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleNavigate = (view) => {
    // Reset interview state when navigating away
    setInterviewConfig(null);
    setCompletedAnswers([]);
    setInterviewQuestions([]);
    setViewingInterviewId(null);

    // Map navbar navigation to appropriate views
    if (view === 'interview') {
      setCurrentView('config');
    } else {
      setCurrentView(view);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = user && token;

  return (
    <div className="app">
      {/* Show navbar only when authenticated and not on auth pages */}
      {isAuthenticated && currentView !== 'signin' && currentView !== 'signup' && (
        <Navbar
          currentView={currentView === 'config' || currentView === 'interview' || currentView === 'results' ? 'interview' : currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={user}
        />
      )}

      {currentView === 'signin' && (
        <SignIn
          onSignIn={handleSignIn}
          onSwitchToSignUp={() => setCurrentView('signup')}
        />
      )}

      {currentView === 'signup' && (
        <SignUp
          onSignUp={handleSignUp}
          onSwitchToSignIn={() => setCurrentView('signin')}
        />
      )}

      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          onStartInterview={() => setCurrentView('config')}
          onLogout={handleLogout}
          onViewInterview={handleViewInterview}
        />
      )}

      {currentView === 'config' && (
        <ConfigurationForm
          onStartInterview={handleStartInterview}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'interview' && interviewConfig && (
        <InterviewInterface
          config={interviewConfig}
          onComplete={(answers, questions) => handleCompleteInterview(answers, questions)}
          onBack={() => setCurrentView('config')}
        />
      )}

      {currentView === 'results' && (
        <ResultsSummary
          questions={interviewQuestions}
          answers={completedAnswers}
          onRestart={handleBackToDashboard}
        />
      )}

      {/* Profile View */}
      {currentView === 'profile' && isAuthenticated && user && (
        <Profile
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Resume Analysis View */}
      {currentView === 'resume' && isAuthenticated && (
        <ResumeAnalysis onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'coding' && isAuthenticated && (
        <CodingPractice onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'aptitude' && isAuthenticated && (
        <AptitudeTest onBack={() => setCurrentView('dashboard')} user={user} />
      )}

      {currentView === 'chatbot' && isAuthenticated && (
        <Chatbot onBack={() => setCurrentView('dashboard')} user={user} />
      )}
    </div>
  );
}

export default App;
