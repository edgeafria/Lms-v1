import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  BookOpen,
  ShoppingCart,
  Bell,
  Search,
  Globe,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface NavigationProps {
  onLoginClick: (isOpen: boolean) => void;
  onAuthMode: (mode: "login" | "register") => void;
}

const Navigation: React.FC<NavigationProps> = ({
  onLoginClick,
  onAuthMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-lg border-b-2 border-secondary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-500 p-2 rounded-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-headline font-bold text-primary-500">
                  Edges Africa
                </h1>
                <p className="text-xs text-gray-600 font-body">C 2025</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/courses"
              className={`font-body font-medium transition-colors ${
                location.pathname === "/courses"
                  ? "text-primary-500"
                  : "text-gray-700 hover:text-primary-500"
              }`}
            >
              Courses
            </Link>
            <Link
              to="/instructors"
              className={`font-body font-medium transition-colors ${
                location.pathname === "/instructors"
                  ? "text-primary-500"
                  : "text-gray-700 hover:text-primary-500"
              }`}
            >
              Instructors
            </Link>
            <a
              href="https://edgesafrica.org/about"
              className="text-gray-700 hover:text-primary-500 font-body font-medium transition-colors"
            >
              About
            </a>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Cart */}
                <button className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                </button>

                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="bg-primary-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-body font-medium">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="text-sm font-body font-medium text-gray-700">
                      {user?.name || "User"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                      >
                        Dashboard
                      </Link>
                      <a
                        href="#profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                      >
                        Profile Settings
                      </a>
                      <a
                        href="#my-courses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                      >
                        My Courses
                      </a>
                      <hr className="my-1" />
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-body"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Login */}
                <button
                  type="button"
                  className="text-primary-500 hover:text-primary-600 font-body font-medium transition-colors"
                  onClick={() => {
                    onAuthMode("login");
                    onLoginClick(true);
                  }}
                >
                  Login
                </button>

                {/* Register */}
                <button
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors font-body font-medium"
                  onClick={() => {
                    onLoginClick(true);
                    onAuthMode("register");
                  }}
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Language Toggle */}
            <button className="p-2 text-gray-600 hover:text-primary-500 transition-colors">
              <Globe className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-500 focus:outline-none focus:text-primary-500"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/courses"
                className={`block px-3 py-2 font-body font-medium ${
                  location.pathname === "/courses"
                    ? "text-primary-500"
                    : "text-gray-700 hover:text-primary-500"
                }`}
              >
                Courses
              </Link>
              <Link
                to="/instructors"
                className={`block px-3 py-2 font-body font-medium ${
                  location.pathname === "/instructors"
                    ? "text-primary-500"
                    : "text-gray-700 hover:text-primary-500"
                }`}
              >
                Instructors
              </Link>
              <a
                href="https://edgesafrica.org/about"
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-body font-medium"
              >
                About
              </a>

              {isAuthenticated ? (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-body font-medium"
                  >
                    Dashboard
                  </Link>
                  <a
                    href="#profile"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-body font-medium"
                  >
                    Profile
                  </a>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 font-body font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      onAuthMode("login");
                      onLoginClick(true);
                    }}
                    className="block w-full text-left px-3 py-2 text-primary-500 hover:text-primary-600 font-body font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onAuthMode("register");
                      onLoginClick(true);
                    }}
                    className="block w-full text-left px-3 py-2 bg-secondary-500 text-white rounded-lg font-body font-medium"
                  >
                    Get Started
                  </button>
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
