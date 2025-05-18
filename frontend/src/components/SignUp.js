import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import './SignUp.css';

const SignUp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: role,
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      const response = await axios.post(
        'http://localhost:8000/api/auth/signup/', 
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Assuming backend returns 201 with message
      navigate('/verify-email-notice', { 
        state: { email: formData.email } 
      });
      
    } catch (error) {
      console.error("Signup failed:", error);
      
      if (error.response) {
        // Handle backend validation errors
        if (error.response.status === 400) {
          const backendErrors = error.response.data;
          
          if (backendErrors.email) {
            setErrors(prev => ({ 
              ...prev, 
              email: backendErrors.email.join(' ') 
            }));
          }
          
          if (backendErrors.password) {
            setErrors(prev => ({ 
              ...prev, 
              password: backendErrors.password.join(' ') 
            }));
          }
        } else {
          alert("Registration failed. Please try again.");
        }
      } else {
        alert("Network error. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="addUser">
      <button onClick={() => navigate('/')} className="back-arrow">
        <FaArrowLeft />
      </button>

      <h3>{role === 'teacher' ? 'Teacher Sign Up' : role === 'admin' ? 'Admin Sign Up' : 'Student Sign Up'}</h3>
      
      <form className='addUserForm' onSubmit={handleSubmit}>
        <div className='inputGroup'>
          <label htmlFor='first_name'>First Name:</label>
          <input 
            type='text' 
            id='first_name' 
            name='first_name' 
            value={formData.first_name}
            onChange={handleChange} 
            placeholder='Enter your first name'
            className={errors.first_name ? 'error' : ''}
          />
          {errors.first_name && <span className="error-message">{errors.first_name}</span>}

          <label htmlFor='last_name'>Last Name:</label>
          <input 
            type='text' 
            id='last_name' 
            name='last_name' 
            value={formData.last_name}
            onChange={handleChange} 
            placeholder='Enter your last name'
            className={errors.last_name ? 'error' : ''}
          />
          {errors.last_name && <span className="error-message">{errors.last_name}</span>}

          <label htmlFor='email'>Email:</label>
          <input 
            type='email' 
            id='email' 
            name='email' 
            value={formData.email}
            onChange={handleChange} 
            placeholder='Enter your email'
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}

          <label htmlFor='password'>Password:</label>
          <input 
            type='password' 
            id='password' 
            name='password' 
            value={formData.password}
            onChange={handleChange} 
            placeholder='Enter your password (min 6 characters)'
            className={errors.password ? 'error' : ''}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}

          <label htmlFor='confirmPassword'>Confirm Password:</label>
          <input 
            type='password' 
            id='confirmPassword' 
            name='confirmPassword' 
            value={formData.confirmPassword}
            onChange={handleChange} 
            placeholder='Confirm your password'
            className={errors.confirmPassword ? 'error' : ''}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}

          <button 
            type="submit" 
            className="btn btn-success"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </div>
      </form>

      <div className='login'>
        <p>Already have an account? </p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    </div>
  );
};

export default SignUp;