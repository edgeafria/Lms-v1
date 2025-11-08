import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { BookOpen, Play } from "lucide-react";

// --- Interface Definitions (Same as StudentDashboard) ---
interface EnrolledCourse {
  _id: string;
  title: string;
  thumbnail?: { url: string };
  instructor: { _id: string; name: string };
}
interface Enrollment {
  _id: string;
  course: EnrolledCourse;
  status: "active" | "completed";
  progress: {
    percentageComplete: number;
    totalTimeSpent: number;
  };
  enrolledAt: string;
}
// ----------------------------------------------------

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!user) {
      setError("Please log in to view your courses.");
      setIsLoading(false);
      return;
    }

    const fetchEnrollments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const response = await axios.get<{
          success: boolean;
          data: Enrollment[];
        }>(
          `${API_BASE_URL}/enrollments`, // Gets all enrollments for the user
          { headers }
        );

        if (response.data.success) {
          setEnrollments(response.data.data);
        } else {
          throw new Error("Failed to fetch enrollments.");
        }
      } catch (err) {
        console.error("Error fetching enrollments:", err);
        if (axios.isAxiosError(err)) {
          setError(`Network Error: ${err.message}`);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-lg text-center"
          role="alert"
        >
          <p className="font-bold text-lg mb-2">Error</p>
          <p className="font-body">{error}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-headline font-bold text-gray-900 mb-8">
          My Learning
        </h1>

        {/* TODO: Add tabs for "All Courses", "Completed", "Wishlist" */}

        <div className="space-y-6">
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <div
                key={enrollment._id}
                className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={
                    enrollment.course.thumbnail?.url ||
                    `https://placehold.co/320x180?text=${encodeURIComponent(
                      enrollment.course.title
                    )}`
                  }
                  alt={enrollment.course.title}
                  className="w-full sm:w-48 h-32 sm:h-28 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 mt-4 sm:mt-0">
                  <h2 className="font-headline font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {enrollment.course.title}
                  </h2>
                  <p className="text-sm text-gray-600 font-body mb-3">
                    by {enrollment.course.instructor.name}
                  </p>
                  {/* Progress Bar */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-500 h-2.5 rounded-full"
                        style={{
                          width: `${enrollment.progress.percentageComplete}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-body font-medium text-gray-700">
                      {enrollment.progress.percentageComplete}% Complete
                    </span>
                  </div>
                </div>
                <Link
                  to={`/learn/course/${enrollment.course._id}`} // Link to Course Player
                  className="w-full sm:w-auto mt-4 sm:mt-0 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors font-body font-semibold flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>
                    {enrollment.progress.percentageComplete > 0
                      ? "Continue"
                      : "Start Course"}
                  </span>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-headline font-semibold text-gray-900 mb-2">
                You haven't enrolled in any courses yet.
              </h3>
              <p className="text-gray-600 font-body mb-6">
                Start your learning journey by finding your next course.
              </p>
              <Link
                to="/courses"
                className="inline-block bg-secondary-500 text-white px-8 py-3 rounded-lg font-body font-semibold hover:bg-secondary-600 transition-colors"
              >
                Explore All Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCoursesPage;
