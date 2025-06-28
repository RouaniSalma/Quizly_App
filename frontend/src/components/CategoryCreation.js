import React, { useState } from 'react';
import './CategoryCreation.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/axiosInstance';
const CategoryCreation = () => {
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
        navigate('/login');
        return;
    }

    if (!moduleName.trim()) {
        setError('Please enter a subject name.');
        return;
    }

    try {
    const response = await api.post(
        'http://localhost:8000/api/student/categories/create/',
        { name: moduleName.trim() },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    console.log('Subject created:', response.data);
    
    // Affiche l'alerte avant la redirection
    alert('Subject created successfully!');
    
    // Redirige après que l'utilisateur a cliqué sur OK dans l'alerte
    navigate('/student/categories');
    
} catch (error) {
    console.error('Error:', error);
    if (error.response) {
        if (error.response.status === 400) {
            setError(error.response.data.error);
        } else if (error.response.status === 403) {
            setError('Unauthorized access');
            navigate('/login');
        } else {
            setError('Failed to create subject. Please try again.');
        }
    } else {
        setError('Network error. Please check your connection.');
    }
}
};

  return (
    <div className="q-uizly-app">
      <nav className="n-avbar">
        <div className="n-avbar-left">
          <span className="l-ogo">QUIZLY</span>
        </div>
        <div className="n-avbar-right">
          <button className="a-dd-button" onClick={handleCreateMaterial}>+</button>
          <button className="l-ogout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="c-ontent">
        <div className="e-mpty-state">
          <div className="b-ook-icon">
            <div className="b-ook-cover">
              <div className="b-ook-spine"></div>
              <div className="b-ook-pages"></div>
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
            className="m-odule-input"
          />
          
          {error && <div className="e-rror-message">{error}</div>}
          
          <button className="c-reate-button" onClick={handleCreateMaterial}>Create subject</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCreation;
