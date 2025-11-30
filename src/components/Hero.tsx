import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, BookOpen, Award } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-secondary-500 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-accent-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-tech-500 rounded-full opacity-30 animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <div className="inline-flex items-center px-4 py-2 bg-secondary-500/20 rounded-full text-secondary-400 text-sm font-body font-medium mb-6 animate-fade-in">
              <Award className="h-4 w-4 mr-2" />
              #1 Learning Platform in Africa
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-headline font-bold mb-6 leading-tight">
              Empowering
              <span className="block text-secondary-500">African Minds</span>
              <span className="block text-accent-500 text-4xl lg:text-5xl">for Tomorrow</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-200 mb-8 font-body leading-relaxed max-w-2xl">
              Join thousands of learners across Africa in mastering skills that matter. 
              Learn from expert instructors, build real projects, and advance your career.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mb-10">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary-500" />
                <span className="font-body font-semibold">50K+ Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-accent-500" />
                <span className="font-body font-semibold">1000+ Courses</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-secondary-500 fill-current" />
                <span className="font-body font-semibold">4.9 Rating</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
             <Link 
                to="/register"
                className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-body font-semibold transition-all duration-300 transform hover:scale-105 animate-pulse-glow inline-block text-center"
              >
                Start Learning Today
            </Link>
              {/* <button className="flex items-center justify-center space-x-2 border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg text-lg font-body font-semibold transition-all duration-300">
                <Play className="h-5 w-5" />
                <span>Watch Demo</span>
              </button> */}
            </div>
          </div>

          {/* Right Content - Hero Image/Video */}
          <div className="relative">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              {/* Video Player Mockup */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                  {/* <div className="bg-secondary-500 hover:bg-secondary-600 rounded-full p-4 transform group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div> */}
                </div>
                <img 
                  src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg" 
                  alt="African students learning"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-tech-500 text-white px-4 py-2 rounded-lg font-body font-semibold shadow-lg animate-fade-in">
                🎓 New Course Alert!
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white text-primary-500 px-4 py-2 rounded-lg font-body font-semibold shadow-lg flex items-center space-x-2 animate-fade-in">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 bg-secondary-500 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-tech-500 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-accent-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm">1.2K instructors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-12 fill-current text-gray-50" viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C240,48 480,48 720,24 C960,0 1200,0 1440,24 L1440,48 L0,48 Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;