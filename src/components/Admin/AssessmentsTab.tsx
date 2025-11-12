import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, Edit, BookOpen, HelpCircle } from 'lucide-react';

// Interface for the stats we'll get from our new API
interface AssessmentStat {
  lessonId: string;
  title: string;
  type: 'quiz' | 'assignment';
  courseId: string;
  courseTitle: string;
  instructorName: string;
  pending: number;
  passed: number;
  failed: number;
  passRate: number;
}

const AssessmentsTab: React.FC = () => {
  const [stats, setStats] = useState<AssessmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/assessments/stats');
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch assessment stats');
        }
      } catch (err: any) {
        console.error("Error fetching assessment stats:", err);
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Fetch once on mount

  const handleEdit = (courseId: string) => {
    // Navigate to the course builder for that course
    navigate(`/instructor/course/edit/${courseId}`);
  };
  
  // Calculate totals for the header cards
  const totalPending = stats.reduce((sum, stat) => sum + (stat.type === 'assignment' ? stat.pending : 0), 0);
  const totalGraded = stats.reduce((sum, stat) => sum + stat.passed + stat.failed, 0);
  const totalPassed = stats.reduce((sum, stat) => sum + stat.passed, 0);
  const overallPassRate = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : 0;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">Assessment Stats</h2>
          <p className="text-gray-600 font-body">Platform-wide statistics for Quizzes and Assignments</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Total Assessments</p>
          <p className="text-3xl font-headline font-bold text-primary-500">{stats.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Pending Grading (Assignments)</p>
          <p className="text-3xl font-headline font-bold text-yellow-500">{totalPending}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Total Graded (All)</p>
          <p className="text-3xl font-headline font-bold text-tech-500">{totalGraded.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Overall Pass Rate</p>
          <p className="text-3xl font-headline font-bold text-green-600">{overallPassRate}%</p>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Assessment</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Course / Instructor</th>
                <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Pending</th>
                <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Pass Rate</th>
                <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Passed</th>
                <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Failed</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((item) => (
                <tr key={item.lessonId} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        item.type === 'quiz' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {item.type === 'quiz' ? <HelpCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-body font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 font-body capitalize">{item.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{item.courseTitle}</p>
                    <p className="text-sm text-gray-600 font-body">by {item.instructorName}</p>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-body font-semibold ${item.pending > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {item.type === 'assignment' ? item.pending : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-body font-semibold text-gray-900">{item.passRate}%</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-body font-semibold text-green-600">{item.passed}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-body font-semibold text-red-600">{item.failed}</span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleEdit(item.courseId)}
                      className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg"
                      title="Edit Course"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsTab;