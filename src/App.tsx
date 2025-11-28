import React, { Suspense } from "react"; // 1. Import Suspense
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import AuthModal from "./components/Auth/AuthModal";
import ServerAwake from "./components/ServerAwake";

// 2. LAZY LOAD YOUR PAGES
// This breaks your huge index.js into many small files.
const HomePage = React.lazy(() => import("./pages/HomePage"));
const CoursesPage = React.lazy(() => import("./pages/CoursesPage"));
const CourseDetailPage = React.lazy(() => import("./pages/CourseDetailPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const InstructorPage = React.lazy(() => import("./pages/InstructorPage"));
const CoursePlayerPage = React.lazy(() => import("./pages/CoursePlayerPage"));
const MyCoursesPage = React.lazy(() => import("./pages/MyCoursesPage"));
const ProfileSettingsPage = React.lazy(() => import("./pages/ProfileSettingsPage"));
const CourseBuilderPage = React.lazy(() => import("./pages/CourseBuilderPage"));
const QuizPlayerPage = React.lazy(() => import("./pages/QuizPlayerPage"));
const AuthPage = React.lazy(() => import("./components/Auth/AuthPage"));
const RegisterPage = React.lazy(() => import("./components/Auth/RegisterPage"));

// 3. Create a Simple Loading Spinner for Page Switches
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
              {/* 4. Wrap Routes in Suspense */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/course/:courseId" element={<CourseDetailPage />} />
                  
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/instructors" element={<InstructorPage />} />
                  
                  {/* These heavy pages will ONLY download when visited */}
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