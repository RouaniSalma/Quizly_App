import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        email: email,  // Changé de username à email
        password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Full response:', response);
      
      const token = response.data.access;
      localStorage.setItem('token', token);
      
      // Utilisez le rôle depuis la réponse API directement
      const role = response.data.user.role;
      console.log('User role:', role);
  
      // Redirection basée sur le rôle
if (role === 'teacher') {
  try {
    // Appel API pour vérifier les modules du teacher
    const modulesResponse = await axios.get('http://localhost:8000/api/teacher/modules/check/', {
      headers: {
        'Authorization': `Bearer ${token}`,  // Utilise le token pour authentifier la requête
      }
    });

    const hasModules = modulesResponse.data.has_modules; // On suppose que ton API retourne { has_modules: true/false }

    if (hasModules) {
      navigate('/teacher/modules'); // Interface liste des modules
    } else {
      navigate('/teacher-create-module'); // Interface de création de module
    }

  } catch (modulesError) {
    console.error('Error checking modules:', modulesError);
    alert('Error checking modules. Please try again.');
  }

} else if (role === 'admin') {
  navigate('/admin-dashboard');
} else if (role === 'student') {
  navigate('/student-dashboard');
} else {
  console.error('Unknown role:', role);
  navigate('/default-dashboard');
}

      
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-to-home">← Back to home</Link>
        <div className="login-header">
          <h2>Welcome back to <span className="quizly-logo">Quizly</span></h2>
          <p>Sign in to access your quizzes and learning materials</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" required />
          </div>
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" className="login-button">Sign In</button>
        </form>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
