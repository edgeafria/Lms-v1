import React from 'react';
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Users,
  Award,
  DollarSign,
  Star
} from 'lucide-react';
import { AdminStats } from '../../pages/AdminDashboard'; // Import shared interfaces
import { formatDistanceToNow } from 'date-fns';

// Helper to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price);
};

// Helper for image fallback
const getInitials = (name: string) => {
  if (!name) return '...';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

interface OverviewTabProps {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg flex items-center">
        <AlertCircle className="h-6 w-6 mr-3" />
        <div>
          <h4 className="font-bold">Error Loading Stats</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Courses</p>
              <p className="text-3xl font-headline font-bold text-primary-500">{stats?.totalCourses ?? 0}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-headline font-bold text-tech-500">{(stats?.totalStudents ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-tech-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-tech-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Instructors</p>
              <p className="text-3xl font-headline font-bold text-secondary-500">{stats?.totalInstructors ?? 0}</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-headline font-bold text-green-600">{formatPrice(stats?.totalRevenue ?? 0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" /> 
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Course Performance */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Recent Enrollments</h3>
          <div className="space-y-4">
            {stats?.recentEnrollments && stats.recentEnrollments.length > 0 ? (
              stats.recentEnrollments.map((enrollment) => (
                <div key={enrollment._id} className="flex items-center space-x-4">
                  {enrollment.student?.avatar?.url ? (
                    <img loading="lazy"
                      src={enrollment.student.avatar.url} 
                      alt={enrollment.student.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-body font-semibold">
                      {getInitials(enrollment.student?.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-body font-semibold text-gray-900">{enrollment.student?.name || 'Student'}</p>
                    <p className="text-sm text-gray-600 font-body">Enrolled in {enrollment.course?.title || 'a course'}</p>
                  </div>
                  <span className="text-sm text-gray-500 font-body shrink-0">
                    {formatDistanceToNow(new Date(enrollment.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 font-body">No recent enrollments.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Course Performance</h3>
          <div className="space-y-4">
            {stats?.topCourses && stats.topCourses.length > 0 ? (
              stats.topCourses.map((course) => (
                <div key={course._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-body font-semibold text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-600 font-body">{course.enrollmentCount} students</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-secondary-500 fill-secondary-500" />
                    <span className="font-body font-semibold">{(course.rating?.average || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 font-body">No course performance data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;