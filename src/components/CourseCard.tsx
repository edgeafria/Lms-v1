import React from 'react';
import { Clock, Users, Star, Play, BookOpen, Award } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  thumbnail: string;
  price: number;
  originalPrice?: number;
  duration: string;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
}

interface CourseCardProps {
  course: Course;
  layout?: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, layout = 'grid' }) => {
  const {
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
  } = course;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const gridLayout = (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="bg-secondary-500 hover:bg-secondary-600 text-white p-3 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-5 w-5 ml-0.5" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          {isNew && (
            <span className="bg-tech-500 text-white px-2 py-1 rounded-full text-xs font-body font-semibold">
              NEW
            </span>
          )}
          {isFeatured && (
            <span className="bg-secondary-500 text-white px-2 py-1 rounded-full text-xs font-body font-semibold flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>Featured</span>
            </span>
          )}
        </div>

        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-body font-semibold ${
            level === 'Beginner' 
              ? 'bg-green-100 text-green-800'
              : level === 'Intermediate'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {level}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-500 text-sm font-body font-semibold uppercase tracking-wide">
            {category}
          </span>
          <div className="flex items-center space-x-1 text-secondary-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-body font-semibold">{rating}</span>
            <span className="text-xs text-gray-500">({reviewsCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-headline font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm font-body mb-4 line-clamp-2">
          {description}
        </p>

        {/* Instructor */}
        <div className="flex items-center mb-4">
          <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold mr-3">
            {instructor.name.charAt(0)}
          </div>
          <span className="text-gray-700 text-sm font-body font-medium">
            {instructor.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span className="font-body">{duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="font-body">{studentsCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span className="font-body">24 lessons</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-body"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-headline font-bold text-primary-500">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through font-body">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );

  const listLayout = (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="flex">
        {/* Thumbnail */}
        <div className="relative w-64 h-48 flex-shrink-0 overflow-hidden">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white p-3 rounded-full">
              <Play className="h-5 w-5 ml-0.5" />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex space-x-1">
            {isNew && (
              <span className="bg-tech-500 text-white px-2 py-1 rounded-full text-xs font-body font-semibold">
                NEW
              </span>
            )}
            {isFeatured && (
              <span className="bg-secondary-500 text-white px-2 py-1 rounded-full text-xs font-body font-semibold">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-3">
            <span className="text-primary-500 text-sm font-body font-semibold uppercase tracking-wide">
              {category}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-body font-semibold ${
              level === 'Beginner' 
                ? 'bg-green-100 text-green-800'
                : level === 'Intermediate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {level}
            </span>
          </div>

          <h3 className="font-headline font-bold text-xl text-gray-900 mb-2 group-hover:text-primary-500 transition-colors">
            {title}
          </h3>

          <p className="text-gray-600 font-body mb-4 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center mb-4">
            <div className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold mr-3">
              {instructor.name.charAt(0)}
            </div>
            <span className="text-gray-700 font-body font-medium mr-4">
              {instructor.name}
            </span>
            <div className="flex items-center space-x-1 text-secondary-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-body font-semibold">{rating}</span>
              <span className="text-xs text-gray-500">({reviewsCount})</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="font-body">{duration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="font-body">{studentsCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-headline font-bold text-primary-500">
                    {formatPrice(price)}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-gray-500 line-through font-body">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-lg font-body font-semibold transition-colors">
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return layout === 'grid' ? gridLayout : listLayout;
};

export default CourseCard;