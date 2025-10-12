import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CourseDetails from '../components/Course/CourseDetails';
import PaymentModal from '../components/Payment/PaymentModal';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Mock course data - in real app, fetch from API
  const course = {
    id: courseId || '1',
    title: 'Full-Stack Web Development with React & Node.js',
    price: 89000,
    thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg'
  };

  useEffect(() => {
    // Check if enroll parameter is present
    if (searchParams.get('enroll') === 'true') {
      setIsPaymentModalOpen(true);
    }
  }, [searchParams]);

  const handleEnroll = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsEnrolled(true);
    setIsPaymentModalOpen(false);
    // In real app, update enrollment status in backend
    console.log('Payment successful for course:', course.title);
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-headline font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 font-body">The requested course could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CourseDetails 
        courseId={courseId}
        onEnroll={handleEnroll}
        isEnrolled={isEnrolled}
      />
      
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        course={course}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default CourseDetailPage;