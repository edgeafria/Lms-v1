import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import AuthModal from "./components/Auth/AuthModal";
import ServerAwake from "./components/ServerAwake";

// 🚀 EAGER LOAD (Instant Start)
// These pages come packaged with the main bundle so they open INSTANTLY.
import HomePage from "./pages/HomePage";
import AuthPage from "./components/Auth/AuthPage";
import RegisterPage from "./components/Auth/RegisterPage";
import CoursesPage from "./pages/CoursesPage"; // Public pages should be fast

// 🐢 LAZY LOAD (Download Later)
// These download only when the user logs in or clicks them.
const CourseDetailPage = React.lazy(() => import("./pages/CourseDetailPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const InstructorPage = React.lazy(() => import("./pages/InstructorPage"));
const CoursePlayerPage = React.lazy(() => import("./pages/CoursePlayerPage"));
const MyCoursesPage = React.lazy(() => import("./pages/MyCoursesPage"));
const ProfileSettingsPage = React.lazy(() => import("./pages/ProfileSettingsPage"));
const CourseBuilderPage = React.lazy(() => import("./pages/CourseBuilderPage"));
const QuizPlayerPage = React.lazy(() => import("./pages/QuizPlayerPage"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");

  const handleAuthModalOpen = (isOpen: boolean) => {
    setIsAuthModalOpen(isOpen);
  };

  return (
    <ServerAwake>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white font-body">
            <Navigation
              onLoginClick={handleAuthModalOpen}
              onAuthMode={setAuthMode}
            />

            <main>
              {/* Suspense handles the loading for the Lazy pages */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ✅ Fast Routes (No Spinner) */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  
                  {/* 💤 Slow/Heavy Routes (Shows Spinner on first click) */}
                  <Route path="/course/:courseId" element={<CourseDetailPage />} />
                  <Route path="/instructors" element={<InstructorPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/learn/course/:courseId" element={<CoursePlayerPage />} />
                  <Route path="/my-courses" element={<MyCoursesPage />} />
                  <Route path="/profile-settings" element={<ProfileSettingsPage />} />
                  <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
                  <Route path="/instructor/course/new" element={<CourseBuilderPage />} />
                  <Route path="/instructor/course/edit/:courseId" element={<CourseBuilderPage />} />
                </Routes>
              </Suspense>
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
    </ServerAwake>
  );
}

export default App;