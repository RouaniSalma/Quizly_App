import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentQuizResults.css';

const StudentQuizResults = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [userAnswers, setUserAnswers] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Récupérer les résultats
        const resultsResponse = await axios.get(
          `http://localhost:8000/api/student/quizzes/${quizId}/results/latest/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setResults(resultsResponse.data);

        // Récupérer les réponses de l'utilisateur
        const answersResponse = await axios.get(
          `http://localhost:8000/api/student/quizzes/${quizId}/answers/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setUserAnswers(answersResponse.data);

        // Récupérer les détails du quiz
        const quizResponse = await axios.get(
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

    fetchResults();
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
    <div className="quiz-results-container">
      <h1>Quiz Results</h1>
      <h2>{quizDetails.titre}</h2>
      
      <div className="score-summary">
        <div className="score-display">
          <span className="percentage">{results.percentage}%</span>
          <span className="score">{results.score} / {results.total_questions}</span>
        </div>
        <p className="date-taken">Completed on: {new Date(results.date_taken).toLocaleDateString()}</p>
      </div>

      <div className="questions-results">
        {quizDetails.questions.map((question, index) => {
          const isCorrect = isAnswerCorrect(question.id);
          
          return (
            <div key={question.id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
              <h3>Question {index + 1}: {question.enonce}</h3>
              <div className="choices-list">
                {question.choix.map((choice, choiceIndex) => {
                  const isSelected = isChoiceSelected(question.id, choiceIndex);
                  const isCorrectChoice = choice.is_correct;
                  
                  return (
                    <div 
                      key={choice.id} 
                      className={`choice-item 
                        ${isCorrectChoice ? 'correct-choice' : ''}
                        ${isSelected ? 'selected-choice' : ''}
                        ${isSelected && !isCorrectChoice ? 'wrong-choice' : ''}
                      `}
                    >
                      {choice.texte}
                      {isCorrectChoice && <span className="correct-indicator">✓ Correct answer</span>}
                      {isSelected && !isCorrectChoice && <span className="wrong-indicator">✗ Your answer</span>}
                    </div>
                  );
                })}
              </div>
              {!isCorrect && (
                <div className="feedback">
                  The correct answer is: {question.choix.find(c => c.is_correct)?.texte}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="back-button" onClick={handleBack}>
        Back to Quiz History
      </button>
    </div>
  );
};

export default StudentQuizResults;