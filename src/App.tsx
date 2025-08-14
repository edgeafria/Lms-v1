import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import CourseCard from './components/CourseCard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import InstructorDashboard from './components/Dashboard/InstructorDashboard';
import AuthModal from './components/Auth/AuthModal';
import Footer from './components/Footer';
import { Grid, List, Filter, Search, ChevronDown, Star } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'courses' | 'dashboard' | 'admin' | 'instructor'>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [courseLayout, setCourseLayout] = useState<'grid' | 'list'>('grid');

  // Mock courses data
  const courses = [
    {
      id: '1',
      title: 'Full-Stack Web Development with React & Node.js',
      description: 'Master modern web development with React, Node.js, MongoDB, and deploy scalable applications.',
      instructor: { name: 'Sarah Johnson', avatar: '' },
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
      price: 89000,
      originalPrice: 120000,
      duration: '12 weeks',
      studentsCount: 2340,
      rating: 4.9,
      reviewsCount: 1205,
      level: 'Intermediate' as const,
      category: 'Web Development',
      tags: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
      isFeatured: true,
      isNew: false,
    },
    {
      id: '2',
      title: 'Digital Marketing Mastery for African Businesses',
      description: 'Learn digital marketing strategies tailored for the African market and grow your business online.',
      instructor: { name: 'Michael Okafor', avatar: '' },
      thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
      price: 65000,
      duration: '8 weeks',
      studentsCount: 1890,
      rating: 4.8,
      reviewsCount: 945,
      level: 'Beginner' as const,
      category: 'Marketing',
      tags: ['SEO', 'Social Media', 'Google Ads', 'Analytics'],
      isFeatured: false,
      isNew: true,
    },
    {
      id: '3',
      title: 'Data Science & Machine Learning with Python',
      description: 'Dive deep into data science, learn Python, pandas, sklearn, and build ML models for real-world problems.',
      instructor: { name: 'Dr. Amina Hassan', avatar: '' },
      thumbnail: 'https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg',
      price: 95000,
      originalPrice: 130000,
      duration: '16 weeks',
      studentsCount: 1567,
      rating: 4.9,
      reviewsCount: 823,
      level: 'Advanced' as const,
      category: 'Data Science',
      tags: ['Python', 'Machine Learning', 'Pandas', 'TensorFlow'],
      isFeatured: true,
      isNew: false,
    },
    {
      id: '4',
      title: 'Mobile App Development with Flutter',
      description: 'Build cross-platform mobile applications for iOS and Android using Google\'s Flutter framework.',
      instructor: { name: 'James Okoye', avatar: '' },
      thumbnail: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
      price: 78000,
      duration: '10 weeks',
      studentsCount: 1234,
      rating: 4.7,
      reviewsCount: 567,
      level: 'Intermediate' as const,
      category: 'Mobile Development',
      tags: ['Flutter', 'Dart', 'iOS', 'Android'],
      isFeatured: false,
      isNew: true,
    },
  ];

  const renderHome = () => (
    <>
      <Hero />
      
      {/* Featured Courses Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline font-bold text-primary-500 mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600 font-body max-w-3xl mx-auto">
              Discover our most popular and highly-rated courses designed to accelerate your career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} layout="grid" />
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => setCurrentView('courses')}
              className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors"
            >
              View All Courses
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">50K+</div>
              <p className="font-body">Students</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-accent-500 mb-2">1,000+</div>
              <p className="font-body">Courses</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-tech-500 mb-2">500+</div>
              <p className="font-body">Instructors</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">4.9</div>
              <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-secondary-500" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderCourses = () => (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary-500 mb-4">
            All Courses
          </h1>
          <p className="text-xl text-gray-600 font-body">
            Explore our comprehensive catalog of courses
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-body"
                />
              </div>
            </div>

            {/* Filters and View Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-body">
                  <Filter className="h-4 w-4" />
                  <span>All Categories</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Level Filter */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-body">
                  <span>All Levels</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCourseLayout('grid')}
                  className={`p-2 rounded ${
                    courseLayout === 'grid' ? 'bg-white shadow' : 'text-gray-500'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCourseLayout('list')}
                  className={`p-2 rounded ${
                    courseLayout === 'list' ? 'bg-white shadow' : 'text-gray-500'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600 font-body">
            Showing {courses.length} courses
          </p>
        </div>

        {/* Course Grid/List */}
        <div className={
          courseLayout === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-6'
        }>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} layout={courseLayout} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors">
            Load More Courses
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white font-body">
        <Navigation />
        
        {/* Navigation Buttons for Demo */}
        <div className="bg-tech-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap space-x-4 py-2">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded font-body font-medium transition-colors ${
                  currentView === 'home' ? 'bg-white text-tech-500' : 'text-tech-100 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView('courses')}
                className={`px-4 py-2 rounded font-body font-medium transition-colors ${
                  currentView === 'courses' ? 'bg-white text-tech-500' : 'text-tech-100 hover:text-white'
                }`}
              >
                Courses
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded font-body font-medium transition-colors ${
                  currentView === 'dashboard' ? 'bg-white text-tech-500' : 'text-tech-100 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setCurrentView('instructor')}
                className={`px-4 py-2 rounded font-body font-medium transition-colors ${
                  currentView === 'instructor' ? 'bg-white text-tech-500' : 'text-tech-100 hover:text-white'
                }`}
              >
                Instructor
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded font-body font-medium transition-colors ${
                  currentView === 'admin' ? 'bg-white text-tech-500' : 'text-tech-100 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded font-body font-medium text-tech-100 hover:text-white transition-colors"
              >
                Auth Modal
              </button>
            </div>
          </div>
        </div>

        <main>
          {currentView === 'home' && renderHome()}
          {currentView === 'courses' && renderCourses()}
          {currentView === 'dashboard' && <StudentDashboard />}
          {currentView === 'instructor' && <InstructorDashboard />}
          {currentView === 'admin' && <AdminDashboard />}
        </main>

        <Footer />

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    </AuthProvider>
  );
}

export default App;