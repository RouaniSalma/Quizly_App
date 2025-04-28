import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import TeacherOrStudent from './components/TeacherOrStudent';
import TeacherModuleDetail from './components/TeacherModuleDetail';
import TeacherDashboard from './components/TeacherDashboard';


import TeacherModules from './components/TeacherModules';
import ModuleCreation from './components/ModuleCreation';

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

        <Route path="/teacher/modules" element={<TeacherModules />} />
        
        <Route path="/teacher-create-module" element={<ModuleCreation />} />
       

        <Route path="/teacher/modules/:id" element={<TeacherModuleDetail />} />
        {/*<Route path="/teacher/dashboard" element={<TeacherDashboard /> } />*/}
         {/* <Route path="/create-module" element={<ModuleForm />} />*/}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
