"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import CourseGrid from '@/components/CourseGrid';
import ServiceFeatures from '@/components/ServiceFeatures';
import EmailVerificationNotice from '@/components/EmailVerificationNotice';

import { getAllCourses } from '@/lib/actions/course-actions';
import { Course } from '@/lib/database/schema';
import { useAuth } from '@/hooks/useAuth';
import { useCourseAccessContext } from '@/contexts/CourseAccessContext';

function HomeContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [forceShowContent, setForceShowContent] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  
  // Get auth and course access states
  const { loading: authLoading } = useAuth();
  const { loading: courseAccessLoading, refresh: refreshCourseAccess } = useCourseAccessContext();
  
  // Combined loading state - wait for all data to be ready
  const loading = coursesLoading || authLoading || courseAccessLoading;

  useEffect(() => {
    loadCourses();
  }, []); // Remove dependency on searchParams to prevent constant reloading

  // Handle payment success - run only once per session
  useEffect(() => {
    const paymentSuccess = searchParams?.get('payment') === 'success';
    const hasProcessedPayment = sessionStorage.getItem('paymentProcessed');
    
    if (paymentSuccess && !hasProcessedPayment) {
      console.log('Payment success detected, processing once...');
      
      // Mark as processed in session storage to prevent multiple executions
      sessionStorage.setItem('paymentProcessed', 'true');
      setPaymentProcessed(true);
      setShowSuccessMessage(true);
      
      // Clear URL parameter immediately
      window.history.replaceState({}, '', '/');
      
      // Refresh course access once
      refreshCourseAccess();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      // Clear the session storage after 30 seconds to allow future payments
      setTimeout(() => {
        sessionStorage.removeItem('paymentProcessed');
      }, 30000);
    }
  }, [searchParams?.get('payment')]); // Remove other dependencies to prevent loops

  // Separate timeout effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing content display');
        setForceShowContent(true);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const loadCourses = async () => {
    try {
      console.log('HomePage: Starting to load courses...');
      setCoursesLoading(true);
      setError(null);
      
      const coursesResult = await getAllCourses();
      if (coursesResult.success && coursesResult.data) {
        console.log('HomePage: Courses loaded successfully:', coursesResult.data.length, 'courses');
        setCourses(coursesResult.data);
      } else {
        throw new Error(coursesResult.error || 'Failed to load courses');
      }
    } catch (err) {
      console.error('HomePage: Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      console.log('HomePage: Setting coursesLoading to false');
      setCoursesLoading(false);
    }
  };

  if (loading && !forceShowContent) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-lg">
            {coursesLoading ? 'Loading courses...' : 
             authLoading ? 'Authenticating...' : 
             courseAccessLoading ? 'Loading your course access...' : 'Loading...'}
          </p>
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
        {/* Email Verification Notice */}
        <EmailVerificationNotice />
        

        
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
        
        {/* Service Features Section */}
        <ServiceFeatures />
        
        {/* Course Grid Section */}
        <div style={{ paddingTop: '20px' }}>
          <CourseGrid courses={courses} />
        </div>
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
