import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
import './TeacherQuizResults.css';
import { fetchWithAuth } from '../services/fetchWithAuth';

const TeacherQuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');

  const handleExportCSV = () => {
    fetchWithAuth(`/api/teacher/quizzes/${quizId}/export/csv/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        const disposition = res.headers.get('Content-Disposition');
        let filename = 'results.csv';
        if (disposition && disposition.indexOf('filename=') !== -1) {
          filename = disposition
            .split('filename=')[1]
            .replace(/['"]/g, '');
        }
        return res.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleExportPDF = () => {
    fetchWithAuth(`/api/teacher/quizzes/${quizId}/export/pdf/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        const disposition = res.headers.get('Content-Disposition');
        let filename = 'results.pdf';
        if (disposition && disposition.indexOf('filename=') !== -1) {
          filename = disposition
            .split('filename=')[1]
            .replace(/['"]/g, '');
        }
        return res.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  useEffect(() => {
    // Récupérer les résultats
    api.get(`http://localhost:8000/api/teacher/quizzes/${quizId}/results/`, {
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
    api.get(`http://localhost:8000/api/teacher/quizzes/${quizId}/`, {
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
          Back
        </button>
      </div>
    </nav>

    <div className="tqr-content">
      <div className="tqr-header">
        <h2>{quizTitle} - Results</h2>
        {/* Afficher les boutons seulement si results.length > 0 */}
        {results.length > 0 && (
          <div className="tqr-actions">
            <button onClick={handleExportCSV}>Export CSV</button>
            <button onClick={handleExportPDF}>Export PDF</button>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="tqr-no-results">
          No results for this quiz at the moment.
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