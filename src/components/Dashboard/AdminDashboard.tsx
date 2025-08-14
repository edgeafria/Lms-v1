import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Settings,
  FileText,
  Clock,
  Star,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  studentsCount: number;
  rating: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  assessments: number;
  certificates: number;
}

interface Assessment {
  id: string;
  courseId: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project';
  questions: number;
  timeLimit: number;
  attempts: number;
  passingScore: number;
  status: 'active' | 'draft';
}

interface Certificate {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
  status: 'issued' | 'revoked';
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Mock data
  const stats = {
    totalCourses: 45,
    totalStudents: 2340,
    totalInstructors: 28,
    totalRevenue: 125000
  };

  const courses: Course[] = [
    {
      id: '1',
      title: 'Full-Stack Web Development with React & Node.js',
      description: 'Master modern web development with React, Node.js, MongoDB, and deploy scalable applications.',
      instructor: 'Sarah Johnson',
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
      price: 89000,
      studentsCount: 234,
      rating: 4.9,
      status: 'published',
      createdAt: '2024-12-15',
      category: 'Web Development',
      level: 'Intermediate',
      assessments: 5,
      certificates: 180
    },
    {
      id: '2',
      title: 'Digital Marketing Mastery for African Businesses',
      description: 'Learn digital marketing strategies tailored for the African market.',
      instructor: 'Michael Okafor',
      thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
      price: 65000,
      studentsCount: 189,
      rating: 4.8,
      status: 'published',
      createdAt: '2024-12-10',
      category: 'Marketing',
      level: 'Beginner',
      assessments: 3,
      certificates: 145
    },
    {
      id: '3',
      title: 'Data Science & Machine Learning with Python',
      description: 'Dive deep into data science, learn Python, pandas, sklearn, and build ML models.',
      instructor: 'Dr. Amina Hassan',
      thumbnail: 'https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg',
      price: 95000,
      studentsCount: 156,
      rating: 4.9,
      status: 'draft',
      createdAt: '2024-12-08',
      category: 'Data Science',
      level: 'Advanced',
      assessments: 7,
      certificates: 98
    }
  ];

  const assessments: Assessment[] = [
    {
      id: '1',
      courseId: '1',
      title: 'React Fundamentals Quiz',
      type: 'quiz',
      questions: 20,
      timeLimit: 30,
      attempts: 3,
      passingScore: 70,
      status: 'active'
    },
    {
      id: '2',
      courseId: '1',
      title: 'Final Project: E-commerce App',
      type: 'project',
      questions: 1,
      timeLimit: 0,
      attempts: 1,
      passingScore: 80,
      status: 'active'
    }
  ];

  const certificates: Certificate[] = [
    {
      id: '1',
      courseId: '1',
      studentId: 'std1',
      studentName: 'John Doe',
      courseName: 'Full-Stack Web Development',
      issueDate: '2024-12-20',
      certificateId: 'CERT-2024-001',
      status: 'issued'
    },
    {
      id: '2',
      courseId: '2',
      studentId: 'std2',
      studentName: 'Jane Smith',
      courseName: 'Digital Marketing Mastery',
      issueDate: '2024-12-18',
      certificateId: 'CERT-2024-002',
      status: 'issued'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const CourseModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-headline font-bold text-gray-900">
                {selectedCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button
                onClick={() => {
                  setShowCourseModal(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter course title"
                    defaultValue={selectedCourse?.title}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Web Development</option>
                    <option>Mobile Development</option>
                    <option>Data Science</option>
                    <option>Digital Marketing</option>
                    <option>Business</option>
                    <option>Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Price (NGN)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    defaultValue={selectedCourse?.price}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Instructor
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Sarah Johnson</option>
                    <option>Michael Okafor</option>
                    <option>Dr. Amina Hassan</option>
                    <option>James Okoye</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter course description"
                  defaultValue={selectedCourse?.description}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                  Course Thumbnail
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="text-gray-400 mb-2">
                    <FileText className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 font-body">Drop image here or click to upload</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setSelectedCourse(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium"
                >
                  {selectedCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const AssessmentModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-headline font-bold text-gray-900">
                {selectedAssessment ? 'Edit Assessment' : 'Create New Assessment'}
              </h3>
              <button
                onClick={() => {
                  setShowAssessmentModal(false);
                  setSelectedAssessment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter assessment title"
                    defaultValue={selectedAssessment?.title}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Quiz</option>
                    <option>Assignment</option>
                    <option>Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    defaultValue={selectedAssessment?.questions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0 (No limit)"
                    defaultValue={selectedAssessment?.timeLimit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1"
                    defaultValue={selectedAssessment?.attempts}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="70"
                    defaultValue={selectedAssessment?.passingScore}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Draft</option>
                    <option>Active</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssessmentModal(false);
                    setSelectedAssessment(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium"
                >
                  {selectedAssessment ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Courses</p>
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
              <p className="text-sm font-body text-gray-600 mb-1">Instructors</p>
              <p className="text-3xl font-headline font-bold text-secondary-500">{stats.totalInstructors}</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-headline font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Recent Enrollments</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="bg-primary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-body font-semibold">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-gray-900">Student Name {index + 1}</p>
                  <p className="text-sm text-gray-600 font-body">Enrolled in Web Development Course</p>
                </div>
                <span className="text-sm text-gray-500 font-body">2h ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Course Performance</h3>
          <div className="space-y-4">
            {courses.slice(0, 4).map((course) => (
              <div key={course.id} className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600 font-body">{course.studentsCount} students</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-secondary-500 fill-current" />
                  <span className="font-body font-semibold">{course.rating}</span>
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
          <h2 className="text-2xl font-headline font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600 font-body">Create, edit, and manage all courses</p>
        </div>
        <button
          onClick={() => setShowCourseModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>All Status</option>
              <option>Published</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>All Categories</option>
              <option>Web Development</option>
              <option>Mobile Development</option>
              <option>Data Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Course</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Instructor</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Students</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Price</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-body font-semibold text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-600 font-body">{course.category} • {course.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{course.instructor}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{course.studentsCount}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body font-semibold text-gray-900">{formatPrice(course.price)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      course.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowCourseModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssessments = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">Assessment Management</h2>
          <p className="text-gray-600 font-body">Create and manage quizzes, assignments, and projects</p>
        </div>
        <button
          onClick={() => setShowAssessmentModal(true)}
          className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Assessment</span>
        </button>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((assessment) => {
          const course = courses.find(c => c.id === assessment.courseId);
          return (
            <div key={assessment.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-lg text-gray-900 mb-2">{assessment.title}</h3>
                  <p className="text-sm text-gray-600 font-body mb-2">{course?.title}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-body font-semibold ${
                    assessment.type === 'quiz' 
                      ? 'bg-tech-100 text-tech-800'
                      : assessment.type === 'assignment'
                      ? 'bg-secondary-100 text-secondary-800'
                      : 'bg-primary-100 text-primary-800'
                  }`}>
                    {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                  </span>
                </div>
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-body">Questions:</span>
                  <span className="font-body font-semibold">{assessment.questions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-body">Time Limit:</span>
                  <span className="font-body font-semibold">
                    {assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-body">Passing Score:</span>
                  <span className="font-body font-semibold">{assessment.passingScore}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className={`px-2 py-1 rounded-full text-xs font-body font-semibold ${
                  assessment.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setShowAssessmentModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">Certificate Management</h2>
          <p className="text-gray-600 font-body">Issue, manage, and track student certificates</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-accent-500 hover:bg-accent-600 text-primary-500 px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Certificate Builder</span>
          </button>
          <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Certificate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Issued</p>
              <p className="text-3xl font-headline font-bold text-secondary-500">423</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-headline font-bold text-tech-500">45</p>
            </div>
            <div className="bg-tech-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-tech-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-headline font-bold text-yellow-500">12</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Revoked</p>
              <p className="text-3xl font-headline font-bold text-red-500">3</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Certificate ID</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Student</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Course</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Issue Date</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-body font-semibold text-primary-500">{certificate.certificateId}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold">
                        {certificate.studentName.charAt(0)}
                      </div>
                      <p className="font-body text-gray-900">{certificate.studentName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{certificate.courseName}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{certificate.issueDate}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      certificate.status === 'issued' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary-500">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  5
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
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'assessments', label: 'Assessments', icon: FileText },
              { id: 'certificates', label: 'Certificates', icon: Award },
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
        {activeTab === 'assessments' && renderAssessments()}
        {activeTab === 'certificates' && renderCertificates()}
      </div>

      {/* Modals */}
      {showCourseModal && <CourseModal />}
      {showAssessmentModal && <AssessmentModal />}
    </div>
  );
};

export default AdminDashboard;