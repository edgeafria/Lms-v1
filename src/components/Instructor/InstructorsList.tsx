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
}

const InstructorsList: React.FC<InstructorsListProps> = ({
  instructors,
  onInstructorClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {instructors.map((instructor) => (
        <div
          key={instructor.id}
          className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer flex flex-col items-center p-6"
          onClick={() => onInstructorClick?.(instructor)}
        >
          <div className="mb-4">
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
          <h3 className="font-headline font-semibold text-lg text-gray-900 mb-1">
            {instructor.name}
          </h3>
          {instructor.bio && (
            <p className="text-gray-600 text-sm text-center mb-2 line-clamp-2">
              {instructor.bio}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
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
                  {instructor.studentsCount}
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
      ))}
    </div>
  );
};

export default InstructorsList;
