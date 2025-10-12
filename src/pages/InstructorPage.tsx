import React, { useState } from "react";
import {
  Grid2x2 as Grid,
  List,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import InstructorsList from "../components/Instructor/InstructorsList";

const mockInstructors = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Senior Web Developer with 10+ years of experience in React and Node.js.",
    rating: 4.8,
    studentsCount: 3200,
    courses: [
      {
        id: "101",
        title: "React Basics",
        isFeatured: true,
        isNew: false,
      },
      {
        id: "102",
        title: "Advanced TypeScript",
        isFeatured: false,
        isNew: true,
      },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Expert in backend development and GraphQL APIs.",
    rating: 4.9,
    studentsCount: 2100,
    courses: [
      {
        id: "103",
        title: "Node.js Fundamentals",
        isFeatured: false,
        isNew: true,
      },
      {
        id: "104",
        title: "GraphQL in Practice",
        isFeatured: true,
        isNew: false,
      },
    ],
  },
];

const InstructorPage: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredInstructors = mockInstructors.filter((instructor) =>
    instructor.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayedInstructors =
    filter === "all"
      ? filteredInstructors
      : filteredInstructors.filter((instructor) =>
          filter === "featured"
            ? instructor.courses.some((c) => c.isFeatured)
            : instructor.courses.some((c) => c.isNew)
        );

  return (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary-500 mb-4">
            Instructors
          </h1>
          <p className="text-xl text-gray-600 font-body">
            Meet our expert instructors and explore their courses
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
                  placeholder="Search instructors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-body"
                />
              </div>
            </div>

            {/* Filters and View Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setFilter("all")}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-body"
                >
                  <Filter className="h-4 w-4" />
                  <span>All Instructors</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Featured/New Filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none hover:bg-gray-50 font-body"
                >
                  <option value="all">All</option>
                  <option value="featured">Featured</option>
                  <option value="new">New</option>
                </select>
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
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

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600 font-body">
            Showing {displayedInstructors.length} instructors
          </p>
        </div>

        {/* Instructor Grid/List */}
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-6"
          }
        >
          <InstructorsList instructors={displayedInstructors} view={view} />
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-body font-semibold transition-colors">
            Load More Instructors
          </button>
        </div>
      </div>
    </section>
  );
};

export default InstructorPage;
