import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
import './StudentQuizDetails.css';
import { fetchWithAuth } from '../services/fetchWithAuth';
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
    const fetchWithAuthData = async () => {
      try {
        // fetchWithAuth module name
        const moduleResponse = await api.get(
          `http://localhost:8000/api/student/categories/${id}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setModuleName(moduleResponse.data.name);

        // fetchWithAuth quiz details
        const quizResponse = await api.get(
          `http://localhost:8000/api/student/categories/${id}/quizzes/${quiz_id}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // fetchWithAuth user answers
        const answersResponse = await api.get(
          `http://localhost:8000/api/student/quizzes/${quiz_id}/answers/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // fetchWithAuth latest result
        const resultResponse = await api.get(
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

    fetchWithAuthData();
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

  if (isLoading) return <div className="loadin-g">Loading quiz details...</div>;
  if (error) return <div className="erro-r">{error}</div>;

  return (
    <div className="student-quiz-details-containe-r">
      <nav className="navba-r">
        <div className="navbar-lef-t">
          <span className="log-o">Quizly</span>
        </div>
        <div className="navbar-righ-t">
          <button className="back-butto-n" onClick={handleBack}>
            Back to Quiz History
          </button>
        </div>
      </nav>

      <div className="quiz-details-conten-t">
        <div className="header-sectio-n">
          <h1>Quiz Results</h1>
          <p className="module-nam-e">{moduleName} - {quiz.titre}</p>
        </div>

        <div className="quiz-card detailed-vie-w">
          <div className="score-summar-y">
            <div className="score-displa-y">
              <span 
                className="percentag-e"
                style={{ color: getScoreColor(quiz.percentage) }}
              >
                {quiz.percentage}%
              </span>
              <span className="score-detail-s">
                {quiz.score} / {quiz.total_questions} correct answers
              </span>
            </div>
          </div>

          <div className="questions-result-s">
            {quiz.questions.map((question, index) => {
              const userAnswer = getUserAnswer(question.id);
              const isCorrect = userAnswer?.is_correct;
              
              return (
                <div 
                  key={question.id} 
                  className={`question-resul-t ${isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <h3>Question {index + 1}: {question.enonce}</h3>
                  
                  <div className="choices-lis-t">
                    {question.choix.map((choice, choiceIndex) => {
                      const isUserChoice = userAnswer?.selected_choice_index === choiceIndex;
                      const isRightChoice = choice.is_correct;
                      
                      return (
                        <div
                          key={choice.id}
                          className={`choice-ite-m 
                            ${isRightChoice ? 'correct-choic-e' : ''}
                            ${isUserChoice ? 'user-choic-e' : ''}
                            ${isUserChoice && !isRightChoice ? 'wrong-choic-e' : ''}
                          `}
                        >
                          {choice.texte}
                          {isRightChoice && <span className="indicator correc-t">✓ Correct answer</span>}
                          {isUserChoice && !isRightChoice && <span className="indicator wron-g">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!isCorrect && (
                    <div className="feedbac-k">
                      Your answer: {question.choix[userAnswer?.selected_choice_index]?.texte || 'No answer'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="quiz-action-s">
            <button 
              className="btn-primary take-qui-z"
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