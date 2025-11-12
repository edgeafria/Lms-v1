import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Trophy,
  Clock,
  Play,
  Award,
  Star,
  Users,
  CheckCircle,
  HelpCircle,
  Calendar, 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// --- Interface Definitions (Unchanged) ---
interface EnrolledCourse {
  _id: string;
  title: string;
  thumbnail?: { url: string };
  instructor: { _id: string; name: string; };
  accessPeriod?: string; 
}
interface Assignment {
    _id: string;
    title: string;
    dueDate: string;
}
interface EnrollmentAssignment {
    assignment: Assignment;
    status: 'not-submitted' | 'submitted' | 'graded';
    _id: string;
}
interface Enrollment {
  _id: string;
  course: EnrolledCourse; 
  status: 'active' | 'completed';
  progress: {
    percentageComplete: number;
    totalTimeSpent: number;
  };
  enrolledAt: string;
  assignments: EnrollmentAssignment[];
}
interface Certificate {
    _id: string;
}
interface ActivityCourse {
    _id: string;
    title: string;
    slug: string;
}
interface Activity {
    _id: string;
    type: 'ENROLLMENT' | 'LESSON_COMPLETE' | 'QUIZ_ATTEMPT' | 'REVIEW_SUBMITTED' | 'CERTIFICATE_EARNED';
    message: string;
    course: ActivityCourse; // This can be null or undefined
    createdAt: string;
}
interface Achievement {
    _id: string;
    title: string;
    description: string;
    icon: string; 
    earned: boolean;
}
interface DashboardStats {
    enrolledCourses: number;
    completedCourses: number;
    certificatesEarned: number;
    studyHours: string;
}
interface Deadline {
    courseTitle: string; 
    assignmentTitle: string; 
    dueDate: string;
    priority: 'high' | 'medium' | 'low'; 
    courseId: string;
    isCourseDeadline: boolean; 
}
// ----------------------------------------


const StudentDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // --- State for fetched data (Unchanged) ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<Enrollment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1';


  // --- Fetch data on component mount (Unchanged) ---
  useEffect(() => {
    if (authLoading) {
        return; 
    }
    if (!user) {
        setIsLoading(false);
        setError("User not found. Please log in again.");
        return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           throw new Error("Authentication token not found.");
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [enrollmentsRes, certificatesRes, activitiesRes, achievementsRes] = await Promise.all([
          axios.get<{ success: boolean; data: Enrollment[]; }>(`${API_BASE_URL}/enrollments`, { headers }),
          axios.get<{ success: boolean; data: Certificate[]; }>(`${API_BASE_URL}/certificates`, { headers }),
          axios.get<{ success: boolean; data: Activity[]; }>(`${API_BASE_URL}/activities?limit=5`, { headers }),
          axios.get<{ success: boolean; data: Achievement[]; }>(`${API_BASE_URL}/achievements`, { headers }) 
        ]);

        if (!enrollmentsRes.data.success || !certificatesRes.data.success || !activitiesRes.data.success || !achievementsRes.data.success) {
            console.error("Dashboard Data Fetch Failure:", {
                enrollments: enrollmentsRes.data.success,
                certificates: certificatesRes.data.success,
                activities: activitiesRes.data.success,
                achievements: achievementsRes.data.success
            });
            throw new Error("Failed to fetch all dashboard data.");
        }

        const allEnrollments = enrollmentsRes.data.data || [];
        const allCertificates = certificatesRes.data.data || [];
        const allActivities = activitiesRes.data.data || [];
        const allAchievements = achievementsRes.data.data || []; 

        // --- Calculate Stats (Unchanged) ---
        const totalEnrolled = allEnrollments.length;
        const totalCompleted = allEnrollments.filter(e => e.status === 'completed').length;
        const totalCertificates = allCertificates.length;
        const totalSeconds = allEnrollments.reduce((sum, enr) => sum + (enr.progress.totalTimeSpent || 0), 0);
        const totalHours = (totalSeconds / 3600).toFixed(1);
        setStats({ enrolledCourses: totalEnrolled, completedCourses: totalCompleted, certificatesEarned: totalCertificates, studyHours: totalHours });
        
        setRecentCourses(allEnrollments.slice(0, 3));
        setActivities(allActivities);
        setAchievements(allAchievements.map(ach => ({...ach, earned: true}))); 

        // --- Process Deadlines (Unchanged) ---
        const today = new Date();
        const upcomingDeadlines: Deadline[] = [];
        
        allEnrollments.forEach(enrollment => {
          if (!enrollment.course) return; 

          // 1. Check for Assignment Deadlines
          if (enrollment.assignments) {
            enrollment.assignments.forEach(assign => {
              if (assign.assignment && assign.assignment.dueDate && assign.status !== 'graded') {
                const dueDate = new Date(assign.assignment.dueDate);
                if (dueDate > today) {
                  const diffTime = dueDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  let priority: 'high' | 'medium' | 'low';
                  if (diffDays <= 3) priority = 'high';
                  else if (diffDays <= 7) priority = 'medium';
                  else priority = 'low';
                  
                  upcomingDeadlines.push({
                    courseTitle: enrollment.course.title,
                    assignmentTitle: assign.assignment.title,
                    dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    priority: priority,
                    courseId: enrollment.course._id,
                    isCourseDeadline: false, 
                  });
                }
              }
            });
          }

          // 2. Check for Course Access Deadlines
          if (enrollment.course.accessPeriod && enrollment.status === 'active') {
            const accessDays = parseInt(enrollment.course.accessPeriod, 10);
            if (!isNaN(accessDays) && accessDays > 0) {
              const enrolledDate = new Date(enrollment.enrolledAt);
              const expiryDate = new Date(enrolledDate.setDate(enrolledDate.getDate() + accessDays));

              if (expiryDate > today) {
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let priority: 'high' | 'medium' | 'low';
                if (diffDays <= 7) priority = 'high'; 
                else if (diffDays <= 30) priority = 'medium'; 
                else priority = 'low';
                
                upcomingDeadlines.push({
                  courseTitle: enrollment.course.title,
                  assignmentTitle: "Course Access Expires", 
                  dueDate: expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  priority: priority,
                  courseId: enrollment.course._id,
                  isCourseDeadline: true, 
                });
              }
            }
          }
        });
        
        setDeadlines(upcomingDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3));
        // -----------------------------

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (axios.isAxiosError(err)) { setError(`Network Error: ${err.message}. Please try refreshing.`); }
        else if (err instanceof Error) { setError(err.message); }
        else { setError('An unexpected error occurred.'); }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]);


  
  const getActivityIcon = (type: Activity['type']) => { 
    switch(type) {
      case 'ENROLLMENT': return <BookOpen className="h-4 w-4 text-primary-500" />;
      case 'LESSON_COMPLETE': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'QUIZ_ATTEMPT': return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      case 'REVIEW_SUBMITTED': return <Star className="h-4 w-4 text-secondary-500" />;
      case 'CERTIFICATE_EARNED': return <Trophy className="h-4 w-4 text-tech-500" />; // <-- Changed to Trophy
      default: return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const timeAgo = (dateString: string): string => { 
      if (!dateString) return ''; 
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 2) return "Just now"; 
      let interval = seconds / 31536000; 
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000; 
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400; 
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600; 
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60; 
      if (interval > 1) return Math.floor(interval) + "m ago";
      return Math.floor(seconds) + "s ago"; 
  };


  // --- Render Loading State (Unchanged) ---
  if (isLoading || authLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
                <p className="text-gray-600 font-body text-lg">Loading Your Dashboard...</p>
             </div>
        </div>
      );
  }

  // --- Render Error State (Unchanged) ---
  if (error) {
       return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-lg text-center" role="alert">
                <p className="font-bold text-lg mb-2">Error Loading Dashboard</p>
                <p className="font-body">{error}</p>
                <Link to="/" className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body">
                  Back to Home
                </Link>
            </div>
        </div>
       );
  }

  // --- Render Dashboard Content ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (Unchanged) */}
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
        {/* Welcome Section (Unchanged) */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-headline font-bold mb-2"> Welcome back, {user?.name.split(' ')[0]}! 👋 </h2>
                <p className="text-primary-100 font-body text-lg mb-6"> You're making great progress. Keep learning and growing! </p>
                <Link to={recentCourses.length > 0 ? `/learn/course/${recentCourses[0].course._id}` : "/courses"} className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-body font-semibold transition-colors">
                {recentCourses.length > 0 ? 'Continue Learning' : 'Explore Courses'}
                </Link>
            </div>
            <div className="absolute top-4 right-8 opacity-20"> <Trophy className="h-24 w-24" /> </div>
        </div>

        {/* Stats Cards (Unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between"> <div> <p className="text-sm font-body text-gray-600 mb-1"> Enrolled Courses </p> <p className="text-3xl font-headline font-bold text-primary-500"> {stats?.enrolledCourses ?? 0} </p> </div> <div className="bg-primary-100 p-3 rounded-lg"> <BookOpen className="h-6 w-6 text-primary-500" /> </div> </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between"> <div> <p className="text-sm font-body text-gray-600 mb-1"> Completed </p> <p className="text-3xl font-headline font-bold text-green-600"> {stats?.completedCourses ?? 0} </p> </div> <div className="bg-green-100 p-3 rounded-lg"> <Trophy className="h-6 w-6 text-green-600" /> </div> </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between"> <div> <p className="text-sm font-body text-gray-600 mb-1"> Certificates </p> <p className="text-3xl font-headline font-bold text-secondary-500"> {stats?.certificatesEarned ?? 0} </p> </div> <div className="bg-secondary-100 p-3 rounded-lg"> <Award className="h-6 w-6 text-secondary-500" /> </div> </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between"> <div> <p className="text-sm font-body text-gray-600 mb-1"> Study Hours </p> <p className="text-3xl font-headline font-bold text-tech-500"> {stats?.studyHours ?? 0} </p> </div> <div className="bg-tech-100 p-3 rounded-lg"> <Clock className="h-6 w-6 text-tech-500" /> </div> </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column (Unchanged) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning (Unchanged) */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-headline font-bold text-gray-900"> Continue Learning </h3>
                    <Link to="/my-courses" className="text-primary-500 hover:text-primary-600 font-body font-medium"> View All </Link>
                </div>
                <div className="space-y-4">
                    {recentCourses.length > 0 ? (
                        recentCourses.map((enrollment) => (
                            <div key={enrollment._id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                <img src={enrollment.course.thumbnail?.url || `https://placehold.co/160x90/006747/FFF?text=${encodeURIComponent(enrollment.course.title)}`} alt={enrollment.course.title} className="w-20 h-14 object-cover rounded-lg" />
                                <div className="flex-1">
                                    <h4 className="font-body font-semibold text-gray-900 mb-1 line-clamp-1"> {enrollment.course.title} </h4>
                                    <p className="text-sm text-gray-600 font-body mb-2"> by {enrollment.course.instructor.name} </p>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2"> <div className="bg-secondary-500 h-2 rounded-full" style={{ width: `${enrollment.progress.percentageComplete}%` }}></div> </div>
                                        <span className="text-sm font-body text-gray-600"> {enrollment.progress.percentageComplete}% </span>
                                    </div>
                                </div>
                                <Link to={`/learn/course/${enrollment.course._id}`} className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors" aria-label={`Continue learning ${enrollment.course.title}`}>
                                <Play className="h-4 w-4" />
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-body">You are not enrolled in any courses yet.</p>
                            <Link to="/courses" className="mt-4 inline-block bg-secondary-500 text-white px-6 py-2 rounded-lg font-body font-semibold hover:bg-secondary-600"> Explore Courses </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 🐞 RECENT ACTIVITY (FIXED) --- */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {activities.length > 0 ? (
                    activities.map((activity) => {
                      
                      // This is the content: icon, message, time
                      const activityContent = (
                        <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <div className="bg-gray-100 p-2 rounded-full mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-body text-gray-900" dangerouslySetInnerHTML={{ __html: activity.message }}></p>
                            <p className="text-sm text-gray-600 font-body">
                              {timeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );

                      // If activity.course exists, wrap it in a Link.
                      // We use optional chaining 'activity.course?._id' to be safe.
                      if (activity.course && (activity.course.slug || activity.course._id)) {
                        return (
                          <Link to={`/course/${activity.course.slug || activity.course._id}`} key={activity._id}>
                            {activityContent}
                          </Link>
                        );
                      }
                      
                      // Otherwise (e.g., for achievements), render as a non-clickable div
                      return (
                        <div key={activity._id}>
                          {activityContent}
                        </div>
                      );
                    })
                ) : (
                   <p className="text-sm text-gray-500 font-body text-center py-4">No recent activity found.</p>
                )}
              </div>
            </div>
            {/* --- END FIX --- */}
            
          </div>

          {/* Right Column (Unchanged) */}
          <div className="space-y-8">
            
            {/* Upcoming Deadlines (Unchanged) */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Upcoming Deadlines
              </h3>
              <div className="space-y-4">
                {deadlines.length > 0 ? (
                    deadlines.map((deadline, index) => (
                      <Link to={`/learn/course/${deadline.courseId}`} key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {deadline.isCourseDeadline ? (
                            <Calendar className="h-5 w-5 text-red-500 flex-shrink-0" />
                        ) : (
                            <Clock className="h-5 w-5 text-primary-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className={`font-body font-semibold text-gray-900 text-sm truncate ${deadline.priority === 'high' ? 'text-red-600' : ''}`}> 
                            {deadline.assignmentTitle} 
                          </p>
                          <p className="text-xs text-gray-600 font-body truncate"> {deadline.courseTitle} </p>
                          <p className="text-xs text-gray-500 font-body"> {deadline.dueDate} </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ deadline.priority === "high" ? "bg-red-500" : deadline.priority === "medium" ? "bg-yellow-500" : "bg-green-500" }`}></div>
                      </Link>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 font-body text-center py-4">No upcoming deadlines.</p>
                )}
              </div>
            </div>

            {/* Achievements (Unchanged) */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">
                Achievements
              </h3>
              <div className="space-y-4">
                {achievements.length > 0 ? (
                    achievements.map((achievement) => (
                      <div key={achievement._id} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-50 border border-secondary-200">
                        <div className="text-2xl">{achievement.icon}</div> 
                        <div className="flex-1">
                          <p className="font-body font-semibold text-sm text-secondary-700">
                            {achievement.title} 
                          </p>
                          <p className="text-xs text-gray-600 font-body">
                            {achievement.description}
                          </p>
                        </div>
                        <div className="bg-secondary-500 text-white p-1 rounded-full">
                           <Trophy className="h-3 w-3" />
                        </div>
                      </div>
                    ))
                ) : (
                   <p className="text-sm text-gray-500 font-body text-center py-4">No achievements earned yet. Keep learning!</p>
                )}
              </div>
            </div>
            
            {/* Study Streak (Unchanged) */}
            <div className="bg-gradient-to-br from-accent-500 to-secondary-500 rounded-xl p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-2xl font-headline font-bold mb-1">
                  {user?.loginStreak || 0} Day Streak!
                </p>
                <p className="text-accent-100 font-body">
                  {user?.loginStreak && user.loginStreak > 1 ? "Keep it up! You're on fire!" : "Log in tomorrow to build your streak!"}
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