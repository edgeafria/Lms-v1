// [COMPLETE CODE FOR: frontend/src/App.tsx]

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ServerAwake from "./components/ServerAwake";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import AuthModal from "./components/Auth/AuthModal";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import DashboardPage from "./pages/DashboardPage";
import InstructorPage from "./pages/InstructorPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import CourseBuilderPage from "./pages/CourseBuilderPage"; 
import QuizPlayerPage from "./pages/QuizPlayerPage"; 

// --- NEW: Import Auth Pages ---
// (These paths are correct based on our last step)
import AuthPage from "./components/Auth/AuthPage"; 
import RegisterPage from "./components/Auth/RegisterPage";
// ------------------------------

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  
  // --- BUG FIX 1: Changed "signup" to "register" to match your modal ---
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");

  // --- BUG FIX 2: This function handles what onLoginClick(true) does ---
  const handleAuthModalOpen = (isOpen: boolean) => {
    setIsAuthModalOpen(isOpen);
  };

  return (
    <ServerAwake> 
      <AuthProvider>
          <Router>
            <div className="min-h-screen bg-white font-body">
              <Navigation
                // --- BUG FIX 3: Pass the EXACT props Navigation.tsx expects ---
                onLoginClick={handleAuthModalOpen} // This function expects a boolean
                onAuthMode={setAuthMode} // This function expects "login" or "register"
              />

              <main>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/course/:courseId" element={<CourseDetailPage />} />
                  
                  {/* --- NEW: Dedicated Auth Routes --- */}
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  {/* ---------------------------------- */}
                  
                  <Route path="/instructors" element={<InstructorPage />} /> 
                  
                  {/* Authenticated Routes */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/learn/course/:courseId" element={<CoursePlayerPage />} />
                  <Route path="/my-courses" element={<MyCoursesPage />} />
                  <Route path="/profile-settings" element={<ProfileSettingsPage />} />
                  
                  {/* --- NEW: Quiz Player Route --- */}
                  <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
                  {/* ----------------------------- */}
                  
                  {/* Instructor/Admin Routes */}
                  <Route path="/instructor/course/new" element={<CourseBuilderPage />} />
                  <Route path="/instructor/course/edit/:courseId" element={<CourseBuilderPage />} />
                </Routes>
              </main>

              <Footer />

              {/* This global modal is still here for your nav bar buttons */}
              <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
              />
            </div>
          </Router>
        </AuthProvider>
    </ServerAwake>
  );
}

export default App;