import React, { useState, useEffect } from 'react';
import api from '../services/axiosInstance';
import './StudentCategories.css';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/fetchWithAuth';
import { motion, AnimatePresence } from 'framer-motion';

const StudentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleName, setmoduleName] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const fetchWithAuthCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('http://localhost:8000/api/student/categories/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetchWithAuth categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithAuthCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!moduleName.trim()) {
      alert('Category name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post(
        'http://localhost:8000/api/student/categories/create/', 
        { name: moduleName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCategories([...categories, response.data]);
      setShowModal(false);
      setmoduleName('');
      
    } catch (error) {
      console.error('Error creating category:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!moduleName.trim()) {
      alert('Category name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put(
        `http://localhost:8000/api/student/categories/${currentCategory.id}/update/`,
        { name: moduleName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchWithAuthCategories();
      setShowEditModal(false);
      setmoduleName('');
      setCurrentCategory(null);
      
    } catch (error) {
      console.error('Error updating category:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.delete(
        `http://localhost:8000/api/student/categories/${currentCategory.id}/delete/`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      await fetchWithAuthCategories();
      setShowDeleteModal(false);
      setCurrentCategory(null);
      
    } catch (error) {
      console.error('Error deleting category:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setmoduleName(category.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCategoryActionClick = (e, category, action) => {
    e.stopPropagation();
    if (action === 'edit') {
      openEditModal(category);
    } else if (action === 'delete') {
      openDeleteModal(category);
    }
  };

  return (
    <motion.div 
      className="s-tudent-categories"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Navbar with animations */}
      <nav className="n-avbar">
        <div className="n-avbar-left">
          <motion.span 
            className="l-ogo"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            Quizly
          </motion.span>
        </div>
        <div className="n-avbar-right">
          <motion.button 
            className="a-dd-button-navbar" 
            onClick={() => setShowModal(true)}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? '...' : '+'}
          </motion.button>
          <motion.button 
            className="l-ogout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </nav>

      {/* Categories List with animations */}
      <div className="c-ategories-container">
        <motion.h2 
          className="c-ategories-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          My Categories
        </motion.h2>
        
        {isLoading && !categories.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>Loading categories...</p>
          </motion.div>
        ) : error ? (
          <motion.p 
            className="e-rror-message"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {error}
          </motion.p>
        ) : categories.length === 0 ? (
          <motion.div 
            className="e-mpty-state"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p className="n-o-categories" variants={itemVariants}>
              No categories yet.
            </motion.p>
            <motion.button 
              className="c-reate-first-category"
              onClick={() => setShowModal(true)}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create your first category
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="c-ategories-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map(category => (
              <motion.div 
                className="c-ategory-card" 
                key={category.id}
                onClick={() => navigate(`/student/categories/${category.id}`)}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="c-ategory-header">
                  <h3>{category.name}</h3>
                  <div className="c-ategory-actions">
                    <motion.button 
                      className="e-dit-btn"
                      onClick={(e) => handleCategoryActionClick(e, category, 'edit')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                    <motion.button 
                      className="d-elete-btn"
                      onClick={(e) => handleCategoryActionClick(e, category, 'delete')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
                <p>Created: {new Date(category.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Modal with animations */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="m-odal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="m-odal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create New Category</h3>
              {error && <motion.p 
                className="m-odal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <motion.input
                type="text"
                placeholder="Category Name"
                value={moduleName}
                onChange={e => setmoduleName(e.target.value)}
                disabled={isLoading}
                whileFocus={{ scale: 1.02 }}
              />
              <div className="m-odal-buttons">
                <motion.button 
                  onClick={handleCreateCategory}
                  disabled={isLoading || !moduleName.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </motion.button>
                <motion.button 
                  className="c-lose-btn" 
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

      {/* Edit Modal with animations */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            className="m-odal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              className="m-odal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Category</h3>
              {error && <motion.p 
                className="m-odal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <motion.input
                type="text"
                placeholder="Category Name"
                value={moduleName}
                onChange={e => setmoduleName(e.target.value)}
                disabled={isLoading}
                whileFocus={{ scale: 1.02 }}
              />
              <div className="m-odal-buttons">
                <motion.button 
                  onClick={handleEditCategory}
                  disabled={isLoading || !moduleName.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </motion.button>
                <motion.button 
                  className="c-lose-btn" 
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

      {/* Delete Modal with animations */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="m-odal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              className="m-odal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Category</h3>
              {error && <motion.p 
                className="m-odal-error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {error}
              </motion.p>}
              <p>Are you sure you want to delete "{currentCategory?.name}"?</p>
              <p className="w-arning-text">This action cannot be undone.</p>
              <div className="m-odal-buttons">
                <motion.button 
                  className="d-elete-confirm-btn"
                  onClick={handleDeleteCategory}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
                <motion.button 
                  className="c-lose-btn" 
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

export default StudentCategories;