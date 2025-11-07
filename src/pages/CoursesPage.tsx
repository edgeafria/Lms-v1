import React, { useState, useEffect } from "react";
import axios from 'axios'; // Import axios
import {
  Grid2x2 as Grid,
  List,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
// Assuming CourseCard is in ../components/CourseCard.tsx relative to this file in src/pages/
import CourseCard from "../components/CourseCard";
import { useNavigate, Link } from "react-router-dom"; // Added Link

// Define Backend Course interface matching data from API
interface BackendInstructor {
    _id?: string;
    name: string;
    avatar?: { url?: string } | string;
}

interface BackendCourse {
    _id: string; // This is the correct ID from MongoDB
    title: string;
    description: string;
    instructor: BackendInstructor;
    thumbnail?: { url?: string };
    price: number;
    originalPrice?: number;
    duration?: string;
    studentsCount?: number; // Optional based on backend providing this
    rating?: { average?: number; count?: number };
    reviewsCount?: number; // Optional, might be calculated or use rating.count
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'; // Match backend enum
    category: string;
    tags?: string[];
    isFeatured?: boolean; // Optional
    isNew?: boolean; // Optional
    slug?: string;
    currency?: string;
    enrollmentCount?: number; // Added based on your Course model
    // Add any other fields coming from your backend API
}

// API Response Interface
interface CoursesApiResponse {
  success: boolean;
  data: BackendCourse[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Define the props expected by your actual CourseCard component
// Based on the code you provided for CourseCard.tsx
interface CourseCardPropsCourse {
  id: string; // CourseCard expects 'id', which we map from '_id'
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string; // Expects a string URL
  };
  thumbnail: string; // Expects a string URL
  price: number;
  originalPrice?: number;
  duration: string; // Expects duration string
  studentsCount: number; // Expects studentsCount
  rating: number; // Expects a single rating number
  reviewsCount: number; // Expects reviewsCount
  level: 'Beginner' | 'Intermediate' | 'Advanced'; // Matches subset
  category: string;
  tags: string[]; // Expects tags array
  isFeatured?: boolean;
  isNew?: boolean;
  currency?: string; // Added currency
}


const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseLayout, setCourseLayout] = useState<"grid" | "list">("grid");
  const [courses, setCourses] = useState<BackendCourse[]>([]); // State for fetched courses
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CoursesApiResponse['pagination'] | null>(null);
  const API_BASE_URL = 'http://localhost:5000/api'; // Backend URL

  // Define limit constant
  const COURSES_PER_PAGE = 12;

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<CoursesApiResponse>(`${API_BASE_URL}/courses`, {
           params: {
                // status: 'published', // Fetch only published
                limit: COURSES_PER_PAGE
                // page: currentPage // Add page state later for pagination
            }
        });

        if (response.data.success) {
          setCourses(response.data.data);
          setPagination(response.data.pagination || null);
        } else {
          setError('Failed to fetch courses. API reported an issue.');
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        if (axios.isAxiosError(err)) {
          setError(`Network Error: ${err.message}. Please ensure the backend server at ${API_BASE_URL} is running.`);
        } else {
          setError('An unexpected error occurred while fetching courses.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []); // Run once on mount

  // Handlers using BackendCourse type's _id for navigation
  const handleCourseClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}`); // Use MongoDB _id here
  };

  const handleEnrollClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}?enroll=true`); // Use MongoDB _id here
  };

  // Helper to get thumbnail URL safely
  const getThumbnailUrl = (course: BackendCourse): string => {
     return course.thumbnail?.url || `https://placehold.co/600x400/006747/FFF?text=${encodeURIComponent(course.title)}`;
  };

  // Helper to get avatar URL safely
  const getAvatarUrl = (instructor: BackendInstructor): string | undefined => {
     if (typeof instructor.avatar === 'string' && instructor.avatar && instructor.avatar !== 'no-photo.jpg') return instructor.avatar;
     if (typeof instructor.avatar === 'object' && instructor.avatar?.url && instructor.avatar.url !== 'no-photo.jpg') return instructor.avatar.url;
     // Fallback if no valid avatar found
     return `https://placehold.co/40x40/0A66EA/FFF?text=${instructor.name.charAt(0).toUpperCase()}`;
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64" aria-live="polite">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className="ml-4 text-gray-600 text-lg font-body">Loading courses...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded max-w-3xl mx-auto text-center shadow-md font-body" role="alert">
          <p className="font-bold">Unable to Load Courses</p>
          <p>{error}</p>
        </div>
      );
    }

    if (courses.length === 0) {
       return (
           <div className="col-span-full text-center py-16 px-6 bg-white rounded-lg shadow font-body">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" opacity="0.6"/>
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.5 15.5L19 19M9 13h6M9 9h6m-6-4h.01" opacity="0.4"/>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Courses Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    There are currently no published courses available. Please try again later!
                </p>
            </div>
       );
    }

    // Map over fetched courses and adapt data for CourseCard
    return (
      <div
        className={
          courseLayout === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
        }
      >
        {courses.map((course) => {
           // Create the props object expected by CourseCard
           const cardProps: CourseCardPropsCourse = {
               id: course._id, // Map _id to id for CourseCard
               title: course.title,
               description: course.description,
               instructor: {
                   name: course.instructor.name,
                   avatar: getAvatarUrl(course.instructor),
               },
               thumbnail: getThumbnailUrl(course),
               price: course.price,
               originalPrice: course.originalPrice,
               duration: course.duration || 'N/A', // Provide default if missing
               studentsCount: course.enrollmentCount || course.studentsCount || 0, // Prioritize enrollmentCount if available
               rating: course.rating?.average || 0,
               reviewsCount: course.rating?.count || course.reviewsCount || 0, // Prioritize rating.count
               // Ensure level matches the expected enum subset
               level: ['Beginner', 'Intermediate', 'Advanced'].includes(course.level) ? course.level as 'Beginner' | 'Intermediate' | 'Advanced' : 'Beginner',
               category: course.category,
               tags: course.tags || [],
               isFeatured: course.isFeatured,
               isNew: course.isNew,
               currency: course.currency // Pass currency
           };
           return (
              <CourseCard
                key={course._id} // Use the unique MongoDB _id as the key
                course={cardProps} // Pass the adapted props
                layout={courseLayout}
                // Pass handlers that use the original backend course object
                onCourseClick={() => handleCourseClick(course)}
                onEnrollClick={() => handleEnrollClick(course)}
              />
           );
        })}
      </div>
    );
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

        {/* Filters and Controls - Keep existing UI */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text" placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-body"
                  // TODO: Implement search
                />
              </div>
            </div>
            {/* Filters and View Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-body">
                  <Filter className="h-4 w-4" /> <span>All Categories</span> <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {/* Level Filter */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-body">
                  <span>All Levels</span> <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {/* Layout Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => setCourseLayout("grid")} aria-label="Grid view" className={`p-2 rounded ${ courseLayout === "grid" ? "bg-white shadow" : "text-gray-500 hover:bg-gray-200" }`}> <Grid className="h-4 w-4" /> </button>
                <button onClick={() => setCourseLayout("list")} aria-label="List view" className={`p-2 rounded ${ courseLayout === "list" ? "bg-white shadow" : "text-gray-500 hover:bg-gray-200" }`}> <List className="h-4 w-4" /> </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
         {!isLoading && !error && (
            <div className="mb-6">
              <p className="text-gray-600 font-body">
                Showing {pagination ? `${(pagination.currentPage - 1) * COURSES_PER_PAGE + 1}-${Math.min(pagination.currentPage * COURSES_PER_PAGE, pagination.totalCourses)} of ${pagination.totalCourses}` : courses.length} courses
              </p>
            </div>
         )}

        {/* Render Course Grid/List or Loading/Error */}
        {renderContent()}

        {/* Load More / Pagination */}
         {!isLoading && !error && courses.length > 0 && pagination && pagination.totalPages > 1 && (
            <div className="text-center mt-12">
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors disabled:opacity-50"
                 disabled={!pagination.hasNext}
                 // onClick={loadMoreCourses} // TODO: Implement
              >
                Load More Courses
              </button>
            </div>
         )}
      </div>
    </section>
  );
};

export default CoursesPage;