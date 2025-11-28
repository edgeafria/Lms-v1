import React, { useState, useEffect, ChangeEvent, FormEvent, Fragment } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Move, Video, FileText,
  Save, Eye, Settings, Upload, BookOpen,
  Star, ArrowUpCircle, ArrowDownCircle, HelpCircle, Loader2,
  Check, ChevronsUpDown 
} from 'lucide-react';
import { useAuth, axiosInstance, User } from '../contexts/AuthContext';
import axios from 'axios';
import Modal from '../components/Modal';
import QuizBuilder from '../components/QuizBuilder';
import RichTextEditor from '../components/RichTextEditor'; 
import mongoose from 'mongoose'; 
import { Listbox, Transition } from '@headlessui/react'; 

// --- Interface Definitions ---
interface Lesson {
  _id?: string;
  id: string; 
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  quizId?: string; 
  duration?: number;
  order: number; 
  isPreview: boolean;
}
interface Module {
  _id?: string;
  id: string; 
  title: string;
  description: string;
  lessons: Lesson[];
  order: number; 
}
interface ListItem {
  id: string;
  value: string;
}

interface AccessPeriod {
  value?: number;
  unit: 'days' | 'weeks' | 'months' | 'years' | 'unlimited';
}

// 🐞 --- NEW CATEGORY INTERFACE ---
// To match the data from /api/categories
interface CategoryOption {
  _id: string;
  value: string;
  label: string;
}
// ----------------------------------

interface CourseData {
  id?: string;
  title: string; description: string; category: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; price: number; thumbnail: string;
  modules: Module[];
  requirements: ListItem[];
  learningOutcomes: ListItem[];
  tags: ListItem[];
  status: 'draft' | 'published' | 'archived' | 'unpublished';
  shortDescription?: string; originalPrice?: number; duration?: string;
  accessPeriod?: AccessPeriod;
}
// ----------------------------

// --- Dropdown Options (Moved outside component for performance) ---
// 🐞 REMOVED categoryOptions (it will be fetched)

const levelOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

const lessonTypeOptions = [
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
];

const accessPeriodUnitOptions = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];
// ---------------------------------------------


// --- Helper to generate unique IDs ---
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// --- (findPermanentLessonId helper is unchanged) ---
const findPermanentLessonId = (updatedCourse: CourseData, tempLesson: Lesson): Lesson | undefined => {
    for (const module of updatedCourse.modules) {
        const savedLesson = module.lessons.find(l => 
            l._id && l.title === tempLesson.title && l.type === tempLesson.type
        );
        if (savedLesson) return savedLesson;
    }
    return undefined;
};

// --- (TouchedState interface is unchanged) ---
interface TouchedState {
  title?: boolean;
  description?: boolean;
  category?: boolean;
}
// ----------------------------------------

const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [courseData, setCourseData] = useState<CourseData>({
    title: '', description: '', category: '', level: 'Beginner',
    price: 0, thumbnail: '', modules: [], requirements: [],
    learningOutcomes: [], tags: [], status: 'draft',
    accessPeriod: { unit: 'unlimited' }
  });
  
  // 🐞 --- NEW STATE FOR CATEGORIES ---
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  // ------------------------------------

  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [touched, setTouched] = useState<TouchedState>({});

  // --- Quiz Builder State ---
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [currentLessonQuiz, setCurrentLessonQuiz] = useState<{ lessonId: string; quizId?: string; courseId: string; } | null>(null);
  // --------------------------


  // --- 🐞 Fetch Course Data AND Categories ---
  useEffect(() => {
    const fetchCourseAndCategories = async () => {
      if (authLoading || !user) return;
      
      setPageLoading(true);

      // 🐞 --- Fetch Categories ---
      // We fetch these first so the dropdown is ready
      try {
        const categoriesResponse = await axiosInstance.get('/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        } else {
          console.error("Failed to fetch categories");
          setError("Failed to load category list."); // Show non-blocking error
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Error loading category list.");
      } finally {
        setCategoriesLoading(false);
      }
      
      // 🐞 --- Fetch Course Data (if editing) ---
      if (courseId) {
        try {
          const response = await axiosInstance.get(`/courses/${courseId}`);
          if(response.data.success) {
              const data = response.data.data;
              setCourseData({
                  id: data._id, title: data.title || '', description: data.description || '', category: data.category || '', level: data.level || 'Beginner', price: data.price || 0, thumbnail: data.thumbnail?.url || '', status: data.status || 'draft',
                  requirements: (data.requirements || []).map((r: string, i: number) => ({ id: `req_${Date.now()}_${i}`, value: r })),
                  learningOutcomes: (data.learningOutcomes || []).map((o: string, i: number) => ({ id: `out_${Date.now()}_${i}`, value: o })),
                  tags: (data.tags || []).map((t: string, i: number) => ({ id: `tag_${Date.now()}_${i}`, value: t })),
                  shortDescription: data.shortDescription || '', originalPrice: data.originalPrice, 
                  duration: data.duration,
                  accessPeriod: data.accessPeriod || { unit: 'unlimited' },
                  modules: (data.modules || []).map((mod: any, modIndex: number) => ({ 
                      ...mod,
                      id: mod.id || mod._id || generateId('mod_fallback'), 
                      _id: mod._id,
                      order: mod.order ?? modIndex, 
                      lessons: (mod.lessons || []).map((les: any, lesIndex: number) => {
                          const finalId = les.id || les._id || generateId('les_fallback');
                          const lessonType = (les.type && ['video', 'text', 'quiz', 'assignment'].includes(les.type)) ? les.type : 'video'; 

                          return {
                              ...les, 
                              id: finalId,
                              _id: les._id || finalId, 
                              type: lessonType, 
                              order: les.order ?? lesIndex, 
                              quizId: les.content?.quiz?._id || les.content?.quiz,
                              content: lessonType === 'video' ? (les.content?.video?.url || '') :
                                      lessonType === 'text' ? (les.content?.text?.body || '') :
                                      lessonType === 'assignment' ? (les.content?.assignment?.instructions || '') :
                                      (lessonType === 'quiz' ? (les.content?.quiz?._id || les.content?.quiz || '') : ''),
                          };
                      })
                  }))
              });
          } else {
              setError(response.data.message || 'Failed to fetch course data');
          }
        } catch (err: any) {
            console.error("Error fetching course:", err);
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    setError(`Server Error ${err.response.status}: ${err.response.data?.message || err.message}`);
                } else if (err.request) {
                    setError('Network Error: Could not reach the server. Please check your connection.');
                } else {
                    setError(`Error: ${err.message}`);
                }
            } else {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            }
        } finally {
          setPageLoading(false); // Only stop page loading after course is fetched
        }
      } else {
        // Not editing, just creating new. Stop loading.
        setPageLoading(false);
      }
    };
    
    fetchCourseAndCategories();
  }, [courseId, authLoading, user]);
  // --------------------------------------------------

  // --- (Validation constants are unchanged) ---
  const isFormValid = courseData.title.length >= 5 &&
                      courseData.description.length >= 50 &&
                      !!courseData.category; 
  const titleError = touched.title && courseData.title.length < 5;
  const descriptionError = touched.description && courseData.description.length < 50;
  const categoryError = touched.category && !courseData.category;
  // ---------------------------------


  // --- (handleSaveCourse is unchanged) ---
  const handleSaveCourse = async (silent: boolean = false): Promise<CourseData | null> => {
     if (!silent) setIsLoading(true);
     setError(null); 
     if (!silent) setMessage(null);
     
     let currentCourseId = courseId || courseData.id;
     let savedData: any = null;
     
     try {
         if (!isFormValid) {
           setTouched({ title: true, description: true, category: true }); 
           setActiveTab('basic');
           setError("Validation Failed: Please fill in Title (min 5), Description (min 50), and Category.");
           return null;
         }
         
         const dataToSave = {
           title: courseData.title, description: courseData.description, shortDescription: courseData.shortDescription, category: courseData.category, level: courseData.level, price: courseData.price, originalPrice: courseData.originalPrice, 
           duration: courseData.duration,
           accessPeriod: {
             value: courseData.accessPeriod?.value || undefined,
             unit: courseData.accessPeriod?.unit || 'unlimited'
           },
           requirements: courseData.requirements.map(r => r.value),
           learningOutcomes: courseData.learningOutcomes.map(o => o.value),
           tags: courseData.tags.map(t => t.value),
           modules: courseData.modules.map((mod, modIndex) => ({
               _id: mod._id?.startsWith('temp_') ? undefined : mod._id, title: mod.title, description: mod.description,
               order: mod.order ?? modIndex,
               lessons: mod.lessons.map((les, lesIndex) => {
                   let contentObject;
                   const lessonType = les.type || 'video';
                   const quizId = les.quizId || (lessonType === 'quiz' ? les.content : undefined);
                   
                   if (lessonType === 'quiz' && quizId) contentObject = { quiz: quizId };
                   else if (lessonType === 'video') contentObject = { video: { url: (les.content && les.content.trim() !== '') ? les.content.trim() : null } };
                   else if (lessonType === 'assignment') contentObject = { assignment: { instructions: les.content } };
                   else contentObject = { text: { body: les.content } };
                   
                   return {
                     _id: les._id?.startsWith('temp_') ? undefined : les._id, title: les.title,
                     type: lessonType, order: les.order ?? lesIndex,
                     duration: les.duration, isPreview: les.isPreview, content: contentObject
                   };
               })
           }))
         };
         
         let response;
         if (currentCourseId) response = await axiosInstance.put(`/courses/${currentCourseId}`, dataToSave);
         else { response = await axiosInstance.post('/courses', dataToSave); currentCourseId = response.data.data._id; }
         
         if (!response.data.success) {
             if (response.data.errors) throw new Error(response.data.errors.map((e: any) => `${e.path || 'General'}: ${e.msg}`).join(', '));
             throw new Error(response.data.message || 'Failed to save course data');
         }
         
         savedData = response.data.data;
         
         if (thumbnailFile && currentCourseId) {
           const formData = new FormData(); formData.append('thumbnail', thumbnailFile);
           try {
             const thumbResponse = await axiosInstance.put(`/courses/${currentCourseId}/thumbnail`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
             if (thumbResponse.data.data?.thumbnail?.url) {
                setCourseData(prev => ({...prev, thumbnail: thumbResponse.data.data.thumbnail.url}));
                setThumbnailFile(null);
             }
           } catch (thumbErr) { console.error("Thumbnail upload failed:", thumbErr); setError("Course saved, but thumbnail upload failed."); }
         }
         
         if (!silent) setMessage(`Course ${courseId ? 'updated' : 'created'} successfully!`);
         
         setCourseData(prev => {
           const findPrevModule = (modResp: any): Module | undefined => { if (modResp._id && mongoose.Types.ObjectId.isValid(modResp._id)) { const modRespIdStr = modResp._id.toString(); const found = prev.modules.find(pm => pm._id && mongoose.Types.ObjectId.isValid(pm._id) && pm._id.toString() === modRespIdStr); if (found) return found; } const respId = modResp.id || modResp._id?.toString(); return respId ? prev.modules.find(pm => pm.id === respId) : undefined; };
           const findPrevLesson = (prevModule: Module | undefined, lesResp: any): Lesson | undefined => { if (!prevModule) return undefined; if (lesResp._id && mongoose.Types.ObjectId.isValid(lesResp._id)) { const lesRespIdStr = lesResp._id.toString(); const found = prevModule.lessons.find(pl => pl._id && mongoose.Types.ObjectId.isValid(pl._id) && pl._id.toString() === lesRespIdStr); if (found) return found; } const respId = lesResp.id || lesResp._id?.toString(); return respId ? prevModule.lessons.find(pl => pl.id === respId) : undefined; };
           const updatedModules = (savedData.modules || []).map((modResp: any, modIndex: number) => {
             const prevModule = findPrevModule(modResp);
             if (!prevModule) { 
               return {
                 ...modResp, id: modResp.id || modResp._id?.toString() || generateId('mod_fallback'), _id: modResp._id, order: modResp.order ?? modIndex,
                 lessons: (modResp.lessons || []).map((lr:any, lIdx: number) => ({ id: lr.id || lr._id?.toString() || generateId('les_fallback'), _id: lr._id, title: lr.title || 'Untitled', type: 'video', order: lr.order ?? lIdx, content: '', isPreview: false, })),
               };
             }
             return {
               ...prevModule, _id: modResp._id || prevModule._id, id: modResp.id || modResp._id?.toString() || prevModule.id, order: modResp.order ?? prevModule.order ?? modIndex, title: modResp.title ?? prevModule.title, description: modResp.description ?? prevModule.description,
               lessons: (modResp.lessons || []).map((lesResp: any, lesIndex: number) => {
                 const prevLesson = findPrevLesson(prevModule, lesResp);
                 if (!prevLesson) { 
                   const lessonTypeFromResp = (lesResp.type && ['video', 'text', 'quiz', 'assignment'].includes(lesResp.type)) ? lesResp.type : 'video'; const finalId = lesResp.id || lesResp._id?.toString() || generateId('les_fallback');
                   return {
                     id: finalId, _id: lesResp._id || finalId, title: lesResp.title || 'Untitled Lesson', type: lessonTypeFromResp, order: lesResp.order ?? lesIndex, isPreview: lesResp.isPreview || false, quizId: lesResp.content?.quiz?._id || lesResp.content?.quiz,
                     content: lessonTypeFromResp === 'video' ? (lesResp.content?.video?.url || '') : lessonTypeFromResp === 'text' ? (lesResp.content?.text?.body || '') : lessonTypeFromResp === 'assignment' ? (lesResp.content?.assignment?.instructions || '') : (lessonTypeFromResp === 'quiz' ? (lesResp.content?.quiz?._id || lesResp.content?.quiz || '') : ''),
                   };
                 }
                 const lessonType = prevLesson.type; const updatedQuizId = lesResp.content?.quiz?._id || lesResp.content?.quiz || prevLesson.quizId; 
                 
                 const updatedContent = lessonType === 'video' ? (lesResp.content?.video?.url || '') : 
                                      lessonType === 'text' ? (lesResp.content?.text?.body || '') : 
                                      lessonType === 'assignment' ? (lesResp.content?.assignment?.instructions || '') : 
                                      (lessonType === 'quiz' ? updatedQuizId : prevLesson.content);
                                      
                 const finalId = lesResp.id || lesResp._id?.toString() || prevLesson.id;
                 
                 return { ...prevLesson, _id: lesResp._id || prevLesson._id, id: finalId, order: lesResp.order ?? prevLesson.order ?? lesIndex, title: lesResp.title ?? prevLesson.title, content: updatedContent, quizId: updatedQuizId, isPreview: lesResp.isPreview ?? prevLesson.isPreview, duration: lesResp.duration ?? prevLesson.duration, };
               })
             };
           });
           const returnedModuleIds = new Set((savedData.modules || []).map((m: any) => m._id?.toString() || m.id).filter(Boolean)); const finalModules = updatedModules.filter(m => returnedModuleIds.has(m._id?.toString() || m.id));
           
           const newCourseData = { 
             ...prev, id: savedData._id, status: savedData.status, 
             thumbnail: prev.thumbnailFile ? prev.thumbnail : (savedData.thumbnail?.url || prev.thumbnail), 
             requirements: (savedData.requirements || []).map((r: string, i: number) => ({ id: `req_${Date.now()}_${i}`, value: r })), 
             learningOutcomes: (savedData.learningOutcomes || []).map((o: string, i: number) => ({ id: `out_${Date.now()}_${i}`, value: o })), 
             tags: (savedData.tags || []).map((t: string, i: number) => ({ id: `tag_${Date.now()}_${i}`, value: t })), 
             modules: finalModules,
             accessPeriod: savedData.accessPeriod || { unit: 'unlimited' }
           };
           
           if (!courseId && currentCourseId) navigate(`/instructor/course/edit/${currentCourseId}`, { replace: true });
           
           return newCourseData;
         });
         
         if (thumbnailFile) setThumbnailFile(null);
         
         if (!silent) setTouched({});
         
         return savedData as CourseData;
         
     } catch (err) {
         console.error("Error saving course:", err); 
         if (axios.isAxiosError(err)) {
           setError(err.response?.data?.message || err.message);
         } else if (err instanceof Error && err.message.includes(': ')) {
           setError(`Validation Failed: ${err.message}`);
         } else if (err instanceof Error) {
           setError(err.message);
         } else {
           setError('An unexpected error occurred.');
         } 
         if (err instanceof Error && err.message.includes("Validation Failed")) setActiveTab('basic');
         
         return null;
         
     } finally { 
       if (!silent) setIsLoading(false);
     }
  };
  // --------------------------------------------------

  // --- (Other handlers are unchanged) ---
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setThumbnailFile(file);
       setCourseData(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
     }
  };
 
  const handleOpenQuizModal = async (lesson: Lesson) => {
    const courseIdToUse = courseData.id || courseId;
    if (!courseIdToUse) {
       setError("Course ID is missing. Please save the course basics first.");
       return;
    }

    const isNewLesson = lesson.id.startsWith('les_') && !lesson._id;

    if (isNewLesson) {
       console.log("Lesson is unsaved. Forcing course save to get permanent lesson ID.");
       
       try {
           const updatedCourseData = await handleSaveCourse(true); // silent save
           
           if (updatedCourseData) {
               const permanentLesson = findPermanentLessonId(updatedCourseData, lesson);
               
               if (permanentLesson) {
                   setCurrentLessonQuiz({
                       lessonId: permanentLesson._id!,
                       quizId: permanentLesson.quizId,
                       courseId: updatedCourseData.id!,
                   });
                   setIsQuizModalOpen(true);
                   return;
               }
           }
       } catch (err) {
           return;
       }
    }
    
    const lessonIdToUse = lesson.id || lesson._id;
    if (!lessonIdToUse) {
       console.error("Cannot open quiz modal: Lesson ID is missing", lesson);
       setError("Cannot edit quiz for this lesson: missing ID.");
       return;
    }
    
    setCurrentLessonQuiz({
        lessonId: lessonIdToUse,
        quizId: lesson.quizId,
        courseId: courseIdToUse,
    });
    setIsQuizModalOpen(true);
  };
 
  const handleQuizSave = (savedQuizId: string) => {
     if (!currentLessonQuiz) return;
     const { lessonId } = currentLessonQuiz;
     setCourseData(prev => ({
         ...prev,
         modules: prev.modules.map(module => ({
             ...module,
             lessons: module.lessons.map(lesson =>
                 (lesson.id === lessonId || lesson._id === lessonId)
                   ? { ...lesson, quizId: savedQuizId, content: savedQuizId }
                   : lesson
             ),
         })),
     }));
     setMessage(`Quiz successfully saved and linked to lesson.`);
     setIsQuizModalOpen(false);
     setCurrentLessonQuiz(null);
  };
 
  const handlePublish = async () => {
    if (!isFormValid) {
        setTouched({ title: true, description: true, category: true });
        setActiveTab('basic');
        setError("Cannot publish: Please fix validation errors first.");
        return;
    }

    setIsPublishing(true); 
    setError(null); 
    setMessage(null);

    const savedCourse = await handleSaveCourse(true); // silent save
    
    if (!savedCourse) {
        setIsPublishing(false);
        setError("Failed to save changes before publishing. Please try again.");
        return; 
    }

    const currentCourseId = savedCourse.id || courseData.id || courseId; 
    if (!currentCourseId) {
        setError("An unknown error occurred (missing course ID).");
        setIsPublishing(false);
        return;
    }

    try {
       const response = await axiosInstance.post(`/courses/${currentCourseId}/publish`);
       if (response.data.success) { 
           const newStatus = response.data.data.status; 
           setMessage(`Course successfully ${newStatus ? newStatus.charAt(0).toUpperCase() + newStatus.slice(1) : 'Updated'}!`); 
           setCourseData(prev => ({ ...prev, status: newStatus })); 
       } else {
           throw new Error(response.data.message || 'Failed to update publish status');
       }
    } catch (err) { 
       console.error("Error updating publish status:", err); 
       if (axios.isAxiosError(err)) setError(err.response?.data?.message || err.message); 
       else if (err instanceof Error) setError(err.message); 
       else setError('An unexpected error occurred.'); 
    } finally { 
       setIsPublishing(false); 
    }
  };
  // ... (addModule, addLesson, updateModule, updateLesson, deleteModule, deleteLesson)
   const addModule = () => {
     const newModule: Module = { id: generateId('mod'), _id: undefined, title: 'New Module', description: '', lessons: [], order: courseData.modules.length }; setCourseData(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
   };
   const addLesson = (moduleId: string) => {
     const newLesson: Lesson = { id: generateId('les'), _id: undefined, title: 'New Lesson', type: 'video', content: '', order: 0, isPreview: false };
     setCourseData(prev => { let foundModule = false; const updatedModules = prev.modules.map(module => { if (module.id === moduleId) { foundModule = true; const newOrder = module.lessons.length; return { ...module, lessons: [ ...module.lessons, { ...newLesson, order: newOrder } ] }; } return module; }); if (!foundModule) console.error(`[Debug AddLesson] Could not find module with id: ${moduleId}`); return { ...prev, modules: updatedModules }; });
   };
   const updateModule = (moduleId: string, updates: Partial<Module>) => {
     setCourseData(prev => ({ ...prev, modules: prev.modules.map(module => module.id === moduleId ? { ...module, ...updates } : module) }));
   };
   const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
     if (!lessonId) return; setCourseData(prev => ({ ...prev, modules: prev.modules.map(module => module.id === moduleId ? { ...module, lessons: module.lessons.map(lesson => lesson.id === lessonId ? { ...lesson, ...updates, order: updates.order ?? lesson.order } : lesson ) } : module ) }));
   };
   const deleteModule = (moduleId: string) => {
     setCourseData(prev => ({ ...prev, modules: prev.modules.filter(module => module.id !== moduleId) }));
   };
   const deleteLesson = (moduleId: string, lessonId: string) => {
     if (!lessonId) return; setCourseData(prev => ({ ...prev, modules: prev.modules.map(module => module.id === moduleId ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) } : module ) }));
   };
  // --------------------------------------------------

  // --- 🐞 Render Functions (CATEGORY LISTBOX UPDATED) ---
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Course Title * </label>
          <input 
            type="text" 
            value={courseData.title} 
            onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))} 
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              titleError 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            placeholder="Enter course title" 
          />
          {titleError && <p className="mt-1 text-xs text-red-600">Title must be at least 5 characters long.</p>}
        </div>
        
        {/* === 🐞 REPLACED CATEGORY SELECT === */}
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Category * </label>
          <Listbox value={courseData.category} onChange={(value) => setCourseData(prev => ({ ...prev, category: value }))}>
            <div className="relative">
              <Listbox.Button 
                className={`relative w-full cursor-default rounded-lg bg-white px-4 py-3 text-left border focus:outline-none focus:ring-2 ${
                  categoryError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
                onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
              >
                <span className="block truncate">{categories.find(o => o.value === courseData.category)?.label || 'Select Category'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                  {categoriesLoading ? (
                    <div className="px-4 py-2 text-gray-500">Loading...</div>
                  ) : (
                    categories.map((option) => (
                      <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))
                  )}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          {categoryError && <p className="mt-1 text-xs text-red-600">Please select a category.</p>}
        </div>
        {/* === END REPLACEMENT === */}
        
        {/* === REPLACED LEVEL SELECT (unchanged) === */}
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Level * </label>
          <Listbox value={courseData.level} onChange={(value) => setCourseData(prev => ({ ...prev, level: value as any }))}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-3 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <span className="block truncate">{courseData.level}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                  {levelOptions.map((option) => (
                    <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        {/* === END REPLACEMENT === */}

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Price (NGN) * </label>
          <input type="number" value={courseData.price} onChange={(e) => setCourseData(prev => ({ ...prev, price: Number(e.target.value) }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Description * </label>
        <textarea 
          rows={6} 
          value={courseData.description} 
          onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))} 
          onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
            descriptionError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="Describe what students will learn in this course" 
        />
        {descriptionError && <p className="mt-1 text-xs text-red-600">Description must be at least 50 characters long.</p>}
      </div>
       <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Short Description (Optional) </label>
        <textarea rows={3} value={courseData.shortDescription || ''} onChange={(e) => setCourseData(prev => ({ ...prev, shortDescription: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="A brief summary for course cards" />
       </div>

      {/* --- (Duration & Access Period - Unchanged) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
             <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Original Price (NGN, Optional) </label>
             <input type="number" value={courseData.originalPrice || ''} onChange={(e) => setCourseData(prev => ({ ...prev, originalPrice: Number(e.target.value) || undefined }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., 20000 (for discounts)" />
           </div>
           <div>
               <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Course Duration (Display) </label>
               <input type="text" value={courseData.duration || ''} onChange={(e) => setCourseData(prev => ({ ...prev, duration: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., 8 Weeks, 10 Hours" />
           </div>
           <div>
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Access Period Value </label>
          <input 
            type="number" 
            value={courseData.accessPeriod?.value || ''} 
            onChange={(e) => setCourseData(prev => ({ 
              ...prev, 
              accessPeriod: { ...prev.accessPeriod, value: e.target.value ? Number(e.target.value) : undefined, unit: prev.accessPeriod?.unit || 'unlimited' } 
            }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" 
            placeholder="e.g., 8" 
            disabled={courseData.accessPeriod?.unit === 'unlimited'}
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Access Period Unit </label>
          <Listbox 
            value={courseData.accessPeriod?.unit || 'unlimited'} 
            onChange={(value) => setCourseData(prev => ({ 
              ...prev, 
              accessPeriod: { ...prev.accessPeriod, unit: value as any } 
            }))}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-3 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <span className="block truncate">{accessPeriodUnitOptions.find(o => o.value === (courseData.accessPeriod?.unit || 'unlimited'))?.label}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                  {accessPeriodUnitOptions.map((option) => (
                    <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>
      {/* --- END NEW SECTION --- */}


      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2"> Course Thumbnail </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
          {courseData.thumbnail && (
             <img loading="lazy" src={courseData.thumbnail} alt="Thumbnail preview" className="w-32 h-auto sm:w-48 mx-auto mb-4 rounded-lg shadow-sm"/>
          )}
          <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-body mb-2 text-sm sm:text-base">Drop your thumbnail here or click</p>
          <p className="text-xs sm:text-sm text-gray-500 font-body">Recommended: 1280x720px, JPG/PNG</p>
          <label className="mt-4 inline-block bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 sm:px-6 rounded-lg text-sm sm:text-base font-body font-medium cursor-pointer">
            {thumbnailFile ? thumbnailFile.name : "Choose File"}
            <input type="file" accept="image/png, image/jpeg" onChange={handleThumbnailChange} className="sr-only" />
          </label>
           {thumbnailFile && (
             <button onClick={() => { setThumbnailFile(null); setCourseData(prev => ({ ...prev, thumbnail: '' })); }}
                     className="ml-2 sm:ml-4 text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium">
               Remove
             </button>
           )}
        </div>
      </div>
    </div>
  );

  // --- (renderCurriculum is unchanged) ---
  const renderCurriculum = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-headline font-bold text-gray-900">Course Curriculum</h3>
           <p className="text-gray-600 font-body text-sm sm:text-base">Organize content into modules & lessons</p>
        </div>
        <button onClick={addModule} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium flex items-center space-x-2 flex-shrink-0 text-sm sm:text-base">
           <Plus className="h-4 w-4" /> <span>Add Module</span>
        </button>
      </div>
      <div className="space-y-4">
        {courseData.modules.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map((module, moduleIndex) => (
          <div key={module.id} className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm flex-shrink-0"> {moduleIndex + 1} </div>
                  <div className="flex-1 min-w-0">
                    <input type="text" value={module.title} onChange={(e) => updateModule(module.id, { title: e.target.value })} className="font-body font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full text-base sm:text-lg" placeholder="Module Title" />
                    <input type="text" value={module.description} onChange={(e) => updateModule(module.id, { description: e.target.value })} className="block text-sm text-gray-600 font-body bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 mt-1 w-full" placeholder="Module description (optional)" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <button onClick={() => addLesson(module.id)} className="text-primary-500 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 flex items-center space-x-1 text-sm">
                        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Lesson</span>
                    </button>
                    <button onClick={() => deleteModule(module.id)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-4">
              {module.lessons.length === 0 ? (
                 <div className="text-center py-8"> <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" /> <p className="text-gray-600 font-body">No lessons yet. Add your first lesson!</p> <button onClick={() => addLesson(module.id)} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium"> Add Lesson </button> </div>
              ) : (
                <div className="space-y-3">
                  {module.lessons.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map((lesson, lessonIndex) => {
                    const lessonKey = lesson.id || `fallback_${module.id}_${lessonIndex}`;
                    const lessonType = (lesson.type && ['video', 'text', 'quiz', 'assignment'].includes(lesson.type)) ? lesson.type : 'video';

                    return (
                    <div key={lessonKey} className="flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-grow min-w-[200px] w-full sm:w-auto">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${ lessonType === 'video' ? 'bg-red-100 text-red-600' : lessonType === 'text' ? 'bg-blue-100 text-blue-600' : lessonType === 'quiz' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600' }`}>
                          {lessonType === 'video' && <Video className="h-4 w-4" />} {lessonType === 'text' && <FileText className="h-4 w-4" />} {lessonType === 'quiz' && <HelpCircle className="h-4 w-4" />} {lessonType === 'assignment' && <BookOpen className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            {lessonType === 'quiz' ? (
                                <input type="text" value={lesson.title || ''} onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })} className="font-body font-medium text-gray-900 block truncate bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full" placeholder="Quiz Title"/>
                            ) : lessonType === 'video' ? (
                                <input type="text" value={lesson.content} onChange={(e) => updateLesson(module.id, lesson.id, { content: e.target.value, title: e.target.value.substring(0,40) || 'Video Lesson' })} className="font-body font-medium text-gray-900 block truncate bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full" placeholder="Video URL"/>
                            ) : (
                                <RichTextEditor
                                  key={lessonKey}
                                  content={lesson.content}
                                  onChange={(newContent: string) => updateLesson(module.id, lesson.id, { content: newContent })}
                                />
                            )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                        
                        {/* === REPLACED LESSON TYPE SELECT === */}
                        <Listbox
                          value={lessonType}
                          onChange={(value) => updateLesson(module.id, lesson.id, { type: value as any, content: '', title: `New ${value.charAt(0).toUpperCase() + value.slice(1)}`, quizId: undefined })}
                        >
                          <div className="relative w-32">
                            <Listbox.Button className="relative w-full cursor-default rounded bg-white px-2 py-1 text-left text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0">
                              <span className="block truncate">{lessonTypeOptions.find(o => o.value === lessonType)?.label}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                              <Listbox.Options className="absolute mt-1 max-h-60 w-auto min-w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                                {lessonTypeOptions.map((option) => (
                                  <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                        {selected ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                            <Check className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                        {/* === END REPLACEMENT === */}

                        <label className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            <input type="checkbox" checked={lesson.isPreview} onChange={(e) => updateLesson(module.id, lesson.id, { isPreview: e.target.checked })} className="rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500" />
                            <span className="text-xs sm:text-sm text-gray-600 font-body">Preview</span>
                        </label>
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                             {lessonType === 'quiz' && (
                                 <button onClick={(e) => { e.stopPropagation(); handleOpenQuizModal(lesson); }} className={`p-1 sm:p-1.5 rounded-lg text-xs sm:text-sm font-body font-medium transition-colors flex items-center space-x-1 ${lesson.quizId ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'}`} title={lesson.quizId ? 'Edit Quiz Questions' : 'Create Quiz Questions'}>
                                     <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4"/>
                                     <span className="hidden sm:inline">{lesson.quizId ? 'Edit' : 'Add'} Quiz</span>
                                 </button>
                             )}
                           <button className="text-gray-400 hover:text-gray-600 p-1 cursor-move hidden sm:block">
                               <Move className="h-4 w-4" />
                           </button>
                           <button onClick={() => deleteLesson(module.id, lesson.id)} className="text-red-500 hover:text-red-600 p-1">
                               <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        ))}
        {courseData.modules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg"> <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" /> <h3 className="text-lg font-headline font-bold text-gray-900 mb-2">No modules yet</h3> <p className="text-gray-600 font-body mb-6">Start building your course by adding your first module</p> <button onClick={addModule} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold"> Add Your First Module </button> </div>
        )}
      </div>
    </div>
  );

  // --- (renderRequirements is unchanged) ---
  const renderRequirements = () => (
    <div className="space-y-6">
      <div> <h3 className="text-lg font-headline font-bold text-gray-900 mb-2">Requirements & Outcomes</h3> <p className="text-gray-600 font-body text-sm sm:text-base">Help students understand needs & achievements</p> </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-3"> Requirements </label>
          <div className="space-y-3">
            {courseData.requirements.map((req) => (
              <div key={req.id} className="flex items-center space-x-2 sm:space-x-3">
                <input
                  type="text" value={req.value}
                  onChange={(e) => { const newReqs = courseData.requirements.map(r => r.id === req.id ? { ...r, value: e.target.value } : r); setCourseData(prev => ({ ...prev, requirements: newReqs })); }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  placeholder="e.g., Basic HTML/CSS"
                />
                <button onClick={() => { const newReqs = courseData.requirements.filter(r => r.id !== req.id); setCourseData(prev => ({ ...prev, requirements: newReqs })); }} className="text-red-500 hover:text-red-600 p-1 sm:p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={() => setCourseData(prev => ({ ...prev, requirements: [...prev.requirements, { id: generateId('req'), value: '' }] }))} className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium text-sm sm:text-base">
              <Plus className="h-4 w-4" /> <span>Add Requirement</span>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-3"> Learning Outcomes </label>
          <div className="space-y-3">
            {courseData.learningOutcomes.map((outcome) => (
              <div key={outcome.id} className="flex items-center space-x-2 sm:space-x-3">
                <input
                  type="text" value={outcome.value}
                  onChange={(e) => { const newOutcomes = courseData.learningOutcomes.map(o => o.id === outcome.id ? { ...o, value: e.target.value } : o); setCourseData(prev => ({ ...prev, learningOutcomes: newOutcomes })); }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  placeholder="e.g., Build a web app"
                />
                <button onClick={() => { const newOutcomes = courseData.learningOutcomes.filter(o => o.id !== outcome.id); setCourseData(prev => ({ ...prev, learningOutcomes: newOutcomes })); }} className="text-red-500 hover:text-red-600 p-1 sm:p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={() => setCourseData(prev => ({ ...prev, learningOutcomes: [...prev.learningOutcomes, { id: generateId('out'), value: '' }] }))} className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium text-sm sm:text-base">
              <Plus className="h-4 w-4" /> <span>Add Outcome</span>
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-3"> Tags (for better discoverability) </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {courseData.tags.map((tag) => (
            <span key={tag.id} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs sm:text-sm font-body flex items-center space-x-2">
              <span>{tag.value}</span>
              <button onClick={() => { const newTags = courseData.tags.filter(t => t.id !== tag.id); setCourseData(prev => ({ ...prev, tags: newTags })); }} className="text-primary-600 hover:text-primary-800"> × </button>
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-3">
          <input type="text" placeholder="Add a tag and press Enter" className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && !courseData.tags.find(t => t.value === value)) {
                  setCourseData(prev => ({ ...prev, tags: [...prev.tags, { id: generateId('tag'), value: value }] }));
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
  // --- End Render Functions ---

  const currentCourseId = courseData.id || courseId;
  const currentStatus = courseData.status || 'draft';

  return (
    <>
      <div className="min-h-screen bg-gray-50">
         {/* --- Header (No changes) --- */}
        <div className="bg-white shadow-sm border-b">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
            <div className="flex-grow min-w-0"> 
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary-500 truncate"> 
                {currentCourseId ? "Edit Course" : "Create New Course"}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs sm:text-sm text-gray-600 font-body">Manage course content</p>
                {currentCourseId && (
                  <>
                      <span className="text-gray-400">|</span>
                      <span className={`text-xs font-medium px-2 py-0.5 sm:px-2.5 rounded-full ${
                          currentStatus === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto justify-start flex-wrap gap-2 md:flex-nowrap md:gap-0 md:space-x-4 flex-shrink-0">
              {currentCourseId && (
                <RouterLink to={`/course/${currentCourseId}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium text-xs sm:text-sm">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Preview</span>
                </RouterLink>
              )}

              {currentCourseId && (
                <button
                    onClick={handlePublish}
                    disabled={isLoading || isPublishing || !isFormValid}
                    className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-body font-medium disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm ${
                        currentStatus === 'published'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                  {currentStatus === 'published' ? <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="hidden xs:inline">{isPublishing ? '...' : (currentStatus === 'published' ? 'Unpublish' : 'Publish')}</span>
                </button>
              )}

              <button
                  onClick={() => handleSaveCourse(false)}
                  disabled={isLoading || isPublishing || !isFormValid}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{isLoading ? "Saving..." : (currentCourseId ? "Update" : "Save")}</span>
                <span className="hidden sm:inline">{isLoading ? '' : (currentCourseId ? " Course" : " Course")}</span>
              </button>
            </div>
          </div>
         </div>
        </div>
         {/* --- Main Content (No changes) --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {message && <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg font-body">{message}</div>}
          {error && !pageLoading && <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg font-body">{error}</div>}
          <div className="mb-6 sm:mb-8 overflow-x-auto">
             {/* --- Nav Tabs (No changes) --- */}
            <nav className="flex space-x-1 sm:space-x-4 border-b border-gray-200 whitespace-nowrap">
              {[
                { id: 'basic', label: 'Basic Info', icon: Settings },
                { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
                { id: 'requirements', label: 'Requirements', icon: FileText },
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
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 md:p-8">
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'curriculum' && renderCurriculum()}
            {activeTab === 'requirements' && renderRequirements()}
          </div>
        </div>
      </div>
       {/* --- Modal (No changes) --- */}
       {isQuizModalOpen && currentLessonQuiz && (
           <Modal
               isOpen={isQuizModalOpen}
               onClose={() => setIsQuizModalOpen(false)}
               title="Edit Quiz Questions"
               size="xl"
           >
               <QuizBuilder
                   lessonId={currentLessonQuiz.lessonId}
                   quizId={currentLessonQuiz.quizId}
                   courseId={currentCourseId!}
                   onSave={handleQuizSave}
                   onCancel={() => setIsQuizModalOpen(false)}
               />
           </Modal>
       )}
    </>
  );
};

export default CourseBuilder;