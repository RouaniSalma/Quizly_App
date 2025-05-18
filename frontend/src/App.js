import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import TeacherOrStudent from './components/TeacherOrStudent';
import TeacherModuleDetail from './components/TeacherModuleDetail';
import TeacherModules from './components/TeacherModules';
import ModuleCreation from './components/ModuleCreation';
import TeacherQuizHistory from './components/TeacherQuizHistory';
import TeacherQuizDetail from './components/TeacherQuizDetail';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentCategories from './components/StudentCategories';
import CategoryCreation from './components/CategoryCreation';
import StudentCategoryDetail from './components/StudentCategoryDetail';
import VerifyEmailNotice from './components/VerifyEmailNotice';
import ResendVerification from './components/ResendVerification';
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
        <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/teacher/modules" element={<TeacherModules />} />
        
        <Route path="/teacher-create-module" element={<ModuleCreation />} />
       

        <Route path="/teacher/modules/:id" element={<TeacherModuleDetail />} />
        <Route path="/teacher/modules/:id/quizzes" element={<TeacherQuizHistory />} />
        <Route path="/teacher/modules/:id/quizzes/:quizId" element={<TeacherQuizDetail />} />
        
        
       <Route path="/student/categories" element={<StudentCategories />} />
        
       <Route path="/student-create-category" element={<CategoryCreation />} />
        <Route path="/student/categories/:id" element={<StudentCategoryDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
