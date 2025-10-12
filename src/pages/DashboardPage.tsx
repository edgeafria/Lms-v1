import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import InstructorDashboard from '../components/Dashboard/InstructorDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-headline font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 font-body">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'instructor':
      return <InstructorDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default DashboardPage;