import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Save, Eye, Settings,
  Clock, CheckCircle, Circle, Type, Move, HelpCircle, FileText, Video, Loader2
} from 'lucide-react';
import { axiosInstance } from '../contexts/AuthContext'; 
import axios from 'axios';
import mongoose from 'mongoose'; // Added for isValid check

// --- Interface Definitions (Unchanged) ---
interface QuizOption {
  id: string; // local state ID
  _id?: string; // backend ID
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string; // local state ID
  _id?: string; // backend ID
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: QuizOption[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  order: number;
}

interface QuizData {
  id?: string; // The Quiz _id from backend
  title: string;
  description: string;
  courseId: string | { _id: string; [key: string]: any }; // Allow courseId to be object or string
  lessonId: string; // Lesson ID this quiz is attached to
  timeLimit: number; // in minutes, 0 = no limit
  attempts: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after-submission' | 'never';
  questions: QuizQuestion[];
  instructions: string;
}

// --- Props for the Component (Unchanged) ---
interface QuizBuilderProps {
    lessonId: string;
    quizId?: string; // Existing quiz ID if we are editing
    courseId: string;
    onSave: (quizId: string) => void; // Function to call when quiz is saved
    onCancel: () => void; // Function to call when modal is closed
}
// -----------------------------


// --- GLOBAL HELPER: Temporary mongoose stand-in for ObjectId validation (Unchanged) ---
const Mongoose = {
    Types: {
        ObjectId: class {}
    },
    isValidObjectId: (id: any) => {
         if (!id) return false;
         const idString = String(id);
         return /^[0-9a-fA-F]{24}$/.test(idString);
    }
}


// --- QUESTION EDITOR COMPONENT (Responsive) (Unchanged) ---
const QuestionEditor: React.FC<{
    question: QuizQuestion;
    onUpdate: (updates: Partial<QuizQuestion>) => void;
    onUpdateOption: (optionId: string, updates: Partial<QuizOption>) => void;
    onAddOption: () => void;
    onDeleteOption: (optionId: string) => void;
  }> = ({ question, onUpdate, onUpdateOption, onAddOption, onDeleteOption }) => (
    <div className="space-y-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-headline font-bold text-gray-900">Edit Question</h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-sm font-body text-gray-600">Points:</span>
          <input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate({ points: Number(e.target.value) || 1 })} // Ensure points >= 1
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Question *
        </label>
        <textarea
          rows={3}
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          placeholder="Enter your question here"
        />
      </div>

      {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
        <div>
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 gap-2">
            <label className="block text-sm font-body font-medium text-gray-700">
              Answer Options
            </label>
            {question.type === 'multiple-choice' && (
              <button
                onClick={onAddOption}
                className="text-primary-500 hover:text-primary-600 text-sm font-body font-medium flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Option</span>
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2 sm:space-x-3">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={() => {
                    // For multiple choice & true/false, only one option can be correct
                    question.options?.forEach(opt => {
                      onUpdateOption(opt.id, { isCorrect: opt.id === option.id });
                    });
                  }}
                  className="text-primary-500 focus:ring-primary-500 h-4 w-4"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  placeholder={`Option ${index + 1}`}
                  disabled={question.type === 'true-false'}
                />
                {question.type === 'multiple-choice' && question.options.length > 2 && (
                  <button
                    onClick={() => onDeleteOption(option.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(question.type === 'short-answer' || question.type === 'essay') && (
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Sample Answer (for reference)
          </label>
          <textarea
            rows={question.type === 'essay' ? 6 : 3}
            value={question.correctAnswer || ''}
            onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            placeholder="Enter a sample answer or key points to look for"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Explanation (optional)
        </label>
        <textarea
          rows={3}
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          placeholder="Explain why this is the correct answer"
        />
      </div>
    </div>
  );
// --- END QUESTION EDITOR DEFINITION ---


const QuizBuilder: React.FC<QuizBuilderProps> = ({ lessonId, quizId, courseId, onSave, onCancel }) => {
  const [quizData, setQuizData] = useState<QuizData>({
    title: 'New Quiz',
    description: '',
    courseId: courseId,
    lessonId: lessonId,
    timeLimit: 0,
    attempts: 1,
    passingScore: 70,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: 'after-submission',
    questions: [],
    instructions: ''
  });

  const [activeTab, setActiveTab] = useState('settings');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  // --- State for API ---
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial fetch
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // -----------------

  // --- Fetch Existing Quiz Data (FIXED LOADING LOGIC) ---
  useEffect(() => {
    setIsLoading(true);
    
    // 1. If no quizId is provided, assume NEW QUIZ, and immediately set loading to false.
    if (!quizId) {
        setQuizData(prev => ({ 
            ...prev, 
            id: undefined, // Ensure ID is clear
            questions: [], // Ensure questions are blank 
            courseId: courseId, 
            lessonId: lessonId 
        }));
        setIsLoading(false);
        return;
    }

    // 2. If quizId is provided, proceed with fetch (EDIT MODE)
    const fetchUrl = `/quizzes/${quizId}`; 

    axiosInstance.get(fetchUrl)
        .then(response => {
            const data = response.data.data;
            
            // ### FIX 1: If data is NOT found OR if the lesson ID doesn't match the current context, reset to blank.
            if (!data || data.lesson?.toString() !== lessonId) {
                setQuizData(prev => ({ 
                    ...prev, 
                    id: undefined, 
                    questions: [], 
                    title: 'New Quiz',
                    courseId: courseId, 
                    lessonId: lessonId 
                }));
                return;
            }

            // 3. Data exists and matches the lesson. Load it. (EDIT MODE)
            // We set courseId to data.course here, which might be an object.
            // This is OK, because handleSave will fix it.
            setQuizData({
                id: data._id,
                title: data.title || 'New Quiz',
                description: data.description || '',
                courseId: data.course || courseId, // Store whatever we get (object or string)
                lessonId: data.lesson?.toString() || lessonId,
                timeLimit: data.settings?.timeLimit || 0,
                attempts: data.settings?.attempts || 1,
                passingScore: data.settings?.passingScore || 70,
                shuffleQuestions: data.settings?.shuffleQuestions || false,
                shuffleOptions: data.settings?.shuffleOptions || false,
                showResults: data.settings?.showResults || 'after-submission',
                questions: (data.questions || []).map((q: any) => ({ 
                    ...q, 
                    id: q._id, 
                    options: (q.options || []).map((opt:any) => ({...opt, id: opt._id})) 
                })),
                instructions: data.instructions || ''
            });

            // Select the first question (if editing)
            if (data.questions && data.questions.length > 0) {
                 const sortedQuestions = [...data.questions].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
                 setSelectedQuestion(sortedQuestions[0]?._id);
            }
        })
        .catch(err => {
            console.error("Error fetching quiz data:", err);
            // Don't set a blocking error if it's just a 404 (no quiz found)
            if (axios.isAxiosError(err) && err.response && err.response.status !== 404) {
               setError("Failed to load quiz data. Please try again.");
            }
            // If the fetch fails for any reason in edit mode, default to a blank slate
            setQuizData(prev => ({ ...prev, id: undefined, questions: [] }));
        })
        .finally(() => {
            setIsLoading(false);
        });
  }, [lessonId, quizId, courseId]); 
  // -----------------------------

  // --- NEW: Detailed Validation Logic (Unchanged) ---
  const validateQuiz = (): { isValid: boolean; message: string; targetTab: string } => {
      if (!quizData.title || quizData.title.trim().length < 3) {
          return { isValid: false, message: "Quiz Title must be at least 3 characters.", targetTab: 'settings' };
      }
      if (quizData.questions.length === 0) {
          return { isValid: false, message: "Quiz must contain at least one question.", targetTab: 'questions' };
      }

      for (const [index, q] of quizData.questions.entries()) {
          if (!q.question.trim()) {
              return { isValid: false, message: `Question ${index + 1}: Question text cannot be empty.`, targetTab: 'questions' };
          }
          if (q.points <= 0) {
              return { isValid: false, message: `Question ${index + 1}: Points must be 1 or greater.`, targetTab: 'questions' };
          }

          if (q.type === 'multiple-choice' || q.type === 'true-false') {
              if (!q.options || q.options.length < 2) {
                  return { isValid: false, message: `Question ${index + 1}: Must have at least two options.`, targetTab: 'questions' };
              }
              if (!q.options.some(opt => opt.isCorrect)) {
                  return { isValid: false, message: `Question ${index + 1}: You must select at least one correct answer.`, targetTab: 'questions' };
              }
              if (q.options.some(opt => !opt.text.trim())) {
                  return { isValid: false, message: `Question ${index + 1}: All option text fields must be filled.`, targetTab: 'questions' };
              }
          }
          // Note: Short-answer/Essay correct answer is optional for Mongoose, so no validation needed here.
      }

      return { isValid: true, message: "Quiz is valid.", targetTab: 'settings' };
  };
  // --- END NEW VALIDATION ---


  // --- Save/Update Quiz Handler (UPDATED) ---
  const handleSave = async () => {
    // 1. Frontend validation
    const validation = validateQuiz();
    if (!validation.isValid) {
        setError(validation.message);
        setActiveTab(validation.targetTab);
        return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);
    
    // Prepare data for backend: filter out empty options and set IDs
    const backendQuestions = quizData.questions.map(q => {
        
        // Filter out options that have empty text. Mongoose schema likely rejects this.
        const filteredOptions = q.options?.filter(opt => opt.text.trim().length > 0);

        const questionData: any = { // Use any to allow dynamic deletion
             _id: Mongoose.isValidObjectId(q._id) ? q._id : undefined,
             type: q.type,
             question: q.question,
             points: q.points,
             // Clean up optional fields if they are empty
             correctAnswer: (q.correctAnswer && q.correctAnswer.trim().length > 0) ? q.correctAnswer : undefined,
             explanation: (q.explanation && q.explanation.trim().length > 0) ? q.explanation : undefined,
             order: q.order,
             
             // Map options, ensuring we don't send local state IDs
             options: filteredOptions?.map(opt => ({
                 _id: Mongoose.isValidObjectId(opt._id) ? opt._id : undefined,
                 text: opt.text,
                 isCorrect: opt.isCorrect,
             }))
        };
        
        // --- FINAL CLEANUP FIX ---
        // 1. If the field is optional and empty, delete it completely.
        if (questionData.correctAnswer === undefined) delete questionData.correctAnswer;
        if (questionData.explanation === undefined) delete questionData.explanation;
        
        // 2. Remove options array if the question type doesn't use it
        if (q.type === 'short-answer' || q.type === 'essay') {
             delete questionData.options;
        } else if (questionData.options && questionData.options.length === 0) {
             delete questionData.options;
        }

        return questionData;
    });

    const dataToSend = {
        title: quizData.title,
        description: quizData.description,
        // --- THIS IS THE NEW, ROBUST FIX ---
        // Check if courseId is an object. If yes, get its _id.
        // If it's not an object, use it as-is (it's already a string).
        course: (quizData.courseId && typeof quizData.courseId === 'object') 
                ? (quizData.courseId as any)._id 
                : quizData.courseId,
        lesson: quizData.lessonId,
        existingQuizId: quizData.id,
        questions: backendQuestions,
        instructions: quizData.instructions,
        settings: {
            timeLimit: quizData.timeLimit,
            attempts: quizData.attempts,
            passingScore: quizData.passingScore,
            shuffleQuestions: quizData.shuffleQuestions,
            shuffleOptions: quizData.shuffleOptions,
            showResults: quizData.showResults,
        }
    };
    
    // ### DEBUGGING LOG 1 (To check payload sent) ###
    console.log('Quiz Payload Check:', {
        course: dataToSend.course, // This should NOW be a string ID
        lesson: dataToSend.lesson,
        numQuestions: dataToSend.questions.length,
        hasId: !!dataToSend.existingQuizId,
        questions: dataToSend.questions.map(q => ({ type: q.type, question: q.question.substring(0, 30) + '...', options: q.options?.length }))
    });
    // ###############################################
    
    try {
        const response = await axiosInstance.post('/quizzes', dataToSend);
        
        if (response.data.success) {
            const savedQuizId = response.data.data._id;
            setMessage("Quiz saved successfully!");
            
            setQuizData(prev => ({ ...prev, id: savedQuizId })); 
            
            onSave(savedQuizId); 
            
            setTimeout(() => {
                onCancel(); 
            }, 1000);
        } else {
            throw new Error(response.data.message || "Save failed");
        }
    } catch (err) {
        console.error("Quiz Save Error:", err);
        if (axios.isAxiosError(err) && err.response?.data?.errors) {
            // ### TEMPORARY FIX TO SHOW BACKEND VALIDATION ERRORS ###
            const validationErrors = err.response.data.errors.map((e: any) => `${e.param}: ${e.msg}`).join('; ');
            setError(`Validation Error: ${validationErrors}`);
            // #######################################################
        } else if (axios.isAxiosError(err)) {
            setError(err.response?.data?.message || err.message);
        } else if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred while saving.");
        }
    } finally {
        setIsSaving(false);
    }
  };


  // --- Local State Handlers (Unchanged) ---
  const addQuestion = (type: QuizQuestion['type']) => {
    const newQuestion: QuizQuestion = {
      id: `temp_${Date.now()}`,
      type,
      question: '',
      points: 1,
      order: quizData.questions.length,
      ...(type === 'multiple-choice' && {
        options: [
          { id: `temp_${Date.now()+1}`, text: 'Option 1', isCorrect: true },
          { id: `temp_${Date.now()+2}`, text: 'Option 2', isCorrect: false },
        ]
      }),
      ...(type === 'true-false' && {
        options: [
          { id: 'tf_1', text: 'True', isCorrect: true },
          { id: 'tf_2', text: 'False', isCorrect: false }
        ]
      })
    };

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestion(newQuestion.id);
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuizOption>) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? {
              ...q,
              options: q.options?.map(opt => 
                opt.id === optionId ? { ...opt, ...updates } : opt
              )
            }
          : q
      )
    }));
  };

  const addOption = (questionId: string) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question?.options) return;

    const newOption: QuizOption = {
      id: `temp_${Date.now()}`,
      text: 'New Option',
      isCorrect: false
    };

    updateQuestion(questionId, {
      options: [...question.options, newOption]
    });
  };

  const deleteQuestion = (questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    if (selectedQuestion === questionId) {
      setSelectedQuestion(quizData.questions.length > 1 ? quizData.questions[0].id : null); // Select first or null
    }
  };

  const deleteOption = (questionId: string, optionId: string) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question?.options || question.options.length <= 2) return; // Min 2 options

    updateQuestion(questionId, {
      options: question.options.filter(opt => opt.id !== optionId)
    });
  };


  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Quiz Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Quiz Title *
          </label>
          <input
            type="text"
            value={quizData.title}
            onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            placeholder="Enter quiz title"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={quizData.timeLimit}
            onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            placeholder="0 for no limit"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Max Attempts
          </label>
          <input
            type="number"
            min="1"
            value={quizData.attempts}
            onChange={(e) => setQuizData(prev => ({ ...prev, attempts: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Passing Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={quizData.passingScore}
            onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={4}
          value={quizData.description}
          onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          placeholder="Describe what this quiz covers"
        />
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Instructions for Students
        </label>
        <textarea
          rows={4}
          value={quizData.instructions}
          onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          placeholder="Enter instructions for students taking this quiz"
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-body font-semibold text-gray-900">Quiz Options</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked={quizData.shuffleQuestions} onChange={(e) => setQuizData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 h-4 w-4" />
            <span className="font-body text-gray-700 text-sm sm:text-base">Shuffle Questions</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked={quizData.shuffleOptions} onChange={(e) => setQuizData(prev => ({ ...prev, shuffleOptions: e.target.checked }))} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 h-4 w-4" />
            <span className="font-body text-gray-700 text-sm sm:text-base">Shuffle Answer Options</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Show Results
        </label>
        <select value={quizData.showResults} onChange={(e) => setQuizData(prev => ({ ...prev, showResults: e.target.value as any }))} className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base">
            <option value="immediately">Immediately</option>
            <option value="after-submission">After Submission</option>
            <option value="never">Never</option>
        </select>
      </div>
    </div>
  );

  const renderQuestions = () => (
    // Stacks vertically by default, becomes 3-col grid on large screens
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Question List (Full width on mobile, 1/3 on lg) */}
      <div className="lg:col-span-1 lg:border-r lg:pr-6">
        {/* Responsive header for question list */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-headline font-bold text-gray-900">Questions</h3>
          <div className="relative group flex-shrink-0">
            <button className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg flex items-center space-x-1 text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Add</span>
            </button>
            {/* --- THIS IS THE MOBILE ALIGNMENT FIX --- */}
            <div className="absolute left-0 xs:left-auto xs:right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button onClick={() => addQuestion('multiple-choice')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"> Multiple Choice </button>
                <button onClick={() => addQuestion('true-false')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"> True/False </button>
                <button onClick={() => addQuestion('short-answer')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"> Short Answer </button>
                <button onClick={() => addQuestion('essay')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"> Essay </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto pr-1"> {/* Make list scrollable */}
          {quizData.questions.sort((a,b) => a.order - b.order).map((question, index) => ( // Sort by order
            <div
              key={question.id}
              onClick={() => setSelectedQuestion(question.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedQuestion === question.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* Responsive layout for list item */}
              <div className="flex flex-col xs:flex-row items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="text-sm font-body font-semibold text-gray-900">Q{index + 1}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-body font-medium ${
                      question.type === 'multiple-choice' ? 'bg-blue-100 text-blue-800' :
                      question.type === 'true-false' ? 'bg-green-100 text-green-800' :
                      question.type === 'short-answer' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {question.type.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-body line-clamp-2">
                    {question.question || 'Untitled Question'}
                  </p>
                  <p className="text-xs text-gray-500 font-body mt-1">{question.points} point(s)</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(question.id);
                  }}
                  className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {quizData.questions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Circle className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-body">No questions yet. Add your first question!</p>
            </div>
          )}
        </div>
      </div>

      {/* Question Editor (Full width on mobile, 2/3 on lg) */}
      <div className="lg:col-span-2 mt-8 lg:mt-0">
        {selectedQuestion && quizData.questions.find(q => q.id === selectedQuestion) ? (
          <QuestionEditor
            question={quizData.questions.find(q => q.id === selectedQuestion)!}
            onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
            onUpdateOption={(optionId, updates) => updateOption(selectedQuestion, optionId, updates)}
            onAddOption={() => addOption(selectedQuestion)}
            onDeleteOption={(optionId) => deleteOption(selectedQuestion, optionId)}
          />
        ) : (
          <div className="text-center py-12 h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-4">
              <Edit className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-gray-900 mb-2">Select a Question</h3>
            <p className="text-gray-600 font-body">Choose a question from the list to edit it, or add a new one.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-headline font-bold text-gray-900 mb-2">{quizData.title || 'Untitled Quiz'}</h2>
          {quizData.description && (
            <p className="text-gray-600 font-body">{quizData.description}</p>
          )}
          
          {/* Responsive stats list */}
          <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-2 sm:gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="font-body">
                {quizData.timeLimit ? `${quizData.timeLimit} minutes` : 'No time limit'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span className="font-body">{quizData.questions.length} questions</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-body">Passing: {quizData.passingScore}%</span>
            </div>
          </div>

          {quizData.instructions && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left sm:text-center">
              <h3 className="font-body font-semibold text-blue-900 mb-2">Instructions</h3>
              <p className="text-blue-800 font-body text-sm whitespace-pre-wrap">{quizData.instructions}</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {quizData.questions.sort((a,b) => a.order - b.order).map((question, index) => ( // Sort by order
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-3 mb-4">
                <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-body font-semibold text-gray-900 mb-2">{question.question}</p>
                  <span className="text-xs text-gray-500 font-body">{question.points} point(s)</span>
                </div>
              </div>

              {/* Responsive padding */}
              <div className="ml-4 sm:ml-11">
                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name={`preview-${question.id}`} className="text-primary-500 focus:ring-primary-500" disabled />
                          <span className="font-body text-gray-700">{option.text}</span>
                          {option.isCorrect && ( <CheckCircle className="h-4 w-4 text-green-500" /> )}
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'true-false' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name={`preview-${question.id}`} className="text-primary-500 focus:ring-primary-500" disabled />
                          <span className="font-body text-gray-700">{option.text}</span>
                          {option.isCorrect && ( <CheckCircle className="h-4 w-4 text-green-500" /> )}
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'short-answer' && (
                    <div>
                      <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none" placeholder="Enter your answer here" disabled />
                    </div>
                  )}

                  {question.type === 'essay' && (
                    <div>
                      <textarea rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none" placeholder="Enter your essay answer here" disabled />
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 font-body"> Methods <strong>Explanation:</strong> {question.explanation} </p>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {quizData.questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-600 font-body">No questions added yet. Go to the Questions tab to add some!</p>
          </div>
        )}
      </div>
    </div>
  );

  // Show main loader if still fetching initial data
  if (isLoading) {
      return (
          <div className="h-[70vh] flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
          </div>
      );
  }
  
  // Show error if initial fetch failed
  if (error) {
       return (
           <div className="h-[70vh] flex items-center justify-center p-8">
               <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-lg text-center" role="alert">
                   <p className="font-bold">Error</p>
                   <p>{error}</p>
                   <button onClick={onCancel} className="mt-4 bg-gray-300 text-gray-800 px-4 py-2 rounded">Close</button>
               </div>
           </div>
       );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stacks on mobile, row on sm+ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary-500">Quiz Builder</h1>
              <p className="text-sm text-gray-600 font-body">Create and manage quiz assessments</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('preview')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium text-sm">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium disabled:opacity-70 disabled:cursor-not-allowed text-sm flex-1 sm:flex-none justify-center">
                {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
                <span>{isSaving ? "Saving..." : "Save Quiz"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Tabs - Responsive */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-4 border-b border-gray-200 whitespace-nowrap">
            {[
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'questions', label: 'Questions', icon: Edit },
              { id: 'preview', label: 'Preview', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-3 sm:py-3 font-body font-medium transition-colors text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'border-b-2 border-transparent text-gray-600 hover:text-primary-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'questions' && quizData.questions.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {quizData.questions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Status Messages */}
        {message && (
             <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg font-body">{message}</div>
        )}
         {error && (
             <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg font-body">{error}</div>
        )}


        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 md:p-8">
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'preview' && renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;