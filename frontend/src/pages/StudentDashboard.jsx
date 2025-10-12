import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { paymentService } from '../services/paymentService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [learningStats, setLearningStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLearningHours: 0,
    currentStreak: 0,
    completionPercentage: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [courseRecommendations, setCourseRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Load enrolled courses
      const enrolledCourseIds = user?.enrolledCourses?.map(e => e.course) || [];
      
      if (enrolledCourseIds.length > 0) {
        const coursesPromises = enrolledCourseIds.map(courseId => 
          courseService.getCourseById(courseId)
        );
        const coursesResponses = await Promise.all(coursesPromises);
        const courses = coursesResponses.map(response => response.course);
        setEnrolledCourses(courses);
        
        // Calculate learning stats
        calculateLearningStats(courses);
      }

      // Load recent activity (simulated)
      setRecentActivity([
        { type: 'completed', course: 'JavaScript Basics', time: '2 hours ago' },
        { type: 'started', course: 'React Fundamentals', time: '1 day ago' },
        { type: 'enrolled', course: 'Node.js Backend', time: '3 days ago' }
      ]);

      // Load course recommendations
      const recommendationsResponse = await courseService.getFeaturedCourses();
      setCourseRecommendations(recommendationsResponse.courses?.slice(0, 4) || []);

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLearningStats = (courses) => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(course => 
      user.enrolledCourses?.find(e => e.course === course._id)?.progress?.completionPercentage === 100
    ).length;
    
    const inProgressCourses = totalCourses - completedCourses;
    const totalLearningHours = courses.reduce((total, course) => total + (course.totalHours || 0), 0);
    
    // Simulate completion percentage (in real app, calculate from user progress)
    const completionPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    setLearningStats({
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalLearningHours,
      currentStreak: 7, // Simulated streak
      completionPercentage
    });
  };

  const continueLearning = enrolledCourses.slice(0, 3);

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    return `${hours} hours`;
  };

  const getProgressPercentage = (courseId) => {
    const enrollment = user.enrolledCourses?.find(e => e.course === courseId);
    return enrollment?.progress?.completionPercentage || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading your learning dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Continue your learning journey.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {learningStats.currentStreak} day streak! 🔥
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
                { id: 'my-courses', name: 'My Courses', icon: '📚' },
                { id: 'progress', name: 'Progress', icon: '🎯' },
                { id: 'achievements', name: 'Achievements', icon: '🏆' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
            {/* Learning Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Courses */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{learningStats.totalCourses}</p>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs text-green-600">{learningStats.completedCourses} completed</span>
                      <span className="text-xs text-blue-600">{learningStats.inProgressCourses} in progress</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Hours */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{learningStats.totalLearningHours}h</p>
                    <p className="text-xs text-gray-500 mt-1">Total time invested</p>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{learningStats.completionPercentage}%</p>
                    <p className="text-xs text-gray-500 mt-1">Overall progress</p>
                  </div>
                </div>
              </div>

              {/* Current Streak */}
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{learningStats.currentStreak} days</p>
                    <p className="text-xs text-gray-500 mt-1">Keep it up! 🔥</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Continue Learning */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
                  <Link 
                    to="/courses" 
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Browse More
                  </Link>
                </div>

                <div className="space-y-4">
                  {continueLearning.length > 0 ? (
                    continueLearning.map((course) => {
                      const progress = getProgressPercentage(course._id);
                      return (
                        <div key={course._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                              {course.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {progress}%
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/learn/${course._id}`}
                            className="btn-primary text-sm px-3 py-1"
                          >
                            Continue
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
                      <Link to="/courses" className="btn-primary">
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'completed' ? 'bg-green-100 text-green-600' :
                        activity.type === 'started' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'completed' && '✓'}
                        {activity.type === 'started' && '▶'}
                        {activity.type === 'enrolled' && '➕'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {activity.type} {activity.course}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Recommendations */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recommended For You</h2>
                <Link 
                  to="/courses" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courseRecommendations.map((course) => (
                  <div key={course._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        by {course.instructor?.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">${course.price}</span>
                        <Link
                          to={`/courses/${course._id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === 'my-courses' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
              <div className="flex items-center space-x-4">
                <select className="input text-sm">
                  <option value="all">All Courses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {enrolledCourses.length > 0 ? (
              <div className="space-y-6">
                {enrolledCourses.map((course) => {
                  const progress = getProgressPercentage(course._id);
                  const isCompleted = progress === 100;
                  
                  return (
                    <div key={course._id} className="flex items-center space-x-6 p-6 border border-gray-200 rounded-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          by {course.instructor?.name} • {course.totalHours || 0}h • {course.level}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-600' : 'bg-primary-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {progress}% complete
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isCompleted ? (
                          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                            Completed ✓
                          </span>
                        ) : (
                          <Link
                            to={`/learn/${course._id}`}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            Continue
                          </Link>
                        )}
                        <Link
                          to={`/courses/${course._id}`}
                          className="btn-secondary text-sm px-3 py-2"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course.</p>
                <Link to="/courses" className="btn-primary">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Learning Progress</h2>
            
            {/* Overall Progress */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Learning Progress</h3>
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-2xl font-bold text-primary-600">{learningStats.completionPercentage}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-primary-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${learningStats.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{learningStats.totalCourses}</div>
                    <div className="text-sm text-gray-600">Total Courses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{learningStats.completedCourses}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{learningStats.inProgressCourses}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course-wise Progress */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h3>
              <div className="space-y-4">
                {enrolledCourses.map((course) => {
                  const progress = getProgressPercentage(course._id);
                  return (
                    <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-9 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{course.title}</h4>
                          <p className="text-sm text-gray-600">{course.instructor?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12">{progress}%</span>
                        <Link
                          to={`/learn/${course._id}`}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {progress === 100 ? 'Review' : 'Continue'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Achievements</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Learning Streak */}
              <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Learning Streak</h3>
                <p className="text-3xl font-bold text-yellow-600 mb-2">{learningStats.currentStreak}</p>
                <p className="text-sm text-gray-600">consecutive days</p>
              </div>

              {/* Course Completer */}
              <div className={`border rounded-lg p-6 text-center ${
                learningStats.completedCourses > 0 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  learningStats.completedCourses > 0 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Course Completer</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">{learningStats.completedCourses}</p>
                <p className="text-sm text-gray-600">courses completed</p>
              </div>

              {/* Time Invested */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏱️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Time Invested</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{learningStats.totalLearningHours}</p>
                <p className="text-sm text-gray-600">hours learning</p>
              </div>
            </div>

            {/* Upcoming Achievements */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Next Milestones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span>🏅</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">10-Day Streak</h4>
                      <p className="text-sm text-gray-600">{10 - learningStats.currentStreak} days to go</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span>⭐</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">5 Courses Completed</h4>
                      <p className="text-sm text-gray-600">{5 - learningStats.completedCourses} more to go</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;