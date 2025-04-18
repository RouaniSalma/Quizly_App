import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <h1 className="logo">Quizly</h1>
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/signup" className="signup-btn">Sign up</Link>
        </div>
      </nav>
      
      <main className="hero-content">
        <div className="content-card">
          <h2 className="tagline">Transform PDFs into Interactive Quizzes</h2>
          <p className="main-description">
            Upload your course materials and let our AI create engaging quizzes<br /> 
            that help you learn faster and remember more.
          </p>
          
          <div className="value-props">
            <div className="prop-card">
              <div className="prop-icon">📚</div>
              <h3>Upload & Go</h3>
              <p>Works with lecture slides, textbooks, and research papers</p>
            </div>
            
            <div className="prop-card">
              <div className="prop-icon">⚡</div>
              <h3>Instant Results</h3>
              <p>Get quiz-ready in no time</p>
            </div>
            
            <div className="prop-card">
              <div className="prop-icon">📊</div>
              <h3>Progress Insights</h3>
              <p>Track your learning journey</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer">
        <p>© 2025 Quizly. Making learning smarter.</p>
      </footer>
    </div>
  );
};

export default LandingPage;