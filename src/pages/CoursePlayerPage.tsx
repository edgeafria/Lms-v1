// [COMPLETE CODE FOR: frontend/src/pages/CoursePlayerPage.tsx]

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, axiosInstance } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Play,
  FileText,
  CheckCircle,
  Lock,
  BookOpen,
  Video,
  HelpCircle,
  ChevronDown,
  Download,
  User,
  Loader2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  X,
  Award,
  Repeat
} from 'lucide-react';
import DOMPurify from 'dompurify';

// --- Video.js Player ---
import VideoPlayer from '../components/VideoPlayer'; 
import 'video.js/dist/video-js.css'; 
// --- End Video.js Player ---

// ### Import RichTextEditor ###
import RichTextEditor from '../components/RichTextEditor';

// Import ProseMirror base styles
import 'prosemirror-view/style/prosemirror.css';

// --- Type Definitions (Unchanged) ---
interface Lesson {
  _id: string;
  id?: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'live' | 'download';
  content?: {
    video?: { url?: string; duration?: number };
    text?: { body?: string };
    quiz?: string;
    assignment?: { instructions?: string };
    live?: { meetingUrl?: string; scheduledAt?: Date; duration?: number; recordingUrl?: string };
    download?: { files?: { name?:string; url?: string; type?: string; size?: number }[] };
  };
  duration?: number;
  isPreview: boolean;
  order: number;
  description?: string;
  isCompleted?: boolean;
}

interface Module {
  _id: string;
  id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
  isCompleted?: boolean;
}

interface CourseData {
  _id: string;
  title: string;
  instructor: { _id: string; name: string };
  modules: Module[];
  totalLessons: number;
}

interface Enrollment {
    _id: string;
    student: string;
    course: string | CourseData;
    status: 'active' | 'completed';
    progress: {
        completedLessons: {
            lesson: string;
            completedAt: Date;
            _id: string;
        }[];
        percentageComplete: number; // We are now ignoring this
        totalTimeSpent: number;
    };
    completedAt?: Date;
}
// --- End Type Definitions ---

// ### NEW: Assignment Submission Type ###
interface AssignmentSubmission {
  _id: string;
  content: string;
  status: 'submitted' | 'graded';
  grade?: number; // 0 = Fail, 1 = Pass
  feedback?: string;
}
// ---------------------------------

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Helper function to check if a string is a URL
const isUrl = (str: string): boolean => {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
};


const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ### NEW: State for success messages ###
  const [message, setMessage] = useState<string | null>(null);
  
  const [lessonStartTime, setLessonStartTime] = useState<number>(Date.now());
  const [isAuthor, setIsAuthor] = useState(false);

  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const lessonContentRef = useRef<HTMLDivElement>(null);

  // --- State for Assignment Submission ---
  const [assignmentContent, setAssignmentContent] = useState<string>("");
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'loading' | 'unsubmitted' | 'submitted' | 'graded'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- Extract stable ID from user object ---
  const userId = user?.id || user?._id;

  // --- Main data fetching effect (Unchanged) ---
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) { return; }
      if (!isAuthenticated || !userId) { 
        setError("You must be logged in to view this course."); 
        setIsLoading(false); 
        return; 
      }
      
      setIsLoading(true); 
      setError(null);
      
      setCourse(prevCourse => prevCourse?._id === courseId ? prevCourse : null);
      setCurrentLesson(null);

      try {
        const courseResponse = await axiosInstance.get<{ success: boolean; data: CourseData }>(`/courses/${courseId}`);
        if (!courseResponse.data.success || !courseResponse.data.data) { 
          throw new Error(courseResponse.data.message || "Failed to fetch course content."); 
        }
        
        const fetchedCourse = courseResponse.data.data;
        const authorCheck = (userId === fetchedCourse.instructor._id);
        setIsAuthor(authorCheck);
        
        let userEnrollment: Enrollment | undefined = undefined;
        if (authorCheck) { 
          setEnrollment(null); 
        } else {
          const enrollmentResponse = await axiosInstance.get<{ success: boolean; data: Enrollment[] }>('/enrollments');
          if (enrollmentResponse.data.success && enrollmentResponse.data.data) {
            userEnrollment = enrollmentResponse.data.data.find((enr: Enrollment) => {
              const enrolledCourseId = typeof enr.course === 'string' ? enr.course : enr.course?._id;
              return enrolledCourseId === courseId;
            });
          }
          if (!userEnrollment) { 
            throw new Error("You are not enrolled in this course. Please enroll to access the content."); 
          }
          setEnrollment(userEnrollment);
        }
        
        const processedCourse: CourseData = {
          ...fetchedCourse,
          modules: (fetchedCourse.modules || []).map((mod: any, modIndex: number) => ({
            ...mod, id: mod.id || mod._id || generateId('mod_fallback'), _id: mod._id, order: mod.order ?? modIndex,
            lessons: (mod.lessons || []).map((les: any, lesIndex: number) => {
              const finalId = les.id || les._id || generateId('les_fallback');
              const lessonType = (les.type && ['video', 'text', 'quiz', 'assignment', 'live', 'download'].includes(les.type)) ? les.type : 'video';
              return { ...les, id: finalId, _id: les._id || finalId, type: lessonType, order: les.order ?? lesIndex, quizId: les.content?.quiz?._id || les.content?.quiz, };
            })
          }))
        };
        
        setCourse(processedCourse);
        
      } catch (err) {
        console.error("Error loading course player data:", err);
        if (axios.isAxiosError(err)) { setError(err.response?.data?.message || err.message); } else if (err instanceof Error) { setError(err.message); } else { setError('An unexpected error occurred.'); }
      } finally { 
        setIsLoading(false); 
      }
    };

    fetchData();
  }, [courseId, userId, isAuthenticated, authLoading]); 


  // --- This effect sets the INITIAL lesson (Unchanged) ---
  useEffect(() => {
    if (currentLesson || !course) {
      return;
    }
    if (course.modules?.length > 0) {
      const sortedModules = [...course.modules].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
      if (sortedModules[0]?.lessons?.length > 0) {
        const firstLesson = sortedModules[0].lessons.sort((a,b) => (a.order ?? 0) - (b.order ?? 0))[0];
        const hasAccess = firstLesson.isPreview || !!enrollment || isAuthor;
        if (firstLesson && hasAccess) {
          setCurrentLesson(firstLesson);
        }
      }
    }
  }, [course, currentLesson, enrollment, isAuthor]);


  // --- Effect to fetch video title (Unchanged) ---
  useEffect(() => {
    if (!currentLesson) return;
    if (currentLesson.type === 'video' && isUrl(currentLesson.title)) {
      const videoUrl = currentLesson.content?.video?.url;
      if (!videoUrl) return;
      axiosInstance.get('/utils/oembed', { params: { url: videoUrl } })
      .then(response => {
        if (response.data.success && response.data.title) {
          const newTitle = response.data.title;
          // Update course state
          setCourse(prevCourse => {
            if (!prevCourse) return null;
            const newModules = prevCourse.modules.map(module => ({
              ...module,
              lessons: module.lessons.map(lesson => {
                if (lesson._id === currentLesson._id) {
                  return { ...lesson, title: newTitle };
                }
                return lesson;
              })
            }));
            return { ...prevCourse, modules: newModules };
          });
          // Update lesson state
          setCurrentLesson(prevLesson => {
            if (!prevLesson) return null;
            return { ...prevLesson, title: newTitle };
          });
        }
      })
      .catch(err => { console.error("Failed to fetch video title", err); });
    }
  }, [currentLesson]);


  // --- Effect to handle secure file downloads (Unchanged) ---
  useEffect(() => {
    const contentElement = lessonContentRef.current;
    if (!contentElement) return;
    const handleSecureClick = async (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) { console.error("VITE_API_BASE_URL is not set!"); return; }
      if (target && target.href && target.href.startsWith(baseUrl) && target.href.includes('/api/assets')) {
        event.preventDefault();
        const urlParams = new URL(target.href).searchParams;
        const filename = urlParams.get('name') || 'downloaded-file';
        const relativeUrl = target.href.substring(baseUrl.length);
        try {
          setIsDownloadingFile(true); 
          const response = await axiosInstance.get(relativeUrl); 
          if (!response.data.success || !response.data.url) { throw new Error(response.data.message || 'Could not get secure download link.'); }
          const signedUrl = response.data.url;
          const fileResponse = await fetch(signedUrl);
          if (!fileResponse.ok) { throw new Error(`Failed to download file: ${fileResponse.statusText}`); }
          const blob = await fileResponse.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', filename); 
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
          console.error('File download error:', err);
          setError('Failed to download the file. Please try again.');
        } finally {
          setIsDownloadingFile(false);
        }
      }
    };
    contentElement.addEventListener('click', handleSecureClick);
    return () => { contentElement.removeEventListener('click', handleSecureClick); };
  }, [currentLesson]);


  // --- Effect to load assignment submission (Unchanged) ---
  useEffect(() => {
    if (currentLesson && currentLesson.type === 'assignment' && !isAuthor) {
      setSubmissionStatus('loading');
      setAssignmentContent('');
      setSubmission(null); // Clear previous submission
      
      axiosInstance.get('/submissions', {
        params: { lessonId: currentLesson._id }
      })
      .then(response => {
        if (response.data.success && response.data.data) {
          const subData: AssignmentSubmission = response.data.data;
          setSubmission(subData); // <-- Store the full submission
          setAssignmentContent(subData.content);
          setSubmissionStatus(subData.status); 
        } else {
          setSubmissionStatus('unsubmitted');
        }
      })
      .catch(err => {
        console.error("Error fetching submission:", err);
        setError("Could not load your previous submission.");
        setSubmissionStatus('unsubmitted');
      });
    }
  }, [currentLesson, isAuthor]);


  useEffect(() => { 
    if (currentLesson) { 
      setLessonStartTime(Date.now()); 
      setMessage(null); // Clear message on new lesson
      setError(null); // Clear error on new lesson
    } 
  }, [currentLesson]);

  // --- isLessonCompleted (Unchanged) ---
  const isLessonCompleted = (lessonId: string): boolean => {
      // Add a check for enrollment
      if (!enrollment || !enrollment.progress || !enrollment.progress.completedLessons) return false;
      return enrollment.progress.completedLessons.some(l => l.lesson === lessonId);
  };

  // --- handleMarkComplete (FIXED for Race Condition & State Sync) ---
  const handleMarkComplete = async () => {
      if (!currentLesson || !courseId) return; // Make sure we have courseId
      
      if (isAuthor) { 
        findAndSetNextLesson(currentLesson._id); 
        return; 
      }
      
      if (isLessonCompleted(currentLesson._id)) {
        findAndSetNextLesson(currentLesson._id);
        return;
      }
      
      if (!enrollment || !enrollment._id) { 
        console.error("Cannot mark complete: Enrollment data is missing or invalid.", enrollment); 
        setError("Your enrollment data could not be found. Please refresh the page and try again.");
        return; 
      }

      const endTime = Date.now();
      const timeSpentInSeconds = Math.max(1, Math.round((endTime - lessonStartTime) / 1000));
      
      // 1. SET LOADING TRUE
      setIsLoading(true); 

      try {
        // 2. Call the backend to complete the lesson
        // This is the single API call. It returns the two key sources of truth: enrollment and totalLessons.
        const response = await axiosInstance.post(
          `/enrollments/${enrollment._id}/complete-lesson`, 
          { lessonId: currentLesson._id, timeSpent: timeSpentInSeconds }
        );
        
        if (response.data.success && response.data.data) {
          
          // 3. Destructure the two key sources of truth
          const { enrollment: newEnrollment, totalLessons: newTotalLessons } = response.data.data;

          // 4. Set the new enrollment (Source of COMPLETED count / Numerator)
          setEnrollment(newEnrollment); 

          // 5. Set the new totalLessons on the course (Source of TOTAL count / Denominator)
          setCourse(prevCourse => {
            if (!prevCourse) return null; 
            return { ...prevCourse, totalLessons: newTotalLessons };
          });

          // 6. Finally, move to the next lesson
          findAndSetNextLesson(currentLesson._id);

        } else { 
          throw new Error(response.data.message || "Failed to mark lesson complete"); 
        }
      } catch (error) { 
        console.error("Error marking lesson complete:", error); 
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not mark lesson as complete. Please try again.");
        }
      } finally { 
        // 7. SET LOADING FALSE *AFTER* EVERYTHING IS DONE
        setIsLoading(false); 
      }
  };

  // --- findAndSetNextLesson (Unchanged) ---
  const findAndSetNextLesson = (completedLessonId: string) => {
      if (!course) return;
      let foundCurrent = false; let nextLesson: Lesson | null = null;
      const sortedModules = [...course.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const module of sortedModules) {
        const sortedLessons = [...module.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const lesson of sortedLessons) {
          if (foundCurrent) { nextLesson = lesson; break; }
          if (lesson._id === completedLessonId) { foundCurrent = true; }
        }
        if (nextLesson) break;
      }
      if (nextLesson) { setCurrentLesson(nextLesson); } else { console.log("Completed the last lesson or couldn't find next lesson."); }
  };


  // ### UPDATED: Handler for Assignment Submission ###
  const handleAssignmentSubmit = async () => {
    // Check if grade is NOT Pass (grade is 1 for Pass, 0 for Fail)
    const canResubmit = submissionStatus === 'graded' && submission?.grade === 0;

    if (!currentLesson || !course || !assignmentContent || isSubmitting || (submissionStatus === 'graded' && !canResubmit)) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null); // Clear previous messages
    setError(null);

    try {
      const response = await axiosInstance.post('/submissions', {
        lessonId: currentLesson._id,
        courseId: course._id,
        content: assignmentContent
      });

      if (response.data.success && response.data.data) {
        const newSub: AssignmentSubmission = response.data.data;
        setSubmission(newSub); // <-- Store new submission
        setSubmissionStatus(newSub.status);
        
        // Check if the lesson is already marked complete.
        if (!isLessonCompleted(currentLesson._id)) {
          // If it's not complete, this is the FIRST submission. Mark as complete.
          // handleMarkComplete will now update both enrollment and course state.
          await handleMarkComplete(); 
        } else if (canResubmit) {
          // If it IS complete, this is a RESUBMISSION (after a fail).
          // Show a success message instead of calling handleMarkComplete.
          setMessage("Your assignment has been resubmitted for grading.");
        }
        
      } else {
        throw new Error(response.data.message || 'Failed to submit');
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit your assignment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- Render Logic (Unchanged) ---
  if (authLoading || (isLoading && !course && !error)) { 
      return ( <div className="min-h-screen flex items-center justify-center"> <div className="flex flex-col items-center"> <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div> <p className="text-gray-600 font-body text-lg">Loading Course Player...</p> </div> </div> );
  }

  // --- UPDATED: Error and Message Display ---
  const showNotification = error || message;
  const notificationType = error ? 'error' : 'success';

  if (showNotification && !isLoading) {
    // We use a key on the div to force re-mount, which restarts the timer
    const timer = setTimeout(() => {
      if (message) setMessage(null);
      if (error) setError(null);
    }, 5000);
  }
  // --- End of Update ---


  if (!course) { 
      return ( <div className="min-h-screen flex items-center justify-center px-4"> <div className="text-center"> <h1 className="text-2xl font-headline font-bold text-gray-900 mb-4">Error</h1> <p className="text-gray-600 font-body">Could not load course data. Please try again.</p> <Link to="/dashboard" className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body"> Back to Dashboard </Link> </div> </div> );
  }

  if (!enrollment && !isAuthor) { 
      return ( <div className="min-h-screen flex items-center justify-center px-4"> <div className="text-center"> <h1 className="text-2xl font-headline font-bold text-gray-900 mb-4">Enrollment Error</h1> <p className="text-gray-600 font-body">Could not verify your enrollment for this course.</p> <Link to={`/course/${courseId}`} className="mt-4 inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 font-body"> Back to Course Page </Link> </div> </div> );
  }

  // --- Helper Functions (Unchanged) ---
  const getResourceIcon = (type: string) => {
      switch (type) {
        case 'video': return <Play className="h-4 w-4" />;
        case 'text': return <FileText className="h-4 w-4" />;
        case 'quiz': return <HelpCircle className="h-4 w-4" />;
        case 'assignment': return <BookOpen className="h-4 w-4" />;
        case 'live': return <Video className="h-4 w-4" />;
        case 'download': return <Download className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
      }
  };
  const formatDuration = (totalMinutes?: number): string => {
      if (totalMinutes === undefined || totalMinutes === null || totalMinutes <= 0) {
        return '';
      }
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      let durationStr = '';
      if (hours > 0) {
        durationStr += `${hours}h `;
      }
      if (minutes > 0 || hours === 0) {
        durationStr += `${minutes}m`;
      }
      return durationStr.trim();
  };
  
  // --- THE CORE PROGRESS CALCULATION ---
  // Using only the two sources of truth: enrollment array length and course totalLessons state.
  const completedCount = enrollment?.progress?.completedLessons?.length || 0;
  const totalCount = course?.totalLessons || 0; 
  
  const progressPercentage = (isAuthor 
    ? 100 
    : (totalCount > 0 ? ((completedCount / totalCount) * 100) : 0)
  ).toFixed(0);


  // --- Main JSX (UPDATED) ---
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      
      {/* ### THIS IS THE FIXED LINE ### */}
      {/* --- Main Content Area (Player) --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar (Unchanged) */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
           <Link to={`/course/${course._id}`} className="text-sm font-medium text-gray-600 hover:text-primary-500 hidden md:block">
             &larr; Back to Course Details
           </Link>
           <h1 className="text-lg md:text-xl font-bold text-gray-800 font-headline truncate px-4 flex-1 text-center md:text-left">
             {course.title} {currentLesson ? `- ${currentLesson.title}` : ''}
           </h1>
           {/* This will now update correctly */}
           <div className="text-sm text-gray-500 whitespace-nowrap">
             {isAuthor ? "Instructor Mode" : `${progressPercentage}% Complete`}
           </div>
        </header>

        {/* Lesson Content Area (Unchanged from prev step) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
           {(isDownloadingFile || (isLoading && !course) ) && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 rounded-lg">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
                <p className="text-white text-lg mt-2 font-body">
                  {isDownloadingFile ? 'Preparing your download...' : 'Loading Course...'}
                </p>
              </div>
            )}
            
           {/* ### NEW: Global Notification ### */}
           {showNotification && (
             <div key={message || error} className={`max-w-4xl mx-auto mb-4 p-4 rounded-lg border ${notificationType === 'error' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-green-100 border-green-300 text-green-800'}`} role="alert">
               <p className="font-semibold">{notificationType === 'error' ? 'Error' : 'Success'}</p>
               <p>{showNotification}</p>
             </div>
           )}

           {currentLesson ? (
               // ### This is the fix from the previous step ###
               <div className={`
                 bg-white rounded-lg shadow-inner overflow-hidden 
                 ${currentLesson.type !== 'video' ? 'max-w-4xl mx-auto' : ''}
               `}>

                   {/* --- Video Player (Unchanged) --- */}
                   {currentLesson.type === 'video' && (
                       <div className="aspect-video bg-black">
                           {currentLesson.content?.video?.url ? (
                                <VideoPlayer
                                    key={currentLesson._id}
                                    options={{
                                      autoplay: false,
                                      controls: true,
                                      responsive: true,
                                      fluid: true,
                                      sources: [{
                                        src: currentLesson.content.video.url,
                                        type: 'video/youtube'
                                      }],
                                    }}
                                    onReady={(player) => {
                                      console.log(`Player ready for lesson: ${currentLesson.title}`);
                                    }}
                                  />
                           ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                   <p className="text-white font-body">Video URL is missing for this lesson.</p>
                                </div>
                           )}
                       </div>
                   )}
                   {/* --- End Video Player --- */}

                   {/* ### UPDATED: Text and Assignment Blocks ### */}
                   {(currentLesson.type === 'text' || currentLesson.type === 'assignment') && ( 
                     <div className="p-6 md:p-8"> 
                       <h2 className="text-2xl lg:text-3xl font-bold font-headline mb-4 text-gray-900">{currentLesson.title}</h2> 
                       
                       <div 
                         ref={lessonContentRef} 
                         className="prose prose-sm sm:prose lg:prose-lg max-w-none" 
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize( currentLesson.type === 'text' ? currentLesson.content?.text?.body || '' : currentLesson.content?.assignment?.instructions || '' ) }} 
                       /> 
                       
                       {/* --- NEW: Assignment Submission Box --- */}
                       {currentLesson.type === 'assignment' && !isAuthor && ( 
                         <div className="mt-8 pt-6 border-t"> 
                           
                           {submissionStatus === 'loading' && (
                             <div className="flex items-center justify-center h-40">
                               <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                             </div>
                           )}
                           
                           {/* --- UPDATED: Show Graded Status --- */}
                           {submissionStatus === 'graded' && (
                              <div className={`p-4 border rounded-lg mb-4 ${submission?.grade === 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h4 className={`font-semibold flex items-center ${submission?.grade === 1 ? 'text-green-800' : 'text-red-800'}`}>
                                  {submission?.grade === 1 ? <CheckCircle className="h-5 w-5 mr-2" /> : <X className="h-5 w-5 mr-2" />}
                                  Assignment Graded: {submission?.grade === 1 ? 'Pass' : 'Fail'}
                                </h4>
                                {submission?.feedback && (
                                  <div className="mt-3 text-sm text-gray-700">
                                    <p className="font-semibold mb-1">Instructor Feedback:</p>
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(submission.feedback) }} />
                                  </div>
                                )}
                              </div>
                           )}

                           {/* --- UPDATED: Show Editor if not Passed --- */}
                           {/* Show if (not graded) OR (graded AND failed) */}
                           {(submissionStatus !== 'loading' && (submissionStatus !== 'graded' || submission?.grade === 0)) && (
                             <>
                               <h3 className="text-lg font-semibold mb-3">
                                 {submissionStatus === 'unsubmitted' ? 'Submit Your Assignment' : 'Resubmit Your Assignment'}
                               </h3>
                               <RichTextEditor
                                 content={assignmentContent}
                                 onChange={setAssignmentContent}
                               />
                               <button 
                                 onClick={handleAssignmentSubmit}
                                 disabled={isSubmitting || submissionStatus === 'loading' || !assignmentContent || assignmentContent === '<p></p>'}
                                 className="mt-4 inline-flex items-center bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 {isSubmitting ? (
                                   <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                 ) : (
                                   <Send className="h-5 w-5 mr-2" />
                                 )}
                                 
                                 {isSubmitting 
                                   ? 'Submitting...' 
                                   : (submissionStatus === 'submitted' || submission?.grade === 0)
                                   ? 'Update Submission'
                                   : 'Submit Assignment'
                                 }
                               </button>
                               {submissionStatus === 'submitted' && !isSubmitting && (
                                  <p className="text-sm text-green-600 mt-2">Your assignment is awaiting grading.</p>
                               )}
                             </>
                           )}
                           {/* --- END UPDATED BLOCK --- */}
                         </div> 
                       )}

                       {currentLesson.type === 'assignment' && isAuthor && (
                         <div className="mt-8 pt-6 border-t">
                           <h3 className="text-lg font-semibold mb-3">Submission Status</h3>
                           <p className="text-gray-600 text-sm">You are in instructor mode. Students will see the submission box here.</p>
                         </div>
                       )}

                     </div> 
                   )}
                   {/* --- END OF UPDATED BLOCK --- */}

                   {/* ### UPDATED: Quiz Block ### */}
                   {currentLesson.type === 'quiz' && ( 
                     <div className="p-6 md:p-8 text-center font-body"> 
                       <h2 className="text-2xl lg:text-3xl font-bold font-headline mb-4 text-gray-900">{currentLesson.title}</h2> 
                       
                       {/* Show completed message if already done */}
                       {isLessonCompleted(currentLesson._id) && !isAuthor && (
                         <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-left max-w-md mx-auto">
                           <h4 className="font-semibold text-green-800 flex items-center">
                             <CheckCircle className="h-5 w-5 mr-2" />
                             Quiz Completed
                           </h4>
                           <p className="text-sm text-gray-700 mt-1">You have already completed this quiz. You can move on to the next lesson.</p>
                         </div>
                       )}

                       {/* Show quiz link if not completed or if author */}
                       {(!isLessonCompleted(currentLesson._id) || isAuthor) && (
                         <>
                           <p className="text-gray-700 mb-6">Ready to test your knowledge?</p> 
                           {currentLesson.content?.quiz ? ( 
                             <Link 
                               to={`/quiz/${currentLesson.content.quiz}`} 
                               // Pass the enrollmentId and lessonId to the quiz page
                               state={{ 
                                 enrollmentId: enrollment?._id, 
                                 lessonId: currentLesson._id 
                               }}
                               className="inline-block bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                             > 
                               {isAuthor ? 'Preview Quiz' : 'Start Quiz'}
                             </Link> 
                           ) : ( <p className="text-red-600">Quiz link is missing for this lesson.</p> )}
                         </>
                       )}
                     </div> 
                   )}
                   {/* --- END OF UPDATED BLOCK --- */}

                   {/* --- Other Lesson Types (Unchanged) --- */}
                   {currentLesson.type === 'download' && ( 
                     <div className="p-6 md:p-8"> 
                       <h2 className="text-2xl lg:text-3xl font-bold font-headline mb-4 text-gray-900">{currentLesson.title}</h2> 
                       <div ref={lessonContentRef}>
                         {(currentLesson.content?.download?.files && currentLesson.content.download.files.length > 0) ? ( 
                           <ul className="space-y-3"> 
                             {currentLesson.content.download.files.map((file, index) => ( 
                               <li key={index}> 
                                 <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name || true} className="flex items-center space-x-2 text-primary-600 hover:text-primary-800 hover:underline font-medium"> <Download className="h-5 w-5 flex-shrink-0" /> <span>{file.name || 'Download File'}</span> {file.size && <span className="text-sm text-gray-500">({(file.size / (1024*1024)).toFixed(1)} MB)</span>} </a> 
                               </li> 
                             ))} 
                           </ul> 
                         ) : ( <p className="text-gray-600 font-body">No downloadable files attached to this lesson.</p> )}
                       </div>
                     </div> 
                   )}
                   {currentLesson.type === 'live' && ( <div className="p-6 md:p-8 text-center font-body"> <h2 className="text-2xl lg:text-3xl font-bold font-headline mb-4 text-gray-900">{currentLesson.title}</h2> <p className="text-gray-700 mb-2">This is a live session.</p> {currentLesson.content?.live?.scheduledAt && ( <p className="text-gray-600 mb-1">Scheduled for: {new Date(currentLesson.content.live.scheduledAt).toLocaleString()}</p> )} {currentLesson.content?.live?.meetingUrl ? ( <a href={currentLesson.content.live.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"> Join Live Session </a> ) : ( <p className="mt-4 text-gray-500">Meeting link not available yet.</p> )} {currentLesson.content?.live?.recordingUrl && ( <a href={currentLesson.content.live.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 ml-4 border border-primary-500 text-primary-500 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"> View Recording </a> )} </div> )}

                   {/* ### UPDATED: Lesson Footer ### */}
                   <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-4 justify-between items-center">
                        <div> <h3 className="font-semibold text-gray-800">{currentLesson.title}</h3> <p className="text-sm text-gray-500 capitalize">{currentLesson.type}</p> </div> 
                        
                        {/* --- "Mark as Complete" Button --- */}
                        {/* Now hidden for 'assignment' AND 'quiz' types */}
                        {!isAuthor && !isLessonCompleted(currentLesson._id) && 
                          ['video', 'text', 'download', 'live'].includes(currentLesson.type) && ( 
                          <button 
                            onClick={handleMarkComplete} 
                            disabled={isLoading} 
                            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg font-body font-semibold flex items-center space-x-2 transition-colors text-sm sm:text-base"
                          > 
                            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                            <span>{isLoading ? 'Saving...' : 'Mark as Complete'}</span> 
                          </button> 
                        )} 
                        
                        {/* --- "Completed" Badge --- */}
                        {!isAuthor && isLessonCompleted(currentLesson._id) && ( 
                          <div className="text-green-600 font-semibold flex items-center space-x-2 text-sm sm:text-base"> 
                            <CheckCircle className="h-5 w-5" /> <span>Completed</span> 
                          </div> 
                        )} 
                        
                        {/* --- "Next Lesson" Button --- */}
                        {(isAuthor || isLessonCompleted(currentLesson._id)) && ( 
                          <button 
                            onClick={() => findAndSetNextLesson(currentLesson._id)} 
                            disabled={isLoading} 
                            className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-3 sm:px-4 py-2 rounded-lg font-body font-semibold flex items-center space-x-2 transition-colors text-sm sm:text-base"
                          > 
                            <span>Next Lesson</span> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                           </button> 
                        )}
                   </div>
               </div>
           ) : ( // No current lesson selected
               <div className="bg-white rounded-lg shadow-inner p-8 text-center max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 font-headline">Welcome!</h2>
                  <p className="text-gray-600 font-body">Select a lesson from the curriculum sidebar to get started.</p>
               </div>
           )}
        </main>
      </div>

      {/* --- Curriculum Sidebar (Unchanged) --- */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-l shadow-xl overflow-y-auto flex-shrink-0 md:h-screen sticky md:top-0">
          <div className="p-4 sticky top-0 bg-white z-10 border-b"> 
            <h2 className="text-lg sm:text-xl font-headline font-bold text-gray-900 mb-1">Course Curriculum</h2> 
            {/* These progress elements will now update when 'enrollment' AND 'course' changes */}
            <p className="text-xs sm:text-sm text-gray-600 font-body"> {isAuthor ? "Instructor Mode" : `${completedCount} / ${totalCount} lessons complete`} </p> 
            {!isAuthor && ( 
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2.5 mt-2 overflow-hidden"> 
                {/* This style will now use the frontend-calculated percentage */}
                <div 
                  className="bg-green-500 h-1.5 sm:h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }} >
                </div> 
              </div> 
            )} 
          </div>
          <div className="p-2 sm:p-4 space-y-2 sm:space-y-4"> {course && course.modules.length > 0 ? ( 
            course.modules.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map((module, index) => ( 
            <details key={module._id || module.id} className="border rounded-lg overflow-hidden group bg-white" open={index === 0 || module.lessons.some(l => l._id === currentLesson?._id)}> 
              <summary className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 list-none"> 
                <h3 className="font-semibold text-gray-800 font-body text-sm sm:text-base flex-1 mr-2 truncate"> {(module.order ?? index) + 1}. {module.title} </h3>
                <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" /> 
              </summary> 
              <div className="divide-y divide-gray-100"> 
                {module.lessons.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(lesson => { 
                  // This will now re-render when 'enrollment' state changes
                  const isCompleted = isLessonCompleted(lesson._id); 
                  const isCurrent = currentLesson?._id === lesson._id; 
                  const isLocked = !isAuthor && !enrollment && !lesson.isPreview; 
                  return ( 
                  <button 
                    key={lesson._id || lesson.id} 
                    onClick={() => !isLocked && setCurrentLesson(lesson)} 
                    disabled={isLocked} 
                    className={`w-full text-left p-3 flex items-center space-x-2 sm:space-x-3 transition-colors ${ isCurrent ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-gray-50' } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} > 
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center"> {isCompleted && !isAuthor ? <CheckCircle className="h-full w-full text-green-500" /> : isLocked ? <Lock className="h-full w-full text-gray-400" /> : <div className={`h-full w-full flex items-center justify-center ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>{getResourceIcon(lesson.type)}</div>} </div> 
                    <div className="flex-1 overflow-hidden"> 
                      <p className={`text-sm truncate ${isCurrent ? 'text-primary-700' : 'text-gray-800'}`}>{lesson.title}</p> 
                      {lesson.duration != null && lesson.duration > 0 && ( <span className="text-xs text-gray-500">{formatDuration(lesson.duration)}</span> )} 
                    </div> 
                  </button> ); 
                })} 
              </div> 
            </details> )) 
          ) : ( <p className="text-gray-600 font-body p-4 text-center">Curriculum not available.</p> )} 
        </div>
      </aside>
    </div>
  );
};

export default CoursePlayerPage;