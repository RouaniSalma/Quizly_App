import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <h1>Welcome to <span className="quizly-logo">Quizly</span> Teacher Space 👨‍🏫</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <p>Here you can manage your modules, upload documents, and generate quizzes.</p>
        {/* Ajoute ici les composants ou liens vers la gestion des modules, fichiers, quiz, etc. */}
      </main>
    </div>
  );
};

export default TeacherDashboard;
