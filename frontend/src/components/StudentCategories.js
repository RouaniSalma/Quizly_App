import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentCategories.css';
import { useNavigate } from 'react-router-dom';

const StudentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fonction pour charger les catégories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/student/categories/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fonction pour créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      alert('Category name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/student/categories/create/', 
        { name: categoryName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Ajouter la nouvelle catégorie à la liste
      setCategories([...categories, response.data]);
      setShowModal(false);
      setCategoryName('');
      
    } catch (error) {
      console.error('Error creating category:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour gérer le logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Supprimer le token
    navigate('/login'); // Rediriger vers la page de connexion
  };

  return (
    <div className="student-categories">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button 
            className="add-button-navbar" 
            onClick={() => setShowModal(true)}
            disabled={isLoading}
          >
            {isLoading ? '...' : '+'}
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Categories List */}
      <div className="categories-container">
        <h2 className="categories-title">My Categories</h2>
        
        {isLoading && !categories.length ? (
          <p>Loading categories...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p className="no-categories">No categories yet.</p>
            <button 
              className="create-first-category"
              onClick={() => setShowModal(true)}
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map(category => (
              <div 
                className="category-card" 
                key={category.id}
                onClick={() => navigate(`/student/categories/${category.id}`)}
              >
                <h3>{category.name}</h3>
                <p>Created: {new Date(category.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Category</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Category Name"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button 
                onClick={handleCreateCategory}
                disabled={isLoading || !categoryName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCategories;