import React, { useState, useEffect, Fragment } from 'react';
import { Listbox, Transition, Switch } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { User } from '../../../contexts/AuthContext';
import { axiosInstance } from '../../../contexts/AuthContext';

interface UserModalProps {
  user: User | null; // If null, we are in "Create" mode
  onClose: () => void;
  onSave: (user: User) => void;
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'admin', label: 'Admin' },
];

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = user !== null;

  useEffect(() => {
    if (isEditMode && user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't pre-fill password
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Prepare payload
    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
    };

    if (!isEditMode && formData.password) {
      payload.password = formData.password;
    } else if (!isEditMode && !formData.password) {
      setError('Password is required for new users.');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (isEditMode && user) {
        response = await axiosInstance.put(`/users/${user._id}`, payload);
      } else {
        response = await axiosInstance.post('/users', payload);
      }

      if (response.data.success) {
        onSave(response.data.data); // Pass the updated/new user back
        onClose();
      } else {
        setError(response.data.message || 'An error occurred.');
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'A server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-headline font-bold text-gray-900">
                  {isEditMode ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded-lg font-body text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Min. 6 characters"
                      required
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Role</label>
                    <Listbox value={formData.role} onChange={(val) => setFormData(f => ({ ...f, role: val }))}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-3 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <span className="block truncate capitalize">{formData.role}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                            {roleOptions.map((option) => (
                              <Listbox.Option key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}>
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate capitalize ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
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
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Status</label>
                    <Switch.Group as="div" className="flex items-center space-x-4 h-full">
                      <Switch
                        checked={formData.isActive}
                        onChange={(val) => setFormData(f => ({ ...f, isActive: val }))}
                        className={`${
                          formData.isActive ? 'bg-primary-500' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      >
                        <span
                          className={`${
                            formData.isActive ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                      <Switch.Label className="text-sm font-body font-medium text-gray-700">
                        {formData.isActive ? 'Active' : 'Deactivated'}
                      </Switch.Label>
                    </Switch.Group>
                  </div>
                </div>
                
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-body font-medium text-white hover:bg-primary-600 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEditMode ? 'Save Changes' : 'Create User')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-body font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm disabled:opacity-50"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;