import React, { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CategoryOption } from '../../../pages/AdminDashboard'; // 🐞 Import shared interface
import { axiosInstance } from '../../../contexts/AuthContext';

interface CategoryModalProps {
  categories: CategoryOption[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryOption[]>>;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  categories,
  setCategories,
  onClose
}) => {
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to create a slug-like value
  const slugify = (text: string) => 
    text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
        .replace(/^-+|-+$/g, '');   // Remove leading/trailing -

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryLabel(e.target.value);
    setNewCategoryValue(slugify(e.target.value));
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel || !newCategoryValue) {
      setError("Please enter both a label and a value.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/categories', {
        label: newCategoryLabel,
        value: newCategoryValue
      });

      if (response.data.success) {
        setCategories(prev => [...prev, response.data.data].sort((a, b) => a.label.localeCompare(b.label)));
        setNewCategoryLabel('');
        setNewCategoryValue('');
      } else {
        setError(response.data.message || 'Failed to add category.');
      }
    } catch (err: any) {
      console.error("Error adding category:", err);
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryOption) => {
    if (!window.confirm(`Are you sure you want to delete "${category.label}"? This action cannot be undone.`)) {
      return;
    }
    
    setError(null);
    try {
      const response = await axiosInstance.delete(`/categories/${category._id}`);
      if (response.data.success) {
        setCategories(prev => prev.filter(c => c._id !== category._id));
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      // This will catch the "category in use" error from our API
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-headline font-bold text-gray-900">
                Manage Categories
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg font-body text-sm">
                  {error}
                </div>
              )}
              
              {/* Form to add new category */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-headline font-semibold text-gray-900 mb-3">Add New Category</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Category Label</label>
                    <input
                      type="text"
                      value={newCategoryLabel}
                      onChange={handleLabelChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., AI Engineering"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Category Value (Slug)</label>
                    <input
                      type="text"
                      value={newCategoryValue}
                      onChange={(e) => setNewCategoryValue(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., ai-engineering"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      onClick={handleAddCategory}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-body font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      <span>{isSubmitting ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* List of existing categories */}
              <div>
                <h4 className="text-lg font-headline font-semibold text-gray-900 mb-3">Existing Categories</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-body font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-6 py-3 text-left text-xs font-body font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-right text-xs font-body font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category) => (
                        <tr key={category.value}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-body font-medium text-gray-900">{category.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-body text-gray-500">{category.value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-body font-medium text-gray-700 hover:bg-gray-50 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;