import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherQuizHistory.css';

const TeacherQuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]); // Initialisez avec un tableau vide
  const [isLoading, setIsLoading] = useState(true); // Commencez avec true
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/teacher/modules/${id}/quizzes/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setQuizzes(response.data || []); // Garantissez un tableau même si response.data est undefined
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load quizzes');
        setQuizzes([]); // En cas d'erreur, définissez un tableau vide
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
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
                <button 
                  className="vi--ew-details"
                  onClick={() => navigate(`/teacher/modules/${id}/quizzes/${quiz.id}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuizHistory;