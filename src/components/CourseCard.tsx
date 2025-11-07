import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Clock, Users, Star, Play, BookOpen, Award } from 'lucide-react';

// Re-define BackendCourse locally if not imported globally
interface BackendInstructor { _id?: string; name: string; avatar?: { url?: string } | string; }
interface BackendCourse { _id: string; title: string; description: string; instructor: BackendInstructor; thumbnail?: { url?: string }; price: number; originalPrice?: number; duration?: string; studentsCount?: number; rating?: { average?: number; count?: number }; reviewsCount?: number; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'; category: string; tags?: string[]; isFeatured?: boolean; isNew?: boolean; slug?: string; currency?: string; enrollmentCount?: number;}


// Interface defining the props this component expects
interface CourseCardPropsCourse {
  id: string; // Expects 'id', which CoursesPage maps from '_id'
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string; // Expects string URL
  };
  thumbnail: string; // Expects string URL
  price: number;
  originalPrice?: number;
  duration: string;
  studentsCount: number;
  rating: number; // Expects single number
  reviewsCount: number; // Expects single number
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  currency?: string;
}

interface CourseCardProps {
  course: CourseCardPropsCourse; // Use the specific props interface
  layout?: 'grid' | 'list';
  // Use the original BackendCourse type for handlers
  onCourseClick?: (course: BackendCourse) => void;
  onEnrollClick?: (course: BackendCourse) => void;
}


const CourseCard: React.FC<CourseCardProps> = ({ course, layout = 'grid', onCourseClick, onEnrollClick }) => {
  const {
    id, // Use id here (mapped from _id)
    title,
    description,
    instructor,
    thumbnail,
    price,
    originalPrice,
    duration,
    studentsCount,
    rating,
    reviewsCount,
    level,
    category,
    tags,
    isFeatured,
    isNew,
    currency
  } = course;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { // Use appropriate locale
      style: 'currency',
      currency: currency || 'NGN', // Use currency from props or default
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Reconstruct minimal original course data if needed by handlers
  // Note: This relies on props passed to CourseCard mirroring BackendCourse structure closely
  const originalCourseData: BackendCourse = {
      _id: id,
      title,
      description,
      instructor: { name: instructor.name, avatar: instructor.avatar }, // Reconstruct simply
      thumbnail: { url: thumbnail }, // Reconstruct simply
      price,
      originalPrice,
      duration,
      studentsCount,
      rating: { average: rating, count: reviewsCount },
      level: level as BackendCourse['level'], // Cast level back, handle 'All Levels' if needed
      category,
      tags,
      isFeatured,
      isNew,
      currency,
      // Add other fields if needed by handlers
  };

  const handleCardClick = () => {
      onCourseClick?.(originalCourseData); // Pass reconstructed original data
  };

  const handleEnrollBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation(); // Prevent card click / Link navigation
      onEnrollClick?.(originalCourseData); // Pass reconstructed original data
  };


  const gridLayout = (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group flex flex-col font-body">
      {/* Thumbnail as Link - USES course.id */}
      <Link to={`/course/${id}`} className="relative block overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
           onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = `https://placehold.co/600x400/EAEAEA/757575?text=Image+Error`; }}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"> <span className="bg-secondary-500 text-white p-3 rounded-full transform scale-90 group-hover:scale-100 transition-transform"> <Play className="h-5 w-5 ml-0.5" /> </span> </div>
        <div className="absolute top-3 left-3 flex flex-col space-y-1"> {isNew && <span className="bg-tech-500 text-white px-2 py-1 rounded-full text-xs font-semibold"> NEW </span>} {isFeatured && <span className="bg-secondary-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"> <Award className="h-3 w-3" /> <span>Featured</span> </span>} </div>
        <div className="absolute top-3 right-3"> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ level === 'Beginner' ? 'bg-green-100 text-green-800' : level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}> {level} </span> </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-500 text-sm font-semibold uppercase tracking-wide"> {category} </span>
          {rating > 0 && reviewsCount > 0 && ( <div className="flex items-center space-x-1 text-secondary-500"> <Star className="h-4 w-4 fill-current" /> <span className="text-sm font-semibold">{rating.toFixed(1)}</span> <span className="text-xs text-gray-500">({reviewsCount})</span> </div> )}
        </div>
        {/* Title as Link - USES course.id */}
        <h3 className="font-headline font-bold text-lg text-gray-900 mb-2 h-14 line-clamp-2 transition-colors">
            <Link to={`/course/${id}`} className="hover:text-primary-500">{title}</Link>
        </h3>
        <div className="flex items-center mb-4">
          <img src={instructor.avatar || `https://placehold.co/40x40/cccccc/000?text=${instructor.name.charAt(0)}`} alt={instructor.name} className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200" onError={(e) => { /* Fallback */ }} />
          <span className="text-gray-700 text-sm font-medium"> {instructor.name} </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 border-t pt-3 mt-auto">
          <div className="flex items-center space-x-1" title="Duration"> <Clock className="h-4 w-4" /> <span>{duration}</span> </div>
          <div className="flex items-center space-x-1" title="Enrolled Students"> <Users className="h-4 w-4" /> <span>{studentsCount.toLocaleString()}</span> </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-headline font-bold text-primary-500"> {formatPrice(price)} </span>
            {originalPrice && originalPrice > price && ( <span className="text-sm text-gray-500 line-through font-body"> {formatPrice(originalPrice)} </span> )}
          </div>
          <button onClick={handleEnrollBtnClick} className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"> Enroll Now </button>
        </div>
      </div>
    </div>
  );

  const listLayout = (
     <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex font-body">
      {/* Thumbnail as Link - USES course.id */}
      <Link to={`/course/${id}`} className="relative w-64 h-full flex-shrink-0 overflow-hidden block">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { /* Fallback */ }} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"> <span className="bg-secondary-500 text-white p-3 rounded-full"> <Play className="h-5 w-5 ml-0.5" /> </span> </div>
        <div className="absolute top-3 left-3 flex space-x-1"> {isNew && <span className="bg-tech-500 text-white px-2 py-1 rounded-full text-xs font-semibold">NEW</span>} {isFeatured && <span className="bg-secondary-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Featured</span>} </div>
      </Link>
      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
         <div> {/* Top section */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-primary-500 text-sm font-semibold uppercase tracking-wide"> {category} </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ level === 'Beginner' ? 'bg-green-100 text-green-800' : level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}> {level} </span>
            </div>
            {/* Title as Link - USES course.id */}
            <h3 className="font-headline font-bold text-xl text-gray-900 mb-2 transition-colors"> <Link to={`/course/${id}`} className="hover:text-primary-500">{title}</Link> </h3>
            <p className="text-gray-600 mb-3 line-clamp-2"> {description} </p>
             <div className="flex items-center mb-3">
                 <img src={instructor.avatar || `https://placehold.co/40x40/cccccc/000?text=${instructor.name.charAt(0)}`} alt={instructor.name} className="w-6 h-6 rounded-full mr-2 object-cover border"/>
                <span className="text-gray-700 font-medium text-sm mr-4"> {instructor.name} </span>
                {rating > 0 && reviewsCount > 0 && ( <div className="flex items-center space-x-1 text-secondary-500"> <Star className="h-4 w-4 fill-current" /> <span className="text-sm font-semibold">{rating.toFixed(1)}</span> <span className="text-xs text-gray-500">({reviewsCount})</span> </div> )}
            </div>
             <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
              <div className="flex items-center space-x-1"> <Clock className="h-4 w-4" /> <span>{duration}</span> </div>
              <div className="flex items-center space-x-1"> <Users className="h-4 w-4" /> <span>{studentsCount.toLocaleString()}</span> </div>
            </div>
        </div>
        {/* Bottom section */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-headline font-bold text-primary-500"> {formatPrice(price)} </span>
              {originalPrice && originalPrice > price && ( <span className="text-sm text-gray-500 line-through font-body"> {formatPrice(originalPrice)} </span> )}
            </div>
            <button onClick={handleEnrollBtnClick} className="bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm"> Enroll Now </button>
        </div>
      </div>
    </div>
  );

  return layout === 'grid' ? gridLayout : listLayout;
};

export default CourseCard;