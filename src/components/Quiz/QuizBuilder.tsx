import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  Settings,
  Clock,
  CheckCircle,
  Circle,
  Square,
  Type,
  Image,
  Move
} from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: QuizOption[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  order: number;
}

interface QuizData {
  id?: string;
  title: string;
  description: string;
  courseId: string;
  timeLimit: number; // in minutes, 0 = no limit
  attempts: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after-submission' | 'never';
  questions: QuizQuestion[];
  instructions: string;
}

const QuizBuilder: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    description: '',
    courseId: '',
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

  const addQuestion = (type: QuizQuestion['type']) => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      points: 1,
      order: quizData.questions.length,
      ...(type === 'multiple-choice' && {
        options: [
          { id: '1', text: '', isCorrect: true },
          { id: '2', text: '', isCorrect: false },
          { id: '3', text: '', isCorrect: false },
          { id: '4', text: '', isCorrect: false }
        ]
      }),
      ...(type === 'true-false' && {
        options: [
          { id: '1', text: 'True', isCorrect: true },
          { id: '2', text: 'False', isCorrect: false }
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
      id: Date.now().toString(),
      text: '',
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
      setSelectedQuestion(null);
    }
  };

  const deleteOption = (questionId: string, optionId: string) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question?.options || question.options.length <= 2) return;

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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter quiz title"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Course
          </label>
          <select
            value={quizData.courseId}
            onChange={(e) => setQuizData(prev => ({ ...prev, courseId: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Course</option>
            <option value="1">Full-Stack Web Development</option>
            <option value="2">Digital Marketing Mastery</option>
            <option value="3">Data Science with Python</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={quizData.timeLimit}
            onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Show Results
          </label>
          <select
            value={quizData.showResults}
            onChange={(e) => setQuizData(prev => ({ ...prev, showResults: e.target.value as any }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="immediately">Immediately</option>
            <option value="after-submission">After Submission</option>
            <option value="never">Never</option>
          </select>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter instructions for students taking this quiz"
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-body font-semibold text-gray-900">Quiz Options</h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={quizData.shuffleQuestions}
              onChange={(e) => setQuizData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="font-body text-gray-700">Shuffle Questions</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={quizData.shuffleOptions}
              onChange={(e) => setQuizData(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="font-body text-gray-700">Shuffle Answer Options</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Question List */}
      <div className="lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-headline font-bold text-gray-900">Questions</h3>
          <div className="relative group">
            <button className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg">
              <Plus className="h-4 w-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => addQuestion('multiple-choice')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                >
                  Multiple Choice
                </button>
                <button
                  onClick={() => addQuestion('true-false')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                >
                  True/False
                </button>
                <button
                  onClick={() => addQuestion('short-answer')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                >
                  Short Answer
                </button>
                <button
                  onClick={() => addQuestion('essay')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                >
                  Essay
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {quizData.questions.map((question, index) => (
            <div
              key={question.id}
              onClick={() => setSelectedQuestion(question.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedQuestion === question.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-body font-semibold text-gray-900">Q{index + 1}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-body font-medium ${
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
                  className="text-red-500 hover:text-red-600 p-1"
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

      {/* Question Editor */}
      <div className="lg:col-span-2">
        {selectedQuestion ? (
          <QuestionEditor
            question={quizData.questions.find(q => q.id === selectedQuestion)!}
            onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
            onUpdateOption={(optionId, updates) => updateOption(selectedQuestion, optionId, updates)}
            onAddOption={() => addOption(selectedQuestion)}
            onDeleteOption={(optionId) => deleteOption(selectedQuestion, optionId)}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Edit className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-gray-900 mb-2">Select a Question</h3>
            <p className="text-gray-600 font-body">Choose a question from the list to edit it</p>
          </div>
        )}
      </div>
    </div>
  );

  const QuestionEditor: React.FC<{
    question: QuizQuestion;
    onUpdate: (updates: Partial<QuizQuestion>) => void;
    onUpdateOption: (optionId: string, updates: Partial<QuizOption>) => void;
    onAddOption: () => void;
    onDeleteOption: (optionId: string) => void;
  }> = ({ question, onUpdate, onUpdateOption, onAddOption, onDeleteOption }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-headline font-bold text-gray-900">Edit Question</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 font-body">Points:</span>
          <input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate({ points: Number(e.target.value) })}
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter your question here"
        />
      </div>

      {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
        <div>
          <div className="flex items-center justify-between mb-3">
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
              <div key={option.id} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={() => {
                    // For multiple choice, only one option can be correct
                    question.options?.forEach(opt => {
                      onUpdateOption(opt.id, { isCorrect: opt.id === option.id });
                    });
                  }}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Explain why this is the correct answer"
        />
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-headline font-bold text-gray-900 mb-2">{quizData.title || 'Untitled Quiz'}</h2>
          {quizData.description && (
            <p className="text-gray-600 font-body">{quizData.description}</p>
          )}
          
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-600">
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-body font-semibold text-blue-900 mb-2">Instructions</h3>
              <p className="text-blue-800 font-body text-sm">{quizData.instructions}</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {quizData.questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-3 mb-4">
                <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-body font-semibold text-gray-900 mb-2">{question.question}</p>
                  <span className="text-xs text-gray-500 font-body">{question.points} point(s)</span>
                </div>
              </div>

              {question.type === 'multiple-choice' && question.options && (
                <div className="ml-11 space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`preview-${question.id}`}
                        className="text-primary-500 focus:ring-primary-500"
                        disabled
                      />
                      <span className="font-body text-gray-700">{option.text}</span>
                      {option.isCorrect && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'true-false' && question.options && (
                <div className="ml-11 space-y-2">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`preview-${question.id}`}
                        className="text-primary-500 focus:ring-primary-500"
                        disabled
                      />
                      <span className="font-body text-gray-700">{option.text}</span>
                      {option.isCorrect && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'short-answer' && (
                <div className="ml-11">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your answer here"
                    disabled
                  />
                </div>
              )}

              {question.type === 'essay' && (
                <div className="ml-11">
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your essay answer here"
                    disabled
                  />
                </div>
              )}

              {question.explanation && (
                <div className="ml-11 mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-body">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-headline font-bold text-primary-500">Quiz Builder</h1>
              <p className="text-sm text-gray-600 font-body">Create and manage quiz assessments</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium">
                <Save className="h-4 w-4" />
                <span>Save Quiz</span>
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
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'questions', label: 'Questions', icon: Edit },
              { id: 'preview', label: 'Preview', icon: Eye },
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
                  {tab.id === 'questions' && quizData.questions.length > 0 && (
                    <span className="bg-white text-primary-500 text-xs px-2 py-1 rounded-full font-semibold">
                      {quizData.questions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'preview' && renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;