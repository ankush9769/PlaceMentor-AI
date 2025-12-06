import React from 'react';
import '../styles/components/Navbar.css';

const Navbar = ({ currentView, onNavigate, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Performance Dashboard', icon: '📊' },
    { id: 'interview', label: 'AI Mock Interview', icon: '🎤' },
    { id: 'resume', label: 'Resume Analysis', icon: '📄' },
    { id: 'coding', label: 'Coding Practice', icon: '💻' },
    { id: 'aptitude', label: 'Aptitude Test', icon: '🎯' },
    { id: 'chatbot', label: 'Chatbot', icon: '🤖' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>🎯 Prep Master AI</h2>
        </div>

        <div className="navbar-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <button 
                className="user-info clickable-user" 
                onClick={() => onNavigate('profile')}
                title="View Profile"
              >
                <span className="user-avatar">👤</span>
                <span className="user-name">{user.name}</span>
              </button>
              <button className="logout-btn" onClick={onLogout}>
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
