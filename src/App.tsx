import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import AuthModal from "./components/Auth/AuthModal";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import DashboardPage from "./pages/DashboardPage";
import InstructorPage from "./pages/InstructorPage";
function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(true);
  const [authMode, setAuthMode] = React.useState<"login" | "signup">("login");

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white font-body">
          <Navigation
            onLoginClick={() => setIsAuthModalOpen(true)}
            onAuthMode={setAuthMode}
          />

          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:courseId" element={<CourseDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/instructors" element={<InstructorPage />} />
            </Routes>
          </main>

          <Footer />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authMode}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
