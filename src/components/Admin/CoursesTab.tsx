import React, { Fragment } from 'react';
// 🐞 Import Switch from headless UI
import { Listbox, Transition, Switch } from '@headlessui/react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Settings,
  Check, 
  ChevronsUpDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Course, CategoryOption } from '../../pages/AdminDashboard'; // Import shared interfaces

// 🐞 --- STATIC DROPDOWN OPTIONS ---
const filterStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

// 🐞 NEW: Featured filter options
const filterFeaturedOptions = [
  { value: 'all', label: 'All Courses' },
  { value: 'true', label: 'Featured Only' },
  { value: 'false', label: 'Not Featured' },
];
// ---

// Helper to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price);
};

// --- Component Props Interface ---
interface CoursesTabProps {
  courses: Course[];
  categories: CategoryOption[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  
  // 🐞 Add new props
  filterFeatured: string;
  setFilterFeatured: (value: string) => void;
  onToggleFeatured: (course: Course, newFeaturedState: boolean) => void;

  onViewCourse: (id: string) => void;
  onEditCourse: (id: string) => void;
  onArchiveCourse: (course: Course) => void;
  onManageCategories: () => void;
}

const CoursesTab: React.FC<CoursesTabProps> = ({
  courses,
  categories,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,

  // 🐞 Destructure new props
  filterFeatured,
  setFilterFeatured,
  onToggleFeatured,

  onViewCourse,
  onEditCourse,
  onArchiveCourse,
  onManageCategories
}) => {

  const filterCategoryOptions = [
    { _id: 'all', value: 'all', label: 'All Categories' },
    ...categories,
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg flex items-center">
        <AlertCircle className="h-6 w-6 mr-3" />
        <div>
          <h4 className="font-bold">Error Loading Courses</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600 font-body">Create, edit, and manage all courses</p>
        </div>
        <button
          onClick={onManageCategories} 
          title="Manage course categories"
          className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-body font-semibold flex items-center space-x-2"
        >
          <Settings className="h-5 w-5" />
          <span>Manage Categories</span>
        </button>
      </div>

      {/* 🐞 Filters - Added Featured Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            
            {/* STATUS FILTER LISTBOX */}
            <Listbox value={filterStatus} onChange={setFilterStatus}>
              <div className="relative w-40">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-2 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span className="block truncate">{filterStatusOptions.find(o => o.value === filterStatus)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {filterStatusOptions.map((option) => (
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
            
            {/* CATEGORY FILTER LISTBOX */}
            <Listbox value={filterCategory} onChange={setFilterCategory}>
              <div className="relative w-48">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-2 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span className="block truncate">{filterCategoryOptions.find(o => o.value === filterCategory)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {filterCategoryOptions.map((option) => (
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
            
            {/* 🐞 NEW: FEATURED FILTER LISTBOX */}
            <Listbox value={filterFeatured} onChange={setFilterFeatured}>
              <div className="relative w-40">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white px-4 py-2 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <span className="block truncate">{filterFeaturedOptions.find(o => o.value === filterFeatured)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {filterFeaturedOptions.map((option) => (
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
      </div>

      {/* 🐞 Courses Table - Added "Featured" Column */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Course</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Instructor</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Students</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Price</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Status</th>
                <th className="text-center py-4 px-6 font-body font-semibold text-gray-900">Featured</th>
                <th className="text-left py-4 px-6 font-body font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={course.thumbnail?.url || 'https://via.placeholder.com/150'}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-body font-semibold text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-600 font-body">{course.category} • {course.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{course.instructor.name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body text-gray-900">{course.enrollmentCount}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-body font-semibold text-gray-900">{formatPrice(course.price)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      course.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  {/* 🐞 NEW: Featured Toggle Cell */}
                  <td className="py-4 px-6 text-center">
                    <Switch
                      checked={course.featured}
                      onChange={(newFeaturedState: boolean) => onToggleFeatured(course, newFeaturedState)}
                      className={`${
                        course.featured ? 'bg-primary-500' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          course.featured ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onViewCourse(course._id)}
                        className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                        title="View Course"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditCourse(course._id)}
                        className="p-2 text-gray-600 hover:text-tech-500 hover:bg-tech-50 rounded-lg"
                        title="Edit Course"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {course.status !== 'archived' && (
                        <button 
                          onClick={() => onArchiveCourse(course)}
                          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Archive Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoursesTab;