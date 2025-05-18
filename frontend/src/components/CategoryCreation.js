import React, { useState } from 'react';
import axios from 'axios';
import './CategoryCreation.css';
import { useNavigate } from 'react-router-dom';

const CategoryCreation = () => {
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState(''); // Ajout d'un état pour le nom

  const handleCreateMaterial = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('You must be logged in.');
      navigate('/login');
      return;
    }

    if (!moduleName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/api/student/categories/create/',
        { name: moduleName }, // <-- Utilise ce que l'utilisateur a tapé
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Category created:', response.data);
      alert('Category created successfully!');
      navigate('/student/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
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
          <h2>Add a category to get started</h2>
          <p>Create your first category to begin organizing your content</p>
          
          {/* Champ pour saisir le nom du module */}
          <input
            type="text"
            placeholder="Enter category name"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="module-input"
          />
          
          <button className="create-button" onClick={handleCreateMaterial}>Create material</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCreation;
