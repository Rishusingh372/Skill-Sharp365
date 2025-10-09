import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import CreateCourse from './pages/CreateCourse';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              
              {/* Protected Routes - All Authenticated Users */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Routes - Instructors Only */}
              <Route 
                path="/instructor/dashboard" 
                element={
                  <ProtectedRoute requireInstructor={true}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/instructor/courses/create" 
                element={
                  <ProtectedRoute requireInstructor={true}>
                    <CreateCourse />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/instructor/courses/:id/edit" 
                element={
                  <ProtectedRoute requireInstructor={true}>
                    <div className="container mx-auto py-8">
                      <h1 className="text-3xl font-bold text-center">Edit Course - Coming Soon</h1>
                      <p className="text-gray-600 text-center mt-4">
                        Course editing functionality will be implemented in future updates.
                      </p>
                    </div>
                  </ProtectedRoute>
                } 
              />

              {/* Learning Routes - Future Implementation */}
              <Route 
                path="/learn/:courseId" 
                element={
                  <ProtectedRoute>
                    <div className="container mx-auto py-8">
                      <h1 className="text-3xl font-bold text-center">Learning Interface - Coming Soon</h1>
                      <p className="text-gray-600 text-center mt-4">
                        Video player, course content, and progress tracking will be implemented soon.
                      </p>
                    </div>
                  </ProtectedRoute>
                } 
              />

              {/* 404 Page */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                          onClick={() => window.history.back()} 
                          className="btn-secondary"
                        >
                          Go Back
                        </button>
                        <a 
                          href="/" 
                          className="btn-primary"
                        >
                          Go Home
                        </a>
                      </div>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </main>
          <Footer />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;