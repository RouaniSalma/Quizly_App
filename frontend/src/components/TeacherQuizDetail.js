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

  if (isLoading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quiz) return <div className="error">Quiz not found</div>;

  return (
    <div className="quiz-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button className="back-button" onClick={handleBack}>
            Back to Quiz History
          </button>
        </div>
      </nav>

      <div className="quiz-detail-content">
        <h1>{quiz.titre}</h1>
        <p className="quiz-description">{quiz.description}</p>
        <div className="quiz-meta">
          <span>Created: {new Date(quiz.date_creation).toLocaleDateString()}</span>
        </div>

        <div className="questions-section">
          <h2>Questions</h2>
          {quiz.questions.map((question, qIndex) => (
            <div key={question.id} className="question-card">
              <h3>Question {qIndex + 1}: {question.enonce}</h3>
              <ul className="choices-list">
                {question.choix.map((choice, cIndex) => (
                  <li 
                    key={choice.id} 
                    className={choice.is_correct ? 'correct-choice' : ''}
                  >
                    {choice.texte}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizDetail;