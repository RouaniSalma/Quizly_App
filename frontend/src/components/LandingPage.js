import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="la-nding-page">
      <nav className="na-vbar">
  <div className="lo-go-block">
    <span className="lo-go">QUIZLY</span>
    <span className="sl-ogan">Quick Quizzes. Real Progress</span>
  </div>
  <div className="au-th-buttons">
    <Link to="/login" className="lo-gin-btn">Login</Link>
    <Link to="/signup" className="si-gnup-btn">Sign up</Link>
  </div>
</nav>



      
      <main className="he-ro-content">
        <div className="co-ntent-wrapper">
          <div className="co-ntent-card">
            <h2 className="ta-gline">Turn Study Materials into Smart Quizzes</h2>
            <p className="ma-in-description">
              Upload your materials and get personalized quizzes. Save time while boosting retention.
            </p>
            
            <div className="va-lue-props">
              <div className="pr-op-card">
                <div className="pr-op-icon">📚</div>
                <h3>Upload & Go</h3>
                <div className="pr-op-content">
                  <p><strong>Students:</strong> Review smarter, not harder. Upload your slides or textbooks and get focused questions.</p>
                  <p><strong>Teachers:</strong> Simplify your workflow. Turn documents into review tools effortlessly.</p>
                </div>
              </div>
              
              <div className="pr-op-card">
                <div className="pr-op-icon">⚡</div>
                <h3>Instant Results</h3>
                <div className="pr-op-content">
                  <p><strong>Students:</strong> Get quiz-ready in seconds. Perfect for quick reviews before exams.</p>
                  <p><strong>Teachers:</strong> Save time with AI-assisted quizzes. Reinforce important points quickly.</p>
                </div>
              </div>
              
              <div className="pr-op-card">
                <div className="pr-op-icon">📊</div>
                <h3>Progress Insights</h3>
                <div className="pr-op-content">
                  <p><strong>Students:</strong> Track your learning journey. See what you've mastered and where to improve.</p>
                  <p><strong>Teachers:</strong> Gain visibility on progress. Identify gaps and guide learners.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="fo-oter">
        <p>© 2025 Quizly. Making learning smarter.</p>
      </footer>
    </div>
  );
};

export default LandingPage;