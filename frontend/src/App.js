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
import PasswordResetPage from './components/PasswordResetPage';
import StudentQuizHistory from './components/StudentQuizHistory';
import StudentQuizDetails from './components/StudentQuizDetails';
import StudentTakeQuiz from './components/StudentTakeQuiz';
import StudentQuizResults from './components/StudentQuizResults';
import SharedQuizDetail from './components/SharedQuizDetail';
import TeacherQuizResults from './components/TeacherQuizResults';
import AdminDashboard from "./components/AdminDashboard";
import AdminUsers from "./components/AdminUsers";
import AdminQuizzes from "./components/AdminQuizzes";
import AdminHistory from "./components/AdminHistory";
import AdminBackup from "./components/AdminBackup";
import AdminStats from "./components/AdminStats";
import AdminLogs from "./components/AdminLogs";
import ErrorBoundary from "./components/ErrorBoundary";
import StudentDashboard from './components/StudentDashboard';
import StudentDetailsQuiz from './components/StudentDetailsQuiz'
import ForgotPassword from './components/forgotPassword';
function App() {
  return (
    <ErrorBoundary>
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
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/teacher/modules" element={<TeacherModules />} />
        
        <Route path="/teacher-create-module" element={<ModuleCreation />} />
       

        <Route path="/teacher/modules/:id" element={<TeacherModuleDetail />} />
        <Route path="/teacher/modules/:id/quizzes" element={<TeacherQuizHistory />} />
        <Route path="/teacher/modules/:id/quizzes/:quizId" element={<TeacherQuizDetail />} />
        
        
       <Route path="/student/categories" element={<StudentCategories />} />
        
       <Route path="/student-create-category" element={<CategoryCreation />} />
        <Route path="/student/categories/:id" element={<StudentCategoryDetail />} />
        <Route path="/student/categories/:id/quizzes" element={<StudentQuizHistory />} />
<Route path="/student/categories/:id/quizzes/:quiz_id/details" element={<StudentQuizDetails />} />
<Route 
  path="/student/categories/:id/quiz/:quizId" 
  element={<StudentTakeQuiz />} 
/>
<Route 
  path="/student/categories/:id/quiz/:quizId" 
  element={<StudentTakeQuiz />} 
/>
<Route path="/student/categories/:id/quizzes/:quizId/results" element={<StudentQuizResults/>} />
<Route path="/student/shared-quiz/:quiz_id/details" element={<SharedQuizDetail />} />
<Route path="/teacher/quizzes/:quizId/results" element={<TeacherQuizResults />} />
<Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/quizzes" element={<AdminQuizzes />} />
            <Route path="/admin/history" element={<AdminHistory />} />
            <Route path="/admin/backup" element={<AdminBackup />} />
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
           
<Route path="/student/dashboard" element={<StudentDashboard />} />
   <Route path="/student/categories/:id/quizzes/:quiz_id" element={<StudentDetailsQuiz />} />
   <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
