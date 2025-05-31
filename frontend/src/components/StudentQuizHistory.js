import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentQuizHistory.css';

const StudentQuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [id]);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/student/categories/${id}/quizzes/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setQuizzes(response.data || []);
      
      const moduleResponse = await axios.get(
        `http://localhost:8000/api/student/categories/${id}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setModuleName(moduleResponse.data.name);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/student/categories/${id}`);
  };

  const handleViewDetails = (quizId) => {
    navigate(`/student/categories/${id}/quizzes/${quizId}/details`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await axios.delete(
          `http://localhost:8000/api/student/categories/${id}/quizzes/${quizId}/delete/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        await fetchQuizzes();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete quiz');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <div className="loading-">Loading quizzes...</div>;
  if (error) return <div className="error-">{error}</div>;

  return (
    <div className="student-quiz-history-container-">
      <nav className="navbar-">
        <div className="navbar-left-">
          <span className="logo-">Quizly</span>
        </div>
        <div className="navbar-right-">
          <button className="back-button-" onClick={handleBack}>
            Back to Category
          </button>
        </div>
      </nav>

      <div className="quiz-history-content-">
        <div className="header-section-">
          <h1>Quiz History</h1>
          <p className="module-name-">{moduleName}</p>
        </div>

        {quizzes.length === 0 ? (
          <div className="no-quizzes-">
            <div className="no-quizzes-icon-">📝</div>
            <h3>No Quizzes Available</h3>
            <p>No quiz has been created for this module yet.</p>
          </div>
        ) : (
          <div className="quizzes-grid-">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card-">
                <div className="quiz-header-">
                  <h3 className="quiz-title-">{quiz.titre}</h3>
                </div>
                
                <p className="quiz-description-">{quiz.description}</p>
                
                <div className="quiz-stats-">
                  <div className="stat-item-">
                    <span className="stat-label-">Questions:</span>
                    <span className="stat-value-">{quiz.questions_count}</span>
                  </div>
                  <div className="stat-item-">
                    <span className="stat-label-">Created on:</span>
                    <span className="stat-value-">{formatDate(quiz.date_creation)}</span>
                  </div>
                  <div className="stat-item-">
                    <span className="stat-label-">Attempts:</span>
                    <span className="stat-value-">{quiz.last_attempt.attempts_count}</span>
                  </div>
                </div>

                {quiz.last_attempt.score !== null ? (
                  <div className="last-attempt-">
                    <div className="score-display-">
                      <span 
                        className="score-percentage-"
                        style={{ color: getScoreColor(quiz.last_attempt.percentage) }}
                      >
                        {quiz.last_attempt.percentage}%
                      </span>
                      <span className="score-details-">
                        ({quiz.last_attempt.score}/{quiz.last_attempt.total_questions})
                      </span>
                    </div>
                    <div className="attempt-date-">
                      Last Attempt: {formatDate(quiz.last_attempt.date_completion)}
                    </div>
                  </div>
                ) : (
                  <div className="no-attempt-">
                    <span>No attempts</span>
                  </div>
                )}

                <div className="quiz-actions-">
                  {quiz.last_attempt.attempts_count > 0 && (
                    <>
                      <button 
                        className="view-details-"
                        onClick={() => handleViewDetails(quiz.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="delete-quiz-"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Quiz'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizHistory;