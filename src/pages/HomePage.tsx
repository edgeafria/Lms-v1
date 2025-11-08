import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios
import { Link, useNavigate } from "react-router-dom"; // Import Link
import Hero from "../components/Hero"; // Assuming path is correct
import CourseCard from "../components/CourseCard"; // Assuming path is correct
import { Star } from "lucide-react";

// --- Interface Definitions ---
// Matches the data structure from your backend API
interface BackendInstructor {
  _id?: string;
  name: string;
  avatar?: { url?: string } | string;
}
interface BackendCourse {
  _id: string;
  title: string;
  description: string;
  instructor: BackendInstructor;
  thumbnail?: { url?: string };
  price: number;
  originalPrice?: number;
  duration?: string;
  studentsCount?: number;
  rating?: { average?: number; count?: number };
  reviewsCount?: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  category: string;
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  slug?: string;
  currency?: string;
  enrollmentCount?: number;
}
// API Response Interface
interface CoursesApiResponse {
  success: boolean;
  data: BackendCourse[];
  pagination?: {
    /* ... */
  };
}
// Matches the props expected by your CourseCard.tsx component
interface CourseCardPropsCourse {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  thumbnail: string;
  price: number;
  originalPrice?: number;
  duration: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  currency?: string;
}
// --- End Interface Definitions ---

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // --- State for Fetched Data ---
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  // ------------------------------

  // --- Fetch Featured Courses on Mount ---
  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch published, featured courses, limit to 4
        const response = await axios.get<CoursesApiResponse>(
          `${API_BASE_URL}/courses`,
          {
            params: {
              status: "published",
              featured: true,
              limit: 4,
              sort: "popular", // Or 'rating', 'newest'
            },
          }
        );

        if (response.data.success) {
          setCourses(response.data.data);
        } else {
          setError("Failed to fetch featured courses.");
        }
      } catch (err) {
        console.error("Error fetching featured courses:", err);
        if (axios.isAxiosError(err)) {
          setError(`Network Error: ${err.message}.`);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []); // Run once
  // -------------------------------------

  // Handlers now use the BackendCourse type and its '_id'
  const handleCourseClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}`);
  };

  const handleEnrollClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}?enroll=true`);
  };

  // --- Helper Functions (copied from CoursesPage) ---
  const getThumbnailUrl = (course: BackendCourse): string => {
    return (
      course.thumbnail?.url ||
      `https://placehold.co/600x400/006747/FFF?text=${encodeURIComponent(
        course.title
      )}`
    );
  };
  const getAvatarUrl = (instructor: BackendInstructor): string | undefined => {
    if (
      typeof instructor.avatar === "string" &&
      instructor.avatar &&
      instructor.avatar !== "no-photo.jpg"
    )
      return instructor.avatar;
    if (
      typeof instructor.avatar === "object" &&
      instructor.avatar?.url &&
      instructor.avatar.url !== "no-photo.jpg"
    )
      return instructor.avatar.url;
    return `https://placehold.co/40x40/0A66EA/FFF?text=${instructor.name
      .charAt(0)
      .toUpperCase()}`;
  };
  // ------------------------------------------------

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  // --- Helper to render course list ---
  const renderFeaturedCourses = () => {
    if (isLoading) {
      return (
        <div className="text-center col-span-full">
          <p className="text-gray-600 font-body">Loading featured courses...</p>
          {/* Optional: Add skeleton loaders */}
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center col-span-full bg-red-100 text-red-700 p-4 rounded-lg">
          <p className="font-body font-semibold">Error loading courses:</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    if (courses.length === 0) {
      return (
        <div className="text-center col-span-full">
          <p className="text-gray-600 font-body">
            No featured courses are available at this time.
          </p>
        </div>
      );
    }

    // Map over fetched courses and adapt data for CourseCard
    return courses.map((course) => {
      const cardProps: CourseCardPropsCourse = {
        id: course._id, // Map _id to id
        title: course.title,
        description: course.description,
        instructor: {
          name: course.instructor.name,
          avatar: getAvatarUrl(course.instructor),
        },
        thumbnail: getThumbnailUrl(course),
        price: course.price,
        originalPrice: course.originalPrice,
        duration: course.duration || "N/A",
        studentsCount: course.enrollmentCount || course.studentsCount || 0,
        rating: course.rating?.average || 0,
        reviewsCount: course.rating?.count || course.reviewsCount || 0,
        level: ["Beginner", "Intermediate", "Advanced"].includes(course.level)
          ? (course.level as "Beginner" | "Intermediate" | "Advanced")
          : "Beginner",
        category: course.category,
        tags: course.tags || [],
        isFeatured: course.isFeatured,
        isNew: course.isNew,
        currency: course.currency,
      };
      return (
        <CourseCard
          key={course._id}
          course={cardProps}
          layout="grid"
          onCourseClick={() => handleCourseClick(course)}
          onEnrollClick={() => handleEnrollClick(course)}
        />
      );
    });
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
              Discover our most popular and highly-rated courses designed to
              accelerate your career
            </p>
          </div>

          {/* --- Updated Grid to handle loading/error/content --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {renderFeaturedCourses()}
          </div>
          {/* -------------------------------------------------- */}

          <div className="text-center">
            <button
              onClick={() => navigate("/courses")}
              className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors"
            >
              View All Courses
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section (Kept as mock data per plan) */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">
                50K+
              </div>
              <p className="font-body">Students</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-accent-500 mb-2">
                1,000+
              </div>
              <p className="font-body">Courses</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-tech-500 mb-2">
                500+
              </div>
              <p className="font-body">Instructors</p>
            </div>
            <div>
              <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">
                4.9
              </div>
              <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-current text-secondary-500"
                  />
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
