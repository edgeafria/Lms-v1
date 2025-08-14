import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Edit,
  Eye,
  MessageSquare,
  Star,
  Calendar,
  Clock,
  Award,
  FileText,
  Video,
  Upload
} from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const stats = {
    totalCourses: 8,
    totalStudents: 1240,
    totalEarnings: 45000,
    avgRating: 4.8
  };

  const courses = [
    {
      id: '1',
      title: 'Full-Stack Web Development with React & Node.js',
      students: 234,
      rating: 4.9,
      earnings: 18500,
      status: 'published',
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
      progress: 85,
      lastUpdated: '2024-12-20'
    },
    {
      id: '2',
      title: 'Advanced JavaScript Concepts',
      students: 189,
      rating: 4.7,
      earnings: 12300,
      status: 'published',
      thumbnail: 'https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg',
      progress: 92,
      lastUpdated: '2024-12-18'
    },
    {
      id: '3',
      title: 'React Native Mobile Development',
      students: 0,
      rating: 0,
      earnings: 0,
      status: 'draft',
      thumbnail: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
      progress: 45,
      lastUpdated: '2024-12-15'
    }
  ];

  const recentQuestions = [
    {
      id: '1',
      student: 'John Doe',
      course: 'Full-Stack Web Development',
      question: 'How do I handle authentication in React?',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: '2',
      student: 'Jane Smith',
      course: 'Advanced JavaScript',
      question: 'Can you explain closures with an example?',
      time: '5 hours ago',
      status: 'answered'
    },
    {
      id: '3',
      student: 'Mike Johnson',
      course: 'Full-Stack Web Development',
      question: 'What\'s the difference between SQL and NoSQL?',
      time: '1 day ago',
      status: 'pending'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">My Courses</p>
              <p className="text-3xl font-headline font-bold text-primary-500">{stats.totalCourses}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-headline font-bold text-tech-500">{stats.totalStudents.toLocaleString()}</p>
            </div>
            <div className="bg-tech-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-tech-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-headline font-bold text-green-600">{formatPrice(stats.totalEarnings)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Avg Rating</p>
              <p className="text-3xl font-headline font-bold text-secondary-500">{stats.avgRating}</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-headline font-bold mb-2">Ready to create your next course?</h2>
            <p className="text-primary-100 font-body">Share your knowledge and help students achieve their goals</p>
          </div>
          <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Course Performance</h3>
          <div className="space-y-4">
            {courses.filter(c => c.status === 'published').map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-12 h-8 object-cover rounded"
                  />
                  <div>
                    <p className="font-body font-semibold text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-600 font-body">{course.students} students</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="h-4 w-4 text-secondary-500 fill-current" />
                    <span className="font-body font-semibold">{course.rating}</span>
                  </div>
                  <p className="text-sm text-green-600 font-body font-semibold">{formatPrice(course.earnings)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Recent Q&A</h3>
          <div className="space-y-4">
            {recentQuestions.map((question) => (
              <div key={question.id} className="border-l-4 border-primary-500 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-body font-semibold text-gray-900 mb-1">{question.student}</p>
                    <p className="text-sm text-gray-600 font-body mb-2">{question.course}</p>
                    <p className="text-sm text-gray-800 font-body">{question.question}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-body font-semibold ${
                      question.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {question.status}
                    </span>
                    <p className="text-xs text-gray-500 font-body mt-1">{question.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600 font-body">Manage and track your course performance</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                  course.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-headline font-bold text-lg text-gray-900 mb-3 line-clamp-2">
                {course.title}
              </h3>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-body">Course Progress</span>
                  <span className="font-body font-semibold">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-headline font-bold text-tech-500">{course.students}</p>
                  <p className="text-sm text-gray-600 font-body">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4 text-secondary-500 fill-current" />
                    <p className="text-2xl font-headline font-bold text-secondary-500">{course.rating || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-gray-600 font-body">Rating</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="text-center mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-headline font-bold text-green-600">{formatPrice(course.earnings)}</p>
                <p className="text-sm text-gray-600 font-body">Total Earnings</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-body">Updated {course.lastUpdated}</p>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold text-gray-900">Analytics & Insights</h2>
        <p className="text-gray-600 font-body">Track your teaching performance and student engagement</p>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Revenue Overview</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-body">Revenue chart will be displayed here</p>
          </div>
        </div>
      </div>

      {/* Student Engagement */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Student Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-body text-gray-700">Course Completion Rate</span>
              <span className="font-body font-semibold text-green-600">78%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-gray-700">Average Watch Time</span>
              <span className="font-body font-semibold text-tech-500">24 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-gray-700">Quiz Pass Rate</span>
              <span className="font-body font-semibold text-secondary-500">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-gray-700">Student Satisfaction</span>
              <span className="font-body font-semibold text-primary-500">4.8/5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Top Performing Courses</h3>
          <div className="space-y-4">
            {courses.filter(c => c.status === 'published').map((course, index) => (
              <div key={course.id} className="flex items-center space-x-4">
                <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600 font-body">{course.students} students</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-secondary-500 fill-current" />
                    <span className="font-body font-semibold">{course.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQA = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold text-gray-900">Student Q&A</h2>
        <p className="text-gray-600 font-body">Answer student questions and provide support</p>
      </div>

      {/* Q&A List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>All Courses</option>
                <option>Full-Stack Web Development</option>
                <option>Advanced JavaScript</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>All Status</option>
                <option>Pending</option>
                <option>Answered</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-body">3 pending questions</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentQuestions.map((question) => (
            <div key={question.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-body font-semibold">
                    {question.student.charAt(0)}
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-900">{question.student}</p>
                    <p className="text-sm text-gray-600 font-body">{question.course} • {question.time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                  question.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {question.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-body text-gray-800">{question.question}</p>
              </div>

              {question.status === 'pending' && (
                <div className="flex items-center space-x-3">
                  <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium">
                    Answer Question
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 font-body font-medium">
                    Mark as Read
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-headline font-bold text-primary-500">
              Instructor Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary-500">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'courses', label: 'My Courses', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'qa', label: 'Q&A', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-body font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'qa' && renderQA()}
      </div>
    </div>
  );
};

export default InstructorDashboard;