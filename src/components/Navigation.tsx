import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // <-- 1. Import useNavigate
import {
  Menu,
  X,
  BookOpen,
  ShoppingCart,
  Bell,
  Search,
  Globe,
  User as UserIcon
} from "lucide-react";
// Ensure path to AuthContext is correct for your project structure
import { useAuth, User } from "../contexts/AuthContext";

interface NavigationProps {
  onLoginClick: (isOpen: boolean) => void;
  onAuthMode: (mode: "login" | "register") => void;
}

const Navigation: React.FC<NavigationProps> = ({
  onLoginClick,
  onAuthMode,
}) => {
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu
  const { user, isAuthenticated, logout, loading } = useAuth(); // Get auth state
  const location = useLocation();
  
  // --- 🐞 2. ADD STATE AND NAVIGATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  // --- END FIX ---

  const toggleMenu = () => setIsOpen(!isOpen);

  // Helper function for user initials (Unchanged)
  const getUserInitials = (name?: string | null): string => {
     if (!name) return 'U';
     const parts = name.trim().split(' ');
     if (parts.length > 1) {
         return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
     }
     return name.charAt(0).toUpperCase();
  };

   // Helper function to safely get avatar URL string (Unchanged)
   const getAvatarUrl = (avatar?: { url?: string } | string): string | undefined => {
       if (typeof avatar === 'string' && avatar && avatar !== 'no-photo.jpg') return avatar; 
       if (typeof avatar === 'object' && avatar?.url && avatar.url !== 'no-photo.jpg') return avatar.url; 
       return undefined; 
   };

  // --- 🐞 3. CREATE SEARCH HANDLER ---
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    if (searchQuery.trim()) {
      // Navigate to the courses page with the search query
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear the search bar
      setIsOpen(false); // Close the mobile menu if it's open
    }
  };
  // --- END FIX ---


  // Show loading indicator during initial auth check (Unchanged)
  if (loading) {
    return (
      <nav className="bg-white shadow-lg h-16 flex items-center justify-center sticky top-0 z-20">
        <div className="animate-pulse text-gray-400 font-body">Checking session...</div>
      </nav>
    );
  }

  // Render full navbar once loading is complete
  return (
    <nav className="bg-white shadow-lg border-b-2 border-secondary-500 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo Section (Unchanged) */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center" aria-label="Edges Africa Home">
              {/* 🖼️ JUST THE LOGO IMAGE */}
              {/* Since the text is inside the image, we don't need h1 tags next to it */}
              <img 
                src="/logo-color.png" 
                alt="Edges Africa" 
                // Increased height slightly to h-12 (48px) so it's legible since it's the only element
                className="h-12 w-auto object-contain" 
                width="160" 
                height="48"
                loading="eager" 
              />
            </Link>
          </div>

          {/* Desktop Navigation Links & Search (Unchanged) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/courses"
              className={`font-body font-medium transition-colors duration-200 ${
                location.pathname.startsWith("/courses") 
                  ? "text-primary-500 border-b-2 border-primary-500 pb-1"
                  : "text-gray-700 hover:text-primary-500"
              }`}
            >
              Courses
            </Link>
            <Link
              to="/instructors"
              className={`font-body font-medium transition-colors duration-200 ${
                location.pathname === "/instructors"
                  ? "text-primary-500 border-b-2 border-primary-500 pb-1"
                  : "text-gray-700 hover:text-primary-500"
              }`}
            >
              Instructors
            </Link>
            <a
              href="https://edgesafrica.org/about" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-primary-500 font-body font-medium transition-colors duration-200"
            >
              About
            </a>

            {/* --- 🐞 4. WIRE UP DESKTOP SEARCH --- */}
            <form className="relative" onSubmit={handleSearchSubmit}>
              <label htmlFor="desktop-search" className="sr-only">Search courses</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              <input
                id="desktop-search"
                type="text"
                placeholder="Search courses..."
                value={searchQuery} // <-- Bind value
                onChange={(e) => setSearchQuery(e.target.value)} // <-- Bind change
                className="pl-9 pr-4 py-2 w-56 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body text-sm"
              />
            </form>
            {/* --- END FIX --- */}
          </div>

          {/* Desktop User Actions (Unchanged) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Notifications Icon */}
                <button aria-label="Notifications" className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 bg-secondary-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">3</span>
                </button>

                {/* Cart Icon */}
                <button aria-label="Shopping Cart" className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                </button>

                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                    <span className="sr-only">Open user menu</span>
                     {getAvatarUrl(user.avatar) ? (
                         <img src={getAvatarUrl(user.avatar)} alt="User avatar" className="h-8 w-8 rounded-full object-cover border-2 border-white shadow" />
                     ) : (
                         <span className="bg-primary-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-body font-medium text-sm shadow">
                             {getUserInitials(user.name)}
                         </span>
                     )}
                     <span className="text-sm font-body font-medium text-gray-700 hidden lg:inline">{user.name}</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform scale-95 group-hover:scale-100 origin-top-right" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                    <div className="py-1" role="none">
                       <div className="px-4 py-3 border-b border-gray-200">
                           <p className="text-sm font-medium text-gray-900 truncate" role="none">{user.name}</p>
                           <p className="text-sm text-gray-500 truncate" role="none">{user.email}</p>
                       </div>
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body" role="menuitem"> Dashboard </Link>
                      <Link to="/profile-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body" role="menuitem"> Profile Settings </Link>
                      
                      {user.role === 'student' && (
                        <Link to="/my-courses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body" role="menuitem"> My Courses </Link>
                      )}

                      <hr className="my-1 border-gray-200" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-body" role="menuitem"> Logout </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Logged Out State: Login/Register Buttons (Unchanged)
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="text-primary-500 hover:text-primary-600 font-body font-medium transition-colors px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => { onAuthMode("login"); onLoginClick(true); }}
                >
                  Login
                </button>
                <button
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors font-body font-medium shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                  onClick={() => { onAuthMode("register"); onLoginClick(true); }}
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Language Toggle Button (Unchanged) */}
            <button aria-label="Select language" className="p-2 text-gray-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full">
              <Globe className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu Button (Unchanged) */}
          <div className="md:hidden flex items-center">
             <button aria-label="Open menu" onClick={toggleMenu} className="ml-4 p-2 text-gray-700 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-md">
                 {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
             </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-md absolute top-full left-0 right-0 z-10 animate-slide-up origin-top">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/courses" onClick={toggleMenu} className={`block px-3 py-2 rounded-md font-body font-medium ${ location.pathname.startsWith("/courses") ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-50 hover:text-primary-500" }`}> Courses </Link>
              <Link to="/instructors" onClick={toggleMenu} className={`block px-3 py-2 rounded-md font-body font-medium ${ location.pathname === "/instructors" ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-50 hover:text-primary-500" }`}> Instructors </Link>
              <a href="https://edgesafrica.org/about" target="_blank" rel="noopener noreferrer" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary-500 font-body font-medium"> About </a>

               {/* --- 🐞 5. WIRE UP MOBILE SEARCH --- */}
               <form className="relative px-3 pt-2 pb-3" onSubmit={handleSearchSubmit}>
                 <label htmlFor="mobile-search" className="sr-only">Search courses</label>
                 <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                 <input 
                   id="mobile-search" 
                   type="text" 
                   placeholder="Search..." 
                   value={searchQuery} // <-- Bind value
                   onChange={(e) => setSearchQuery(e.target.value)} // <-- Bind change
                   className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 font-body text-sm" 
                 />
               </form>
               {/* --- END FIX --- */}

              {isAuthenticated && user ? (
                <>
                  <hr className="my-2 border-gray-200" />
                  <div className="px-3 py-2 flex items-center space-x-3">
                       {getAvatarUrl(user.avatar) ? ( <img src={getAvatarUrl(user.avatar)} alt="User avatar" className="h-8 w-8 rounded-full object-cover border"/> ) : ( <span className="bg-primary-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-body font-medium text-sm"> {getUserInitials(user.name)} </span> )}
                       <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                       </div>
                  </div>
                  <Link to="/dashboard" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary-500 font-body font-medium"> Dashboard </Link>
                  <Link to="/profile-settings" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary-500 font-body font-medium"> Profile Settings </Link>
                  
                  {user.role === 'student' && (
                    <Link to="/my-courses" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary-500 font-body font-medium"> My Courses </Link>
                  )}

                  <button onClick={() => { logout(); toggleMenu(); }} className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 font-body font-medium"> Logout </button>
                </>
              ) : (
                <>
                  <hr className="my-2 border-gray-200" />
                  <button onClick={() => { onAuthMode("login"); onLoginClick(true); toggleMenu(); }} className="block w-full text-left px-3 py-2 rounded-md text-primary-500 hover:bg-gray-50 font-body font-medium"> Login </button>
                  <button onClick={() => { onAuthMode("register"); onLoginClick(true); toggleMenu(); }} className="mt-1 block w-full text-left px-3 py-2 rounded-md bg-secondary-500 text-white hover:bg-secondary-600 font-body font-medium"> Get Started </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;