import React, { useState } from 'react';
import { 
  Save, 
  Eye, 
  Download, 
  Upload, 
  Type, 
  Image, 
  Award, 
  Calendar,
  User,
  BookOpen,
  Palette,
  Move,
  Trash2,
  Plus
} from 'lucide-react';

interface CertificateElement {
  id: string;
  type: 'text' | 'image' | 'signature' | 'date' | 'logo';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface CertificateTemplate {
  id?: string;
  name: string;
  description: string;
  background: string;
  width: number;
  height: number;
  elements: CertificateElement[];
  isDefault: boolean;
}

const CertificateBuilder: React.FC = () => {
  const [template, setTemplate] = useState<CertificateTemplate>({
    name: 'Default Certificate',
    description: 'A professional certificate template',
    background: '#ffffff',
    width: 800,
    height: 600,
    elements: [
      {
        id: '1',
        type: 'text',
        content: 'Certificate of Completion',
        x: 400,
        y: 100,
        width: 400,
        height: 60,
        fontSize: 36,
        fontFamily: 'serif',
        color: '#006747',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: '2',
        type: 'text',
        content: 'This is to certify that',
        x: 400,
        y: 180,
        width: 300,
        height: 30,
        fontSize: 18,
        fontFamily: 'sans-serif',
        color: '#333333',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: '3',
        type: 'text',
        content: '{{STUDENT_NAME}}',
        x: 400,
        y: 240,
        width: 400,
        height: 50,
        fontSize: 32,
        fontFamily: 'serif',
        color: '#F59741',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: '4',
        type: 'text',
        content: 'has successfully completed the course',
        x: 400,
        y: 320,
        width: 350,
        height: 30,
        fontSize: 18,
        fontFamily: 'sans-serif',
        color: '#333333',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: '5',
        type: 'text',
        content: '{{COURSE_NAME}}',
        x: 400,
        y: 380,
        width: 500,
        height: 40,
        fontSize: 24,
        fontFamily: 'serif',
        color: '#006747',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: '6',
        type: 'date',
        content: '{{COMPLETION_DATE}}',
        x: 200,
        y: 500,
        width: 200,
        height: 30,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#666666',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: '7',
        type: 'signature',
        content: '{{INSTRUCTOR_SIGNATURE}}',
        x: 600,
        y: 480,
        width: 150,
        height: 60,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#333333',
        fontWeight: 'normal',
        textAlign: 'center'
      }
    ],
    isDefault: false
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [previewData, setPreviewData] = useState({
    studentName: 'John Doe',
    courseName: 'Full-Stack Web Development',
    completionDate: '2024-12-20',
    instructorName: 'Sarah Johnson'
  });

  const addElement = (type: CertificateElement['type']) => {
    const newElement: CertificateElement = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'New Text' : 
               type === 'date' ? '{{COMPLETION_DATE}}' :
               type === 'signature' ? '{{INSTRUCTOR_SIGNATURE}}' :
               type === 'logo' ? '{{LOGO}}' : 'New Element',
      x: 400,
      y: 300,
      width: type === 'text' ? 200 : type === 'image' || type === 'logo' ? 100 : 150,
      height: type === 'text' ? 40 : type === 'image' || type === 'logo' ? 100 : 60,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#333333',
      fontWeight: 'normal',
      textAlign: 'center'
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<CertificateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  };

  const deleteElement = (elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const renderElement = (element: CertificateElement, isPreview = false) => {
    let content = element.content;
    
    if (isPreview) {
      content = content
        .replace('{{STUDENT_NAME}}', previewData.studentName)
        .replace('{{COURSE_NAME}}', previewData.courseName)
        .replace('{{COMPLETION_DATE}}', previewData.completionDate)
        .replace('{{INSTRUCTOR_SIGNATURE}}', previewData.instructorName)
        .replace('{{INSTRUCTOR_NAME}}', previewData.instructorName);
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.x - element.width / 2,
      top: element.y - element.height / 2,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      color: element.color,
      fontWeight: element.fontWeight,
      textAlign: element.textAlign,
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
      cursor: isPreview ? 'default' : 'pointer',
      border: !isPreview && selectedElement === element.id ? '2px solid #0A66EA' : '1px dashed transparent',
      backgroundColor: !isPreview && selectedElement === element.id ? 'rgba(10, 102, 234, 0.1)' : 'transparent'
    };

    if (element.type === 'image' || element.type === 'logo') {
      return (
        <div
          key={element.id}
          style={style}
          onClick={() => !isPreview && setSelectedElement(element.id)}
        >
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      );
    }

    if (element.type === 'signature') {
      return (
        <div
          key={element.id}
          style={style}
          onClick={() => !isPreview && setSelectedElement(element.id)}
        >
          <div className="w-full text-center">
            <div className="border-t border-gray-400 mb-1"></div>
            <div style={{ fontSize: element.fontSize }}>{content}</div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={() => !isPreview && setSelectedElement(element.id)}
      >
        {content}
      </div>
    );
  };

  const renderDesign = () => (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Toolbar */}
      <div className="lg:col-span-1">
        <div className="space-y-6">
          {/* Add Elements */}
          <div>
            <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Add Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addElement('text')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Type className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-xs font-body">Text</span>
              </button>
              <button
                onClick={() => addElement('image')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Image className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-xs font-body">Image</span>
              </button>
              <button
                onClick={() => addElement('signature')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-xs font-body">Signature</span>
              </button>
              <button
                onClick={() => addElement('date')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-xs font-body">Date</span>
              </button>
              <button
                onClick={() => addElement('logo')}
                className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Award className="h-6 w-6 text-gray-600 mb-1" />
                <span className="text-xs font-body">Logo</span>
              </button>
            </div>
          </div>

          {/* Template Settings */}
          <div>
            <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Template Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.background}
                    onChange={(e) => setTemplate(prev => ({ ...prev, background: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.background}
                    onChange={(e) => setTemplate(prev => ({ ...prev, background: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={template.width}
                    onChange={(e) => setTemplate(prev => ({ ...prev, width: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={template.height}
                    onChange={(e) => setTemplate(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Element Properties */}
          {selectedElement && (
            <div>
              <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Element Properties</h3>
              <ElementProperties
                element={template.elements.find(el => el.id === selectedElement)!}
                onUpdate={(updates) => updateElement(selectedElement, updates)}
                onDelete={() => deleteElement(selectedElement)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-3">
        <div className="bg-gray-100 p-8 rounded-lg">
          <div
            className="relative mx-auto shadow-lg"
            style={{
              width: template.width * 0.75,
              height: template.height * 0.75,
              backgroundColor: template.background,
              transform: 'scale(0.75)',
              transformOrigin: 'top center'
            }}
          >
            {template.elements.map(element => renderElement(element))}
          </div>
        </div>
      </div>
    </div>
  );

  const ElementProperties: React.FC<{
    element: CertificateElement;
    onUpdate: (updates: Partial<CertificateElement>) => void;
    onDelete: () => void;
  }> = ({ element, onUpdate, onDelete }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-body font-medium text-gray-700">
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element
        </span>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {(element.type === 'text' || element.type === 'date' || element.type === 'signature') && (
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            rows={3}
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            X Position
          </label>
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Y Position
          </label>
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Width
          </label>
          <input
            type="number"
            value={element.width}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Height
          </label>
          <input
            type="number"
            value={element.height}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      {(element.type === 'text' || element.type === 'date' || element.type === 'signature') && (
        <>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <input
              type="number"
              value={element.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={element.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={element.fontWeight}
              onChange={(e) => onUpdate({ fontWeight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Text Align
            </label>
            <select
              value={element.textAlign}
              onChange={(e) => onUpdate({ textAlign: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={element.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-headline font-bold text-gray-900 mb-4">Preview Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={previewData.studentName}
              onChange={(e) => setPreviewData(prev => ({ ...prev, studentName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={previewData.courseName}
              onChange={(e) => setPreviewData(prev => ({ ...prev, courseName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Completion Date
            </label>
            <input
              type="date"
              value={previewData.completionDate}
              onChange={(e) => setPreviewData(prev => ({ ...prev, completionDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-2">
              Instructor Name
            </label>
            <input
              type="text"
              value={previewData.instructorName}
              onChange={(e) => setPreviewData(prev => ({ ...prev, instructorName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="bg-gray-100 p-8 rounded-lg">
        <div
          className="relative mx-auto shadow-lg"
          style={{
            width: template.width,
            height: template.height,
            backgroundColor: template.background
          }}
        >
          {template.elements.map(element => renderElement(element, true))}
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
              <h1 className="text-2xl font-headline font-bold text-primary-500">Certificate Builder</h1>
              <p className="text-sm text-gray-600 font-body">Design and customize certificate templates</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-body font-medium">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium">
                <Save className="h-4 w-4" />
                <span>Save Template</span>
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
              { id: 'design', label: 'Design', icon: Palette },
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {activeTab === 'design' && renderDesign()}
          {activeTab === 'preview' && renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default CertificateBuilder;