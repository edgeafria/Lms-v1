import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'xl' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 sm:p-8 overflow-y-auto transition-opacity duration-300"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-headline font-bold text-gray-900">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Body (scrollable) */}
                <div className="p-4 sm:p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;