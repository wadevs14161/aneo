'use server'
import { createClient } from '@/lib/supabase/server';

/**
 * Get authenticated user or throw error if not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}

/**
 * Ensure user profile exists for the given user ID
 */
export async function ensureUserProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found. Please try logging out and back in.');
  }
  
  return profile;
}

/**
 * Get Supabase client instance
 */
export async function getSupabaseClient() {
  return await createClient();
}

/**
 * Check if user already owns a specific course
 */
export async function checkCourseOwnership(userId: string, courseId: string) {
  const supabase = await createClient();
  const { data: access } = await supabase
    .from('course_access')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  return !!access;
}

/**
 * Get course details by ID
 */
export async function getCourseById(courseId: string) {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    throw new Error('Course not found');
  }

  return course;
}