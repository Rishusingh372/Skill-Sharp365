import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { courseService } from '../services/courseService';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalRevenue: 0,
    totalPayments: 0,
    recentUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load platform statistics
      const statsResponse = await adminService.getPlatformStats();
      setStats(statsResponse.stats);

      // Load pending course approvals
      const coursesResponse = await adminService.getAllCourses({ status: 'unpublished' });
      setPendingApprovals(coursesResponse.courses.slice(0, 5));

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminService.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await adminService.getAllCourses();
      setCourses(response.courses);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await adminService.getAllPayments();
      setPayments(response.payments);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Load data based on tab
    switch (tab) {
      case 'users':
        loadUsers();
        break;
      case 'courses':
        loadCourses();
        break;
      case 'payments':
        loadPayments();
        break;
      default:
        break;
    }
  };

  const approveCourse = async (courseId) => {
    try {
      await adminService.approveCourse(courseId, 'approve');
      toast.success('Course approved successfully!');
      loadAdminData(); // Refresh data
      if (activeTab === 'courses') loadCourses();
    } catch (error) {
      toast.error('Failed to approve course');
    }
  };

  const rejectCourse = async (courseId) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      try {
        await adminService.approveCourse(courseId, 'reject', reason);
        toast.success('Course rejected successfully!');
        loadAdminData();
        if (activeTab === 'courses') loadCourses();
      } catch (error) {
        toast.error('Failed to reject course');
      }
    }
  };

  const deleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await adminService.deleteCourse(courseId);
        toast.success('Course deleted successfully!');
        loadAdminData();
        if (activeTab === 'courses') loadCourses();
      } catch (error) {
        toast.error('Failed to delete course');
      }
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      if (activeTab === 'users') loadUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This will also delete their courses and payments.`)) {
      try {
        await adminService.deleteUser(userId);
        toast.success('User deleted successfully!');
        if (activeTab === 'users') loadUsers();
        loadAdminData(); // Refresh stats
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const processRefund = async (paymentId) => {
    const reason = prompt('Please enter refund reason:');
    if (reason) {
      try {
        await adminService.processRefund(paymentId, reason);
        toast.success('Refund processed successfully!');
        if (activeTab === 'payments') loadPayments();
      } catch (error) {
        toast.error('Failed to process refund');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Manage your platform effectively.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                Administrator
              </span>
              <span className="text-sm text-gray-500">
                Last login: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'users', name: 'User Management', icon: '👥' },
                { id: 'courses', name: 'Course Moderation', icon: '📚' },
                { id: 'payments', name: 'Financial Management', icon: '💰' },
                { id: 'settings', name: 'System Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs text-green-600">+{stats.recentUsers} new</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Courses */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs text-green-600">{stats.publishedCourses} published</span>
                      <span className="text-xs text-orange-600">{stats.pendingCourses} pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.totalPayments} payments</p>
                  </div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingCourses}</p>
                    <p className="text-xs text-gray-500 mt-1">Course reviews needed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Course Approvals */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Pending Course Approvals</h2>
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((course) => (
                      <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-12 h-9 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              by {course.instructor?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => approveCourse(course._id)}
                            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectCourse(course._id)}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No pending approvals</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        Manage Users
                      </h3>
                      <p className="text-sm text-gray-600">View and manage all platform users</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('payments')}
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        Financial Reports
                      </h3>
                      <p className="text-sm text-gray-600">View payments, revenue, and process refunds</p>
                    </div>
                  </button>

                  <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group text-left">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        System Settings
                      </h3>
                      <p className="text-sm text-gray-600">Configure platform settings and preferences</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input text-sm"
                />
                <select className="input text-sm">
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-primary-600 text-sm font-medium">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteUser(user._id, user.name)}
                            className="text-error-600 hover:text-error-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Course Moderation Tab */}
        {activeTab === 'courses' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Course Moderation</h2>
              <div className="flex items-center space-x-4">
                <select className="input text-sm">
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
            </div>

            {coursesLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">
                          by {course.instructor?.name} • ${course.price} • {course.totalStudents} students
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {!course.isPublished && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {course.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!course.isPublished && (
                        <>
                          <button
                            onClick={() => approveCourse(course._id)}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectCourse(course._id)}
                            className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteCourse(course._id)}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Management Tab */}
        {activeTab === 'payments' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Financial Management</h2>
              <div className="text-sm text-gray-600">
                Total Revenue: <span className="font-semibold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.stripePaymentId?.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.user?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.course?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.amount / 100)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'refunded'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => processRefund(payment._id)}
                              className="text-error-600 hover:text-error-900"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Under Development</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>System settings panel is currently under development and will be available in the next update.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Configuration</h3>
                  <p className="text-sm text-gray-600">Coming soon: Site settings, email templates, and more.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                  <p className="text-sm text-gray-600">Coming soon: Security protocols and access controls.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;