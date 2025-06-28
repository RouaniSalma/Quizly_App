import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
import './StudentTakeQuiz.css'
import { fetchWithAuth } from '../services/fetchWithAuth';
const StudentTakeQuiz = () => {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchWithAuthQuiz = async () => {
      try {
        const response = await api.get(
          `http://localhost:8000/api/student/categories/${id}/quizzes/${quizId}/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setQuiz(response.data);
        
        // Initialiser les choix sélectionnés avec null pour chaque question
        const initialChoices = {};
        response.data.questions.forEach(question => {
          initialChoices[question.id] = null;
        });
        setSelectedChoices(initialChoices);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithAuthQuiz();
  }, [id, quizId]);

  const handleChoiceSelect = (questionId, choiceIndex) => {
    setSelectedChoices({
      ...selectedChoices,
      [questionId]: choiceIndex
    });
  };

  const handleSubmit = async () => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    const answers = quiz.questions.map(question => ({
      question_id: question.id,
      selected_choice_index: selectedChoices[question.id]
    }));

    await api.post(
      `http://localhost:8000/api/student/quizzes/${quizId}/submit/`,
      { answers },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    // Rediriger vers la page des résultats plutôt que les détails
    navigate(`/student/categories/${id}/quizzes/${quizId}/results`);
  } catch (error) {
    setError(error.response?.data?.error || 'Failed to submit quiz');
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) return <div className="load-ing">Loading quiz...</div>;
  if (error) return <div className="er-ror">{error}</div>;
  if (!quiz) return <div className="er-ror">No quiz found</div>;

  return (
    <div className="quiz-contai-ner">
      <h1 className="quiz-ti-tle">{quiz.titre}</h1>
      <p className="quiz-descript-ion">{quiz.description}</p>
      
      <div className="questions-contai-ner">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="question-c-ard">
            <h3 className="question-t-ext">
              {index + 1}. {question.enonce}
            </h3>
            
            <div className="choices-contai-ner">
              {question.choix.map((choice, choiceIndex) => (
                <div 
                  key={choice.id}
                  className={`choice-i-tem ${
                    selectedChoices[question.id] === choiceIndex ? 'selec-ted' : ''
                  }`}
                  onClick={() => handleChoiceSelect(question.id, choiceIndex)}
                >
                  <span className="choice-let-ter">
                    {String.fromCharCode(65 + choiceIndex)}.
                  </span>
                  {choice.texte}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-acti-ons">
        <button 
          className="submit--btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
};

export default StudentTakeQuiz;