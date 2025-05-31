import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentQuizDetails.css';

const StudentQuizDetails = () => {
  const { id, quiz_id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState({
    titre: '',
    description: '',
    questions: [],
    score: 0,
    total_questions: 0,
    percentage: 0,
    user_answers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleName, setModuleName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch module name
        const moduleResponse = await axios.get(
          `http://localhost:8000/api/student/categories/${id}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setModuleName(moduleResponse.data.name);

        // Fetch quiz details
        const quizResponse = await axios.get(
          `http://localhost:8000/api/student/categories/${id}/quizzes/${quiz_id}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Fetch user answers
        const answersResponse = await axios.get(
          `http://localhost:8000/api/student/quizzes/${quiz_id}/answers/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Fetch latest result
        const resultResponse = await axios.get(
          `http://localhost:8000/api/student/quizzes/${quiz_id}/results/latest/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setQuiz({
          titre: quizResponse.data.titre,
          description: quizResponse.data.description,
          questions: quizResponse.data.questions || [],
          score: resultResponse.data.score,
          total_questions: resultResponse.data.total_questions,
          percentage: resultResponse.data.percentage,
          user_answers: answersResponse.data || []
        });
        
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load quiz details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, quiz_id]);

  const handleBack = () => {
    navigate(`/student/categories/${id}/quizzes`);
  };

  const handleRetakeQuiz = () => {
    navigate(`/student/categories/${id}/quiz/${quiz_id}`);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Trouver la réponse de l'utilisateur pour une question donnée
  const getUserAnswer = (questionId) => {
    return quiz.user_answers.find(answer => answer.question_id === questionId);
  };

  if (isLoading) return <div className="loading">Loading quiz details...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-quiz-details-container">
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

      <div className="quiz-details-content">
        <div className="header-section">
          <h1>Quiz Results</h1>
          <p className="module-name">{moduleName} - {quiz.titre}</p>
        </div>

        <div className="quiz-card detailed-view">
          <div className="score-summary">
            <div className="score-display">
              <span 
                className="percentage"
                style={{ color: getScoreColor(quiz.percentage) }}
              >
                {quiz.percentage}%
              </span>
              <span className="score-details">
                {quiz.score} / {quiz.total_questions} correct answers
              </span>
            </div>
          </div>

          <div className="questions-results">
            {quiz.questions.map((question, index) => {
              const userAnswer = getUserAnswer(question.id);
              const isCorrect = userAnswer?.is_correct;
              
              return (
                <div 
                  key={question.id} 
                  className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <h3>Question {index + 1}: {question.enonce}</h3>
                  
                  <div className="choices-list">
                    {question.choix.map((choice, choiceIndex) => {
                      const isUserChoice = userAnswer?.selected_choice_index === choiceIndex;
                      const isRightChoice = choice.is_correct;
                      
                      return (
                        <div
                          key={choice.id}
                          className={`choice-item 
                            ${isRightChoice ? 'correct-choice' : ''}
                            ${isUserChoice ? 'user-choice' : ''}
                            ${isUserChoice && !isRightChoice ? 'wrong-choice' : ''}
                          `}
                        >
                          {choice.texte}
                          {isRightChoice && <span className="indicator correct">✓ Correct answer</span>}
                          {isUserChoice && !isRightChoice && <span className="indicator wrong">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!isCorrect && (
                    <div className="feedback">
                      Your answer: {question.choix[userAnswer?.selected_choice_index]?.texte || 'No answer'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="quiz-actions">
            <button 
              className="btn-primary take-quiz"
              onClick={handleRetakeQuiz}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizDetails;