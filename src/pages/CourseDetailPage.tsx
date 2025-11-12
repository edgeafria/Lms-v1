import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CourseDetails from '../components/Course/CourseDetails';
import PaymentModal from '../components/Payment/PaymentModal';
import { useAuth, axiosInstance } from '../contexts/AuthContext';

// --- Type Definitions (remain the same) ---
interface InstructorDetail {
    _id: string; name: string; avatar?: { url?: string } | string; bio?: string;
    rating?: number; students?: number; courses?: number;
}
interface LessonSummary { _id: string; title: string; type: string; duration?: number; isPreview?: boolean; order: number; description?: string; isCompleted?: boolean; }
interface Module { _id: string; title: string; order: number; lessons: LessonSummary[]; description?: string; isCompleted?: boolean; }
interface CourseDetailData {
    _id: string; title: string; slug?: string; description: string; shortDescription?: string; instructor: InstructorDetail;
    coInstructors?: InstructorDetail[]; category: string; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    language?: string; price: number; originalPrice?: number; currency?: string;
    thumbnail?: { public_id?: string; url?: string }; trailer?: { public_id?: string; url?: string; duration?: number }; tags?: string[];
    requirements?: string[]; learningOutcomes?: string[]; targetAudience?: string[];
    modules: Module[]; totalDuration?: number; totalLessons?: number; enrollmentCount?: number;
    rating?: { average?: number; count?: number }; reviews?: any[];
    status?: string; publishedAt?: string | Date; updatedAt?: string | Date;
    certificate?: { enabled?: boolean; template?: string };
    studentsCount?: number; reviewsCount?: number; lastUpdated?: string | Date;
}
interface CourseApiResponse {
    success: boolean;
    data: CourseDetailData;
    message?: string;
}
// --- End Interface Definitions ---


const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [paymentStatusMessage, setPaymentStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1';

    // --- (fetchCourse is unchanged) ---
    const fetchCourse = useCallback(async () => {
        if (!courseId) {
            setError("No Course ID provided."); setIsLoading(false); return;
        }
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(courseId)) {
            setError("Invalid Course ID format.");
            setIsLoading(false);
            return;
        }

        setIsLoading(prev => prev || !course);
        setError(null); 
        
        try {
            const response = await axios.get<CourseApiResponse>(`${API_BASE_URL}/courses/${courseId}`);
            if (response.data.success && response.data.data) {
                setCourse(response.data.data);
            } else { setError(response.data.message || 'Failed to fetch course details.'); }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 404) setError(`Course not found.`);
                else setError(`Network Error: ${err.message}. Could not connect to the backend.`);
            } else { setError('An unexpected error occurred while fetching the course.'); }
             console.error("Fetch Course Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [courseId, API_BASE_URL, course]);


    // --- (useEffect to Fetch Course Data is unchanged) ---
    useEffect(() => {
        fetchCourse();
    }, [courseId, API_BASE_URL]);


    // --- (useEffect to Check Enrollment Status is unchanged) ---
     useEffect(() => {
        const checkEnrollment = async () => {
            try {
                const enrollResponse = await axiosInstance.get<{ success: boolean, data: any[] }>('/enrollments');
                if (enrollResponse.data.success) {
                    const isEnrolledInThisCourse = enrollResponse.data.data.some(
                        (enrollment: any) => enrollment.course?._id === course._id || enrollment.course === course._id
                    );
                    setIsEnrolled(isEnrolledInThisCourse);
                    if (isEnrolledInThisCourse) console.log("(Initial Check) User IS enrolled.");
                    else console.log("(Initial Check) User NOT enrolled.");
                } else {
                     setIsEnrolled(false);
                }
            } catch (enrollError: any) {
                console.error("Error (Initial Check) enrollment status (403 is OK for instructors):", enrollError.message);
                setIsEnrolled(false);
            }
        };
        
        // 🐞 We check for admin role here
        const isAuthorOrAdmin = !authLoading && isAuthenticated && user && course?.instructor
                                ? ( (user.id === course.instructor._id) || (user._id === course.instructor._id) || (user.role === 'admin') )
                                : false;
        
        if (!authLoading && !isLoading && course && isAuthenticated && user && (user.id || user._id)) {
            if (!isAuthorOrAdmin) {
                console.log("(Initial Check) User is not author or admin, checking enrollment...");
                checkEnrollment();
            } else {
                console.log("(Initial Check) Skipped: User is the course author or admin.");
                setIsEnrolled(false); // Authors/Admins are not "enrolled", they just have access
            }
        } else {
            setIsEnrolled(false);
        }
    }, [course, user, isAuthenticated, isLoading, authLoading]);


    // --- (useEffect for URL Query Parameters is unchanged) ---
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const enrollQuery = searchParams.get('enroll');

        if (paymentStatus === 'success') {
            setPaymentStatusMessage({ type: 'success', text: 'Payment successful! Verifying enrollment, please wait...' });
            setSearchParams({}, { replace: true });
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
             setPaymentStatusMessage({ type: 'error', text: 'Payment failed or cancelled.' });
            setSearchParams({}, { replace: true });
        }
        else if (enrollQuery === 'true' && course && !isLoading && !authLoading) {
             const checkEnrollmentBeforeModal = async () => {
                // 🐞 We check for admin role here too
                const isAuthorOrAdmin = isAuthenticated && user && ( (user.id === course.instructor._id) || (user._id === course.instructor._id) || (user.role === 'admin') );
                if (isAuthorOrAdmin) {
                    console.log("Enroll link detected, but user is author/admin. Skipping modal.");
                    setSearchParams({}, { replace: true });
                    return;
                }
                if (isAuthenticated && user && (user.id || user._id)) {
                    try {
                        const enrollResponse = await axiosInstance.get<{ success: boolean, data: any[] }>('/enrollments');
                        const isCurrentlyEnrolled = enrollResponse.data.success && enrollResponse.data.data.some(e => e.course?._id === course._id || e.course === course._id);
                        if (isCurrentlyEnrolled) {
                             setIsEnrolled(true);
                        } else if (isAuthenticated) {
                            if (course.price > 0) {
                                setIsPaymentModalOpen(true);
                            } else {
                                handleEnroll(); 
                            }
                        } else {
                             alert("Please log in to enroll.");
                        }
                    } catch (err) {
                        console.error("Error checking enrollment before opening modal:", err);
                        alert("Could not verify enrollment status. Please try again.");
                    }
                } else {
                     alert("Please log in to enroll.");
                 }
                setSearchParams({}, { replace: true });
            };
            checkEnrollmentBeforeModal();
        } else if (enrollQuery === 'true') {
             setSearchParams({}, { replace: true });
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [course, isLoading, authLoading, isAuthenticated, user, setSearchParams]);

    // --- (useEffect to Poll for Enrollment after Payment is unchanged) ---
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (paymentStatusMessage?.type === 'success' && !isEnrolled && course && user && (user.id || user._id)) {
            let attempts = 0;
            const maxAttempts = 12;
            const pollEnrollment = async () => {
                attempts++;
                try {
                    const enrollResponse = await axiosInstance.get<{ success: boolean, data: any[] }>('/enrollments');
                    if (enrollResponse.data.success) {
                        const isEnrolledInThisCourse = enrollResponse.data.data.some(
                            (enrollment: any) => enrollment.course?._id === course._id || enrollment.course === course._id
                        );
                        if (isEnrolledInThisCourse) {
                            setIsEnrolled(true); setPaymentStatusMessage(null); if(intervalId) clearInterval(intervalId);
                        } else {
                             if (attempts >= maxAttempts) { throw new Error("Verification timeout."); }
                        }
                    } else {
                         if (attempts >= maxAttempts) { throw new Error("Verification timeout."); }
                     }
                } catch (err) {
                    console.error("Polling error:", err);
                    setPaymentStatusMessage({ type: 'error', text: 'Verification failed or timed out. Please refresh the page or contact support.' });
                    setIsEnrolled(false);
                    if(intervalId) clearInterval(intervalId);
                }
            };
             pollEnrollment().catch(() => { if (intervalId) clearInterval(intervalId); });
             intervalId = setInterval(pollEnrollment, 2500);
            return () => { if (intervalId) clearInterval(intervalId); };
        }
    }, [paymentStatusMessage, isEnrolled, course, user, isAuthenticated]);


    // --- (handleEnroll is unchanged) ---
    const handleEnroll = async () => {
        if (!course) return;
        if (!isAuthenticated || !user) {
            alert("Please log in or create an account to enroll.");
            return;
        }
        // 🐞 We check for admin role here
        const isAuthorOrAdmin = (user.id === course.instructor._id) || (user._id === course.instructor._id) || (user.role === 'admin');
        if (isAuthorOrAdmin) {
            navigate(`/instructor/course/edit/${course._id}`);
            return;
        }
        if (course.price > 0) {
            setIsPaymentModalOpen(true);
        } else {
            setIsLoading(true);
            setError(null);
            setMessage(null);
            try {
                const response = await axiosInstance.post('/enrollments', { 
                    courseId: course._id 
                });
                if (response.data.success) {
                    setIsEnrolled(true);
                    setMessage({ type: 'success', text: 'Successfully enrolled!' });
                } else {
                    setError(response.data.message || 'Enrollment failed. Please try again.');
                }
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'An error occurred during enrollment.');
                } else {
                    setError('An unexpected error occurred.');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    // --- (handlePaymentSuccess is unchanged) ---
    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        setPaymentStatusMessage({ 
            type: 'success', 
            text: 'Payment successful! Verifying enrollment, please wait...' 
        });
    };
    
    // --- (handleReviewSuccess is unchanged) ---
    const handleReviewSuccess = () => {
        fetchCourse();
    };
    // ---------------------------------------------


    // --- (Render Logic is unchanged) ---
    if (authLoading || isLoading) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                 <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
                    <p className="text-gray-600 font-body text-lg">Loading Course Details...</p>
                 </div>
            </div>
        );
    }
     if (error && (!paymentStatusMessage || paymentStatusMessage.type !== 'error')) {
         return (
             <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-lg text-center" role="alert">
                     <p className="font-bold text-lg mb-2">Error</p>
                     <p className="font-body">{error}</p>
                     <Link to="/courses" className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body">
                       Back to Courses
                     </Link>
                 </div>
             </div>
         );
     }
    if (!course) {
        return (
             <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
                 <div className="text-center">
                   <h1 className="text-2xl font-headline font-bold text-gray-900 mb-4">Course Not Found</h1>
                   <p className="text-gray-600 font-body">The course data could not be loaded or the course does not exist.</p>
                    <Link to="/courses" className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body">
                      Back to Courses
                    </Link>
                 </div>
             </div>
        );
    }

    // --- 🐞 THIS IS THE FIX ---
    // The 'isAuthor' variable now ALSO checks if user.role is 'admin'
    const isAuthor = !authLoading && isAuthenticated && user && course?.instructor
                     ? ( (user.id === course.instructor._id) || (user._id === course.instructor._id) || (user.role === 'admin') )
                     : false;
    // --- END OF FIX ---

    const paymentCourseData = {
        id: course._id,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail?.url || ''
    };

    return (
        <>
            {paymentStatusMessage && (
                 <div className={`p-4 text-center font-semibold ${paymentStatusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {paymentStatusMessage.text}
                 </div>
            )}
            {message && message.type === 'success' && (
                 <div className="p-4 text-center font-semibold bg-green-100 text-green-800">
                     {message.text}
                 </div>
             )}
             {error && (!paymentStatusMessage || paymentStatusMessage.type !== 'error') && (
                  <div className="p-4 text-center font-semibold bg-red-100 text-red-800">
                     {error}
                 </div>
             )}


            <CourseDetails
                courseData={course}
                onEnroll={handleEnroll}
                isEnrolled={isEnrolled}
                isAuthor={isAuthor} // This prop is now 'true' for admins
                onReviewSubmitted={handleReviewSuccess}
            />

            {course.price > 0 && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    course={paymentCourseData}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
};

export default CourseDetailPage;