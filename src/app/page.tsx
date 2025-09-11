"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import CourseGrid from '@/components/CourseGrid';
import { getAllCourses, Course } from '@/lib/database';

function HomeContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadCourses();
    
    // Check for payment success
    if (searchParams?.get('payment') === 'success') {
      setShowSuccessMessage(true);
      // Clear the URL parameter after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        window.history.replaceState({}, '', '/');
      }, 5000);
    }
  }, [searchParams]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const coursesData = await getAllCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Courses</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadCourses}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="p-5">
        {/* Payment Success Message */}
        {showSuccessMessage && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Payment Successful!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Thank you for your purchase. Your course access has been granted and you can start learning immediately.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <CourseGrid courses={courses} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="p-5 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
