import React, { useState } from 'react';
import { 
  Play, 
  FileText, 
  Download, 
  Clock, 
  Users, 
  Star, 
  Award,
  CheckCircle,
  Lock,
  BookOpen,
  Video,
  HelpCircle,
  Calendar,
  User,
  Globe,
  Share2
} from 'lucide-react';

interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz' | 'assignment' | 'text';
  duration?: string;
  isCompleted: boolean;
  isLocked: boolean;
  url?: string;
  description?: string;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  resources: CourseResource[];
  isCompleted: boolean;
}

interface CourseDetailsProps {
  courseId: string;
  onEnroll?: () => void;
  isEnrolled?: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ courseId, onEnroll, isEnrolled = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedResource, setSelectedResource] = useState<CourseResource | null>(null);

  // Mock course data
  const course = {
    id: courseId,
    title: 'Full-Stack Web Development with React & Node.js',
    description: 'Master modern web development with React, Node.js, MongoDB, and deploy scalable applications. This comprehensive course covers everything from frontend development with React to backend APIs with Node.js.',
    instructor: {
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
      bio: 'Senior Full-Stack Developer with 8+ years of experience',
      rating: 4.9,
      students: 15000,
      courses: 12
    },
    thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
    price: 89000,
    originalPrice: 120000,
    duration: '12 weeks',
    studentsCount: 2340,
    rating: 4.9,
    reviewsCount: 1205,
    level: 'Intermediate',
    category: 'Web Development',
    tags: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
    requirements: [
      'Basic knowledge of HTML, CSS, and JavaScript',
      'Understanding of programming fundamentals',
      'Computer with internet connection'
    ],
    learningOutcomes: [
      'Build full-stack web applications with React and Node.js',
      'Create RESTful APIs and integrate with databases',
      'Deploy applications to cloud platforms',
      'Implement authentication and authorization',
      'Master modern development tools and workflows'
    ],
    language: 'English',
    lastUpdated: '2024-12-20',
    certificate: true
  };

  const modules: CourseModule[] = [
    {
      id: '1',
      title: 'Introduction to Web Development',
      description: 'Get started with the fundamentals of web development',
      isCompleted: isEnrolled,
      resources: [
        {
          id: '1-1',
          title: 'Welcome to the Course',
          type: 'video',
          duration: '5 min',
          isCompleted: isEnrolled,
          isLocked: false,
          description: 'Course introduction and what you\'ll learn'
        },
        {
          id: '1-2',
          title: 'Setting Up Your Development Environment',
          type: 'video',
          duration: '15 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Install and configure development tools'
        },
        {
          id: '1-3',
          title: 'Course Resources',
          type: 'pdf',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Downloadable course materials and references'
        }
      ]
    },
    {
      id: '2',
      title: 'React Fundamentals',
      description: 'Learn the core concepts of React development',
      isCompleted: false,
      resources: [
        {
          id: '2-1',
          title: 'Introduction to React',
          type: 'video',
          duration: '25 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Understanding React and its ecosystem'
        },
        {
          id: '2-2',
          title: 'Components and JSX',
          type: 'video',
          duration: '30 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Building your first React components'
        },
        {
          id: '2-3',
          title: 'React Fundamentals Quiz',
          type: 'quiz',
          duration: '10 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Test your understanding of React basics'
        }
      ]
    },
    {
      id: '3',
      title: 'Node.js Backend Development',
      description: 'Build powerful backend APIs with Node.js',
      isCompleted: false,
      resources: [
        {
          id: '3-1',
          title: 'Introduction to Node.js',
          type: 'video',
          duration: '20 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Understanding server-side JavaScript'
        },
        {
          id: '3-2',
          title: 'Building REST APIs',
          type: 'video',
          duration: '45 min',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Create RESTful web services'
        },
        {
          id: '3-3',
          title: 'API Development Assignment',
          type: 'assignment',
          duration: '2 hours',
          isCompleted: false,
          isLocked: !isEnrolled,
          description: 'Build your own REST API'
        }
      ]
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'quiz': return <HelpCircle className="h-5 w-5" />;
      case 'assignment': return <BookOpen className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleResourceClick = (resource: CourseResource) => {
    if (resource.isLocked) {
      return;
    }
    setSelectedResource(resource);
    // Here you would typically navigate to the lesson player or open the resource
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Course Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-4">About This Course</h3>
        <p className="text-gray-700 font-body leading-relaxed mb-6">{course.description}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-body font-semibold text-gray-900 mb-3">What You'll Learn</h4>
            <ul className="space-y-2">
              {course.learningOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-body">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-body font-semibold text-gray-900 mb-3">Requirements</h4>
            <ul className="space-y-2">
              {course.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 font-body">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Instructor Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-4">Your Instructor</h3>
        <div className="flex items-start space-x-4">
          <img
            src={course.instructor.avatar}
            alt={course.instructor.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h4 className="font-body font-bold text-lg text-gray-900">{course.instructor.name}</h4>
            <p className="text-gray-600 font-body mb-3">{course.instructor.bio}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-secondary-500 fill-current" />
                <span className="font-body">{course.instructor.rating} rating</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="font-body">{course.instructor.students.toLocaleString()} students</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span className="font-body">{course.instructor.courses} courses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurriculum = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Course Content</h3>
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm">
                      {moduleIndex + 1}
                    </div>
                    <div>
                      <h4 className="font-body font-bold text-gray-900">{module.title}</h4>
                      <p className="text-sm text-gray-600 font-body">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-body">
                      {module.resources.length} lessons
                    </span>
                    {module.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {module.resources.map((resource) => (
                  <div
                    key={resource.id}
                    onClick={() => handleResourceClick(resource)}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      resource.isLocked ? 'opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        resource.type === 'video' ? 'bg-red-100 text-red-600' :
                        resource.type === 'pdf' ? 'bg-blue-100 text-blue-600' :
                        resource.type === 'quiz' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div>
                        <h5 className="font-body font-semibold text-gray-900">{resource.title}</h5>
                        <p className="text-sm text-gray-600 font-body">{resource.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {resource.duration && (
                        <span className="text-sm text-gray-500 font-body">{resource.duration}</span>
                      )}
                      {resource.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : resource.isLocked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Play className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Student Reviews</h3>
        
        {/* Review Summary */}
        <div className="flex items-center space-x-8 mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">{course.rating}</div>
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current text-secondary-500" />
              ))}
            </div>
            <p className="text-sm text-gray-600 font-body">{course.reviewsCount} reviews</p>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-body text-gray-600 w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-secondary-500 h-2 rounded-full"
                    style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 7 : rating === 2 ? 2 : 1}%` }}
                  ></div>
                </div>
                <span className="text-sm font-body text-gray-600 w-8">
                  {rating === 5 ? '70%' : rating === 4 ? '20%' : rating === 3 ? '7%' : rating === 2 ? '2%' : '1%'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-6">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-body font-semibold">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-body font-semibold text-gray-900">Student Name {index + 1}</h5>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current text-secondary-500" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-body">2 weeks ago</span>
                  </div>
                  <p className="text-gray-700 font-body">
                    Excellent course! The instructor explains everything clearly and the projects are very practical. 
                    I learned so much and feel confident building full-stack applications now.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-body font-semibold">
                  {course.category}
                </span>
              </div>
              <h1 className="text-4xl font-headline font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-primary-100 font-body mb-6 leading-relaxed">
                {course.description.substring(0, 200)}...
              </p>
              
              <div className="flex items-center space-x-6 text-primary-100">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-current text-secondary-500" />
                  <span className="font-body font-semibold">{course.rating}</span>
                  <span className="font-body">({course.reviewsCount} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-5 w-5" />
                  <span className="font-body">{course.studentsCount.toLocaleString()} students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-5 w-5" />
                  <span className="font-body">{course.duration}</span>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <span className="text-3xl font-headline font-bold text-primary-500">
                      {formatPrice(course.price)}
                    </span>
                    {course.originalPrice && (
                      <span className="text-lg text-gray-500 line-through font-body">
                        {formatPrice(course.originalPrice)}
                      </span>
                    )}
                  </div>
                  {course.originalPrice && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-body font-semibold">
                      Save {Math.round((1 - course.price / course.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {isEnrolled ? (
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-body font-semibold mb-4">
                    Continue Learning
                  </button>
                ) : (
                  <button
                    onClick={onEnroll}
                    className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-3 px-6 rounded-lg font-body font-semibold mb-4"
                  >
                    Enroll Now
                  </button>
                )}

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-body">Level:</span>
                    <span className="font-body font-semibold">{course.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body">Duration:</span>
                    <span className="font-body font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body">Language:</span>
                    <span className="font-body font-semibold">{course.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body">Certificate:</span>
                    <span className="font-body font-semibold flex items-center space-x-1">
                      <Award className="h-4 w-4 text-secondary-500" />
                      <span>Yes</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body">Last Updated:</span>
                    <span className="font-body font-semibold">{course.lastUpdated}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium">
                    <Share2 className="h-4 w-4" />
                    <span>Share Course</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'curriculum', label: 'Curriculum' },
                  { id: 'reviews', label: 'Reviews' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-body font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:text-primary-500 hover:bg-primary-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'curriculum' && renderCurriculum()}
            {activeTab === 'reviews' && renderReviews()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Course Tags</h3>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-body">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;