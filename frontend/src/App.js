import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import TeacherOrStudent from './components/TeacherOrStudent';

import TeacherDashboard from './components/TeacherDashboard';


import ModuleForm from './components/ModuleForm';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Route pour la sélection Teacher/Student */}
        <Route path="/signup" element={<TeacherOrStudent />} />

        {/* Formulaire d’inscription selon le rôle */}
        <Route path="/signup-form" element={<SignUp />} />

        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
         {/* <Route path="/create-module" element={<ModuleForm />} />*/}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
