import React from 'react';
import Hero from '../components/Hero';
import CourseCard from '../components/CourseCard';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

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
      level: 'Beginner' as const,
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

  const handleCourseClick = (course: any) => {
    navigate(`/course/${course.id}`);
  };

  const handleEnrollClick = (course: any) => {
    navigate(`/course/${course.id}?enroll=true`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div>
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
              <CourseCard 
                key={course.id} 
                course={course} 
                layout="grid" 
                onCourseClick={handleCourseClick}
                onEnrollClick={handleEnrollClick}
              />
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => navigate('/courses')}
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
    </div>
  );
};

export default HomePage;