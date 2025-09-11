import React, { useState, useMemo } from 'react';
import CourseCard from './CourseCard';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  price: number;
  instructor: string;
}

interface CourseGridProps {
  courses: Course[];
  onSeeMore: (courseId: string) => void;
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
    <div style={{
      backgroundColor: '#eff1f2ff',
      borderRadius: '8px',
      width: '70%',
      minHeight: '200px',
      padding: '20px',
      margin: '0 auto'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '32px', color: '#333', fontWeight: 'bold' }}>
        COURSES
      </h1>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '30px',
        gap: '20px'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Category:
          </label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              backgroundColor: 'white',
              color: '#333'
            }}>
            <option value="">All Categories</option>
            <option value="sport">Sport</option>
            <option value="life">Life</option>
            <option value="party">Party</option>
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Sort by:
          </label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              backgroundColor: 'white',
              color: '#333'
            }}>
            <option value="">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px 30px'
      }}>
        {filteredAndSortedCourses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onSeeMore={onSeeMore}
        />
      ))}
      </div>
    </div>
  );
}
