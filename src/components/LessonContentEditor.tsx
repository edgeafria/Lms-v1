import React, { useState } from 'react';
import { Video, FileText, Upload, Download } from 'lucide-react';
import { Textarea } from 'lucide-react'; // Placeholder for richer input

interface LessonContentEditorProps {
    type: 'video' | 'text' | 'quiz' | 'assignment' | 'download' | string;
    content: string; // Used for text/video URL/instructions
    onContentChange: (newContent: string) => void;
    // We pass the full lesson object to read secondary details if needed
    lesson: any;
}

const LessonContentEditor: React.FC<LessonContentEditorProps> = ({ 
    type, 
    content, 
    onContentChange, 
    lesson 
}) => {
    // Determine the title/placeholder based on type
    const getLabel = (type: string) => {
        switch (type) {
            case 'video': return 'Video URL (e.g., YouTube or Vimeo Link)';
            case 'text': return 'Text Content (Full HTML/Markdown or Plain Text)';
            case 'assignment': return 'Assignment Instructions';
            case 'download': return 'Download Link (For direct file hosting)';
            case 'quiz': return 'Quiz Link (Managed in Quiz Builder)';
            default: return 'Content';
        }
    };

    // --- Render Logic based on Lesson Type ---

    if (type === 'video' || type === 'download') {
        // Use a simple text input for URLs/links
        return (
            <div className="space-y-2">
                <label className="block text-sm font-body font-medium text-gray-700">
                    {getLabel(type)}:
                </label>
                <div className="flex items-center space-x-3">
                    {type === 'video' ? <Video className="h-5 w-5 text-red-500 flex-shrink-0" /> : <Download className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                    <input
                        type="url"
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={`Enter ${type} URL or Link`}
                    />
                </div>
                {(type === 'download') && (
                     <p className="text-xs text-gray-500 pt-1">Note: For downloadable files, you can also consider implementing cloud storage uploads via a dedicated route.</p>
                )}
            </div>
        );
    }
    
    if (type === 'text' || type === 'assignment') {
        // Use a textarea for block text/instructions
        return (
            <div className="space-y-2">
                <label className="block text-sm font-body font-medium text-gray-700">
                    {getLabel(type)}:
                </label>
                <textarea
                    rows={type === 'text' ? 8 : 6}
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Enter detailed ${getLabel(type).toLowerCase()} here.`}
                />
                 {type === 'text' && (
                     <p className="text-xs text-gray-500">For rich text formatting (bold, links, etc.), you might integrate a library like TinyMCE or Quill here.</p>
                )}
            </div>
        );
    }

    if (type === 'quiz') {
        // Quiz content is managed by the QuizBuilder modal, not a direct input field.
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm flex items-center space-x-3">
                <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <span className="text-yellow-800 font-medium">
                    Content is managed entirely by the **Quiz Builder Modal**. Use the **Edit Quiz** button next to the lesson title to add questions and settings.
                </span>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="text-sm text-red-500">
            Unsupported lesson type: {type}.
        </div>
    );
};

export default LessonContentEditor;