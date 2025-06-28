import React, { useState, useEffect } from 'react';
import api from '../services/axiosInstance';
import './TeacherModules.css';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/fetchWithAuth';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherModules = () => {
  const [modules, setModules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [currentModule, setCurrentModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWithAuthModules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('http://localhost:8000/api/teacher/modules/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setModules(response.data);
    } catch (error) {
      console.error('Error fetchWithAuthing modules:', error);
      setError('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithAuthModules();
  }, []);

  const handleCreateModule = async () => {
    if (!moduleName.trim()) {
      alert('Subject name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await api.post(
        'http://localhost:8000/api/teacher/modules/create/', 
        { name: moduleName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchWithAuthModules();
      setShowModal(false);
      setModuleName('');
      
    } catch (error) {
      console.error('Error creating subject:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to create subject');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditModule = async () => {
    if (!moduleName.trim()) {
      alert('Subject name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put(
        `http://localhost:8000/api/teacher/modules/${currentModule.id}/update/`,
        { name: moduleName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await fetchWithAuthModules();
      setShowEditModal(false);
      setModuleName('');
      setCurrentModule(null);
      
    } catch (error) {
      console.error('Error updating subject:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to update subject');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.delete(
        `http://localhost:8000/api/teacher/modules/${currentModule.id}/delete/`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      await fetchWithAuthModules();
      setShowDeleteModal(false);
      setCurrentModule(null);
      
    } catch (error) {
      console.error('Error deleting subject:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to delete subject');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (module) => {
    setCurrentModule(module);
    setModuleName(module.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (module) => {
    setCurrentModule(module);
    setShowDeleteModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleModuleActionClick = (e, module, action) => {
    e.stopPropagation();
    if (action === 'edit') {
      openEditModal(module);
    } else if (action === 'delete') {
      openDeleteModal(module);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", damping: 25 }
    },
    exit: { scale: 0.9, opacity: 0 }
  };

  return (
    <motion.div 
      className="Teacher-modules"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <nav className="Navbar">
        <div className="Navbar-left">
          <motion.span 
            className="Logo"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            QUIZLY
          </motion.span>
        </div>
        <div className="Navbar-right">
          <motion.button 
            className="Add-button-navbar" 
            onClick={() => setShowModal(true)}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? '...' : '+'}
          </motion.button>
          <motion.button 
            className="Logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </nav>

      <div className="Modules-container">
        <motion.h2 
          className="Modules-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          My Subjects
        </motion.h2>
        
        {isLoading && !modules.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>Loading subjects...</p>
          </motion.div>
        ) : error ? (
          <motion.p 
            className="error-message"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {error}
          </motion.p>
        ) : modules.length === 0 ? (
          <motion.div 
            className="Empty-state"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p className="No-modules" variants={itemVariants}>
              No subjects yet.
            </motion.p>
            <motion.button 
              className="Create-first-module"
              onClick={() => setShowModal(true)}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create your first subject
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="Modules-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {modules.map(module => (
              <motion.div 
                className="Module-card" 
                key={module.id}
                onClick={() => navigate(`/teacher/modules/${module.id}`)}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="Module-header">
                  <h3>{module.name}</h3>
                  <div className="Module-actions">
                    <motion.button 
                      className="Edit-btn"
                      onClick={(e) => handleModuleActionClick(e, module, 'edit')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                    <motion.button 
                      className="Delete-btn"
                      onClick={(e) => handleModuleActionClick(e, module, 'delete')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
                <p>Created: {new Date(module.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="Modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="Modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create New subject</h3>
              {error && <motion.p 
                className="Modal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <motion.input
                type="text"
                placeholder="Subject Name"
                value={moduleName}
                onChange={e => setModuleName(e.target.value)}
                disabled={isLoading}
                whileFocus={{ scale: 1.02 }}
              />
              <div className="Modal-buttons">
                <motion.button 
                  onClick={handleCreateModule}
                  disabled={isLoading || !moduleName.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </motion.button>
                <motion.button 
                  className="Close-btn" 
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            className="Modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              className="Modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Subject</h3>
              {error && <motion.p 
                className="Modal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <motion.input
                type="text"
                placeholder="Subject Name"
                value={moduleName}
                onChange={e => setModuleName(e.target.value)}
                disabled={isLoading}
                whileFocus={{ scale: 1.02 }}
              />
              <div className="Modal-buttons">
                <motion.button 
                  onClick={handleEditModule}
                  disabled={isLoading || !moduleName.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </motion.button>
                <motion.button 
                  className="Close-btn" 
                  onClick={() => {
                    setShowEditModal(false);
                    setError(null);
                  }}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="Modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              className="Modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Subject</h3>
              {error && <motion.p 
                className="Modal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <p>Are you sure you want to delete "{currentModule?.name}"?</p>
              <p className="Warning-text">This action cannot be undone.</p>
              <div className="Modal-buttons">
                <motion.button 
                  className="Delete-confirm-btn"
                  onClick={handleDeleteModule}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
                <motion.button 
                  className="Close-btn" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
                  }}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherModules;