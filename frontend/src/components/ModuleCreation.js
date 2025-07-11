import React, { useState } from 'react';
import api from '../services/axiosInstance';
import './ModuleCreation.css';
import { useNavigate } from 'react-router-dom';

const ModuleCreation = () => {
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState('');
  const [error, setError] = useState('');
const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const handleCreateMaterial = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('You must be logged in.');
      navigate('/login');
      return;
    }

    if (!moduleName.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    try {
      // Vérification d'unicité sans modifier le texte saisi (laisser le backend gérer la casse si possible)
      const checkResponse = await api.get(
        `http://localhost:8000/api/teacher/modules/check-unique/?name=${encodeURIComponent(moduleName.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!checkResponse.data.is_unique) {
        setError('A subject with this name already exists.');
        return;
      }

      // Création du module (nom converti en minuscules et nettoyé)
      const response = await api.post(
        'http://localhost:8000/api/teacher/modules/create/',
        { name: moduleName.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Subject created:', response.data);
      alert('Subject created successfully!');
      navigate('/teacher/modules');
    } catch (error) {
      console.error('Error:', error);
      if (error.response && error.response.status === 409) {
        setError('A subject with this name already exists.');
      } else {
        setError('Failed to create subject. Please try again.');
      }
    }
  };

  return (
    <div className="qu-izly-app">
      <nav className="na-vbar">
        <div className="na-vbar-left">
          <span className="lo-go">QUIZLY</span>
        </div>
        <div className="na-vbar-right">
          <button className="Ad-d-button" onClick={handleCreateMaterial}>+</button>
          <button className="Lo-gout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="co-ntent">
        <div className="em-pty-state">
          <div className="bo-ok-icon">
            <div className="bo-ok-cover">
              <div className="bo-ok-spine"></div>
              <div className="bo-ok-pages"></div>
            </div>
          </div>
          <h2>Add a subject to get started</h2>
          <p>Create your first subject to begin organizing your content</p>
          
          <input 
            type="text"
            placeholder="Enter subject name"
            value={moduleName}
            onChange={(e) => {
              setModuleName(e.target.value);
              setError('');
            }}
            className="mo-dule-input"
          />
          
          {error && <div className="er-ror-message">{error}</div>}
          
          <button className="cr-eate-button" onClick={handleCreateMaterial}>Create subject</button>
        </div>
      </div>
    </div>
  );
};

export default ModuleCreation;
