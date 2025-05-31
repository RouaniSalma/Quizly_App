import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherQuizDetail.css';

const TeacherQuizDetail = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [restrictions, setRestrictions] = useState({
    expiry_date: '',
    max_participants: ''
  });

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/teacher/quizzes/${quizId}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setQuiz(response.data);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleBack = () => {
    navigate(`/teacher/modules/${id}/quizzes`);
  };

  const handleShareQuiz = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/teacher/quizzes/${quizId}/share/`,  // Ajoutez le préfixe
        { restrictions },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setShareData(response.data);
    } catch (error) {
      console.error('Sharing failed:', error);
      setError(error.response?.data?.error || 'Failed to share quiz');
    }
  };

  if (isLoading) return <div className="loa-ding">Loading quiz...</div>;
  if (error) return <div className="err-or">{error}</div>;
  if (!quiz) return <div className="err-or">Quiz not found</div>;

  return (
    <div className="qui-z-detail-container">
      <nav className="nav-bar">
        <div className="nav-bar-left">
          <span className="log-o">Quizly</span>
        </div>
        <div className="nav-bar-right">
          <button className="bac-k-button" onClick={handleBack}>
            Back to Quiz History
          </button>
        </div>
      </nav>

      <div className="qui-z-detail-content">
        <h1>{quiz.titre}</h1>
        <p className="qui-z-description">{quiz.description}</p>
        <div className="qui-z-meta">
          <span>Created: {new Date(quiz.date_creation).toLocaleDateString()}</span>
        </div>

        <div className="que-stions-section">
          <h2>Questions</h2>
          {quiz.questions.map((question, qIndex) => (
            <div key={question.id} className="que-stion-card">
              <h3>Question {qIndex + 1}: {question.enonce}</h3>
              <ul className="cho--ices-list">
                {question.choix.map((choice, cIndex) => (
                  <li 
                    key={choice.id} 
                    className={choice.is_correct ? 'cor-rect-choice' : ''}
                  >
                    {choice.texte}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="qui-z-actions">
          <button 
            className="sha-re-button"
            onClick={() => setShowShareModal(true)}
          >
            Share the quiz
          </button>
        </div>

        {showShareModal && (
          <div className="sha-re-modal">
            <div className="mod-al-content">
              <h2>Share</h2>
              
              <div className="res-trictions-form">
                <label>
                  Expiration date:
                  <input
                    type="dat-etime-local"
                    value={restrictions.expiry_date}
                    onChange={(e) => setRestrictions({
                      ...restrictions,
                      expiry_date: e.target.value
                    })}
                  />
                </label>
                
                <label>
                  Number of max participants:
                  <input
                    type="number"
                    value={restrictions.max_participants}
                    onChange={(e) => setRestrictions({
                      ...restrictions,
                      max_participants: e.target.value
                    })}
                  />
                </label>
              </div>

              {shareData && (
                <div className="sha-re-results">
                  <div className="qr-c-ode-container">
                  {shareData.qr_code_url && (
    <img 
        src={shareData.qr_code_url} 
        alt="QR Code"
        onError={(e) => {
            console.error("Failed to load QR code image:", e);
            e.target.style.display = 'none';
        }}
    />
)}
                  </div>
                  <div className="sha-re-link">
  <div className="url--copy-container">  {/* Nouveau conteneur flex */}
    <input
      type="text"
      value={shareData.share_url}
      readOnly
      className="url--input"
    />
    <button 
      className="cop-y-button"
      onClick={() => {
        navigator.clipboard.writeText(shareData.share_url);
        alert('Link copied!');
      }}
    >
      Copy
    </button>
  </div>
</div>
                </div>
              )}

              <div className="mod-al-actions">
  <div className="but-ton-group"> {/* Conteneur flex pour les boutons */}
    <button className="gen-erate-button" onClick={handleShareQuiz}>
      Generate the link
    </button>
    <button className="clo-se-button" onClick={() => setShowShareModal(false)}>
      Close
    </button>
  </div>
</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuizDetail;