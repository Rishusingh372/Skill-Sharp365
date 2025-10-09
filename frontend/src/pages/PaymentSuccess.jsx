import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentService } from '../services/paymentService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      navigate('/courses');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      const response = await paymentService.verifyPayment(sessionId);
      
      if (response.success) {
        setVerified(true);
        toast.success('Payment verified successfully! You now have access to the course.');
      } else {
        setVerified(false);
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerified(false);
      toast.error('Error verifying payment. Please check your enrollment status.');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {verified ? (
            <>
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. You now have full access to the course.
              </p>
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="w-full btn-primary"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/courses"
                  className="w-full btn-secondary"
                >
                  Browse More Courses
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
              <p className="text-gray-600 mb-6">
                We couldn't verify your payment. Please check your email for confirmation or contact support.
              </p>
              <div className="space-y-3">
                <Link
                  to="/courses"
                  className="w-full btn-primary"
                >
                  Browse Courses
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full btn-secondary"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;