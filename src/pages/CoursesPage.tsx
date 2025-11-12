import React, { useState, useEffect, useCallback, useRef } from "react"; // <-- 1. IMPORT useRef
import axios from 'axios'; 
import {
  Grid2x2 as Grid,
  List,
  Filter, 
  Search,
  ChevronDown, 
  Loader2,
  AlertTriangle,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import CourseCard from "../components/CourseCard";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

// --- Custom Hook for Debouncing (Unchanged) ---
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Interfaces (Unchanged) ---
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
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'; 
    category: string;
    tags?: string[];
    isFeatured?: boolean; 
    isNew?: boolean; 
    slug?: string;
    currency?: string;
    enrollmentCount?: number; 
}
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
  level: 'Beginner' | 'Intermediate' | 'Advanced'; 
  category: string;
  tags: string[]; 
  isFeatured?: boolean;
  isNew?: boolean;
  currency?: string; 
}
// ---

// --- Constants (Unchanged) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1'; // Use your proxy
const COURSES_PER_PAGE = 12;
const LEVELS_FILTER = [
  { id: "all", name: "All Levels" },
  { id: "Beginner", name: "Beginner" },
  { id: "Intermediate", name: "Intermediate" },
  { id: "Advanced", name: "Advanced" },
];

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [courseLayout, setCourseLayout] = useState<"grid" | "list">("grid");
  
  // --- State for Data (Unchanged) ---
  const [courses, setCourses] = useState<BackendCourse[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CoursesApiResponse['pagination'] | null>(null);

  // --- 🐞 2. REFACTOR FILTER STATE ---
  // We get the initial search from the URL
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [categories, setCategories] = useState<string[]>([]); 
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Ref to prevent initial fetch from filter effect
  const isInitialMount = useRef(true); 
  // --- END REFACTOR ---

  // --- Fetch Categories (Unchanged) ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<{ success: boolean, data: string[] }>(`${API_BASE_URL}/courses/categories`);
        if (response.data.success) {
          setCategories(["All", ...response.data.data]); 
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // --- Main Data Fetching Function (Unchanged) ---
  const fetchCourses = useCallback(async (page: number) => {
    if (page === 1) {
      setIsLoading(true); 
    } else {
      setIsLoadMore(true); 
    }
    setError(null);

    const params: any = {
      limit: COURSES_PER_PAGE,
      page: page,
      status: 'published',
    };
    // Use the debounced search and stateful filters
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "All") params.category = selectedCategory;
    if (selectedLevel && selectedLevel !== "all") params.level = selectedLevel;

    try {
      const response = await axios.get<CoursesApiResponse>(`${API_BASE_URL}/courses`, { params });

      if (response.data.success) {
        setCourses(prev => 
          page === 1 ? response.data.data : [...prev, ...response.data.data]
        );
        setPagination(response.data.pagination || null);
      } else {
        throw new Error('Failed to fetch courses. API reported an issue.');
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      if (axios.isAxiosError(err)) {
        setError(`Network Error: ${err.message}. Please ensure the proxy is configured and backend server is running.`);
      } else {
        setError('An unexpected error occurred while fetching courses.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  }, [debouncedSearch, selectedCategory, selectedLevel]); // This function rebuilds if filters change

  
  // --- 🐞 3. REFACTORED useEffect LOGIC ---
  
  // This effect runs ONCE on mount to load initial data
  // It uses the search query from the URL (if any)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || "";
    // We pass the URL search directly to fetchCourses
    // We pass 'true' to mark this as the initial load
    fetchCourses(1);
    
    // Set the ref to false after the first mount
    isInitialMount.current = false;
  }, [fetchCourses, searchParams]); // searchParams is stable, fetchCourses is memoized
  
  // This effect runs when filters CHANGE (but skips the first run)
  useEffect(() => {
    if (isInitialMount.current) {
      // Don't run on the first render, the effect above is handling that
      return;
    }
    
    // On any filter change, fetch page 1
    fetchCourses(1);
    
  }, [debouncedSearch, selectedCategory, selectedLevel, fetchCourses]);
  // --- END REFACTOR ---
  
  // --- Load More Handler (Unchanged) ---
  const handleLoadMore = () => {
    if (pagination && pagination.hasNext) {
      fetchCourses(pagination.currentPage + 1); 
    }
  };

  // Handlers (Unchanged)
  const handleCourseClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}`); 
  };
  const handleEnrollClick = (course: BackendCourse) => {
    navigate(`/course/${course._id}?enroll=true`); 
  };

  // Helpers (Unchanged)
  const getThumbnailUrl = (course: BackendCourse): string => {
     return course.thumbnail?.url || `https://placehold.co/600x400/006747/FFF?text=${encodeURIComponent(course.title)}`;
  };
  const getAvatarUrl = (instructor: BackendInstructor): string | undefined => {
     if (typeof instructor.avatar === 'string' && instructor.avatar && instructor.avatar !== 'no-photo.jpg') return instructor.avatar;
     if (typeof instructor.avatar === 'object' && instructor.avatar?.url && instructor.avatar.url !== 'no-photo.jpg') return instructor.avatar.url;
     return `https://placehold.co/40x40/0A66EA/FFF?text=${instructor.name.charAt(0).toUpperCase()}`;
  };

  // --- Render Logic (Unchanged) ---
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
                    Your search or filters returned no results. Try adjusting your terms.
                </p>
            </div>
       );
    }

    return (
      <div
        className={
          courseLayout === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
        }
      >
        {courses.map((course) => {
           const cardProps: CourseCardPropsCourse = {
               id: course._id, 
               title: course.title,
               description: course.description,
               instructor: {
                   name: course.instructor.name,
                   avatar: getAvatarUrl(course.instructor),
               },
               thumbnail: getThumbnailUrl(course),
               price: course.price,
               originalPrice: course.originalPrice,
               duration: course.duration || 'N/A', 
               studentsCount: course.enrollmentCount || course.studentsCount || 0, 
               rating: course.rating?.average || 0,
               reviewsCount: course.rating?.count || course.reviewsCount || 0, 
               level: ['Beginner', 'Intermediate', 'Advanced'].includes(course.level) ? course.level as 'Beginner' | 'Intermediate' | 'Advanced' : 'Beginner',
               category: course.category,
               tags: course.tags || [],
               isFeatured: course.isFeatured,
               isNew: course.isNew,
               currency: course.currency 
           };
           return (
              <CourseCard
                key={course._id} 
                course={cardProps} 
                layout={courseLayout}
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
        {/* Header (Unchanged) */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary-500 mb-4">
            All Courses
          </h1>
          <p className="text-xl text-gray-600 font-body">
            Explore our comprehensive catalog of courses
          </p>
        </div>

        {/* --- FILTERS (Unchanged) --- */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text" placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-body"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {/* Filters and View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
              
              {/* Category Filter */}
              <Listbox value={selectedCategory} onChange={setSelectedCategory}>
                <div className="relative w-full sm:w-48">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-body">
                    <span className="block truncate">{selectedCategory === "all" ? "All Categories" : selectedCategory}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                          }`
                        }
                        value={category === "All" ? "all" : category}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {category}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>

              {/* Level Filter */}
              <Listbox value={selectedLevel} onChange={setSelectedLevel}>
                <div className="relative w-full sm:w-48">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-body">
                    <span className="block truncate">{LEVELS_FILTER.find(l => l.id === selectedLevel)?.name}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {LEVELS_FILTER.map((level) => (
                      <Listbox.Option
                        key={level.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                          }`
                        }
                        value={level.id}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {level.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>

              {/* Layout Toggle (Unchanged) */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 self-center sm:self-auto">
                <button onClick={() => setCourseLayout("grid")} aria-label="Grid view" className={`p-2 rounded ${ courseLayout === "grid" ? "bg-white shadow" : "text-gray-500 hover:bg-gray-200" }`}> <Grid className="h-4 w-4" /> </button>
                <button onClick={() => setCourseLayout("list")} aria-label="List view" className={`p-2 rounded ${ courseLayout === "list" ? "bg-white shadow" : "text-gray-500 hover:bg-gray-200" }`}> <List className="h-4 w-4" /> </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info (Unchanged) */}
         {!isLoading && !error && (
            <div className="mb-6">
              <p className="text-gray-600 font-body">
                {courses.length > 0 && pagination ? 
                  `Showing ${courses.length} of ${pagination.totalCourses} courses` : 
                  `Showing ${courses.length} courses`
                }
              </p>
            </div>
         )}

        {/* Render Course Grid/List or Loading/Error (Unchanged) */}
        {renderContent()}

        {/* Load More / Pagination (Unchanged) */}
         {!isLoading && !error && courses.length > 0 && pagination && pagination.hasNext && (
            <div className="text-center mt-12">
              <button 
                 className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors disabled:opacity-50"
                 disabled={isLoadMore}
                 onClick={handleLoadMore}
              >
                {isLoadMore ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Load More Courses'
                )}
              </button>
            </div>
         )}
      </div>
    </section>
  );
};

export default CoursesPage;