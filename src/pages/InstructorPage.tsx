import React, { useState, useEffect, useCallback } from "react"; // <-- 1. IMPORT useCallback
import {
  Grid2x2 as Grid,
  List,
  Search,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import InstructorsList from "../components/Instructor/InstructorsList";
import axios from 'axios';

// --- 2. ADD API_BASE_URL (like your working CoursesPage) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1';

// --- Interface Definitions (Unchanged) ---
interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  coursesCount?: number;
  studentsCount?: number;
  rating?: number;
  courses: any[];
}

interface PaginationData {
  total: number;
  page: number; // This is the current page
  totalPages: number;
  limit: number;
  hasNext: boolean;
}
// ---

// --- Filter Options (Unchanged) ---
const filterOptions = [
  { id: "all", name: "All" },
  { id: "featured", name: "Featured" },
  { id: "new", name: "New" },
];

const InstructorPage: React.FC = () => {
  // --- State (Unchanged) ---
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // --- 3. WRAP fetchInstructors in useCallback ---
  const fetchInstructors = useCallback(async (pageToFetch: number) => {
    if (pageToFetch === 1) {
      setIsLoading(true);
    } else {
      setIsLoadMore(true);
    }
    setError(null);
    console.log(`Attempting to fetch ${API_BASE_URL}/users/instructors?page=${pageToFetch}`);

    try {
      // --- 4. USE THE FULL API_BASE_URL ---
      const response = await axios.get<{
        success: boolean,
        data: Instructor[],
        pagination: PaginationData,
        message?: string
      }>(
        `${API_BASE_URL}/users/instructors`, // <-- This is the main fix
        {
          params: {
            page: pageToFetch,
            limit: 9
          }
        }
      );
      // --- END FIX ---

      if (response.data.success) {
        console.log("Successfully fetched data:", response.data.data);
        setInstructors(prev =>
          pageToFetch === 1 ? response.data.data : [...prev, ...response.data.data]
        );
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch instructors');
      }
    } catch (err: any) {
      console.error("--- 🐞 INSTRUCTOR PAGE FETCH ERROR ---", err);
      // --- 5. ADD BETTER ERROR MESSAGE (like CoursesPage) ---
      if (axios.isAxiosError(err)) {
          setError(`Network Error: ${err.message}. Please check API_BASE_URL and backend server.`);
      } else {
          setError(err.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  }, []); // <-- This function has no dependencies, so empty array is correct

  // --- 6. UPDATE useEffect to use fetchInstructors dependency ---
  useEffect(() => {
    // This now runs only once when the component mounts
    fetchInstructors(1);
  }, [fetchInstructors]); // <-- Runs when the memoized fetchInstructors is created

  // --- handleLoadMore (Unchanged) ---
  const handleLoadMore = () => {
    if (pagination && pagination.hasNext) {
      const nextPage = pagination.page + 1; // Use 'page' from pagination
      fetchInstructors(nextPage);
    }
  };

  // --- Filter Logic (Unchanged) ---
  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayedInstructors = filteredInstructors.filter((instructor) => {
    if (filter === "all") {
      return true;
    }
    if (filter === "featured") {
      return instructor.courses?.some((c) => c.isFeatured);
    }
    if (filter === "new") {
      return instructor.courses?.some((c) => c.isNew);
    }
    return true;
  });

  // --- Helper (Unchanged) ---
  const selectedFilterName = filterOptions.find(opt => opt.id === filter)?.name || "All";


  return (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (Unchanged) */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary-500 mb-4">
            Instructors
          </h1>
          <p className="text-xl text-gray-600 font-body">
            Meet our expert instructors and explore their courses
          </p>
        </div>

        {/* --- Responsive Filters (Unchanged) --- */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            
            {/* Search (Unchanged) */}
            <div className="w-full md:flex-1 md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search instructors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-body"
                />
              </div>
            </div>

            {/* Filters/View (Unchanged) */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
              
              <Listbox value={filter} onChange={setFilter}>
                <div className="relative w-full sm:w-48">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-body">
                    <span className="block truncate">{selectedFilterName}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {filterOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                          }`
                        }
                        value={option.id}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {option.name}
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
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded ${
                    view === "grid" ? "bg-white shadow" : "text-gray-500"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded ${
                    view === "list" ? "bg-white shadow" : "text-gray-500"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* --- END Responsive Filters --- */}
        
        {/* Loading/Error States (Unchanged) */}
        {isLoading && (
          <div className="flex justify-center items-center py-20" data-testid="loading-spinner">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          </div>
        )}

        {/* This will now show the REAL backend error message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-4 rounded-lg flex items-center" role="alert">
            <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
            <div>
                <h4 className="font-bold">Error loading instructors</h4>
                <p>{error}</p>
            </div>
          </div>
        )}

        {/* Render Logic (Unchanged) */}
        {!isLoading && !error && (
          <>
            {/* Results Summary (Unchanged) */}
            <div className="mb-6">
              <p className="text-gray-600 font-body">
                Showing {displayedInstructors.length} of {pagination?.total || 0} instructors
              </p>
            </div>

            {/* Instructor Grid/List (Unchanged) */}
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              <InstructorsList 
                instructors={displayedInstructors} 
                view={view} 
              />
            </div>

            {/* Load More Button (Unchanged) */}
            <div className="text-center mt-12">
              {pagination && pagination.hasNext && (
                <button 
                  onClick={handleLoadMore}
                  disabled={isLoadMore} 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoadMore ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Load More Instructors'
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default InstructorPage;