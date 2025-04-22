import React from 'react'
import './signup.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa'; // Import de l'icône flèche

const Signup = () => {
  return (
    <div className="addUser">
      {/* Ajout de la flèche de retour en haut à gauche */}
      <Link to="/" className="back-arrow">
        <FaArrowLeft />
      </Link>
      
      <h3>Sign Up</h3>
      <form className='addUserForm'>
            <div className='inputGroup'>
                <label htmlFor='FirstName'>First Name:</label>
                <input 
                type='text'
                id='FirstName'
                autoComplete='off'
                placeholder='Enter your first name'
                />
                <label htmlFor='SecondName'>Second Name:</label>
                <input 
                type='text'
                id='SecondName'
                autoComplete='off'
                placeholder='Enter your second name'
                />
                <label htmlFor='email'>Email:</label>
                <input 
                type='email'
                id='email'
                autoComplete='off'
                placeholder='Enter your Email'
                />
                <label htmlFor='password'>Password:</label>
                <input 
                type='password'
                id='password'
                autoComplete='off'
                placeholder='Enter Password'
                />
                <button type="submit" class="btn btn-success">Sign Up</button>
            </div>
        </form>
      <div className='login'>
        <p>Already have an account? </p>
        <Link to="/login" type="submit" className="btn btn-primary">Login</Link>
      </div>
    </div>
  )
}

export default Signup;