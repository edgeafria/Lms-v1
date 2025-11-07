import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // --- IMPORT LINK ---
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronDown, // For custom dropdown
  GraduationCap, // For custom dropdown
  Briefcase, // For custom dropdown
} from "lucide-react";
// Ensure correct path to your AuthContext
import { useAuth } from "../../contexts/AuthContext";
// --- Import Google Login ---
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
// -------------------------

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "instructor",
    agreeToTerms: false, // Default to false
  });
  const [error, setError] = useState("");

  // --- NEW: State for custom role dropdown ---
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  // ----------------------------------------

  // Get loginWithGoogle from context
  const { login, register, loginWithGoogle, isAuthenticating } = useAuth();

  // Reset form and error when mode changes or modal opens/closes
  useEffect(() => {
      // When the modal opens or the initialMode prop changes,
      // sync the internal mode state.
      if (isOpen) {
        setMode(initialMode);
      }
      
      // Always clear errors and form data when modal opens/closes
      // or when the initialMode changes
      setError(""); 
      setShowPassword(false);
      setIsRoleOpen(false); // Close custom dropdown
      setFormData({
          name: "", email: "", password: "", confirmPassword: "",
          role: "student", agreeToTerms: false
      });
  }, [isOpen, initialMode]); // --- FIX: Cleaned up dependencies ---

  // --- NEW: Effect to handle clicks outside the custom dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // -------------------------------------------------------------

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    // Special handling for checkbox
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // --- NEW: Handler for custom dropdown selection ---
  const handleRoleSelect = (role: "student" | "instructor") => {
    setFormData((prev) => ({ ...prev, role }));
    setIsRoleOpen(false);
  };
  // ------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        if (!formData.email || !formData.password) {
          throw new Error("Email and Password are required.");
        }
        await login(formData.email, formData.password);
        onClose(); // Close modal on successful login
      } else {
        // Register logic
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            throw new Error("All fields except Role are required for registration.");
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!formData.agreeToTerms) {
          // This error is now correctly reachable
          throw new Error("Please agree to the terms and conditions");
        }
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        // Feedback after registration
        setError("Account created successfully. Please log in.");
        setMode("login"); // Switch to login mode
        // Do not close modal automatically
      }
    } catch (err) {
      // Catch errors (validation, API errors thrown by context)
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

   // --- Google Handlers ---
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(""); // Clear previous errors
    if (credentialResponse.credential) {
        try {
            await loginWithGoogle(credentialResponse.credential); // Call context function
            onClose(); // Close modal on success
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google login failed.");
        }
    } else { setError("Google login failed: No credential received."); }
  };
  const handleGoogleError = () => {
    console.error("Google Login Failed");
    setError("Google login failed. Please try again or use email/password.");
  };
  // ---------------------


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div
          // --- FIX: Added 'animate-slide-up' back in ---
          className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-headline font-bold text-gray-900">
                {mode === "login" ? "Welcome Back" : "Join Edges Africa"}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"> <X className="h-6 w-6" /> </button>
            </div>
            <p className="text-gray-600 font-body mt-1">
              {mode === "login" ? "Sign in to continue your learning journey" : "Create your account and start learning today"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {/* Error/Success Message Area */}
            {error && (
              <div className={`mb-4 p-3 border rounded-lg ${
                error.startsWith("Account created successfully") // Updated check
                  ? 'bg-green-100 border-green-300 text-green-700' 
                  : 'bg-red-100 border-red-300 text-red-700'
              }`}>
                <p className="text-sm font-body">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              
              {mode === "register" && (
                <div> {/* Name */}
                  <label htmlFor="name" className="block text-sm font-body font-medium text-gray-700 mb-1"> Full Name </label>
                  <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body" placeholder="Enter your full name" />
                  </div>
                </div>
              )}
              
              {/* --- FIX: Replaced <select> with custom dropdown --- */}
              {mode === "register" && (
                <div className="relative" ref={roleDropdownRef}>
                  <label htmlFor="role" className="block text-sm font-body font-medium text-gray-700 mb-1"> I want to </label>
                  <button
                    type="button"
                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                    className="block w-full px-3 py-3 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body flex justify-between items-center"
                    aria-haspopup="true"
                    aria-expanded={isRoleOpen}
                  >
                    <span className="flex items-center">
                      {formData.role === 'student' ? (
                        <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      {formData.role === 'student' ? 'Learn (Student)' : 'Teach (Instructor)'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isRoleOpen && (
                    <div className="absolute mt-1 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10" role="menu" aria-orientation="vertical">
                      <div className="py-1" role="none">
                        <button
                          type="button"
                          onClick={() => handleRoleSelect('student')}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                          Learn (Student)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleSelect('instructor')}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                          Teach (Instructor)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* ----------------------------------------------------------- */}

              <div> {/* Email */}
                <label htmlFor="email" className="block text-sm font-body font-medium text-gray-700 mb-1"> Email Address </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body" placeholder="Enter your email" />
                </div>
              </div>
              <div> {/* Password */}
                <label htmlFor="password" className="block text-sm font-body font-medium text-gray-700 mb-1"> Password </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange} className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* --- FIX: Moved Confirm Password to follow Password --- */}
              {mode === "register" && (
                <div> {/* Confirm Password */}
                  <label htmlFor="confirmPassword" className="block text-sm font-body font-medium text-gray-700 mb-1"> Confirm Password </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body" placeholder="Confirm your password" />
                  </div>
                </div>
              )}
              {/* --------------------------------------------------- */}

              {/* --- FIX: Moved "Remember me" to be after Password --- */}
              {mode === "login" && (
                <div className="flex items-center justify-between"> {/* Remember/Forgot */}
                  <div className="flex items-center">
                    <input id="remember" name="remember" type="checkbox" className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded" />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 font-body"> Remember me </label>
                  </div>
                  <a href="#" className="text-sm font-body text-primary-500 hover:text-primary-600"> Forgot password? </a>
                </div>
              )}
              {/* --------------------------------------------------- */}
            </div>
            
            {/* --- FIX: Moved "Terms" to be before Submit button --- */}
            {mode === "register" && (
              <div className="flex items-start mt-4"> {/* Terms */}
                <div className="flex items-center h-5"> <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleInputChange} className="focus:ring-primary-500 h-4 w-4 text-primary-500 border-gray-300 rounded" /> </div>
                <div className="ml-3 text-sm"> <label htmlFor="agreeToTerms" className="font-body text-gray-700"> I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Privacy Policy</a> </label> </div>
              </div>
            )}
            {/* ------------------------------------------------- */}

            {/* Submit Button */}
            <button type="submit" disabled={isAuthenticating} className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:opacity-75 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-body font-semibold transition-colors flex justify-center items-center">
              {isAuthenticating ? (<> {/* Spinner SVG */} Processing...</>) : mode === "login" ? "Sign In" : "Create Account"}
            </button>
            
            {/* --- Link (This was already correct) --- */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-body">
                {mode === "login" 
                  ? "Don't have an account? "
                  : "Already have an account? "
                }
                <Link 
                  to={mode === "login" ? "/register" : "/login"} 
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </Link>
              </p>
            </div>
            {/* ------------------------------------- */}
          </form>

          {/* Social Login */}
          <div className="px-6 mb-6">
              <div className="relative my-6"> {/* Separator */}
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 font-body"> Or continue with </span></div>
              </div>

              {/* --- Google Login Button --- */}
              <div className="flex justify-center mb-3">
                 {isAuthenticating ? (
                     <div className="text-center text-gray-500 p-2 font-body">Processing...</div> // Show loading indicator
                 ) : (
                     <GoogleLogin
                        onSuccess={handleGoogleSuccess} // Connect success handler
                        onError={handleGoogleError}     // Connect error handler
                        useOneTap={false}               // Use the button flow
                        // Optional styling: Check documentation for latest props
                        // theme="outline"
                        // size="large"
                        // width="300px" // Example width
                     />
                 )}
              </div>
              {/* ------------------------- */}

              {/* Placeholder for other social buttons */}
              {/* <div className="grid grid-cols gap-3">
                <button className="flex items-center justify-center ..."> <Facebook className="..." /> Facebook </button>
              </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

