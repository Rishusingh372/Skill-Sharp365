import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { paymentService } from '../services/paymentService';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [relatedCourses, setRelatedCourses] = useState([]);

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(id);
      setCourse(response.course);
      
      // Load related courses
      const relatedResponse = await courseService.getAllCourses({
        category: response.course.category,
        limit: 4
      });
      setRelatedCourses(relatedResponse.courses.filter(c => c._id !== id));
    } catch (error) {
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setEnrolling(true);
      
      // Check if user is already enrolled
      const isEnrolled = user.enrolledCourses?.some(
        enrolled => enrolled.course?._id === id
      );

      if (isEnrolled) {
        navigate(`/learn/${id}`);
        return;
      }

      // Check if user is the instructor
      if (user._id === course.instructor._id) {
        toast.info('You cannot enroll in your own course');
        return;
      }

      // Create checkout session
      const response = await paymentService.createCheckoutSession(id);
      
      // Redirect to Stripe checkout
      window.location.href = response.url;
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = user?.enrolledCourses?.some(
    enrolled => enrolled.course?._id === id
  );

  const isCourseOwner = user?._id === course?.instructor?._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading course...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2">
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link to="/courses" className="hover:text-primary-600">Courses</Link>
                <span>/</span>
                <span className="text-gray-900">{course.category}</span>
              </nav>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{course.shortDescription}</p>

              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-primary-600 text-xs font-medium">
                      {course.instructor?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>Created by {course.instructor?.name}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{course.rating || 'New'} • {course.totalStudents} students</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="badge bg-primary-100 text-primary-700 capitalize">{course.level}</span>
                <span className="badge bg-gray-100 text-gray-700 capitalize">{course.category}</span>
                {!course.isPublished && <span className="badge-warning">Draft</span>}
              </div>
            </div>

            {/* Right Column - Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900">${course.price}</span>
                    </div>
                  </div>

                  {isCourseOwner ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate(`/instructor/courses/${id}/edit`)}
                        className="w-full btn-primary"
                      >
                        Manage Course
                      </button>
                      <p className="text-sm text-gray-600 text-center">
                        This is your course
                      </p>
                    </div>
                  ) : isEnrolled ? (
                    <div className="space-y-3">
                      <Link
                        to={`/learn/${id}`}
                        className="w-full btn-success"
                      >
                        Continue Learning
                      </Link>
                      <p className="text-sm text-success-600 text-center">
                        You're enrolled in this course
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling || !course.isPublished}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enrolling ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          'Enroll Now'
                        )}
                      </button>
                      
                      {!course.isPublished && (
                        <p className="text-sm text-warning-600 text-center">
                          This course is not published yet
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-600 text-center">
                        30-day money-back guarantee
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{course.totalHours} hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Level</span>
                      <span className="font-medium capitalize">{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Language</span>
                      <span className="font-medium">{course.language}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* What You'll Learn */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.learningOutcomes?.map((outcome, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{outcome}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Course Content */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Course Modules</h3>
                      <p className="text-sm text-gray-600">
                        {course.lectures || 0} lectures • {course.totalHours || 0} total hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">Course content will be available after enrollment</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Requirements */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {course.requirements?.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </section>

            {/* Description */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
              </div>
            </section>

            {/* Instructor */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructor</h2>
              <div className="card p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-xl font-medium">
                      {course.instructor?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.instructor?.name}</h3>
                    <p className="text-gray-600 mb-2">{course.instructor?.email}</p>
                    <p className="text-gray-700">
                      Experienced instructor passionate about sharing knowledge and helping students succeed.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Related Courses */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Related Courses</h3>
            <div className="space-y-4">
              {relatedCourses.slice(0, 3).map((relatedCourse) => (
                <Link
                  key={relatedCourse._id}
                  to={`/courses/${relatedCourse._id}`}
                  className="card p-4 block hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex space-x-3">
                    <img
                      src={relatedCourse.thumbnail}
                      alt={relatedCourse.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {relatedCourse.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">${relatedCourse.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;