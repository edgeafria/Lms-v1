import React, { useState, useCallback, ChangeEvent } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, File as FileIcon, Loader2, Heading1, Heading2, Heading3, Palette } from 'lucide-react';
import { axiosInstance } from '../contexts/AuthContext';
import axios from 'axios';

// --- IMPORTS ---
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
// --------------------

// Import ProseMirror base styles
import 'prosemirror-view/style/prosemirror.css';

interface RichTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

// Pre-defined colors for cycling
const colorCycle = [
    { name: 'Default', value: '' }, // Represents unsetColor
    { name: 'Red', value: '#E03131' },
    { name: 'Blue', value: '#1C7ED6' },
    { name: 'Green', value: '#2F9E44' },
];

// Toolbar Component
const EditorToolbar: React.FC<{ editor: Editor | null, onFileSelect: (file: File, type: 'image' | 'pdf') => void, isUploading: boolean }> = ({ editor, onFileSelect, isUploading }) => {
    if (!editor) {
        return null;
    }

    const handleLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
        const urlWithProtocol = /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : `http://${url}`;
        editor.chain().focus().extendMarkRange('link').setLink({ href: urlWithProtocol, target: '_blank' }).run();
    }, [editor]);

    const triggerFileInput = (accept: string, type: 'image' | 'pdf') => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = accept;
        input.onchange = (event: Event) => { const target = event.target as HTMLInputElement; if (target.files && target.files[0]) { onFileSelect(target.files[0], type); } };
        input.click();
     };

     const handleCycleColor = () => {
         const currentAttributes = editor.getAttributes('textStyle');
         const currentColor = currentAttributes?.color || '';

         const currentIndex = colorCycle.findIndex(c => c.value === currentColor);
         const nextIndex = (currentIndex + 1) % colorCycle.length;
         const nextColor = colorCycle[nextIndex];

         if (nextColor.value) {
             editor.chain().focus().setColor(nextColor.value).run();
         } else {
             editor.chain().focus().unsetColor().run();
         }
     }

     const currentAppliedColor = editor.getAttributes('textStyle')?.color;


  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 border border-b-0 border-gray-300 rounded-t-lg p-2 bg-gray-50 relative">
      {/* Basic Formatting */}
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`} title="Heading 1"> <Heading1 className="h-4 w-4" /> </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`} title="Heading 2"> <Heading2 className="h-4 w-4" /> </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`} title="Heading 3"> <Heading3 className="h-4 w-4" /> </button>
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`} title="Bold"> <Bold className="h-4 w-4" /> </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`} title="Italic"> <Italic className="h-4 w-4" /> </button>

      {/* --- Single Color Cycle Button --- */}
       <button
            onClick={handleCycleColor}
            className={`p-1 rounded hover:bg-gray-200 relative ${currentAppliedColor ? 'ring-1 ring-offset-1 ring-gray-400' : ''}`}
            title="Cycle Text Color (Default, Red, Blue, Green)"
        >
           <Palette className="h-4 w-4" />
           {currentAppliedColor && (
               <span
                   className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full ring-1 ring-white"
                   style={{ backgroundColor: currentAppliedColor }}
               />
           )}
       </button>
       {/* --- End Color Cycle Button --- */}

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`} title="Bullet List"> <List className="h-4 w-4" /> </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`} title="Numbered List"> <ListOrdered className="h-4 w-4" /> </button>
      <button onClick={handleLink} className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`} title="Add Link"> <LinkIcon className="h-4 w-4" /> </button>

      {/* Upload Buttons */}
      <button onClick={() => triggerFileInput('image/*', 'image')} className={`p-1 rounded hover:bg-gray-200 disabled:opacity-50`} disabled={isUploading} title="Upload Image" > <ImageIcon className="h-4 w-4" /> </button>
      <button onClick={() => triggerFileInput('.pdf, .doc, .docx', 'pdf')} className={`p-1 rounded hover:bg-gray-200 disabled:opacity-50`} disabled={isUploading} title="Upload PDF/Doc" > <FileIcon className="h-4 w-4" /> </button>

      {/* Upload Indicator */}
      {isUploading && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-70 flex items-center justify-center rounded-t-lg">
           <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
           <span className="ml-2 text-sm text-gray-600">Uploading...</span>
        </div>
      )}
    </div>
  );
};


const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
         heading: { levels: [1, 2, 3] },
         link: {
             openOnClick: false,
             autolink: true,
             HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' }
         },
         bulletList: { HTMLAttributes: { class: 'list-disc pl-4' } },
         orderedList: { HTMLAttributes: { class: 'list-decimal pl-4' } },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: 'max-w-full h-auto rounded' },
      }),
      TextStyle,
      Color.configure(),
    ],
    content: content,
    editorProps: {
        attributes: {
            class: 'ProseMirror prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[150px] p-3',
        },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

   const handleFileUpload = async (file: File, type: 'image' | 'pdf') => {
        if (!editor) return; 
        setIsUploading(true); 
        setUploadError(null);
        
        const formData = new FormData(); 
        formData.append('file', file);
        
        try {
            const response = await axiosInstance.post('/upload', formData, { 
              headers: { 'Content-Type': 'multipart/form-data' }, 
            });

            console.log('Upload Response Data:', response.data); // For debugging

            if (response.data.success && response.data.data) {
                const {
                  url, 
                  public_id, 
                  original_filename,
                  resource_type
                } = response.data.data;
                
                const fileName = original_filename || (type === 'pdf' ? 'Download File' : 'Image');

                if (resource_type === 'image') {
                    // --- IMAGE LOGIC (Public) ---
                    editor.chain().focus().setImage({ src: url, alt: fileName }).run();

                } else if (resource_type === 'raw') {
                    // --- PDF/RAW FILE LOGIC (Private) ---
                    
                    // Get the backend's base URL from Vite's .env variable
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

                    // Add this log to check if the variable is loaded
                    console.log('VITE_API_BASE_URL loaded as:', API_BASE_URL);

                    if (!API_BASE_URL) {
                      console.error("VITE_API_BASE_URL is not set in your .env file!");
                      throw new Error("Client configuration error. Please set VITE_API_BASE_URL.");
                    }

                    // Build the secure URL path
                    const proxyUrlPath = `/assets?id=${encodeURIComponent(public_id)}&name=${encodeURIComponent(fileName)}`;
                    
                    // Create the full, absolute URL
                    const absoluteProxyUrl = `${API_BASE_URL}${proxyUrlPath}`;

                    // Insert the absolute link to our secure proxy
                    editor.chain().focus().insertContent(
                      `<a href="${absoluteProxyUrl}" target="_blank" rel="noopener noreferrer">${fileName}</a> `
                    ).run();
                } else {
                  console.error(`Unknown resource_type: '${resource_type}'. Cannot insert file.`);
                  setUploadError(`Upload succeeded but file type '${resource_type}' is not handled.`);
                  setTimeout(() => setUploadError(null), 5000);
                }
            } else { 
              throw new Error(response.data.message || 'Upload failed'); 
            }
        } catch (err: any) {
             console.error("Upload error:", err); 
             let message = 'File upload failed.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
              message = err.response.data.message;
            } else if (err instanceof Error) {
              message = err.message;
            }
            setUploadError(message); 
            setTimeout(() => setUploadError(null), 5000);
        } finally { 
          setIsUploading(false); 
        }
   };

  return (
    <div className='border border-gray-300 rounded-lg bg-white'>
      <EditorToolbar editor={editor} onFileSelect={handleFileUpload} isUploading={isUploading} />
       {uploadError && <div className="text-xs text-red-600 px-3 py-1 bg-red-50 border-t border-red-200">{uploadError}</div>}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;