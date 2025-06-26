import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function QuizPage() {
  const { quizId } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log(`Fetching quiz ${quizId}...`);
        const response = await axios.get(`http://localhost:8000/api/quiz/${quizId}/`);
        
        console.log('API Response:', response.data);

        // Vérification plus robuste des données
        if (!response.data || 
            !response.data.questions || 
            response.data.questions.length === 0) {
          throw new Error("Ce quiz ne contient aucune question");
        }

        // Transformation des données pour correspondre à votre modèle
        const transformedData = {
          ...response.data,
          questions: response.data.questions.map(question => ({
            ...question,
            enonce: question.text || question.enonce, // Selon ce que renvoie l'API
            choix: question.options || question.choix || [] // Selon ce que renvoie l'API
          }))
        };

        setQuizData(transformedData);
      } catch (err) {
        console.error("Erreur de chargement:", err);
        setError(err.message || "Erreur lors du chargement du quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) return <div>Chargement du quiz...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!quizData) return <div>Quiz non disponible</div>;

  return (
    <div className="quiz-container">
      <h1>{quizData.title || quizData.titre}</h1>
      {quizData.description && <p className="description">{quizData.description}</p>}

      <div className="questions">
        {quizData.questions.map((question, qIndex) => (
          <div key={question.id || `q-${qIndex}`} className="question">
            <h3>Question {qIndex + 1}: {question.enonce || question.text}</h3>
            
            {question.choix && question.choix.length > 0 ? (
              <ul className="options">
                {question.choix.map((choix, cIndex) => (
                  <li key={choix.id || `c-${cIndex}`}>
                    <input 
                      type="radio" 
                      id={`choice-${choix.id || cIndex}`}
                      name={`question-${question.id || qIndex}`} 
                    />
                    <label htmlFor={`choice-${choix.id || cIndex}`}>
                      {choix.texte || choix.text}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun choix disponible pour cette question</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuizPage;