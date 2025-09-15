'use client'
import { useState, useEffect, useCallback } from 'react';
import { getUserCourses } from '@/lib/actions/course-actions';
import { useAuth } from './useAuth';

export function useCourseAccess() {
  const { user, loading: authLoading } = useAuth();
  const [accessibleCourseIds, setAccessibleCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('useCourseAccess - State:', { 
    hasUser: !!user, 
    authLoading, 
    courseAccessLoading: loading,
    combined: loading || authLoading 
  });

  const loadAccessibleCourses = useCallback(async () => {
    console.log('useCourseAccess - loadAccessibleCourses called, user:', !!user);
    
    if (!user) {
      console.log('useCourseAccess - No user, setting empty courses');
      setAccessibleCourseIds([]);
      setLoading(false);
      return;
    }

    try {
      console.log('useCourseAccess - Loading courses for user:', user.id);
      const coursesResult = await getUserCourses(user.id);
      if (coursesResult.success && coursesResult.data) {
        console.log('useCourseAccess - Loaded courses:', coursesResult.data.length);
        setAccessibleCourseIds(coursesResult.data.map(course => course.id));
      } else {
        throw new Error(coursesResult.error || 'Failed to load accessible courses');
      }
    } catch (error) {
      console.error('useCourseAccess - Error loading accessible courses:', error);
      setAccessibleCourseIds([]);
    } finally {
      console.log('useCourseAccess - Setting loading to false');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to finish loading
    }
    
    loadAccessibleCourses();
  }, [authLoading, loadAccessibleCourses]);

  const hasAccess = useCallback((courseId: string) => {
    return accessibleCourseIds.includes(courseId);
  }, [accessibleCourseIds]);

  const refresh = useCallback(() => {
    console.log('useCourseAccess - refresh called, authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && user) {
      console.log('useCourseAccess - refreshing course access data');
      setLoading(true);
      loadAccessibleCourses();
    } else if (authLoading) {
      console.log('useCourseAccess - auth still loading, will retry refresh in 1 second');
      // If auth is still loading, retry after a short delay
      setTimeout(() => {
        if (user && !authLoading) {
          console.log('useCourseAccess - retrying refresh after delay');
          setLoading(true);
          loadAccessibleCourses();
        }
      }, 1000);
    }
  }, [authLoading, user, loadAccessibleCourses]);

  return {
    hasAccess,
    loading: loading || authLoading,
    refresh,
    accessibleCourseIds
  };
}