'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/database';
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
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '8px',
      maxWidth: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      <div style={{ marginBottom: '6px' }}>
        <img
          src={course.thumbnail_url}
          alt={course.title}
          onClick={handleSeeMore}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'contain',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        />
      </div>
      
      <h3 
        onClick={handleSeeMore}
        style={{ 
          fontSize: '15px', 
          fontWeight: 'bold', 
          marginBottom: '4px',
          color: '#333',
          cursor: 'pointer',
          transition: 'color 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#007bff'}
        onMouseOut={(e) => e.currentTarget.style.color = '#333'}
      >
        {course.title}
      </h3>
      
      <p style={{ 
        fontSize: '13px', 
        color: '#666', 
        marginBottom: '4px',
        lineHeight: '1.3'
      }}>
        {course.description.length > 80 
          ? `${course.description.substring(0, 80)}...` 
          : course.description
        }
      </p>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#888', 
        marginBottom: '6px' 
      }}>
        Instructor: {course.instructor_name}
      </div>
      
      <div style={{ 
        marginBottom: '8px'
      }}>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: '#007bff' 
        }}>
          ${course.price}
        </span>
      </div>
      
      {/* Enhanced Add to Cart / Access Course Button */}
      <div style={{ width: '100%' }}>
        {hasAccessToCourse ? (
          <button
            onClick={handleAccessCourse}
            style={{
              width: '100%',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'medium',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Access Course
          </button>
        ) : (
          <AddToCartButton 
            courseId={course.id}
            courseName={course.title}
            variant="primary"
            className="w-full text-sm py-2 px-4"
          />
        )}
      </div>
    </div>
  );
}