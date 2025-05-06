import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherModules.css';
import { useNavigate } from 'react-router-dom';

const TeacherModules = () => {
  const [modules, setModules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fonction pour charger les modules
  const fetchModules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/teacher/modules/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setError('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Fonction pour créer un nouveau module
  const handleCreateModule = async () => {
    if (!moduleName.trim()) {
      alert('Module name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(
        'http://localhost:8000/api/teacher/modules/create/', 
        { name: moduleName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchModules();
      setShowModal(false);
      setModuleName('');
      
    } catch (error) {
      console.error('Error creating module:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to create module');
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
    <div className="teacher-modules">
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

      {/* Modules List */}
      <div className="modules-container">
        <h2 className="modules-title">My Modules</h2>
        
        {isLoading && !modules.length ? (
          <p>Loading modules...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : modules.length === 0 ? (
          <div className="empty-state">
            <p className="no-modules">No modules yet.</p>
            <button 
              className="create-first-module"
              onClick={() => setShowModal(true)}
            >
              Create your first module
            </button>
          </div>
        ) : (
          <div className="modules-grid">
            {modules.map(module => (
              <div 
                className="module-card" 
                key={module.id}
                onClick={() => navigate(`/teacher/modules/${module.id}`)}
              >
                <h3>{module.name}</h3>
                <p>Created: {new Date(module.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Module</h3>
            {error && <p className="modal-error">{error}</p>}
            <input
              type="text"
              placeholder="Module Name"
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              disabled={isLoading}
            />
            <div className="modal-buttons">
              <button 
                onClick={handleCreateModule}
                disabled={isLoading || !moduleName.trim()}
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

export default TeacherModules;
