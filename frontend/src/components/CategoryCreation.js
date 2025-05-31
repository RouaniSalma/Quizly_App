import React, { useState } from 'react';
import axios from 'axios';
import './CategoryCreation.css';
import { useNavigate } from 'react-router-dom';

const CategoryCreation = () => {
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState('');
  const [error, setError] = useState('');

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
    const response = await axios.post(
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
    <div className="quizly-app">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">QUIZLY</span>
        </div>
        <div className="navbar-right">
          <button className="add-button" onClick={handleCreateMaterial}>+</button>
        </div>
      </nav>

      <div className="content">
        <div className="empty-state">
          <div className="book-icon">
            <div className="book-cover">
              <div className="book-spine"></div>
              <div className="book-pages"></div>
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
            className="module-input"
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button className="create-button" onClick={handleCreateMaterial}>Create subject</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCreation;
