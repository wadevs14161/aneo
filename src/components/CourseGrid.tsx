import React, { useState, useMemo } from 'react';
import EnhancedCourseCard from './EnhancedCourseCard';
import { Course } from '@/lib/database';

interface CourseGridProps {
  courses: Course[];
  onSeeMore?: (courseId: string) => void;
}

export default function CourseGrid({ courses, onSeeMore }: CourseGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  // Filter and sort courses based on selected options
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(course => 
        course.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort courses
    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [courses, selectedCategory, sortBy]);
  return (
    <div className="bg-gray-100 rounded-lg w-full max-w-6xl mx-auto min-h-[200px] p-4 sm:p-6 lg:p-8">
      <h1 className="text-center mb-8 sm:mb-10 text-2xl sm:text-3xl lg:text-4xl text-gray-800 font-bold">
        COURSES
      </h1>
      
      {/* Mobile-responsive filter controls */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
            Category:
          </label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm sm:text-base bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Categories</option>
            <option value="sport">Sport</option>
            <option value="life">Life</option>
            <option value="party">Party</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
            Sort by:
          </label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm sm:text-base bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      
      {/* Responsive course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {filteredAndSortedCourses.map((course) => (
          <EnhancedCourseCard
            key={course.id}
            course={course}
            onSeeMore={onSeeMore}
          />
        ))}
      </div>
    </div>
  );
}
