import React from 'react';
import axios from 'axios';
import './ModuleCreation.css';
import { useNavigate } from 'react-router-dom';

const ModuleCreation = () => {
  const navigate = useNavigate();

  const handleCreateMaterial = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('You must be logged in.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/api/teacher/modules/create/',
        { name: 'New Module' }, // <-- tu peux améliorer pour demander un vrai nom
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Module created:', response.data);
      alert('Module created successfully!');
      
      // Redirige vers la liste des modules par exemple
      navigate('/teacher/modules');
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module.');
    }
  };

  return (
    <div className="quizly-app">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
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
          <h2>Add a material to get started</h2>
          <p>Create your first material to begin organizing your content</p>
          <button className="create-button" onClick={handleCreateMaterial}>Create material</button>
        </div>
      </div>
    </div>
  );
};

export default ModuleCreation;
