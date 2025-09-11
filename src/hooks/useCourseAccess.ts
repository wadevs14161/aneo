'use client'
import { useState, useEffect, useCallback } from 'react';
import { getUserAccessibleCourses } from '@/lib/database';
import { useAuth } from './useAuth';

export function useCourseAccess() {
  const { user, loading: authLoading } = useAuth();
  const [accessibleCourseIds, setAccessibleCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccessibleCourses = useCallback(async () => {
    if (!user) {
      setAccessibleCourseIds([]);
      setLoading(false);
      return;
    }

    try {
      const courses = await getUserAccessibleCourses(user.id);
      setAccessibleCourseIds(courses.map(course => course.id));
    } catch (error) {
      console.error('Error loading accessible courses:', error);
      setAccessibleCourseIds([]);
    } finally {
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
    if (!authLoading && user) {
      setLoading(true);
      loadAccessibleCourses();
    }
  }, [authLoading, user, loadAccessibleCourses]);

  return {
    hasAccess,
    loading: loading || authLoading,
    refresh,
    accessibleCourseIds
  };
}