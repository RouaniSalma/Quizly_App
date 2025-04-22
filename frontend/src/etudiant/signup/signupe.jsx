import React, { useState, useEffect } from 'react';
import './signupe.css';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const SignupE = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    field: '',
    email: '',
    password: ''
  });

  // Liste des filières disponibles
  const fieldsOfStudy = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Business Administration",
    "Information Technology",
    "Other"
  ];

  useEffect(() => {
    const selectElement = document.getElementById('field');
    if (selectElement) {
      // Applique le style initial
      selectElement.style.color = formData.field === "" ? 'rgba(0, 0, 0, 0.5)' : '#000';
      
      // Gère le changement de style lors de la sélection
      const handleSelectChange = () => {
        selectElement.style.color = selectElement.value === "" ? 'rgba(0, 0, 0, 0.5)' : '#000';
      };
      
      selectElement.addEventListener('change', handleSelectChange);
      
      // Nettoyage de l'event listener
      return () => {
        selectElement.removeEventListener('change', handleSelectChange);
      };
    }
  }, [formData.field]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Traitement du formulaire ici
    console.log(formData);
  };

  return (
    <div className="addUser">
      <button onClick={() => navigate('/')} className="back-arrow">
        <FaArrowLeft />
      </button>

      <h3>Student Sign Up</h3>
      <form className='addUserForm' onSubmit={handleSubmit}>
        <div className='inputGroup'>
          <label htmlFor='firstName'>First Name:</label>
          <input 
            type='text'
            id='firstName'
            name='firstName'
            value={formData.firstName}
            onChange={handleChange}
            autoComplete='off'
            placeholder='Enter your first name'
            required
          />
          
          <label htmlFor='secondName'>Second Name:</label>
          <input 
            type='text'
            id='secondName'
            name='secondName'
            value={formData.secondName}
            onChange={handleChange}
            autoComplete='off'
            placeholder='Enter your second name'
            required
          />
          
          <label htmlFor='field'>Field of Study:</label>
          <select
            id='field'
            name='field'
            value={formData.field}
            onChange={handleChange}
            className='form-select'
            required
          >
            <option value="">-- Select your field --</option>
            {fieldsOfStudy.map((field, index) => (
              <option key={index} value={field}>{field}</option>
            ))}
          </select>
          
          <label htmlFor='email'>Email:</label>
          <input 
            type='email'
            id='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            autoComplete='off'
            placeholder='Enter your Email'
            required
          />
          
          <label htmlFor='password'>Password:</label>
          <input 
            type='password'
            id='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            autoComplete='off'
            placeholder='Enter Password'
            required
            minLength="6"
          />
          
          <button type="submit" className="btn btn-success">Sign Up</button>
        </div>
      </form>
      
      <div className='login'>
        <p>Already have an account? </p>
        <Link to="/logine" className="btn btn-primary">Login</Link>
      </div>
    </div>
  );
};

export default SignupE;