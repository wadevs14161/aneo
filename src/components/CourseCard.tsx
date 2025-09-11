import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  price: number;
  instructor: string;
}

interface CourseCardProps {
  course: Course;
  onSeeMore?: (courseId: string) => void;
}

export default function CourseCard({ course, onSeeMore }: CourseCardProps) {
  const router = useRouter();

  const handleSeeMore = () => {
    if (onSeeMore) {
      onSeeMore(course.id);
    } else {
      // Navigate to course video page
      router.push(`/course/${course.id}`);
    }
  };
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
        <Image
          src={course.thumbnail}
          alt={course.title}
          width={226}
          height={120}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <h3 style={{ 
        fontSize: '15px', 
        fontWeight: 'bold', 
        marginBottom: '4px',
        color: '#333'
      }}>
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
        Instructor: {course.instructor}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: '#007bff' 
        }}>
          ${course.price}
        </span>
        
        <button
          onClick={handleSeeMore}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          See more
        </button>
      </div>
    </div>
  );
}
