// Protected route component for checking course access
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, hasAccess } from '@/lib/database';

interface ProtectedCourseProps {
  courseId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedCourse({ courseId, children, fallback }: ProtectedCourseProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccessToContent, setHasAccessToContent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, [courseId]);

  const checkAccess = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const accessGranted = await hasAccess(user.id, courseId);
      setHasAccessToContent(accessGranted);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccessToContent(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Authentication Required</h2>
        <p className="text-gray-600 mb-6 text-center">
          Please log in to access this course content.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccessToContent) {
    return fallback || (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Access Denied</h2>
        <p className="text-gray-600 mb-6 text-center">
          You need to purchase this course to access its content.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}