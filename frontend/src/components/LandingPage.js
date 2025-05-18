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
          <h2 className="tagline">Turn Study Materials into Smart, Personalized Quizzes</h2>
          <p className="main-description">
            Upload your course materials and let AI turn them into quick, focused quizzes.
Revise better, teach smarter, and save time while boosting retention.
          </p>
          
          <div className="value-props">
            <div className="prop-card">
              <div className="prop-icon">📚</div>
              <h3>Upload & Go</h3>
              <p>
  <strong>Students:</strong> Review smarter, not harder.<br />
  Upload your slides or textbooks and get focused questions that help you grasp key concepts — fast.<br /><br />
  <strong>Teachers:</strong> Simplify your workflow.<br />
  Turn any document into an instant review tool to support your students effortlessly.
</p>
            </div>
            
            <div className="prop-card">
              <div className="prop-icon">⚡</div>
              <h3>Instant Results</h3>
              <p>
  <strong>Students:</strong> Get quiz-ready in seconds.<br />
  Perfect for quick reviews before class, exams, or study sessions.<br /><br />
  <strong>Teachers:</strong> Save time with AI-assisted quiz creation.<br />
  Reinforce important points without spending hours on prep.
</p>
            </div>
            
            <div className="prop-card">
              <div className="prop-icon">📊</div>
              <h3>Progress Insights</h3>
              <p> <strong>Students:</strong> Track your learning journey.<br />
  See what you’ve mastered and where to improve — all in one place.<br /><br />
  <strong>Teachers:</strong> Gain visibility on student progress.<br />
  Identify gaps and guide your learners with confidence.</p>
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