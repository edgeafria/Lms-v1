import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../../../contexts/AuthContext'; // Import main User type

interface DeleteUserModalProps {
  user: User | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  error: string | null;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isDeleting,
  onClose,
  onConfirm,
  error
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-2xl font-headline font-bold text-gray-900">
                  Delete User
                </h3>
                <div className="mt-2">
                  <p className="text-sm font-body text-gray-600">
                    Are you sure you want to permanently delete "<strong>{user.name}</strong>" ({user.email})?
                  </p>
                  <p className="text-sm font-body text-red-600 mt-2">
                    This action is irreversible. All of the user's data, including enrollments and submissions, will be permanently lost.
                  </p>
                  {error && (
                    <p className="text-sm font-body text-red-700 bg-red-100 p-3 mt-3 rounded-md">
                      <strong>Error:</strong> {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              type="button"
              disabled={isDeleting}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-body font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={onConfirm}
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete User'}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-body font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;