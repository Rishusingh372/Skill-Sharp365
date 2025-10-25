import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsUserMenuOpen(false);
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={closeAllMenus}
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LearnHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/courses"
              className={`font-medium transition-colors ${
                location.pathname === "/courses"
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              Browse Courses
            </Link>
                {/* Admin Dashboard */}
            {user?.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className={`font-medium transition-colors ${
                  location.pathname === "/admin/dashboard"
                    ? "text-primary-600"
                    : "text-gray-700 hover:text-primary-600"
                }`}
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.role === "instructor" && (
                  <Link
                    to="/instructor/dashboard"
                    className={`font-medium transition-colors ${
                      location.pathname === "/instructor/dashboard"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Instructor
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className={`font-medium transition-colors ${
                    location.pathname.startsWith("/dashboard")
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  }`}
                >
                  Dashboard
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:block">{user?.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-card border border-gray-200 z-50">
                      <div className="p-2">
                        {/* User Info */}
                        <div className="px-3 py-2 text-sm text-gray-600 border-b border-gray-100">
                          <div className="font-medium text-gray-900 truncate">
                            {user?.name}
                          </div>
                          <div className="truncate">{user?.email}</div>
                          <div className="flex items-center mt-1">
                            <span className="capitalize px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                              {user?.role}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <Link
                          to="/dashboard"
                          className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          My Profile
                        </Link>

                        <Link
                          to="/dashboard"
                          className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          My Dashboard
                        </Link>

                        {user?.role === "instructor" && (
                          <Link
                            to="/instructor/dashboard"
                            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            Instructor Dashboard
                          </Link>
                        )}

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`font-medium transition-colors ${
                    location.pathname === "/login"
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  }`}
                >
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsUserMenuOpen(false);
            }}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col space-y-4">
              <Link
                to="/courses"
                className={`px-3 py-2 font-medium transition-colors ${
                  location.pathname === "/courses"
                    ? "text-primary-600 bg-primary-50 rounded-lg"
                    : "text-gray-700 hover:text-primary-600"
                }`}
                onClick={closeAllMenus}
              >
                Browse Courses
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Mobile User Info */}
                  <div className="px-3 py-3 border-t border-gray-200 mt-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 font-medium transition-colors ${
                      location.pathname.startsWith("/dashboard")
                        ? "text-primary-600 bg-primary-50 rounded-lg"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    onClick={closeAllMenus}
                  >
                    My Dashboard
                  </Link>

                  {user?.role === "instructor" && (
                    <Link
                      to="/instructor/dashboard"
                      className={`px-3 py-2 font-medium transition-colors ${
                        location.pathname === "/instructor/dashboard"
                          ? "text-primary-600 bg-primary-50 rounded-lg"
                          : "text-gray-700 hover:text-primary-600"
                      }`}
                      onClick={closeAllMenus}
                    >
                      Instructor Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-left px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-3 py-2 font-medium transition-colors ${
                      location.pathname === "/login"
                        ? "text-primary-600 bg-primary-50 rounded-lg"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    onClick={closeAllMenus}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary text-center mx-3"
                    onClick={closeAllMenus}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for closing menus when clicking outside */}
      {(isMenuOpen || isUserMenuOpen) && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={closeAllMenus} />
      )}
    </nav>
  );
};

export default Navbar;
