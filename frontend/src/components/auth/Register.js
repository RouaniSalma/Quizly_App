// frontend/src/components/auth/Register.js
import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
    role: "student",
    niveau: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        formData
      );
      console.log("Inscription réussie !", response.data);
    } catch (error) {
      console.error("Erreur lors de l’inscription", error.response.data);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        placeholder="Nom d'utilisateur"
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password1"
        placeholder="Mot de passe"
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password2"
        placeholder="Confirmer le mot de passe"
        onChange={handleChange}
        required
      />
      <select name="role" onChange={handleChange}>
        <option value="student">Étudiant</option>
        <option value="teacher">Professeur</option>
        <option value="admin">Admin</option>
      </select>
      {formData.role === "student" && (
        <input
          type="text"
          name="niveau"
          placeholder="Niveau (ex: Licence 1)"
          onChange={handleChange}
        />
      )}
      <button type="submit">S'inscrire</button>
    </form>
  );
};

export default Register;
