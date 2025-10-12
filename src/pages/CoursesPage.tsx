import React, { useState } from "react";
import {
  Grid2x2 as Grid,
  List,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import CourseCard from "../components/CourseCard";
import { useNavigate } from "react-router-dom";

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseLayout, setCourseLayout] = useState<"grid" | "list">("grid");

  // Mock courses data
  const courses = [
    {
      id: "1",
      title: "Full-Stack Web Development with React & Node.js",
      description:
        "Master modern web development with React, Node.js, MongoDB, and deploy scalable applications.",
      instructor: { name: "Sarah Johnson", avatar: "" },
      thumbnail:
        "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg",
      price: 89000,
      originalPrice: 120000,
      duration: "12 weeks",
      studentsCount: 2340,
      rating: 4.9,
      reviewsCount: 1205,
      level: "Intermediate" as const,
      category: "Web Development",
      tags: ["React", "Node.js", "JavaScript", "MongoDB"],
      isFeatured: true,
      isNew: false,
    },
    {
      id: "2",
      title: "Digital Marketing Mastery for African Businesses",
      description:
        "Learn digital marketing strategies tailored for the African market and grow your business online.",
      instructor: { name: "Michael Okafor", avatar: "" },
      thumbnail:
        "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg",
      price: 65000,
      duration: "8 weeks",
      studentsCount: 1890,
      rating: 4.8,
      reviewsCount: 945,
      level: "Beginner" as const,
      category: "Marketing",
      tags: ["SEO", "Social Media", "Google Ads", "Analytics"],
      isFeatured: false,
      isNew: true,
    },
    {
      id: "3",
      title: "Data Science & Machine Learning with Python",
      description:
        "Dive deep into data science, learn Python, pandas, sklearn, and build ML models for real-world problems.",
      instructor: { name: "Dr. Amina Hassan", avatar: "" },
      thumbnail:
        "https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg",
      price: 95000,
      originalPrice: 130000,
      duration: "16 weeks",
      studentsCount: 1567,
      rating: 4.9,
      reviewsCount: 823,
      level: "Advanced" as const,
      category: "Data Science",
      tags: ["Python", "Machine Learning", "Pandas", "TensorFlow"],
      isFeatured: true,
      isNew: false,
    },
    {
      id: "4",
      title: "Mobile App Development with Flutter",
      description:
        "Build cross-platform mobile applications for iOS and Android using Google's Flutter framework.",
      instructor: { name: "James Okoye", avatar: "" },
      thumbnail:
        "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg",
      price: 78000,
      duration: "10 weeks",
      studentsCount: 1234,
      rating: 4.7,
      reviewsCount: 567,
      level: "Intermediate" as const,
      category: "Mobile Development",
      tags: ["Flutter", "Dart", "iOS", "Android"],
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

  return (
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
                  onClick={() => setCourseLayout("grid")}
                  className={`p-2 rounded ${
                    courseLayout === "grid"
                      ? "bg-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCourseLayout("list")}
                  className={`p-2 rounded ${
                    courseLayout === "list"
                      ? "bg-white shadow"
                      : "text-gray-500"
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
        <div
          className={
            courseLayout === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-6"
          }
        >
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              layout={courseLayout}
              onCourseClick={handleCourseClick}
              onEnrollClick={handleEnrollClick}
            />
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
};

export default CoursesPage;
