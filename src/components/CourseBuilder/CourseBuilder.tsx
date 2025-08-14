import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Move, 
  Video, 
  FileText, 
  Image, 
  Link,
  Save,
  Eye,
  Settings,
  Upload,
  Play,
  Clock,
  Users,
  Star
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  duration?: number;
  order: number;
  isPreview: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

interface CourseData {
  id?: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  thumbnail: string;
  modules: Module[];
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
}

const CourseBuilder: React.FC = () => {
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    thumbnail: '',
    modules: [],
    requirements: [],
    learningOutcomes: [],
    tags: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [draggedItem, setDraggedItem] = useState<{ type: 'module' | 'lesson', id: string } | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: 'New Module',
      description: '',
      lessons: [],
      order: courseData.modules.length
    };
    setCourseData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: 'New Lesson',
      type: 'video',
      content: '',
      order: 0,
      isPreview: false
    };

    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.id === moduleId 
          ? { ...module, lessons: [...module.lessons, { ...newLesson, order: module.lessons.length }] }
          : module
      )
    }));
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.id === moduleId ? { ...module, ...updates } : module
      )
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.id === moduleId 
          ? {
              ...module,
              lessons: module.lessons.map(lesson => 
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              )
            }
          : module
      )
    }));
  };

  const deleteModule = (moduleId: string) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter(module => module.id !== moduleId)
    }));
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.id === moduleId 
          ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) }
          : module
      )
    }));
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter course title"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={courseData.category}
            onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Category</option>
            <option value="web-development">Web Development</option>
            <option value="mobile-development">Mobile Development</option>
            <option value="data-science">Data Science</option>
            <option value="digital-marketing">Digital Marketing</option>
            <option value="business">Business</option>
            <option value="design">Design</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Level *
          </label>
          <select
            value={courseData.level}
            onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value as any }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Price (NGN) *
          </label>
          <input
            type="number"
            value={courseData.price}
            onChange={(e) => setCourseData(prev => ({ ...prev, price: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          rows={6}
          value={courseData.description}
          onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Describe what students will learn in this course"
        />
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-2">
          Course Thumbnail
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-body mb-2">Drop your thumbnail here or click to upload</p>
          <p className="text-sm text-gray-500 font-body">Recommended: 1280x720px, JPG or PNG</p>
          <button className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-body font-medium">
            Choose File
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurriculum = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-headline font-bold text-gray-900">Course Curriculum</h3>
          <p className="text-gray-600 font-body">Organize your course content into modules and lessons</p>
        </div>
        <button
          onClick={addModule}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Module</span>
        </button>
      </div>

      <div className="space-y-4">
        {courseData.modules.map((module, moduleIndex) => (
          <div key={module.id} className="bg-white border border-gray-200 rounded-lg">
            {/* Module Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-body font-semibold text-sm">
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(module.id, { title: e.target.value })}
                      className="font-body font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                      placeholder="Module Title"
                    />
                    <input
                      type="text"
                      value={module.description}
                      onChange={(e) => updateModule(module.id, { description: e.target.value })}
                      className="block text-sm text-gray-600 font-body bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 mt-1"
                      placeholder="Module description (optional)"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addLesson(module.id)}
                    className="text-primary-500 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="p-4">
              {module.lessons.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-body">No lessons yet. Add your first lesson!</p>
                  <button
                    onClick={() => addLesson(module.id)}
                    className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-body font-medium"
                  >
                    Add Lesson
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          lesson.type === 'video' ? 'bg-red-100 text-red-600' :
                          lesson.type === 'text' ? 'bg-blue-100 text-blue-600' :
                          lesson.type === 'quiz' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {lesson.type === 'video' && <Video className="h-4 w-4" />}
                          {lesson.type === 'text' && <FileText className="h-4 w-4" />}
                          {lesson.type === 'quiz' && <Star className="h-4 w-4" />}
                          {lesson.type === 'assignment' && <Edit className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                            className="font-body font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full"
                            placeholder="Lesson Title"
                          />
                        </div>
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(module.id, lesson.id, { type: e.target.value as any })}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="video">Video</option>
                          <option value="text">Text</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Assignment</option>
                        </select>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={lesson.isPreview}
                            onChange={(e) => updateLesson(module.id, lesson.id, { isPreview: e.target.checked })}
                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600 font-body">Preview</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <Move className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteLesson(module.id, lesson.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {courseData.modules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-headline font-semibold text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-600 font-body mb-6">Start building your course by adding your first module</p>
            <button
              onClick={addModule}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold"
            >
              Add Your First Module
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-headline font-bold text-gray-900 mb-2">Course Requirements & Outcomes</h3>
        <p className="text-gray-600 font-body">Help students understand what they need and what they'll achieve</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-3">
            Requirements
          </label>
          <div className="space-y-3">
            {courseData.requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...courseData.requirements];
                    newReqs[index] = e.target.value;
                    setCourseData(prev => ({ ...prev, requirements: newReqs }));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Basic knowledge of HTML and CSS"
                />
                <button
                  onClick={() => {
                    const newReqs = courseData.requirements.filter((_, i) => i !== index);
                    setCourseData(prev => ({ ...prev, requirements: newReqs }));
                  }}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCourseData(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))}
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Requirement</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-3">
            Learning Outcomes
          </label>
          <div className="space-y-3">
            {courseData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => {
                    const newOutcomes = [...courseData.learningOutcomes];
                    newOutcomes[index] = e.target.value;
                    setCourseData(prev => ({ ...prev, learningOutcomes: newOutcomes }));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Build a complete web application"
                />
                <button
                  onClick={() => {
                    const newOutcomes = courseData.learningOutcomes.filter((_, i) => i !== index);
                    setCourseData(prev => ({ ...prev, learningOutcomes: newOutcomes }));
                  }}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCourseData(prev => ({ ...prev, learningOutcomes: [...prev.learningOutcomes, ''] }))}
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-body font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Learning Outcome</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-body font-medium text-gray-700 mb-3">
          Tags (for better discoverability)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {courseData.tags.map((tag, index) => (
            <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-body flex items-center space-x-2">
              <span>{tag}</span>
              <button
                onClick={() => {
                  const newTags = courseData.tags.filter((_, i) => i !== index);
                  setCourseData(prev => ({ ...prev, tags: newTags }));
                }}
                className="text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Add a tag and press Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && !courseData.tags.includes(value)) {
                  setCourseData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-headline font-bold text-primary-500">Course Builder</h1>
              <p className="text-sm text-gray-600 font-body">Create and manage your course content</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium">
                <Save className="h-4 w-4" />
                <span>Save Course</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-body font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'curriculum' && renderCurriculum()}
          {activeTab === 'requirements' && renderRequirements()}
        </div>
      </div>
    </div>
  );
};

export default CourseBuilder;