import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SharedQuizDetail.css';

const SharedQuizDetail = () => {
  const { quiz_id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/student/shared-quiz/${quiz_id}/details/`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setQuiz(res.data))
    .catch(err => setError(err.response?.data?.error || 'Failed to load quiz'));
  }, [quiz_id]);

  if (error) return <div className="shared-quiz-error">{error}</div>;
  if (!quiz) return <div className="shared-quiz-loading">Chargement...</div>;

  return (
    <div className="shared-quiz-detail-container">
      <nav className="shared-quiz-navbar">
        <span className="shared-quiz-logo" onClick={() => navigate('/student/categories')}>Quizly</span>
        <button className="shared-quiz-back-btn" onClick={() => navigate(-1)}>Retour</button>
      </nav>
      <div className="shared-quiz-header">
        <h1>{quiz.titre}</h1>
        <p className="shared-quiz-description">{quiz.description}</p>
        <div className="shared-quiz-score">
          Score : <span>{quiz.last_result?.score} / {quiz.last_result?.total_questions}</span>
          <span className="shared-quiz-percentage">
            ({quiz.last_result?.percentage}%)
          </span>
        </div>
      </div>
      <div className="shared-quiz-questions">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="shared-quiz-question-card">
            <h3>Q{idx + 1} : {q.enonce}</h3>
            <ul className="shared-quiz-choices">
              {q.choix.map((c, i) => {
                const userAnswer = quiz.last_result?.answers?.find(a => a.question_id === q.id);
                const isUserChoice = userAnswer?.selected_choice_index === i;
                const isCorrect = c.is_correct;
                return (
                  <li
                    key={c.id}
                    className={
                      "shared-quiz-choice" +
                      (isCorrect ? " correct-choice" : "") +
                      (isUserChoice ? (isCorrect ? " user-correct" : " user-wrong") : "")
                    }
                  >
                    <span className="choice-letter">{String.fromCharCode(65 + i)}.</span>
                    {c.texte}
                    {isCorrect && <span className="badge-correct">Bonne réponse</span>}
                    {isUserChoice && !isCorrect && <span className="badge-wrong">Votre réponse</span>}
                    {isUserChoice && isCorrect && <span className="badge-user-correct">Votre réponse</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedQuizDetail;