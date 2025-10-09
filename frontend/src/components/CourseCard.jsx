import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CourseCard = ({ course }) => {
  const { user } = useAuth();

  const isEnrolled = user?.enrolledCourses?.some(
    enrolled => enrolled.course?._id === course._id
  );

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  const isCourseOwner = course.instructor?._id === user?._id;

  return (
    <div className="card overflow-hidden group">
      {/* Course Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          {!course.isPublished && (
            <span className="badge-warning">Draft</span>
          )}
          {course.isFeatured && (
            <span className="badge-success ml-1">Featured</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="badge bg-black bg-opacity-70 text-white">
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Instructor Info */}
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-primary-600 text-xs font-medium">
              {course.instructor?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-600">{course.instructor?.name}</span>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>

        {/* Course Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.shortDescription || course.description}
        </p>

        {/* Course Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.totalHours}h
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {course.totalStudents} students
            </span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{course.rating || 'New'}</span>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">${course.price}</span>
            {course.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">${course.originalPrice}</span>
            )}
          </div>

          <div>
            {isCourseOwner ? (
              <Link
                to={`/instructor/courses/${course._id}/edit`}
                className="btn-secondary text-sm"
              >
                Manage
              </Link>
            ) : isEnrolled ? (
              <Link
                to={`/learn/${course._id}`}
                className="btn-success text-sm"
              >
                Continue
              </Link>
            ) : isInstructor ? (
              <span className="text-sm text-gray-500">Enroll to access</span>
            ) : (
              <Link
                to={`/courses/${course._id}`}
                className="btn-primary text-sm"
              >
                Enroll Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;