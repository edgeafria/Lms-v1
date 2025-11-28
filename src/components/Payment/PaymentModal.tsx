import React, { useState } from 'react';
import { X, Shield, Lock } from 'lucide-react';
import axios from 'axios'; // Import axios for API calls
// Corrected import path
import { useAuth } from '../../contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string; // This is the course._id
    title: string;
    price: number;
    thumbnail: string;
  };
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, course, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paystack'>('paystack');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for API errors
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: ''
  });

  const { token } = useAuth(); // Get the authentication token from context
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1'; // Backend URL

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Updated handlePayment function to call the backend
  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    // Validate essential form fields (email/name are used by backend/Paystack)
    if (!formData.email || !formData.name) {
         setError("Full Name and Email Address are required.");
         setLoading(false);
         return;
    }

    try {
      // Call your backend's create-intent endpoint
      const response = await axios.post(
        `${API_BASE_URL}/payments/create-intent`,
        {
          courseId: course.id, // Pass the course ID
          paymentMethod: paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Send the user's auth token
          },
        }
      );

      if (response.data.success && response.data.data) {
        // --- Handle Paystack ---
        if (paymentMethod === 'paystack' && response.data.data.authorizationUrl) {
          // Redirect the user to Paystack's checkout page
          console.log("Redirecting to Paystack:", response.data.data.authorizationUrl);
          window.location.href = response.data.data.authorizationUrl;
          // User leaves site, loading state doesn't need to be reset here
        }
        // --- Handle Stripe ---
        else if (paymentMethod === 'stripe' && response.data.data.clientSecret) {
          // TODO: Implement Stripe Elements flow
          console.log("Stripe client secret received:", response.data.data.clientSecret);
          setError('Stripe integration not yet complete. Please use Paystack.');
          setLoading(false);
        } else {
          throw new Error('Invalid response from payment gateway.');
        }
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment.');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      let errorMessage = 'An error occurred while starting the payment.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
          errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
          errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Note: onPaymentSuccess() is not called here,
  // as confirmation happens via webhook or when user returns to the site.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-headline font-bold text-gray-900">
                Complete Your Purchase
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Course Info */}
          <div className="px-6 pb-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img loading="lazy"
                src={course.thumbnail}
                alt={course.title}
                className="w-16 h-12 object-cover rounded"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/150x100?text=Course`; }}
              />
              <div className="flex-1">
                <h4 className="font-body font-semibold text-gray-900 line-clamp-1">{course.title}</h4>
                <p className="text-2xl font-headline font-bold text-primary-500">
                  {formatPrice(course.price)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="px-6 pb-6">
            <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6">

              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm font-body">{error}</p>
                </div>
              )}

              {/* Student Information */}
              <div className="space-y-4">
                <h4 className="font-body font-semibold text-gray-900">Student Information</h4>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h4 className="font-body font-semibold text-gray-900">Payment Method</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paystack')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'paystack'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400' // Corrected syntax here
                    }`}
                  >
                    <div className="text-center">
                      <div className="bg-green-500 text-white w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center font-body font-bold"> P </div>
                      <span className="font-body font-medium">Paystack</span>
                      <p className="text-xs text-gray-600 mt-1">Card, Bank Transfer, USSD</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="bg-blue-500 text-white w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center font-body font-bold"> S </div>
                      <span className="font-body font-medium">Stripe</span>
                      <p className="text-xs text-gray-600 mt-1">Credit/Debit Cards</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h5 className="font-body font-semibold text-blue-900">Secure Payment</h5>
                    <p className="text-sm text-blue-800 font-body">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.email}
                className="w-full bg-secondary-500 hover:bg-secondary-600 disabled:opacity-70 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-body font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Pay {formatPrice(course.price)}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-600 text-center font-body">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;