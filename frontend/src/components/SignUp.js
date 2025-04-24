import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import './SignUp.css';

const SignUp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role || 'student';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: role,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.email, // Use full email as username
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      await axios.post('http://localhost:8000/api/auth/signup/', payload);
      navigate('/login');
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Registration failed. Please try again.");
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
          <input type='text' id='first_name' name='first_name' value={formData.first_name}
            onChange={handleChange} placeholder='Enter your first name' required />

          <label htmlFor='last_name'>Last Name:</label>
          <input type='text' id='last_name' name='last_name' value={formData.last_name}
            onChange={handleChange} placeholder='Enter your last name' required />

          <label htmlFor='email'>Email:</label>
          <input type='email' id='email' name='email' value={formData.email}
            onChange={handleChange} placeholder='Enter your email' required />

          <label htmlFor='password'>Password:</label>
          <input type='password' id='password' name='password' value={formData.password}
            onChange={handleChange} placeholder='Enter your password' required minLength="6" />

          <button type="submit" className="btn btn-success">Sign Up</button>
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