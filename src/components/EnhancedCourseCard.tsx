'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/database/schema';
import { useAuth } from '@/hooks/useAuth';
import { useCourseAccessContext } from '@/contexts/CourseAccessContext';
import AddToCartButton from './AddToCartButton';

interface EnhancedCourseCardProps {
  course: Course;
  onSeeMore?: (courseId: string) => void;
}

export default function EnhancedCourseCard({ course, onSeeMore }: EnhancedCourseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess, loading: courseAccessLoading } = useCourseAccessContext();

  // Remove skeleton loading since the page waits for all data before rendering

  const handleSeeMore = () => {
    if (onSeeMore) {
      onSeeMore(course.id);
    } else {
      // Navigate to course video page
      router.push(`/course/${course.id}`);
    }
  };

  const handleAccessCourse = () => {
    router.push(`/course/${course.id}`);
  };

  const hasAccessToCourse = user && hasAccess(course.id);

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 max-w-full shadow-md hover:shadow-lg bg-white transition-shadow duration-200 h-fit">
      {/* Course Image */}
      <div className="mb-3">
        <img
          src={course.thumbnail_url}
          alt={course.title}
          onClick={handleSeeMore}
          className="w-full h-32 sm:h-36 md:h-40 object-contain rounded-md cursor-pointer hover:opacity-80 transition-opacity duration-200"
        />
      </div>
      
      {/* Course Title */}
      <h3 
        onClick={handleSeeMore}
        className="text-sm sm:text-base font-bold mb-2 text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200 overflow-hidden"
        style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis'
        }}
      >
        {course.title}
      </h3>
      
      {/* Course Description */}
      <p 
        className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed overflow-hidden"
        style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis'
        }}
      >
        {course.description}
      </p>
      
      {/* Instructor */}
      <div className="text-xs text-gray-500 mb-3">
        Instructor: {course.instructor_name}
      </div>
      
      {/* Price */}
      <div className="mb-4">
        <span className="text-lg sm:text-xl font-bold text-blue-600">
          ${course.price}
        </span>
      </div>
      
      {/* Action Button */}
      <div className="w-full">
        {hasAccessToCourse ? (
          <button
            onClick={handleAccessCourse}
            className="w-full bg-green-600 hover:bg-green-700 text-white border-none py-2.5 sm:py-3 px-4 rounded-md cursor-pointer text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Access Course
          </button>
        ) : (
          <AddToCartButton 
            courseId={course.id}
            courseName={course.title}
            variant="primary"
            className="w-full text-sm py-2.5 sm:py-3 px-4"
          />
        )}
      </div>
    </div>
  );
}