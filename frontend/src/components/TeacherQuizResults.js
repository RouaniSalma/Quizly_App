import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherQuizResults.css';

const TeacherQuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');

  const handleExportCSV = () => {
    fetch(`/api/teacher/quizzes/${quizId}/export/csv/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_${quizId}_results.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleExportPDF = () => {
    fetch(`/api/teacher/quizzes/${quizId}/export/pdf/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_${quizId}_results.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  useEffect(() => {
    // Récupérer les résultats
    axios.get(`http://localhost:8000/api/teacher/quizzes/${quizId}/results/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => {
      setResults(res.data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.response?.data?.error || 'Failed to load results');
      setLoading(false);
    });

    // Récupérer le titre du quiz
    axios.get(`http://localhost:8000/api/teacher/quizzes/${quizId}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => {
      setQuizTitle(res.data.titre || 'Quiz Results');
    })
    .catch(() => {
      setQuizTitle('Quiz Results');
    });
  }, [quizId]);

  if (loading) return <div className="tqr-container tqr-loading">Chargement...</div>;
  if (error) return <div className="tqr-container tqr-error">{error}</div>;

  return (
  <div className="tqr-container">
    <nav className="tqr-navbar">
      <div className="tqr-navbar-left">
        <span className="tqr-logo">Quizly</span>
      </div>
      <div className="tqr-navbar-right">
        <button className="tqr-back-btn" onClick={() => navigate(-1)}>
          Retour
        </button>
      </div>
    </nav>

    <div className="tqr-content">
      <div className="tqr-header">
        <h2>{quizTitle} - Résultats</h2>
        {/* Afficher les boutons seulement si results.length > 0 */}
        {results.length > 0 && (
          <div className="tqr-actions">
            <button onClick={handleExportCSV}>Exporter CSV</button>
            <button onClick={handleExportPDF}>Exporter PDF</button>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="tqr-no-results">
          Aucun résultat pour ce quiz pour le moment.
        </div>
      ) : (
        <div className="tqr-table-container">
          <table className="tqr-table">
                <thead>
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Total</th>
                    <th>Pourcentage</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.student_first_name}</td>
                      <td>{res.student_last_name}</td>
                      <td>{res.student_email}</td>
                      <td>{res.score}</td>
                      <td>{res.total_questions}</td>
                      <td>{res.percentage}%</td>
                      <td>{new Date(res.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
        </div>
      )}
    </div>
  </div>
);
};

export default TeacherQuizResults;