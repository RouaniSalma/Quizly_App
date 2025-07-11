import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
import './TeacherQuizHistory.css';
import { fetchWithAuth } from '../services/fetchWithAuth';
const TeacherQuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWithAuthQuizzes = async () => {
      try {
        const response = await api.get(
          `http://localhost:8000/api/teacher/modules/${id}/quizzes/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setQuizzes(response.data || []);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load quizzes');
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithAuthQuizzes();
  }, [id]);

  const handleBack = () => {
    navigate(`/teacher/modules/${id}`);
  };

  if (isLoading) return <div className="lo--ading">Loading quizzes...</div>;
  if (error) return <div className="er--ror">{error}</div>;

  return (
    <div className="qu--iz-history-container">
      <nav className="na--vbar">
        <div className="na--vbar-left">
          <span className="lo--go">Quizly</span>
        </div>
        <div className="na--vbar-right">
          <button className="ba--ck-button" onClick={handleBack}>
            Back to Subject
          </button>
        </div>
      </nav>

      <div className="qu--iz-history-content">
        <h1>Quiz History</h1>
        
        {quizzes.length === 0 ? (
          <div className="no--quizzes">No quizzes found for this module</div>
        ) : (
          <div className="qu--izzes-list">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="qu--iz-card">
                <h3>{quiz.titre}</h3>
                <p>{quiz.description}</p>
                <div className="qu--iz-meta">
                  <span>Created: {new Date(quiz.date_creation).toLocaleDateString()}</span>
                  <span>{quiz.questions_count || 0} questions</span>
                </div>
                <div className="qu--iz-card-buttons">
                  <button 
                    className="vi--ew-details"
                    onClick={() => navigate(`/teacher/modules/${id}/quizzes/${quiz.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="vi--ew-results"
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/results`)}
                  >
                    View Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuizHistory;