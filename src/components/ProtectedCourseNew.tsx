'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, checkCourseAccess } from '@/lib/auth';

interface ProtectedCourseProps {
  courseId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedCourse({ courseId, children, fallback }: ProtectedCourseProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, [courseId, user, isAuthenticated]);

  const checkAccess = async () => {
    if (authLoading) return;

    try {
      if (!isAuthenticated || !user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const hasAccess = await checkCourseAccess(user.id, courseId);
      setHasAccess(hasAccess);
    } catch (error) {
      console.error('Error checking course access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
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
            onClick={() => router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => router.push(`/register?redirectTo=${encodeURIComponent(window.location.pathname)}`)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
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