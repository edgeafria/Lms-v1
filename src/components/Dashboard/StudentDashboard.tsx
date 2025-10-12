import React, { useState } from "react";
import {
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  Play,
  Award,
  Calendar,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Star,
  Users,
} from "lucide-react";

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const stats = {
    enrolledCourses: 8,
    completedCourses: 3,
    certificatesEarned: 3,
    studyHours: 42,
  };

  const recentCourses = [
    {
      id: 1,
      title: "Full-Stack Web Development",
      instructor: "Jane Doe",
      progress: 75,
      thumbnail:
        "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg",
      nextLesson: "React Hooks Deep Dive",
      duration: "45 min",
    },
    {
      id: 2,
      title: "Digital Marketing Mastery",
      instructor: "John Smith",
      progress: 45,
      thumbnail:
        "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg",
      nextLesson: "SEO Optimization",
      duration: "30 min",
    },
    {
      id: 3,
      title: "Data Science with Python",
      instructor: "Dr. Sarah Johnson",
      progress: 20,
      thumbnail:
        "https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg",
      nextLesson: "Pandas Fundamentals",
      duration: "60 min",
    },
  ];

  const upcomingDeadlines = [
    {
      course: "Full-Stack Web Development",
      assignment: "Final Project",
      dueDate: "2025-01-15",
      priority: "high",
    },
    {
      course: "Digital Marketing Mastery",
      assignment: "Case Study Analysis",
      dueDate: "2025-01-18",
      priority: "medium",
    },
    {
      course: "Data Science with Python",
      assignment: "Quiz 3",
      dueDate: "2025-01-20",
      priority: "low",
    },
  ];

  const achievements = [
    {
      title: "Quick Learner",
      description: "Completed 5 lessons in one day",
      icon: "🚀",
      earned: true,
    },
    {
      title: "Perfect Score",
      description: "Scored 100% in a quiz",
      icon: "🎯",
      earned: true,
    },
    {
      title: "Consistent Student",
      description: "7-day learning streak",
      icon: "🔥",
      earned: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-headline font-bold text-primary-500">
              Student Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-headline font-bold mb-2">
              Welcome back, John! 👋
            </h2>
            <p className="text-primary-100 font-body text-lg mb-6">
              You're making great progress. Keep learning and growing!
            </p>
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-body font-semibold transition-colors">
              Continue Learning
            </button>
          </div>

          {/* Background decoration */}
          <div className="absolute top-4 right-8 opacity-20">
            <Trophy className="h-24 w-24" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-gray-600 mb-1">
                  Enrolled Courses
                </p>
                <p className="text-3xl font-headline font-bold text-primary-500">
                  {stats.enrolledCourses}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-gray-600 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-headline font-bold text-green-600">
                  {stats.completedCourses}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-gray-600 mb-1">
                  Certificates
                </p>
                <p className="text-3xl font-headline font-bold text-secondary-500">
                  {stats.certificatesEarned}
                </p>
              </div>
              <div className="bg-secondary-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-secondary-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-gray-600 mb-1">
                  Study Hours
                </p>
                <p className="text-3xl font-headline font-bold text-tech-500">
                  {stats.studyHours}
                </p>
              </div>
              <div className="bg-tech-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-tech-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-headline font-bold text-gray-900">
                  Continue Learning
                </h3>
                <button className="text-primary-500 hover:text-primary-600 font-body font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-14 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h4 className="font-body font-semibold text-gray-900 mb-1">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600 font-body mb-2">
                        by {course.instructor}
                      </p>

                      {/* Progress Bar */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-secondary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-body text-gray-600">
                          {course.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-body text-gray-600 mb-1">
                        Next:
                      </p>
                      <p className="text-sm font-body font-semibold text-gray-900 mb-1">
                        {course.nextLesson}
                      </p>
                      <p className="text-xs text-gray-500 font-body">
                        {course.duration}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        // Navigate to course details or lesson player
                        console.log("Continue learning:", course.title);
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Recent Activity
              </h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-900">
                      Completed "React Fundamentals" course
                    </p>
                    <p className="text-sm text-gray-600 font-body">
                      2 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-tech-100 p-2 rounded-full">
                    <Star className="h-4 w-4 text-tech-500" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-900">
                      Earned 95% on JavaScript Quiz
                    </p>
                    <p className="text-sm text-gray-600 font-body">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-100 p-2 rounded-full">
                    <BookOpen className="h-4 w-4 text-secondary-500" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-900">
                      Started "Digital Marketing Mastery"
                    </p>
                    <p className="text-sm text-gray-600 font-body">
                      3 days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Upcoming Deadlines
              </h3>

              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        deadline.priority === "high"
                          ? "bg-red-500"
                          : deadline.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-body font-semibold text-gray-900 text-sm">
                        {deadline.assignment}
                      </p>
                      <p className="text-xs text-gray-600 font-body">
                        {deadline.course}
                      </p>
                      <p className="text-xs text-gray-500 font-body">
                        {deadline.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Achievements
              </h3>

              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      achievement.earned
                        ? "bg-secondary-50 border border-secondary-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <p
                        className={`font-body font-semibold text-sm ${
                          achievement.earned
                            ? "text-secondary-700"
                            : "text-gray-600"
                        }`}
                      >
                        {achievement.title}
                      </p>
                      <p className="text-xs text-gray-600 font-body">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && (
                      <div className="bg-secondary-500 text-white p-1 rounded-full">
                        <Trophy className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Study Streak */}
            <div className="bg-gradient-to-br from-accent-500 to-secondary-500 rounded-xl p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-2xl font-headline font-bold mb-1">
                  7 Day Streak!
                </p>
                <p className="text-accent-100 font-body">
                  Keep it up! You're on fire!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
