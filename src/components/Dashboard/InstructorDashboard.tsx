import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Upload,
  Loader2,
  Check, // <-- NEW
  X        // <-- NEW
} from 'lucide-react';
import { useAuth, User, axiosInstance } from '../../contexts/AuthContext';
import axios from 'axios';
import DOMPurify from 'dompurify'; // <-- NEW
import Modal from '../Modal'; // <-- NEW

// --- Interface Definitions ---
interface InstructorCourse {
  _id: string;
  title: string;
  enrollmentCount?: number;
  rating?: { average?: number; count?: number };
  status: 'draft' | 'published' | 'archived';
  thumbnail?: { url?: string };
  updatedAt: string;
  price: number;
}
interface InstructorStatsData {
    totalCourses: number;
    totalRevenue: number;
    newEnrollments: number;
    totalStudents: number;
    avgRating: number;
    avgCompletionRate: number;
    avgStudyTime: number; 
    avgQuizPassRate: number;
    period?: string;
}
interface CalculatedStats {
    totalCourses: number;
    totalStudents: number;
    totalEarnings: number;
    avgRating: number;
    avgCompletionRate: number;
    avgStudyTime: number;
    avgQuizPassRate: number;
}
interface Review {
    _id: string;
    student: { _id: string, name: string, avatar?: { url?: string } | string };
    course: { _id: string, title: string };
    rating: number;
    comment: string;
    createdAt: string;
}
interface RevenueBreakdown {
    courseId: string;
    courseTitle: string;
    totalRevenue: number;
    numberOfSales: number;
}
interface RevenueAnalytics {
    period: string;
    filterCourseId: string | 'all';
    totalRevenue: number;
    revenueBreakdown: RevenueBreakdown[];
}
// ------------------------------------

// --- NEW SUBMISSION INTERFACE ---
interface AssignmentSubmission {
  _id: string;
  student: { _id: string, name: string, avatar?: { url?: string } | string };
  course: { _id: string, title: string };
  lesson: { _id: string, title: string };
  content: string;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string;
}
// ---------------------------------

interface StatsApiResponse { success: boolean; data: InstructorStatsData; }
interface CoursesApiResponse { success: boolean; data: InstructorCourse[]; pagination?: any; }
interface RevenueApiResponse { success: boolean; data: RevenueAnalytics; }
interface ReviewsApiResponse { success: boolean; data: Review[]; pagination?: any; }
interface SubmissionsApiResponse { success: boolean; data: AssignmentSubmission[]; pagination?: any; } // <-- NEW
// ---------------------------------

// --- Helper function to format time (Unchanged) ---
const formatTime = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 60) {
        return '0 min';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);

    if (hours > 0) {
        const decimalHours = (totalSeconds / 3600).toFixed(1);
        return `${decimalHours} hours`;
    }
    return `${minutes} min`;
};

// --- Helper function to format time ago (Unchanged) ---
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

// --- Helper for avatar (Unchanged) ---
const getAvatarUrl = (avatar?: { url?: string } | string, name?: string): string => {
   if (typeof avatar === 'string' && avatar && avatar !== 'no-photo.jpg') return avatar;
   if (typeof avatar === 'object' && avatar?.url && avatar.url !== 'no-photo.jpg') return avatar.url;
   return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'A')}&background=random&color=fff`;
};
// -----------------------------------------

const InstructorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<CalculatedStats>({
      totalCourses: 0,
      totalStudents: 0,
      totalEarnings: 0,
      avgRating: 0,
      avgCompletionRate: 0,
      avgStudyTime: 0,
      avgQuizPassRate: 0,
  });
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  
  // --- UPDATED Q&A STATES ---
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[] | null>(null); // <-- NEW
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  // --------------------------
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);

  // --- NEW GRADING STATE ---
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingFeedback, setGradingFeedback] = useState("");
  // -------------------------


  // --- Main Data Fetch (Unchanged) ---
  useEffect(() => {
      if (authLoading) return;
      if (!user || user.role === 'student') {
          setIsLoading(false);
          setError("Access Denied. You must be an instructor.");
          navigate('/dashboard'); 
          return;
      }
       if (user.role === 'admin') {
           navigate('/dashboard');
           return;
       }

      const fetchInstructorData = async () => {
          setIsLoading(true);
          setError(null);
          try {
              const [statsRes, coursesRes] = await Promise.all([
                  axiosInstance.get<StatsApiResponse>(`/analytics?type=dashboard`),
                  axiosInstance.get<CoursesApiResponse>(`/courses?instructorId=${user.id}`)
              ]);

              if (coursesRes.data.success) {
                  setCourses(coursesRes.data.data || []);
              } else { 
                  throw new Error(coursesRes.data.message || 'Failed to fetch courses'); 
              }
              
              if (statsRes.data.success) {
                  const { 
                      totalCourses, 
                      totalRevenue, 
                      totalStudents, 
                      avgRating,
                      avgCompletionRate,
                      avgStudyTime,
                      avgQuizPassRate
                  } = statsRes.data.data;
                  setStats({
                      totalCourses: totalCourses || 0,
                      totalEarnings: totalRevenue || 0,
                      totalStudents: totalStudents || 0,
                      avgRating: avgRating || 0,
                      avgCompletionRate: avgCompletionRate || 0,
                      avgStudyTime: avgStudyTime || 0,
                      avgQuizPassRate: avgQuizPassRate || 0,
                  });
              } else { 
                  throw new Error(statsRes.data.message || 'Failed to fetch stats'); 
              }
          } catch (err) {
              console.error("Error fetching instructor data:", err);
              if (axios.isAxiosError(err)) setError(err.response?.data?.message || err.message);
              else if (err instanceof Error) setError(err.message);
              else setError('An unexpected error occurred.');
          } finally {
              setIsLoading(false);
          }
      };
      
      fetchInstructorData();
  }, [user, authLoading, navigate]);

  // --- UPDATED: Tab Data Fetching ---
  useEffect(() => {
      const fetchDataForTab = async (tab: string) => {
          // --- ANALYTICS TAB ---
          if (tab === 'analytics' && !revenueData && !analyticsLoading) {
              setAnalyticsLoading(true);
              setAnalyticsError(null);
              try {
                  const revenueRes = await axiosInstance.get<RevenueApiResponse>(
                      `/analytics?type=revenue&period=30d`
                  );
                  if (revenueRes.data.success) {
                      setRevenueData(revenueRes.data.data);
                  } else {
                      throw new Error(revenueRes.data.message || 'Failed to fetch revenue analytics');
                  }
              } catch (err) {
                  console.error("Error fetching analytics data:", err);
                  if (axios.isAxiosError(err)) setAnalyticsError(err.response?.data?.message || err.message);
                  else if (err instanceof Error) setAnalyticsError(err.message);
                  else setAnalyticsError('An unexpected error occurred.');
              } finally {
                  setAnalyticsLoading(false);
              }
          }
          
          // --- COURSES TAB ---
          if (tab === 'courses' && !revenueData && !analyticsLoading && !isLoading) {
               setAnalyticsLoading(true);
               setAnalyticsError(null);
               try {
                   const revenueRes = await axiosInstance.get<RevenueApiResponse>(
                       `/analytics?type=revenue&period=all`
                   );
                   if (revenueRes.data.success) {
                       setRevenueData(revenueRes.data.data);
                   } else {
                       throw new Error(revenueRes.data.message || 'Failed to fetch revenue data');
                   }
               } catch (err) {
                   console.error("Error fetching revenue data for courses:", err);
               } finally {
                   setAnalyticsLoading(false);
               }
           }

           // --- Q&A / REVIEWS / ASSIGNMENTS TAB ---
           if ((tab === 'overview' || tab === 'qa') && (reviews === null || submissions === null) && !qaLoading) {
               setQaLoading(true);
               setQaError(null);
               try {
                   // Fetch both reviews and submissions in parallel
                   const [reviewsRes, submissionsRes] = await Promise.all([
                       axiosInstance.get<ReviewsApiResponse>(`/reviews?sort=createdAt`),
                       axiosInstance.get<SubmissionsApiResponse>(`/submissions/instructor`) // <-- NEW API CALL
                   ]);

                   if (reviewsRes.data.success) {
                       setReviews(reviewsRes.data.data || []);
                   } else {
                       throw new Error(reviewsRes.data.message || 'Failed to fetch reviews');
                   }

                   if (submissionsRes.data.success) {
                       setSubmissions(submissionsRes.data.data || []); // <-- NEW
                   } else {
                       throw new Error(submissionsRes.data.message || 'Failed to fetch submissions');
                   }

               } catch (err) {
                   console.error("Error fetching Q&A/Reviews/Submissions data:", err);
                   if (axios.isAxiosError(err)) setQaError(err.response?.data?.message || err.message);
                   else if (err instanceof Error) setQaError(err.message);
                   else setQaError('An unexpected error occurred.');
               } finally {
                   setQaLoading(false);
               }
           }
      };
      
      fetchDataForTab(activeTab);

  }, [activeTab, revenueData, analyticsLoading, isLoading, reviews, submissions, qaLoading]); // <-- Added submissions

  // --- NEW: Handle Grade Submission ---
  const handleGradeSubmission = async (passed: boolean) => {
    if (!gradingSubmission) return;
    setIsGrading(true);

    try {
      const response = await axiosInstance.put(
        `/submissions/${gradingSubmission._id}/grade`,
        {
          passed: passed,
          feedback: gradingFeedback
        }
      );

      if (response.data.success) {
        // Remove the graded submission from the local state
        setSubmissions(prev => 
          prev ? prev.filter(s => s._id !== gradingSubmission._id) : null
        );
        // Close the modal
        setGradingSubmission(null);
        setGradingFeedback("");
      } else {
        throw new Error(response.data.message || "Failed to grade submission");
      }
    } catch (err) {
      console.error("Grading error:", err);
      if (axios.isAxiosError(err)) {
        // Set error *inside* the modal? For now, just log
        alert(`Error: ${err.response?.data?.message || err.message}`);
      } else if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setIsGrading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };
  
  if (isLoading || authLoading) {
      return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }
  if (error) {
       return <div className="min-h-screen flex items-center justify-center p-8"><div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-lg text-center" role="alert"><p className="font-bold">Error</p><p>{error}</p></div></div>;
  }

  // --- renderOverview (Unchanged) ---
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div> <p className="text-sm font-body text-gray-600 mb-1">My Courses</p> <p className="text-3xl font-headline font-bold text-primary-500">{stats.totalCourses}</p> </div>
            <div className="bg-primary-100 p-3 rounded-lg"> <BookOpen className="h-6 w-6 text-primary-500" /> </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div> <p className="text-sm font-body text-gray-600 mb-1">Total Students</p> <p className="text-3xl font-headline font-bold text-tech-500">{stats.totalStudents.toLocaleString()}</p> </div>
            <div className="bg-tech-100 p-3 rounded-lg"> <Users className="h-6 w-6 text-tech-500" /> </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div> <p className="text-sm font-body text-gray-600 mb-1">Earnings (30d)</p> <p className="text-3xl font-headline font-bold text-green-600">{formatPrice(stats.totalEarnings)}</p> </div>
            <div className="bg-green-100 p-3 rounded-lg"> <DollarSign className="h-6 w-6 text-green-600" /> </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div> <p className="text-sm font-body text-gray-600 mb-1">Avg Rating</p> <p className="text-3xl font-headline font-bold text-secondary-500">{stats.avgRating.toFixed(1)}</p> </div>
            <div className="bg-secondary-100 p-3 rounded-lg"> <Star className="h-6 w-6 text-secondary-500" /> </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (Responsive) */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-headline font-bold mb-2">Ready to create your next course?</h2>
            <p className="text-primary-100 font-body text-sm sm:text-base">Share your knowledge and help students achieve their goals</p>
          </div>
          <Link to="/instructor/course/new" className="bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-lg font-body font-semibold flex items-center space-x-2 flex-shrink-0">
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity (Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-6">Course Performance</h3>
          <div className="space-y-4">
            {courses.filter(c => c.status === 'published').slice(0, 3).map((course) => (
              <div key={course._id} className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4 min-w-0">
                  <img src={course.thumbnail?.url || `https://placehold.co/100x60?text=Course`} alt={course.title} className="w-12 h-8 object-cover rounded flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-gray-900 line-clamp-1">{course.title}</p>
                    <p className="text-sm text-gray-600 font-body">{course.enrollmentCount || 0} students</p>
                  </div>
                </div>
                <div className="text-left xs:text-right flex-shrink-0">
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="h-4 w-4 text-secondary-500 fill-current" />
                    <span className="font-body font-semibold">{course.rating?.average?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
             {courses.filter(c => c.status === 'published').length === 0 && (
                <p className="text-sm text-gray-500 font-body text-center py-4">No published courses to show performance for.</p>
             )}
          </div>
        </div>

        {/* --- Recent Reviews (Unchanged) --- */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-6">Recent Reviews</h3>
          <div className="space-y-4">
            {qaLoading && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
                </div>
            )}
            {qaError && <p className="text-sm text-red-500 font-body text-center py-4">{qaError}</p>}
            
            {reviews && reviews.length > 0 && !qaLoading && (
                reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="border-l-4 border-primary-500 pl-4">
                     <div className="flex flex-col xs:flex-row items-start justify-between gap-2">
                       <div className="flex-1 min-w-0">
                         <p className="font-body font-semibold text-gray-900 mb-1 line-clamp-1">{review.student?.name}</p>
                         <p className="text-sm text-gray-600 font-body mb-2 line-clamp-1">{review.course?.title}</p>
                         <p className="text-sm text-gray-800 font-body line-clamp-2">{review.comment}</p>
                       </div>
                       <div className="text-left xs:text-right flex-shrink-0">
                         <div className="flex items-center space-x-0.5">
                             {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-secondary-500 fill-current' : 'text-gray-300'}`} />
                             ))}
                         </div>
                         <p className="text-xs text-gray-500 font-body mt-1">{formatTimeAgo(review.createdAt)}</p>
                       </div>
                     </div>
                  </div>
                ))
            )}
             {reviews && reviews.length === 0 && !qaLoading && !qaError && (
                <p className="text-sm text-gray-500 font-body text-center py-4">No reviews found yet.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- renderCourses (Unchanged) ---
  const renderCourses = () => {
    const revenueMap = new Map<string, number>();
    if (revenueData && revenueData.revenueBreakdown) {
        revenueData.revenueBreakdown.forEach(item => {
            revenueMap.set(item.courseId, item.totalRevenue);
        });
    }

    return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-headline font-bold text-gray-900">My Courses</h2>
              <p className="text-gray-600 font-body">Manage and track your course performance</p>
            </div>
            <Link to="/instructor/course/new" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-lg font-body font-semibold flex items-center space-x-2 flex-shrink-0">
              <Plus className="h-5 w-5" />
              <span>Create Course</span>
            </Link>
          </div>

          {analyticsLoading && !revenueData && (
              <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
                  <span className="ml-2 text-gray-600 font-body">Loading course earnings...</span>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
                 <p className="text-gray-600 font-body col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">You have not created any courses yet. Click "Create Course" to get started!</p>
            ) : (
                courses.map((course) => {
                    const courseEarnings = revenueMap.get(course._id) || 0;
                    return (
                      <div key={course._id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="relative">
                          <img
                            src={course.thumbnail?.url || `https://placehold.co/600x400/006747/FFF?text=${encodeURIComponent(course.title)}`}
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                              course.status === 'published' 
                                ? 'bg-green-100 text-green-800'
                                : (course.status === 'archived' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
                            }`}>
                              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                          <div>
                              <h3 className="font-headline font-bold text-lg text-gray-900 mb-3 line-clamp-2 h-[3.25rem]">
                                {course.title}
                              </h3>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center">
                                  <p className="text-xl sm:text-2xl font-headline font-bold text-tech-500">{course.enrollmentCount || 0}</p>
                                  <p className="text-sm text-gray-600 font-body">Students</p>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <Star className="h-4 w-4 text-secondary-500 fill-current" />
                                    <p className="text-xl sm:text-2xl font-headline font-bold text-secondary-500">{course.rating?.average?.toFixed(1) || 'N/A'}</p>
                                  </div>
                                  <p className="text-sm text-gray-600 font-body">Rating</p>
                                </div>
                              </div>
                          </div>
                          <div>
                              <div className="text-center mb-4 p-3 bg-green-50 rounded-lg">
                                {analyticsLoading ? (
                                    <Loader2 className="h-6 w-6 text-green-500 animate-spin mx-auto" />
                                ) : (
                                    <p className="text-2xl font-headline font-bold text-green-600">{formatPrice(courseEarnings)}</p>
                                )}
                                <p className="text-sm text-gray-600 font-body">Total Earnings (All-Time)</p>
                              </div>
                              <div className="border-t pt-4 mt-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500 font-body">Updated {new Date(course.updatedAt).toLocaleDateString()}</p>
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                      <Link to={`/course/${course._id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Preview Course"> <Eye className="h-4 w-4" /> </Link>
                                      <Link to={`/instructor/course/edit/${course._id}`} className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg" title="Edit Course"> <Edit className="h-4 w-4" /> </Link>
                                    </div>
                                  </div>
                              </div>
                          </div>
                        </div>
                      </div>
                    );
                })
            )}
          </div>
        </div>
    );
  };

  // --- renderAnalytics (Unchanged) ---
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold text-gray-900">Analytics & Insights</h2>
        <p className="text-gray-600 font-body">Track your teaching performance and student engagement</p>
      </div>
      
      {analyticsLoading && (
         <div className="h-64 bg-white rounded-xl shadow-sm border p-6 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
         </div>
      )}
      
      {analyticsError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md" role="alert">
              <p className="font-bold">Error Loading Analytics</p>
              <p>{analyticsError}</p>
          </div>
      )}

      {!analyticsLoading && revenueData && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-2">Revenue Overview</h3>
            <p className="text-sm text-gray-600 font-body mb-4">
                Showing total revenue for the <span className="font-semibold">{revenueData.period === '30d' ? 'Last 30 Days' : revenueData.period}</span>
            </p>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-4">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-body mb-2">Revenue chart will be displayed here</p>
                <p className="text-2xl font-bold font-headline text-green-600">{formatPrice(revenueData.totalRevenue)}</p>
                <p className="text-sm text-gray-500 font-body">Total in Period</p>
              </div>
            </div>
             <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Breakdown by Course</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {revenueData.revenueBreakdown.length > 0 ? (
                                revenueData.revenueBreakdown.map(item => (
                                    <tr key={item.courseId}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 line-clamp-1">{item.courseTitle}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.numberOfSales}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold text-right">{formatPrice(item.totalRevenue)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No revenue recorded for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}
      
      {!isLoading && !analyticsError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-6">Student Engagement</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="font-body text-gray-700">Avg. Completion Rate</span>
                    <span className="font-body font-semibold text-green-600">{stats.avgCompletionRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-body text-gray-700">Average Study Time</span>
                    <span className="font-body font-semibold text-tech-500">{formatTime(stats.avgStudyTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-body text-gray-700">Quiz Pass Rate</span>
                    <span className="font-body font-semibold text-secondary-500">{stats.avgQuizPassRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-body text-gray-700">Student Satisfaction</span>
                    <span className="font-body font-semibold text-primary-500">{stats.avgRating.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-6">Top Performing Courses</h3>
              <div className="space-y-4">
                {courses
                  .filter(c => c.status === 'published')
                  .sort((a,b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
                  .slice(0, 5)
                  .map((course, index) => (
                  <div key={course._id} className="flex items-center space-x-4">
                    <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm flex-shrink-0"> {index + 1} </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-gray-900 line-clamp-1">{course.title}</p>
                      <p className="text-sm text-gray-600 font-body">{course.enrollmentCount || 0} students</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-secondary-500 fill-current" />
                        <span className="font-body font-semibold">{course.rating?.average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                 {courses.filter(c => c.status === 'published').length === 0 && (
                    <p className="text-sm text-gray-500 font-body text-center py-4">No published courses to show stats for.</p>
                 )}
              </div>
            </div>
          </div>
      )}
    </div>
  );

  // --- UPDATED: renderQA ---
  const renderQA = () => (
    <div className="space-y-8">
      {/* --- PENDING ASSIGNMENTS --- */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-xl font-headline font-bold text-gray-900">Pending Assignments</h2>
          <p className="text-gray-600 font-body">Submissions from students that require grading.</p>
        </div>
        
        {qaLoading && (
             <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
             </div>
        )}
        {qaError && (
             <p className="text-sm text-red-500 font-body text-center p-6">{qaError}</p>
        )}

        <div className="divide-y divide-gray-200">
          {!qaLoading && !qaError && (!submissions || submissions.length === 0) && (
                <p className="text-sm text-gray-500 font-body text-center py-10">No pending assignments found.</p>
          )}

          {!qaLoading && !qaError && submissions && submissions.map((submission) => (
            <div key={submission._id} className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-start space-x-4 min-w-0">
                  <img 
                    src={getAvatarUrl(submission.student?.avatar, submission.student?.name)} 
                    alt={submission.student?.name} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0"> 
                    <p className="font-body font-semibold text-gray-900 truncate">{submission.student?.name || 'Anonymous'}</p> 
                    <p className="text-sm text-gray-600 font-body truncate">
                      <span className="font-medium">{submission.course?.title || 'Course'}</span>
                      <span className="mx-1">/</span>
                      <span>{submission.lesson?.title || 'Lesson'}</span>
                    </p> 
                    <p className="text-xs text-gray-500 font-body mt-1">{formatTimeAgo(submission.submittedAt)}</p> 
                  </div>
                </div>
                <button 
                  onClick={() => setGradingSubmission(submission)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium text-sm flex-shrink-0"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- STUDENT REVIEWS (Unchanged) --- */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-xl font-headline font-bold text-gray-900">Student Reviews</h2>
          <p className="text-gray-600 font-body">All reviews left by your students.</p>
        </div>
        
        {qaLoading && (
             <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
             </div>
        )}
        {qaError && (
             <p className="text-sm text-red-500 font-body text-center p-6">{qaError}</p>
        )}

        <div className="divide-y divide-gray-200">
          {!qaLoading && !qaError && (!reviews || reviews.length === 0) && (
                <p className="text-sm text-gray-500 font-body text-center py-10">No reviews found for your courses yet.</p>
          )}

          {!qaLoading && !qaError && reviews && reviews.map((review) => (
            <div key={review._id} className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-start space-x-4 min-w-0">
                  <img 
                    src={getAvatarUrl(review.student?.avatar, review.student?.name)} 
                    alt={review.student?.name} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0"> 
                    <p className="font-body font-semibold text-gray-900 truncate">{review.student?.name || 'Anonymous'}</p> 
                    <p className="text-sm text-gray-600 font-body truncate">{review.course?.title || 'Course'} • {formatTimeAgo(review.createdAt)}</p> 
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0" title={`Rated ${review.rating} out of 5`}>
                     {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-secondary-500 fill-current' : 'text-gray-300'}`} />
                     ))}
                 </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                 <p className="font-body text-gray-800 whitespace-pre-wrap">{review.comment}</p> 
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary-500">
                Instructor Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:text-primary-500" onClick={() => setActiveTab('qa')}>
                  <MessageSquare className="h-5 w-5" />
                   {/* Example: Combine counts */}
                   {/* {((reviews?.length || 0) + (submissions?.length || 0)) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {(reviews?.length || 0) + (submissions?.length || 0)}
                      </span>
                  )} */}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Navigation Tabs - Responsive */}
          <div className="mb-6 sm:mb-8 overflow-x-auto">
            <nav className="flex space-x-1 sm:space-x-4 border-b border-gray-200 whitespace-nowrap">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'courses', label: 'My Courses', icon: BookOpen },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'qa', label: 'Submissions & Reviews', icon: MessageSquare }, // <-- UPDATED LABEL
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-3 sm:py-3 font-body font-medium transition-colors text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary-500 text-primary-600'
                        : 'border-b-2 border-transparent text-gray-600 hover:text-primary-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{tab.label}</span>
                    
                    {/* --- NEW: Show count for pending submissions --- */}
                    {tab.id === 'qa' && submissions && submissions.length > 0 && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {submissions.length}
                      </span>
                    )}
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

      {/* --- NEW: Grading Modal --- */}
      {gradingSubmission && (
        <Modal
          isOpen={true}
          onClose={() => {
            setGradingSubmission(null);
            setGradingFeedback("");
          }}
          title={`Grade Submission: ${gradingSubmission.lesson.title}`}
          size="lg"
        >
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-body font-medium text-gray-700 mb-1">Student</label>
              <p className="font-body font-semibold">{gradingSubmission.student.name}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-body font-medium text-gray-700 mb-1">Submitted</label>
              <p className="font-body text-sm text-gray-600">{formatTimeAgo(gradingSubmission.submittedAt)}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-body font-medium text-gray-700 mb-2">Submission Content</label>
              <div 
                className="prose prose-sm max-w-none p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(gradingSubmission.content) }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-body font-medium text-gray-700 mb-1">Feedback (Optional)</label>
              <textarea
                id="feedback"
                rows={4}
                value={gradingFeedback}
                onChange={(e) => setGradingFeedback(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide constructive feedback..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => handleGradeSubmission(false)}
                disabled={isGrading}
                className="flex items-center justify-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-body font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGrading ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                <span>Mark as Fail</span>
              </button>
              <button
                onClick={() => handleGradeSubmission(true)}
                disabled={isGrading}
                className="flex items-center justify-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-body font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGrading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                <span>Mark as Pass</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default InstructorDashboard;