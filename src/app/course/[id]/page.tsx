'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import ProtectedCourse from '@/components/ProtectedCourse';
import { getCourse, type Course } from '@/lib/database';

export default function CoursePage() {
  const params = useParams();
  const courseId = params?.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData = await getCourse(courseId);
      
      if (!courseData) {
        setError('Course not found');
        return;
      }
      
      setCourse(courseData);
    } catch (err) {
      console.error('Error loading course:', err);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };
  
  if (!courseId) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold mb-4">Invalid course</h2>
        <p className="text-gray-600">No course ID provided.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center p-10 bg-gray-50 min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <p className="text-gray-600">
          {error || "The course you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="py-5 bg-gray-50 min-h-screen">
      <ProtectedCourse courseId={courseId}>
        <VideoPlayer
          videoUrl={course.video_url}
          title={course.title}
          description={course.description}
          instructor={course.instructor_name}
        />
      </ProtectedCourse>
    </div>
  );
}