// [COMPLETE CODE FOR: frontend/src/pages/QuizPlayerPage.tsx]

import React, { useEffect, useState, useCallback } from 'react';
// ### 1. Import useLocation ###
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
import ReactPlayer from 'react-player'; 

// Import ProseMirror base styles
import 'prosemirror-view/style/prosemirror.css';

// --- Interface Definitions (Unchanged) ---
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
    download?: { files?: { name?: string; url?: string; type?: string; size?: number }[] };
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
        percentageComplete: number;
        totalTimeSpent: number;
    };
    completedAt?: Date;
}

// --- Quiz & Result Interfaces (Unchanged) ---
interface QuizOption {
  _id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  _id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: QuizOption[];
  points: number;
  explanation?: string;
  correctAnswer?: string;
}

interface QuizData {
  _id: string;
  title: string;
  description: string;
  course: { _id: string, title: string, instructor: string }; 
  lesson: string;
  settings: {
    timeLimit: number;
    attempts: number;
    passingScore: number;
    showResults: 'immediately' | 'after-submission' | 'never';
    showCorrectAnswers: boolean;
  };
  questions: QuizQuestion[];
  instructions: string;
}

interface QuizApiResponse {
  success: boolean;
  data: QuizData;
  message?: string;
}

interface GradedAnswer {
    questionId: string;
    answer: any;
    isCorrect: boolean;
    points: number;
}

interface QuizResult {
    score: number;
    totalPoints: number; 
    percentage: number; 
    passed: boolean; // This is the final pass/fail status
    showResults: boolean;
    showCorrectAnswers?: boolean;
    answers?: GradedAnswer[];
}

interface AttemptHistory {
    attempts: any[];
    bestScore: number;
    passed: boolean;
}

interface QuizSubmitResponse {
    success: boolean;
    data: QuizResult;
    message?: string;
}

interface AttemptHistoryResponse {
    success: boolean;
    data: AttemptHistory;
}
// -----------------------------

const QuizPlayerPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const location = useLocation();
  const { enrollmentId, lessonId } = (location.state as { enrollmentId?: string, lessonId?: string }) || {};

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attemptData, setAttemptData] = useState<AttemptHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizState, setQuizState] = useState<'start' | 'active' | 'submitted'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [lessonStartTime, setLessonStartTime] = useState<number>(0);
  const [quizTimer, setQuizTimer] = useState<number | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  // --- Fetch Quiz Data & Attempt History (Unchanged) ---
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setError("You must be logged in to take a quiz.");
      setIsLoading(false);
      return;
    }
    if (!quizId) {
        setError("No Quiz ID provided.");
        setIsLoading(false);
        return;
    }

    const fetchQuizAndAttempts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const quizRes = await axiosInstance.get<QuizApiResponse>(`/quizzes/${quizId}`);
        
        if (!quizRes.data.success || !quizRes.data.data) {
          throw new Error(quizRes.data.message || 'Failed to fetch quiz data.');
        }

        const fetchedQuiz = quizRes.data.data;
        setQuiz(fetchedQuiz);

        const authorCheck = (user && fetchedQuiz.course?.instructor &&
                            (user.id === fetchedQuiz.course.instructor || user._id === fetchedQuiz.course.instructor));
        setIsAuthor(authorCheck);
        console.log(`User is author: ${authorCheck}`);

        if (authorCheck) {
            setAttemptData({ attempts: [], bestScore: 0, passed: false });
        } else {
            console.log('Quiz Player Loaded. Enrollment ID:', enrollmentId, 'Lesson ID:', lessonId);

            const attemptRes = await axiosInstance.get<AttemptHistoryResponse>(`/quizzes/${quizId}/attempts`);
            if (attemptRes.data.success && attemptRes.data.data) {
                setAttemptData(attemptRes.data.data);
            } else {
                console.warn("Could not fetch attempt history:", attemptRes.data.message);
                setAttemptData({ attempts: [], bestScore: 0, passed: false });
            }
        }

      } catch (err) {
        console.error("Error fetching quiz:", err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizAndAttempts();
  }, [quizId, isAuthenticated, authLoading, user, enrollmentId, lessonId]);

  // --- Timer Effect (Unchanged) ---
  useEffect(() => {
      let timerId: NodeJS.Timeout | null = null;
      if (quizState === 'active' && !isAuthor && quiz?.settings?.timeLimit && quiz.settings.timeLimit > 0) {
          if (quizTimer === null) {
              setQuizTimer(quiz.settings.timeLimit * 60);
          } else if (quizTimer > 0) {
              timerId = setTimeout(() => {
                  setQuizTimer(t => (t ? t - 1 : 0));
              }, 1000);
          } else if (quizTimer === 0) {
              console.log("Time's up! Submitting quiz...");
              handleSubmitQuiz(true);
          }
      }
      return () => { if (timerId) clearTimeout(timerId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState, quizTimer, quiz?.settings?.timeLimit, isAuthor]);


  // --- Quiz Action Handlers ---
  const handleStartQuiz = () => {
    setQuizState('active');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setQuizResults(null);
    setLessonStartTime(Date.now());
    setQuizTimer(null);
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1); 
    }
  };

  // --- handleSubmitQuiz (Unchanged) ---
  const handleSubmitQuiz = async (timeUp: boolean = false) => {
    if (!quiz) return;
    
    if (isAuthor) {
        console.log("Author preview submitted. No API call.");
        const totalPoints = quiz.questions.reduce((sum, q) => q.type !== 'essay' ? sum + (q.points || 0) : sum, 0);
        setQuizResults({
            score: 0,
            totalPoints: totalPoints,
            percentage: 0,
            passed: false,
            showResults: true,
            showCorrectAnswers: true,
            answers: quiz.questions.map(q => ({
                questionId: q._id,
                answer: answers.get(q._id) || "[No Answer]",
                isCorrect: false,
                points: 0
            }))
        });
        setQuizState('submitted');
        return;
    }

    if (!timeUp && answers.size !== quiz.questions.length) {
        if (!window.confirm("You have unanswered questions. Are you sure you want to submit?")) {
            return;
        }
    }

    setIsSubmitting(true);
    setError(null);

    const endTime = Date.now();
    const timeSpentInSeconds = Math.round((endTime - lessonStartTime) / 1000);

    const answersPayload = Array.from(answers.entries()).map(([questionId, answer]) => ({
      questionId: questionId,
      answer: answer 
    }));

    try {
        const response = await axiosInstance.post<QuizSubmitResponse>(
            `/quizzes/${quiz._id}/attempt`, 
            { 
                answers: answersPayload,
                timeSpent: timeSpentInSeconds
            }
        );
        
        if(response.data.success) {
            setQuizResults(response.data.data);
            setQuizState('submitted');

            const quizResult = response.data.data;
            
            if (quizResult.passed && enrollmentId && lessonId) {
                console.log('Quiz passed! Attempting to mark lesson as complete...');
                
                // --- DEBUG LOG START ---
                const completionPayload = {
                    lessonId: lessonId,
                    timeSpent: timeSpentInSeconds
                };
                console.log(`[DEBUG] Sending to complete-lesson API: URL: /enrollments/${enrollmentId}/complete-lesson, PAYLOAD:`, completionPayload);
                // --- DEBUG LOG END ---

                axiosInstance.post(`/enrollments/${enrollmentId}/complete-lesson`, completionPayload)
                .then(res => {
                    if (res.data.success) {
                        console.log('Lesson marked as complete successfully.');
                    } else {
                        console.warn('Quiz passed, but failed to mark lesson as complete on backend.');
                    }
                }).catch(err => {
                    console.error('Error marking lesson complete after quiz:', err);
                });
            }

            axiosInstance.get<AttemptHistoryResponse>(`/quizzes/${quizId}/attempts`)
                .then(res => setAttemptData(res.data.data));
        } else {
            throw new Error(response.data.message || "Failed to submit quiz");
        }

    } catch (err: any) {
         console.error("Quiz Submit Error:", err);
         setError(err.message || "An error occurred during submission.");
    } finally {
        setIsSubmitting(false);
    }
  };


  // --- Render Logic (Unchanged) ---
  if (isLoading || authLoading) { 
      return (
          <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
          </div>
      );
  }
  
  if (error && quizState !== 'active') { 
      return (
           <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
               <div className="bg-white p-8 rounded-lg shadow-lg border max-w-md text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-headline font-bold text-gray-900 mb-2">An Error Occurred</h2>
                    <p className="text-gray-600 font-body mb-6">{error}</p>
                    <Link 
                        to={'/dashboard'} 
                        className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-body font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </Link>
               </div>
           </div>
       );
  }
  
  if (!quiz) {
       return (
           <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
               <div className="bg-white p-8 rounded-lg shadow-lg border max-w-md text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-headline font-bold text-gray-900 mb-2">Quiz Not Found</h2>
                    <p className="text-gray-600 font-body mb-6">We couldn't find the quiz you're looking for.</p>
                    <Link 
                        to={'/dashboard'} 
                        className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-body font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </Link>
               </div>
           </div>
       );
  }

  // --- RENDER FUNCTIONS (Unchanged) ---

  const maxAttempts = quiz.settings.attempts || 1;
  const attemptsMade = attemptData?.attempts?.length || 0;
  const attemptsLeft = maxAttempts - attemptsMade;
  const canAttempt = isAuthor || maxAttempts === 0 || attemptsLeft > 0;

  const renderStartScreen = () => (
    <main className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border">
        <h2 className="text-2xl font-headline font-bold text-gray-900 mb-4">Instructions</h2>
        <div className="prose prose-sm sm:prose max-w-none mb-6">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(quiz.instructions || "<p>Read each question carefully and select the best answer.</p>") }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="text-center">
                <p className="text-sm font-body text-gray-600">Questions</p>
                <p className="text-2xl font-headline font-bold text-primary-500">{quiz.questions.length}</p>
            </div>
             <div className="text-center">
                <p className="text-sm font-body text-gray-600">Time Limit</p>
                <p className="text-2xl font-headline font-bold text-primary-500">
                    {quiz.settings.timeLimit > 0 ? `${quiz.settings.timeLimit} min` : 'No Limit'}
                </p>
            </div>
             <div className="text-center">
                <p className="text-sm font-body text-gray-600">Passing Score</p>
                <p className="text-2xl font-headline font-bold text-primary-500">{quiz.settings.passingScore}%</p>
            </div>
        </div>
        
        {!isAuthor && attemptData && (
             <div className="text-center mt-6">
                <p className="text-sm font-body text-gray-600">
                    You have <span className="font-bold">{maxAttempts === 0 ? 'Unlimited' : attemptsLeft}</span> attempt(s) remaining.
                </p>
                {attemptData.attempts.length > 0 && (
                    <p className="text-sm font-body text-gray-600">
                        Your best score so far: <span className="font-bold">{attemptData.bestScore} / {quiz.questions.reduce((acc, q) => acc + (q.points || 0), 0)}</span>
                    </p>
                )}
            </div>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={handleStartQuiz}
                disabled={!canAttempt || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-body font-semibold px-10 py-3 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAuthor ? 'Start Preview' : (attemptsMade > 0 ? 'Try Again' : 'Start Quiz')}
            </button>
            {!canAttempt && !isAuthor && (
                <p className="text-red-600 font-body mt-4">You have no attempts remaining.</p>
            )}
        </div>
   </main>
  );

  const renderActiveQuiz = () => {
    if (!quiz) return null;
    const question = quiz.questions[currentQuestionIndex];
    if (!question) return <p>Error: Question not found.</p>;

    const currentAnswer = answers.get(question._id);
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <main className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                     <p className="text-sm font-body font-medium text-gray-600 mb-1">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                     </p>
                     <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                        <div 
                            className="bg-primary-500 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                        ></div>
                     </div>
                 </div>
                 {quiz.settings.timeLimit > 0 && !isAuthor && (
                     <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                         <Clock className="h-5 w-5" />
                         <span>{quizTimer !== null ? formatTime(quizTimer) : '...'}</span>
                     </div>
                 )}
            </div>

            <div className="mb-8">
                 <p className="text-xs font-body text-gray-500 mb-1">{question.points} point(s)</p>
                 <h2 className="text-xl sm:text-2xl font-headline font-semibold text-gray-900 mb-6">
                    {question.question}
                 </h2>
                 <div className="space-y-3">
                    {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
                        question.options.map(option => (
                            <label 
                                key={option._id} 
                                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                    currentAnswer === option._id ? 'bg-primary-50 border-primary-400 ring-2 ring-primary-300' : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`answer-${question._id}`}
                                    value={option._id}
                                    checked={currentAnswer === option._id}
                                    onChange={() => handleAnswerSelect(question._id, option._id)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="font-body text-gray-800">{option.text}</span>
                            </label>
                        ))
                    )}
                    {question.type === 'short-answer' && (
                         <textarea
                            rows={2}
                            value={currentAnswer as string || ''}
                            onChange={(e) => handleAnswerSelect(question._id, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Type your short answer here..."
                        />
                    )}
                    {question.type === 'essay' && (
                         <textarea
                            rows={6}
                            value={currentAnswer as string || ''}
                            onChange={(e) => handleAnswerSelect(question._id, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Type your essay answer here..."
                        />
                    )}
                 </div>
            </div>

            {error && (
                 <div className="my-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex justify-between items-center border-t pt-6 mt-8">
                <button
                    onClick={handlePrevQuestion}
                    disabled={isFirstQuestion || isSubmitting}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                </button>
                
                {isLastQuestion ? (
                    <button
                        onClick={() => handleSubmitQuiz(false)}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-body font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>{isAuthor ? 'Finish Preview' : 'Submit Quiz'}</span>
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium disabled:opacity-50"
                    >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </main>
    );
  };
  
  const renderResultsScreen = () => {
      if (!quizResults || !quiz) return null;
      
      const { score, totalPoints, percentage, passed, showResults } = quizResults;
      const hasEssay = quiz.questions.some(q => q.type === 'essay');

      return (
         <main className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border">
            <div className="text-center">
                {isAuthor ? (
                    <Award className="h-16 w-16 text-primary-500 mx-auto mb-4" />
                ) : passed ? ( 
                    <Award className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
               
               <h2 className="text-3xl font-headline font-bold text-gray-900 mb-2">
                    {isAuthor ? "Preview Finished" : (passed ? "Congratulations, you passed!" : (hasEssay ? "Attempt Submitted" : "Attempt Finished"))}
               </h2>
           </div>
           
           {!isAuthor && showResults && (
               <>
                 <p className="text-lg text-gray-600 font-body mb-6 text-center">
                    {!hasEssay &&
                        `You scored ${score} out of ${totalPoints} (${percentage.toFixed(0)}%).`
                    }
                    {hasEssay &&
                        `You scored ${score} out of ${totalPoints} on the auto-graded questions. Your essay is pending review.`
                    }
                 </p>
                 
                 {!hasEssay && (
                     <div className="w-full bg-gray-200 rounded-full h-4 mb-8 max-w-md mx-auto">
                        <div 
                            className={`h-4 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                     </div>
                 )}
               </>
           )}
           
           {isAuthor && (
                <p className="text-lg text-gray-600 font-body mb-6 text-center">
                    This is a preview of the quiz results screen.
                </p>
           )}
           
           {!showResults && !isAuthor && (
               <p className="text-lg text-gray-600 font-body mb-6 text-center">
                 Your results have been submitted.
               </p>
           )}

           {/* Answer Review Section */}
           {(quizResults.showCorrectAnswers && (quizResults.answers || isAuthor)) && (
               <div className="mt-6 text-left border-t pt-6">
                    <h3 className="text-xl font-bold font-headline mb-4">Answer Review</h3>
                     <div className="space-y-6">
                         {quiz.questions.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map((question, index) => {
                            const gradedAnswer = quizResults.answers?.find(a => a.questionId === question._id);
                            const userAnswer = isAuthor ? answers.get(question._id) : gradedAnswer?.answer;
                            const userAnswerText = userAnswer ? String(userAnswer) : "[No Answer]";
                            const isCorrect = gradedAnswer?.isCorrect || false;

                            let correctAnswerText = question.correctAnswer || "";
                            if ((question.type === 'multiple-choice' || question.type === 'true-false') && question.options) {
                                const correctOption = question.options.find(opt => opt.isCorrect);
                                correctAnswerText = correctOption ? correctOption.text : "N/A";
                            }
                            
                            return (
                                <div key={question._id} className={`p-4 rounded-lg ${
                                    isAuthor ? 'bg-gray-50 border border-gray-200' :
                                    question.type === 'essay' ? 'bg-yellow-50 border border-yellow-200' : 
                                    (isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')
                                }`}>
                                    <p className="font-semibold font-body text-gray-900">{index+1}. {question.question}</p>
                                    
                                    <div className="flex items-start space-x-2 mt-3 text-sm">
                                        {isAuthor ? <User className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" /> : 
                                         (question.type === 'essay' ? <HelpCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" /> :
                                         (isCorrect ? <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" /> : 
                                         <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />))}
                                        
                                        <div className="flex-1">
                                            <span className={`font-medium ${
                                                isAuthor ? 'text-gray-700' : 
                                                question.type === 'essay' ? 'text-yellow-800' :
                                                (isCorrect ? 'text-green-800' : 'text-red-800')
                                            }`}>Your Answer:</span>
                                            <p className="text-gray-700 whitespace-pre-wrap">{
                                                (question.type === 'multiple-choice' || question.type === 'true-false')
                                                ? (question.options?.find(o => o._id === userAnswerText)?.text || userAnswerText)
                                                : userAnswerText
                                            }</p>
                                        </div>
                                    </div>
                                    
                                    {!isAuthor && !isCorrect && question.type !== 'essay' && (
                                         <div className="flex items-start space-x-2 mt-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="font-medium text-green-800">Correct Answer:</span>
                                                <p className="text-gray-700 whitespace-pre-wrap">{correctAnswerText}</p>
                                            </div>
                                         </div>
                                    )}

                                    {question.explanation && (
                                        <div className="mt-3 pt-3 border-t border-gray-200/60">
                                            <p className="text-sm text-gray-700 font-body"><strong className="font-semibold">Explanation:</strong> {question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )
                         })}
                     </div>
               </div>
           )}

           <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={handleStartQuiz}
                    disabled={!isAuthor && (maxAttempts > 0 && attemptsLeft <= 0)}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-body font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <Repeat className="h-4 w-4" />
                    <span>{isAuthor ? 'Restart Preview' : (maxAttempts === 0 ? 'Try Again' : `Try Again (${attemptsLeft} left)`)}</span>
                </button>
                 <Link 
                    to={`/learn/course/${quiz.course._id}`}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-body font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Course</span>
                </Link>
           </div>
         </main>
      );
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
       <header className="max-w-4xl mx-auto mb-6 sm:mb-8">
            <Link to={quiz ? `/learn/course/${quiz.course._id}` : '/dashboard'} className="text-sm font-medium text-gray-600 hover:text-primary-500">
             &larr; Back to Course
           </Link>
           <h1 className="text-3xl sm:text-4xl font-headline font-bold text-gray-900 mt-2">{quiz?.title || 'Loading Quiz...'}</h1>
           {quizState === 'start' && (
                <p className="text-lg text-gray-700 font-body mt-2">{quiz?.description}</p>
           )}
       </header>

       {/* Main Content: Switches based on quizState */}
       {quizState === 'start' && renderStartScreen()}
       {quizState === 'active' && renderActiveQuiz()}
       {quizState === 'submitted' && renderResultsScreen()}

    </div>
  );
};

export default QuizPlayerPage;