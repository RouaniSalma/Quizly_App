import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
import './StudentQuizResults.css';
import { fetchWithAuth } from '../services/fetchWithAuth';
const StudentQuizResults = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [userAnswers, setUserAnswers] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWithAuthResults = async () => {
      try {
        // Récupérer les résultats
        const resultsResponse = await api.get(
          `http://localhost:8000/api/student/quizzes/${quizId}/results/latest/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setResults(resultsResponse.data);

        // Récupérer les réponses de l'utilisateur
        const answersResponse = await api.get(
          `http://localhost:8000/api/student/quizzes/${quizId}/answers/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setUserAnswers(answersResponse.data);

        // Récupérer les détails du quiz
        const quizResponse = await api.get(
          `http://localhost:8000/api/student/categories/${id}/quizzes/${quizId}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setQuizDetails(quizResponse.data);

      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithAuthResults();
  }, [id, quizId]);

  const handleBack = () => {
    navigate(`/student/categories/${id}/quizzes`);
  };

  // Fonction pour déterminer si la réponse de l'utilisateur était correcte
  const isAnswerCorrect = (questionId) => {
    if (!userAnswers || !quizDetails) return false;
    
    const question = quizDetails.questions.find(q => q.id === questionId);
    const userAnswer = userAnswers.find(a => a.question_id === questionId);
    
    if (!question || !userAnswer) return false;
    
    const correctChoice = question.choix.find(c => c.is_correct);
    return correctChoice && userAnswer.selected_choice_index === question.choix.indexOf(correctChoice);
  };

  // Fonction pour vérifier si un choix a été sélectionné par l'utilisateur
  const isChoiceSelected = (questionId, choiceIndex) => {
    if (!userAnswers) return false;
    const answer = userAnswers.find(a => a.question_id === questionId);
    return answer && answer.selected_choice_index === choiceIndex;
  };

  if (isLoading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!results || !quizDetails) return <div className="error">No results found</div>;

  return (
    <div className="quiz-results-contain-er">
      <h1>Quiz Results</h1>
      <h2>{quizDetails.titre}</h2>
      
      <div className="score-summa-ry">
        <div className="score-displ-ay">
          <span className="percenta-ge">{results.percentage}%</span>
          <span className="sco-re">{results.score} / {results.total_questions}</span>
        </div>
        <p className="date-tak-en">Completed on: {new Date(results.date_taken).toLocaleDateString()}</p>
      </div>

      <div className="questions-resul-ts">
        {quizDetails.questions.map((question, index) => {
          const isCorrect = isAnswerCorrect(question.id);
          
          return (
            <div key={question.id} className={`question-resu-lt ${isCorrect ? 'corre-ct' : 'incorre-ct'}`}>
              <h3>Question {index + 1}: {question.enonce}</h3>
              <div className="choices-li-st">
                {question.choix.map((choice, choiceIndex) => {
                  const isSelected = isChoiceSelected(question.id, choiceIndex);
                  const isCorrectChoice = choice.is_correct;
                  
                  return (
                    <div 
                      key={choice.id} 
                      className={`choice-it-em 
                        ${isCorrectChoice ? 'correct-choi-ce' : ''}
                        ${isSelected ? 'selected-choi-ce' : ''}
                        ${isSelected && !isCorrectChoice ? 'wrong-choi-ce' : ''}
                      `}
                    >
                      {choice.texte}
                      {isCorrectChoice && <span className="correct-indicat-or">✓ Correct answer</span>}
                      {isSelected && !isCorrectChoice && <span className="wrong-indicat-or">✗ Your answer</span>}
                    </div>
                  );
                })}
              </div>
              {!isCorrect && (
                <div className="feedba-ck">
                  The correct answer is: {question.choix.find(c => c.is_correct)?.texte}
                </div>
              )}
            </div>
          );
        })}
      </div>
        <div className="action-buttons">
        <button className="back-butt-on" onClick={handleBack}>
        Back to Quiz History
       </button>
       </div>
    </div>
  );
};

export default StudentQuizResults;