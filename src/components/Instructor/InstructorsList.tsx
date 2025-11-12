import React from "react";

interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  coursesCount?: number;
  studentsCount?: number;
  rating?: number;
}

interface InstructorsListProps {
  instructors: Instructor[];
  onInstructorClick?: (instructor: Instructor) => void;
  view: "grid" | "list"; // <-- 1. ACCEPT THE 'view' PROP
}

const InstructorsList: React.FC<InstructorsListProps> = ({
  instructors,
  onInstructorClick,
  view, // <-- 2. DESTRUCTURE THE 'view' PROP
}) => {
  
  // --- 3. DYNAMIC CLASSES BASED ON VIEW ---
  const itemContainerClasses = view === "grid"
    ? "bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer flex flex-col items-center p-6"
    : "bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-center p-6 sm:space-x-6";

  const textAlignment = view === "grid" ? "text-center" : "text-left";
  const avatarAlignment = view === "grid" ? "mb-4" : "mb-4 sm:mb-0 flex-shrink-0";
  const statsJustify = view === "grid" ? "justify-center" : "justify-start";

  return (
    // --- 4. REMOVE THE WRAPPER DIV ---
    // The parent 'InstructorPage' now controls the grid/list layout.
    <>
      {instructors.map((instructor) => (
        <div
          key={instructor.id}
          className={itemContainerClasses} // <-- Use dynamic class
          onClick={() => onInstructorClick?.(instructor)}
        >
          <div className={avatarAlignment}>
            {instructor.avatar ? (
              <img
                src={instructor.avatar}
                alt={instructor.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                {instructor.name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full"> {/* Added wrapper for text */}
            <h3 className={`font-headline font-semibold text-lg text-gray-900 mb-1 ${textAlignment}`}>
              {instructor.name}
            </h3>
            {instructor.bio && (
              <p className={`text-gray-600 text-sm mb-2 line-clamp-2 ${textAlignment}`}>
                {instructor.bio}
              </p>
            )}
            <div className={`flex items-center flex-wrap gap-4 text-sm text-gray-500 mt-2 ${statsJustify}`}>
              {typeof instructor.coursesCount === "number" && (
                <span>
                  <span className="font-semibold text-gray-700">
                    {instructor.coursesCount}
                  </span>{" "}
                  Courses
                </span>
              )}
              {typeof instructor.studentsCount === "number" && (
                <span>
                  <span className="font-semibold text-gray-700">
                    {instructor.studentsCount.toLocaleString()}
                  </span>{" "}
                  Students
                </span>
              )}
              {typeof instructor.rating === "number" && (
                <span>
                  <span className="font-semibold text-yellow-600">
                    {instructor.rating.toFixed(1)}
                  </span>{" "}
                  ★
                </span>
              )}
            </div>
          </div>
          
        </div>
      ))}
    </>
    // --- END FIX ---
  );
};

export default InstructorsList;