import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  FileText,
  Download,
  Clock,
  Users,
  Star,
  Award,
  CheckCircle,
  Lock,
  BookOpen,
  Video,
  HelpCircle,
  Calendar,
  User,
  Globe,
  Share2,
  Edit, // <-- 1. IMPORT 'Edit' ICON
} from 'lucide-react';
import ReviewModal from './ReviewModal'; 
import { useAuth } from '../../contexts/AuthContext'; // <-- 2. IMPORT 'useAuth'

// --- 🐞 COPIED TYPES FROM YOUR PREVIOUS FILE ---
interface StudentStub {
  _id: string;
  name: string;
  avatar?: { url?: string } | string;
}

interface ReviewDetail {
  _id: string;
  comment: string;
  rating: number;
  createdAt: string | Date;
  student: StudentStub; 
}
// --- END COPIED TYPES ---


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
    rating?: { average?: number; count?: number }; 
    reviews?: ReviewDetail[]; // <-- Use the strict type
    status?: string; publishedAt?: string | Date; updatedAt?: string | Date;
    certificate?: { enabled?: boolean; template?: string };
    studentsCount?: number;
    reviewsCount?: number;
    lastUpdated?: string | Date;
    duration?: string;
}
// --- End Type Definitions ---

// --- Props ---
interface CourseDetailsProps {
  courseData: CourseDetailData | null;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isAuthor?: boolean;
  onReviewSubmitted: () => void; 
}
// --- End Props ---

// --- Helper Functions (remain the same) ---
const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="h-4 w-4" />;
    case 'text': return <FileText className="h-4 w-4" />;
    case 'quiz': return <HelpCircle className="h-4 w-4" />;
    case 'assignment': return <BookOpen className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};
const getAvatarUrl = (avatar?: { url?: string } | string): string | undefined => {
  if (typeof avatar === 'string') {
    return avatar;
  }
  if (typeof avatar === 'object' && avatar !== null && avatar.url) {
    return avatar.url;
  }
  return undefined;
};
const formatDuration = (totalMinutes?: number): string => {
  if (totalMinutes == null || totalMinutes === 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  let durationString = '';
  if (hours > 0) {
    durationString += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (minutes > 0) {
    if (durationString.length > 0) durationString += ' ';
    durationString += `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  }
  return durationString || 'N/A';
};
const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    console.error("Invalid date:", dateString, e);
    return 'Invalid Date';
  }
};
const formatPrice = (price: number, currency: string = 'NGN') => {
  if (price === 0) return "Free";
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  } catch (e) {
    return `${currency} ${price.toLocaleString()}`;
  }
};
// --- END HELPER FUNCTIONS ---


const CourseDetails: React.FC<CourseDetailsProps> = ({
    courseData,
    onEnroll,
    isEnrolled = false,
    isAuthor = false,
    onReviewSubmitted
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedResource, setSelectedResource] = useState<LessonSummary | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  // const [reviewSubmitted, setReviewSubmitted] = useState(false); // We will replace this
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- 3. GET THE LOGGED-IN USER
  const course = courseData;

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Loading course...</div>
      </div>
    );
  }
  
  const modules = course.modules || [];
  const reviews = course.reviews || []; 
  const tags = course.tags || [];
  const requirements = course.requirements || [];
  const learningOutcomes = course.learningOutcomes || [];
  
  // --- 4. FIND THE USER'S REVIEW ---
  const userReview = reviews.find(review => review.student?._id === user?._id);

  const handleResourceClick = (resource: LessonSummary) => {
    const isLocked = !isEnrolled && !resource.isPreview && !isAuthor;
    if (isLocked) {
        if (!isAuthor && onEnroll) { onEnroll(); }
        return; 
    }
    if (isEnrolled || isAuthor) {
       navigate(`/learn/course/${course._id}?lesson=${resource._id}`);
    } else if (resource.isPreview) {
       navigate(`/learn/course/${course._id}?lesson=${resource._id}`);
    }
  };

  const handleShare = async () => {
    if (!course) return;
    const shareData = {
      title: course.title,
      text: course.shortDescription || `Check out this course on ${window.location.host}!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Course shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Share dialog canceled by user.');
      } else {
        console.error('Error sharing/copying:', err);
        if (!navigator.share) {
           alert('Failed to copy link. Please copy it from the address bar.');
        }
      }
    }
  };


  const renderOverview = () => (
    <div className="space-y-8">
      {/* Course Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-4">About This Course</h3>
        <p className="text-gray-700 font-body leading-relaxed mb-6 whitespace-pre-line break-words">{course.description}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-body font-semibold text-gray-900 mb-3">What You'll Learn</h4>
            <ul className="space-y-2">
              {learningOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-body break-words">{outcome}</span>
                </li>
              ))}
              {learningOutcomes.length === 0 && <li className="text-gray-500 font-body italic">Learning outcomes not specified.</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-body font-semibold text-gray-900 mb-3">Requirements</h4>
            <ul className="space-y-2">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 font-body break-words">{requirement}</span>
                </li>
              ))}
              {requirements.length === 0 && <li className="text-gray-500 font-body italic">No requirements specified.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Instructor Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-4">Your Instructor</h3>
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <img
            src={getAvatarUrl(course.instructor.avatar) || `https://placehold.co/100x100/cccccc/000?text=${course.instructor.name.charAt(0)}`}
            alt={course.instructor.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/100x100/cccccc/000?text=Error`; }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-body font-bold text-lg text-gray-900 break-words">{course.instructor.name}</h4>
            <p className="text-gray-600 font-body mb-3 break-words">{course.instructor.bio || 'Instructor bio not available'}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-secondary-500 fill-current flex-shrink-0" />
                <span className="font-body">{course.instructor.rating || 4.9} rating</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="font-body">{(course.instructor.students || 0).toLocaleString()} students</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="font-body">{course.instructor.courses || 0} courses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurriculum = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-headline font-bold text-gray-900 mb-6">Course Content</h3>
        <div className="space-y-4">
          {modules.sort((a,b) => a.order - b.order).map((module, moduleIndex) => (
            <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm flex-shrink-0">
                      {moduleIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-body font-bold text-gray-900 break-words">{module.title}</h4>
                      <p className="text-sm text-gray-600 font-body break-words truncate">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                    <span className="text-sm text-gray-600 font-body">
                      {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                    </span>
                    {module.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {module.lessons.sort((a,b) => a.order - b.order).map((resource) => {
                  const isLocked = !isEnrolled && !resource.isPreview && !isAuthor; // Author bypasses lock
                  const isCompleted = resource.isCompleted; // Use data if available
                  return(
                    <div
                      key={resource._id}
                      onClick={() => handleResourceClick(resource)}
                      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors ${
                        isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      } ${selectedResource?._id === resource._id ? 'bg-primary-50' : ''}`}
                    >
                      <div className="flex items-center space-x-4 mb-2 sm:mb-0 w-full sm:w-auto min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          resource.type === 'video' ? 'bg-red-100 text-red-600' :
                          resource.type === 'pdf' ? 'bg-blue-100 text-blue-600' :
                          resource.type === 'quiz' ? 'bg-green-100 text-green-600' :
                          resource.type === 'text' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-body font-semibold text-gray-900 break-words">{resource.title}</h5>
                          <p className="text-sm text-gray-600 font-body break-words truncate">{resource.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0 self-end sm:self-center">
                        {resource.duration != null && (
                          <span className="text-sm text-gray-500 font-body">{formatDuration(resource.duration)}</span>
                        )}
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Play className="h-5 w-5 text-primary-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {modules.length === 0 && <p className="text-center text-gray-500 font-body italic">Course curriculum is not yet available.</p>}
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-headline font-bold text-gray-900">Student Reviews</h3>
          
          {/* --- 5. UPDATED BUTTON LOGIC --- */}
          {isEnrolled && !isAuthor && (
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium flex items-center space-x-2 flex-shrink-0 text-sm sm:text-base"
            >
              {userReview ? (
                <Edit className="h-4 w-4" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              <span>{userReview ? 'Edit Your Review' : 'Leave a Review'}</span>
            </button>
          )}
          {/* We no longer need the 'reviewSubmitted' state check */}
          {/* --- END OF BUTTON --- */}

        </div>

        {/* Review Summary */}
        {(course.rating?.count ?? 0) > 0 ? (
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="text-center flex-shrink-0">
              <div className="text-4xl font-headline font-bold text-secondary-500 mb-2">{(course.rating?.average ?? 0).toFixed(1)}</div>
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 fill-current ${i < Math.round(course.rating?.average ?? 0) ? 'text-secondary-500' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-600 font-body">{course.rating?.count ?? 0} {course.rating?.count === 1 ? 'review' : 'reviews'}</p>
            </div>
            <div className="flex-1 w-full">
              <p className="text-center text-gray-500 italic">Rating distribution chart placeholder.</p>
            </div>
          </div>
        ) : null}

        {/* Individual Reviews */}
        <div className="space-y-6">
          {reviews.map((review, index) => {
            // Check if this review belongs to the currently logged-in user
            const isMyReview = review.student?._id === user?._id;
            
            return (
              <div key={review._id || index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <img src={getAvatarUrl(review.student?.avatar) || `https://placehold.co/40x40/cccccc/000?text=${review.student?.name?.charAt(0) || 'S'}`} alt={review.student?.name || 'Student'} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 mb-2">
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                        <h5 className="font-body font-semibold text-gray-900 break-words">{review.student?.name || 'Anonymous'}</h5>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 fill-current ${i < review.rating ? 'text-secondary-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 font-body flex-shrink-0">{formatDate(review.createdAt)}</span>
                      </div>

                      {/* --- 6. ADD EDIT BUTTON TO THE REVIEW --- */}
                      {isMyReview && (
                        <button
                          onClick={() => setIsReviewModalOpen(true)}
                          className="flex items-center space-x-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 font-body whitespace-pre-line break-words">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {/* This logic remains correct */}
          {(reviews.length === 0 && (course.rating?.count ?? 0) === 0) && <p className="text-center text-gray-500 font-body italic">No reviews have been submitted yet.</p>}
        </div>
      </div>
    </div>
  );

  return (
    <> 
      <div className="min-h-screen bg-gray-50">
        {/* Course Header (NO CHANGES) */}
        <div className="bg-primary-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Title Block */}
              <div className="lg:col-span-2 min-w-0">
                <div className="mb-4">
                  <span className="bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-body font-semibold">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-headline font-bold mb-4 break-words">{course.title}</h1>
                <p className="text-lg sm:text-xl text-primary-100 font-body mb-6 leading-relaxed break-words">
                  {course.shortDescription || course.description.substring(0, 200) + (course.description.length > 200 ? '...' : '')}
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-primary-100">
                     <div className="flex items-center space-x-1"> <Star className="h-5 w-5 fill-current text-secondary-500" /> <span className="font-body font-semibold">{(course.rating?.average ?? 0).toFixed(1)}</span> <span className="font-body">({course.rating?.count ?? 0} reviews)</span> </div>
                     <div className="flex items-center space-x-1"> <Users className="h-5 w-5" /> <span className="font-body">{(course.enrollmentCount || 0).toLocaleString()} students</span> </div>
                     <div className="flex items-center space-x-1"> 
                       <Clock className="h-5 w-5" /> 
                       <span className="font-body">{course.duration || formatDuration(course.totalDuration)}</span> 
                     </div>
                </div>
                <div className="flex items-center space-x-2 mt-4 text-primary-100 text-sm min-w-0">
                   <img src={getAvatarUrl(course.instructor.avatar) || `https://placehold.co/40x40/cccccc/000?text=${course.instructor.name.charAt(0)}`} alt={course.instructor.name} className="w-6 h-6 rounded-full object-cover border border-primary-300 flex-shrink-0" />
                   <span className="truncate">Created by <span className="font-semibold break-all">{course.instructor.name}</span></span>
                </div>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-primary-200 text-xs">
                   <div className="flex items-center space-x-2"> <Calendar className="h-4 w-4" /> <span>Last updated {formatDate(course.updatedAt || course.lastUpdated)}</span> </div>
                   <div className="flex items-center space-x-2"> <Globe className="h-4 w-4" /> <span>{course.language || 'English'}</span> </div>
                </div>
              </div>

              {/* Course Card (Sidebar) (NO CHANGES) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900 lg:sticky lg:top-24">
                  <div className="relative mb-4 aspect-video">
                      <img
                        src={course.thumbnail?.url || `https://placehold.co/600x400?text=Preview`}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x400?text=Error`; }}
                      />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                           <Play className="h-12 w-12 text-white fill-white" />
                      </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center flex-wrap gap-x-3 mb-2">
                      <span className="text-3xl font-headline font-bold text-primary-500">
                        {formatPrice(course.price, course.currency)}
                      </span>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-lg text-gray-500 line-through font-body">
                          {formatPrice(course.originalPrice, course.currency)}
                        </span>
                      )}
                    </div>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-body font-semibold">
                        Save {Math.round((1 - course.price / course.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {isEnrolled || isAuthor ? (
                    <Link to={`/learn/course/${course._id}`} className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-body font-semibold mb-4 transition-colors shadow hover:shadow-md">
                      {isAuthor ? 'Go to Course (Instructor)' : 'Go to Course'}
                    </Link>
                  ) : (
                    <button
                      onClick={onEnroll}
                      className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-3 px-6 rounded-lg font-body font-semibold mb-4 transition-colors shadow hover:shadow-md"
                    >
                       Enroll Now
                    </button>
                  )}

                  <div className="space-y-3 text-sm text-gray-600 border-t pt-4 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2 font-body">This course includes:</h4>
                    <div className="flex items-start space-x-2"> 
                      <Clock className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" /> 
                      <span className="font-body break-words">
                        {course.duration || formatDuration(course.totalDuration) || (course.totalLessons ? `${course.totalLessons} lessons` : 'Self-paced')}
                      </span> 
                    </div>
                    <div className="flex items-start space-x-2"> <FileText className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" /> <span className="font-body break-words">Articles & Resources</span> </div>
                    <div className="flex items-start space-x-2"> <Download className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" /> <span className="font-body break-words">Downloadable resources</span> </div>
                    {course.certificate?.enabled && <div className="flex items-start space-x-2"> <Award className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" /> <span className="font-body break-words">Certificate of completion</span> </div> }
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button 
                      onClick={handleShare}
                      disabled={isCopied}
                      className="w-full flex items-center justify-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Share Course</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content Sections (NO CHANGES) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex flex-wrap gap-2 md:gap-8 border-b pb-px">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'curriculum', label: 'Curriculum' },
                  { id: 'reviews', label: 'Reviews' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-2 rounded-t-lg font-body font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-primary-500 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'curriculum' && renderCurriculum()}
            {activeTab === 'reviews' && renderReviews()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 lg:sticky lg:top-24">
              <h3 className="text-lg font-headline font-bold text-gray-90NT">Course Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-body">
                    {tag}
                  </span>
                ))}
                {tags.length === 0 && <p className="text-gray-500 font-body italic text-sm">No tags specified.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 7. PASS THE 'userReview' TO THE MODAL --- */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseId={course._id}
        existingReview={userReview || null} // Pass the user's review (or null)
        onSubmitSuccess={(newReview) => { 
          setIsReviewModalOpen(false);
          onReviewSubmitted(); // This re-fetches the course data
        }}
      />
    </>
  );
};

export default CourseDetails;