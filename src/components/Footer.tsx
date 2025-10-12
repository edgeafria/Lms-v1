import React from "react";
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-500 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-secondary-500 p-2 rounded-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-headline font-bold text-white">
                  Edges Africa
                </h1>
                <p className="text-sm text-primary-200">C 2025</p>
              </div>
            </div>

            <p className="text-primary-200 font-body mb-6 leading-relaxed">
              EDGES Africa is a pan-African social enterprise helping people
              thrive in a climate-resilient, tech-enabled future.We make climate
              education simple, practical, and accessible — using mobile,
              WhatsApp, and local languages.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-secondary-500" />
                <span className="text-primary-200 font-body">
                  hello@edgesafrica.com
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-secondary-500" />
                <span className="text-primary-200 font-body">
                  +234 800 123 4567
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-secondary-500" />
                <span className="text-primary-200 font-body">
                  Lagos, Nigeria
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-headline font-bold text-white mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#courses"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Browse Courses
                </a>
              </li>
              <li>
                <a
                  href="#instructors"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Our Instructors
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#help"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-headline font-bold text-white mb-6">
              Popular Categories
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#web-development"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Web Development
                </a>
              </li>
              <li>
                <a
                  href="#mobile-development"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Mobile Development
                </a>
              </li>
              <li>
                <a
                  href="#data-science"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Data Science
                </a>
              </li>
              <li>
                <a
                  href="#digital-marketing"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Digital Marketing
                </a>
              </li>
              <li>
                <a
                  href="#business"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Business
                </a>
              </li>
              <li>
                <a
                  href="#design"
                  className="text-primary-200 hover:text-white font-body transition-colors"
                >
                  Design
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-headline font-bold text-white mb-6">
              Stay Updated
            </h3>
            <p className="text-primary-200 font-body mb-4">
              Get the latest courses, tips, and news delivered to your inbox.
            </p>

            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 border border-primary-400 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent font-body"
              />
              <button
                type="submit"
                className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-3 px-4 rounded-lg font-body font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>

            {/* Social Links */}
            <div className="mt-6">
              <p className="text-primary-200 font-body mb-3">Follow Us</p>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <Facebook className="h-5 w-5 text-primary-200 hover:text-white" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <Twitter className="h-5 w-5 text-primary-200 hover:text-white" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <Instagram className="h-5 w-5 text-primary-200 hover:text-white" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-primary-200 hover:text-white" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <Youtube className="h-5 w-5 text-primary-200 hover:text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-primary-200 font-body text-sm">
                © 2025 Edges Africa C. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#privacy"
                  className="text-primary-200 hover:text-white font-body text-sm transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="text-primary-200 hover:text-white font-body text-sm transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#cookies"
                  className="text-primary-200 hover:text-white font-body text-sm transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-primary-200 font-body text-sm">
                Made with ❤️ in Africa
              </span>
              <div className="flex items-center space-x-2">
                <img
                  src="https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg"
                  alt="African flag"
                  className="w-6 h-4 rounded-sm object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
