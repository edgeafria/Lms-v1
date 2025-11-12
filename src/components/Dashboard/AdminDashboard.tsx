import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp,
  Settings,
  FileText,
  Bell,
  Loader2,
  DollarSign,
  Star,
  AlertCircle 
} from 'lucide-react';
import { useAuth, axiosInstance, User } from '../../contexts/AuthContext';
import OverviewTab from '../Admin/OverviewTab';
import CoursesTab from '../Admin/CoursesTab';
import AssessmentsTab from '../Admin/AssessmentsTab';
import UsersTab from '../Admin/UsersTab';
import ArchiveModal from '../Admin/modals/ArchiveModal';
import CategoryModal from '../Admin/modals/CategoryModal';
import UserModal from '../Admin/modals/UserModal';
import DeleteUserModal from '../Admin/modals/DeleteUserModal';

// --- (All Interfaces are unchanged) ---
export interface RecentEnrollment {
  _id: string; 
  student: {
    name: string;
    avatar?: {
      url: string;
    }
  };
  course: {
    title: string;
  };
  createdAt: string; 
}
export interface CoursePerformance {
  _id: string;
  title: string;
  enrollmentCount: number; 
  rating: {
    average: number;
  };
}
export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
  totalRevenue: number;
  recentEnrollments: RecentEnrollment[]; 
  topCourses: CoursePerformance[];       
}
export interface AdminUser extends User {
  enrollmentCount: number;
}
export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructor: {
    _id: string;
    name: string;
    avatar?: { url: string };
  };
  thumbnail: {
    url: string;
    public_id: string;
  };
  price: number;
  enrollmentCount: number;
  rating: {
    average: number;
    count: number;
  };
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  createdAt: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}
export interface Instructor {
  _id: string;
  name: string;
  avatar?: { url: string };
}
export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project';
  questions: number;
  timeLimit: number;
  attempts: number;
  passingScore: number;
  status: 'active' | 'draft';
}
export interface Certificate {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
  status: 'issued' | 'revoked';
}
export interface CategoryOption {
  _id: string;
  value: string;
  label: string;
}
// ---

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [courseToArchive, setCourseToArchive] = useState<Course | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  // Data
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  
  const navigate = useNavigate(); 

  // --- (All useEffect hooks are unchanged) ---
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const response = await axiosInstance.get('/analytics?type=dashboard');
        if (response.data.success) {
          setStats(response.data.data); 
        } else {
          throw new Error(response.data.message || 'Failed to fetch dashboard stats');
        }
      } catch (err: any) {
        console.error("Error fetching admin stats:", err);
        setStatsError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setStatsLoading(false);
      }
    };

    if (activeTab === 'overview' && !stats) {
      fetchStats();
    }
  }, [activeTab, stats]);

  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const params = new URLSearchParams();
        params.append('status', filterStatus);
        if (filterCategory !== 'all') params.append('category', filterCategory);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (filterFeatured !== 'all') params.append('featured', filterFeatured);

        const response = await axiosInstance.get(`/courses?${params.toString()}`); 
        if (response.data.success) {
          setCourses(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch courses');
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setCoursesError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setCoursesLoading(false);
      }
    };

    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab, debouncedSearchTerm, filterStatus, filterCategory, filterFeatured]);

  useEffect(() => {
    const fetchSupportingData = async () => {
      if (instructors.length === 0) {
        try {
          const instructorResponse = await axiosInstance.get('/users?role=instructor');
          if (instructorResponse.data.success) {
            setInstructors(instructorResponse.data.data);
          } else {
            console.error("Failed to fetch instructors");
          }
        } catch (err) {
          console.error("Error fetching instructors:", err);
        }
      }
      
      if (categories.length === 0) {
        try {
          const response = await axiosInstance.get('/categories');
          if (response.data.success) {
            setCategories(response.data.data);
          } else {
            console.error("Failed to fetch categories");
          }
        } catch (err) {
          console.error("Error fetching categories:", err);
        }
      }
    };

    if (activeTab === 'courses' || activeTab === 'assessments' || activeTab === 'users') {
      fetchSupportingData();
    }
  }, [activeTab, instructors.length, categories.length]);

  
  // --- (All Action Handlers are unchanged) ---
  const handleViewCourse = (courseId: string) => {
    window.open(`/course/${courseId}`, '_blank');
  };
  const handleEditCourse = (courseId: string) => {
    navigate(`/instructor/course/edit/${courseId}`);
  };
  const openArchiveModal = (course: Course) => {
    setCourseToArchive(course);
    setShowArchiveModal(true);
  };
  const handleArchiveCourse = async () => {
    if (!courseToArchive) return;
    setIsArchiving(true);
    try {
      await axiosInstance.put(`/courses/${courseToArchive._id}`, {
        status: 'archived',
      });
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c._id === courseToArchive._id ? { ...c, status: 'archived' } : c
        )
      );
      setShowArchiveModal(false);
    } catch (err) {
      console.error("Error archiving course:", err);
    } finally {
      setIsArchiving(false);
      setCourseToArchive(null);
    }
  };
  const handleToggleFeatured = async (course: Course, newFeaturedState: boolean) => {
    setCourses(prevCourses =>
      prevCourses.map(c =>
        c._id === course._id ? { ...c, featured: newFeaturedState } : c
      )
    );
    try {
      await axiosInstance.patch(`/courses/${course._id}/toggle-featured`);
    } catch (err) {
      console.error("Error toggling featured status:", err);
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c._id === course._id ? { ...c, featured: !newFeaturedState } : c
        )
      );
    }
  };
  const handleAddUser = () => {
    setUserToEdit(null);
    setShowUserModal(true);
  };
  const handleEditUser = (user: AdminUser) => {
    setUserToEdit(user);
    setShowUserModal(true);
  };
  const handleSaveUser = (savedUser: User) => {
    const userWithCount = { ...savedUser, enrollmentCount: 0 } as AdminUser;
    
    if (userToEdit) {
      setCourses(prev => prev.map(c => c._id === savedUser._id ? { ...c, ...userWithCount } : c));
    } else {
      setCourses(prev => [userWithCount, ...prev]);
    }
  };
  const openDeleteUserModal = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteUserError(null);
    setShowDeleteUserModal(true);
  };
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeletingUser(true);
    setDeleteUserError(null);
    try {
      await axiosInstance.delete(`/users/${userToDelete._id}`);
      // This will be fixed when we wire up UsersTab state
      // setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      setShowDeleteUserModal(false);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setDeleteUserError(err.response?.data?.message || 'A server error occurred.');
    } finally {
      setIsDeletingUser(false);
    }
  };


  // --- (Mock Render Function) ---
  const renderCertificates = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-xl font-headline font-bold text-gray-900 mb-4">Certificates</h3>
      <p className="text-gray-600 font-body">This component has not been built yet.</p>
    </div>
  );
  // ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (Unchanged) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary-500 truncate pr-4">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary-500">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  5
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🐞 --- RESPONSIVE NAVIGATION TABS --- 🐞 */}
        <div className="mb-8">
          <nav className="flex space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap pb-2 md:overflow-x-visible md:justify-start">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'assessments', label: 'Assignments', icon: FileText },
              { id: 'certificates', label: 'Certificates', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-body font-medium transition-colors text-sm md:text-base ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        {/* 🐞 --- END OF RESPONSIVE TABS --- 🐞 */}

        {/* Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            loading={statsLoading}
            error={statsError}
          />
        )}
        {activeTab === 'courses' && (
          <CoursesTab
            courses={courses}
            categories={categories}
            loading={coursesLoading}
            error={coursesError}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterFeatured={filterFeatured}
            setFilterFeatured={setFilterFeatured}
            onToggleFeatured={handleToggleFeatured}
            onViewCourse={handleViewCourse}
            onEditCourse={handleEditCourse}
            onArchiveCourse={openArchiveModal}
            onManageCategories={() => setShowCategoryModal(true)}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={openDeleteUserModal}
          />
        )}
        {activeTab === 'assessments' && <AssessmentsTab />}
        {activeTab ==='certificates' && renderCertificates()}
      </div>

      {/* Modals */}
      {showArchiveModal && (
        <ArchiveModal
          course={courseToArchive}
          isArchiving={isArchiving}
          onClose={() => setShowArchiveModal(false)}
          onConfirm={handleArchiveCourse}
        />
      )}
      
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          setCategories={setCategories}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      
      {showUserModal && (
        <UserModal
          user={userToEdit}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {showDeleteUserModal && (
        <DeleteUserModal
          user={userToDelete}
          isDeleting={isDeletingUser}
          error={deleteUserError}
          onClose={() => setShowDeleteUserModal(false)}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default AdminDashboard;