import React, { useState, useEffect, Fragment } from 'react';
import { Listbox, Transition, Switch } from '@headlessui/react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Check, 
  ChevronsUpDown,
  Loader2,
  AlertCircle,
  Users,
  Award,
  UserPlus
} from 'lucide-react';
// 🐞 --- CORRECTED PATHS ---
import { User, axiosInstance } from '../../contexts/AuthContext';
import { AdminUser } from '../Dashboard/AdminDashboard';
import { format } from 'date-fns';

// ... (rest of the file is unchanged) ...
// 🐞 --- INTERFACES --- 🐞
interface UserStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  newSignups: number;
}

interface Pagination {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

// 🐞 --- STATIC OPTIONS --- 🐞
const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
];

// Helper for image fallback
const getInitials = (name: string) => {
  if (!name) return '...';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// 🐞 --- PROPS --- 🐞
interface UsersTabProps {
  onAddUser: () => void;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ onAddUser, onEditUser, onDeleteUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Debouncer
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Main data fetching effect
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filterRole !== 'all') params.append('role', filterRole);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        // We'll add pagination later
        // params.append('page', '1'); 

        const res = await axiosInstance.get(`/users?${params.toString()}`);
        if (res.data.success) {
          setUsers(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.data.message || 'Failed to fetch users');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearchTerm, filterRole, filterStatus]);

  // Stats fetching effect
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axiosInstance.get('/users/stats');
        if (res.data.success) {
          setStats(res.data.data);
        } else {
          throw new Error(res.data.message || 'Failed to fetch stats');
        }
      } catch (err: any) {
        // Don't set a page-blocking error for stats
        console.error("Failed to fetch user stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  // 🐞 --- IN-TABLE ACTION HANDLERS --- 🐞

  // Optimistic update for role
  const handleRoleChange = async (user: AdminUser, newRole: 'admin' | 'instructor' | 'student') => {
    const oldRole = user.role;
    // 1. Optimistic UI update
    setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
    
    // 2. API call
    try {
      await axiosInstance.put(`/users/${user._id}`, { role: newRole });
    } catch (err) {
      console.error("Failed to update role:", err);
      // Revert on failure
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: oldRole } : u));
      // You could show an error toast here
    }
  };

  // Optimistic update for status
  const handleStatusToggle = async (user: AdminUser, newStatus: boolean) => {
    const oldStatus = user.isActive;
    // 1. Optimistic UI update
    setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: newStatus } : u));
    
    // 2. API call
    try {
      await axiosInstance.put(`/users/${user._id}`, { isActive: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert on failure
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: oldStatus } : u));
    }
  };
  
  // Role Dropdown styling
  const getRoleClasses = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-green-100 text-green-800';
      case 'student':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 font-body">Manage all platform users</p>
        </div>
        <button
          onClick={onAddUser}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add New User</span>
        </button>
      </div>
      
      {/* 🐞 --- STAT CARDS --- 🐞 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-headline font-bold text-primary-500">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.totalUsers ?? 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Students</p>
          <p className="text-3xl font-headline font-bold text-tech-500">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.totalStudents ?? 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">Instructors</p>
          <p className="text-3xl font-headline font-bold text-green-600">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.totalInstructors ?? 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm font-body text-gray-600 mb-1">New Signups (30d)</p>
          <p className="text-3xl font-headline font-bold text-secondary-500">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.newSignups ?? 0)}
          </p>
        </div>
      </div>
      
      {/* 🐞 --- FILTERS --- 🐞 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            
            {/* ROLE FILTER */}
            <Listbox value={filterRole} onChange={setFilterRole}>
              <div className="relative w-40">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-2 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span className="block truncate">{roleOptions.find(o => o.value === filterRole)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {roleOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
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
                </Transition>
              </div>
            </Listbox>
            
            {/* STATUS FILTER */}
            <Listbox value={filterStatus} onChange={setFilterStatus}>
              <div className="relative w-40">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-2 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span className="block truncate">{statusOptions.find(o => o.value === filterStatus)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {statusOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
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
                </Transition>
              </div>
            </Listbox>

          </div>
        </div>
      </div>

      {/* 🐞 --- USERS TABLE --- 🐞 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
            </div>
          ) : error ? (
             <div className="p-10 text-center">
               <p className="text-red-500">{error}</p>
             </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">User</th>
                  <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Role</th>
                  <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Courses</th>
                  <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Joined</th>
                  <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {user.avatar?.url ? (
                          <img src={user.avatar.url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold">
                            {getInitials(user.name)}
                          </span>
                        )}
                        <div>
                          <p className="font-body font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600 font-body">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="py-4 px-6">
                      <Listbox value={user.role} onChange={(newRole) => handleRoleChange(user, newRole)}>
                        <div className="relative w-36">
                          <Listbox.Button className={`relative w-full cursor-default rounded-full px-3 py-1 text-left text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 ${getRoleClasses(user.role)}`}>
                            <span className="block truncate capitalize">{user.role}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                              {roleOptions.filter(o => o.value !== 'all').map((option) => (
                                <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate capitalize ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
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
                          </Transition>
                        </div>
                      </Listbox>
                    </td>
                    {/* Courses */}
                    <td className="py-4 px-6 text-center">
                      <p className="font-body text-gray-900">{user.enrollmentCount}</p>
                    </td>
                    {/* Joined */}
                    <td className="py-4 px-6">
                      <p className="font-body text-gray-900">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                    </td>
                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <Switch
                        checked={user.isActive}
                        onChange={(newStatus: boolean) => handleStatusToggle(user, newStatus)}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        className={`${
                          user.isActive ? 'bg-primary-500' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            user.isActive ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteUser(user)}
                          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersTab;