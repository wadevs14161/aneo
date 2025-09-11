'use client'
import React, { createContext, useContext, ReactNode } from 'react';
import { useCourseAccess } from '@/hooks/useCourseAccess';

interface CourseAccessContextType {
  hasAccess: (courseId: string) => boolean;
  loading: boolean;
  refresh: () => void;
  accessibleCourseIds: string[];
}

const CourseAccessContext = createContext<CourseAccessContextType | undefined>(undefined);

interface CourseAccessProviderProps {
  children: ReactNode;
}

export function CourseAccessProvider({ children }: CourseAccessProviderProps) {
  const courseAccessState = useCourseAccess();

  return (
    <CourseAccessContext.Provider value={courseAccessState}>
      {children}
    </CourseAccessContext.Provider>
  );
}

export function useCourseAccessContext() {
  const context = useContext(CourseAccessContext);
  if (context === undefined) {
    throw new Error('useCourseAccessContext must be used within a CourseAccessProvider');
  }
  return context;
}