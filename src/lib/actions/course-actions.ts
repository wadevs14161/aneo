'use server'
import { getSupabaseClient } from '@/lib/database/utils';
import type { Course, CourseAccess, Purchase, DatabaseActionResult } from '@/lib/database/schema';

/**
 * Grant course access to a user (admin function)
 */
export async function grantCourseAccess(userId: string, courseId: string, accessType: 'purchased' | 'gifted' | 'admin_granted' = 'admin_granted'): DatabaseActionResult {
  try {
    const supabase = await getSupabaseClient();

    // Create access record
    const { error: accessError } = await supabase
      .from('course_access')
      .insert({
        user_id: userId,
        course_id: courseId,
        access_type: accessType
      });

    if (accessError) {
      console.error('Error granting access:', accessError);
      return { success: false, error: accessError.message };
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error granting course access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to grant access' };
  }
}

/**
 * Check if user has access to a specific course
 */
export async function checkUserCourseAccess(userId: string, courseId: string): DatabaseActionResult<boolean> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: access, error } = await supabase
      .from('course_access')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      return { success: false, error: error.message };
    }

    return { success: true, data: !!access };
    
  } catch (error) {
    console.error('Error checking course access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check access' };
  }
}

/**
 * Get all courses the user has access to
 */
export async function getUserCourses(userId: string): DatabaseActionResult<Course[]> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('course_access')
      .select(`
        courses (
          id,
          title,
          description,
          price,
          thumbnail_url,
          video_url,
          instructor_name,
          category,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    const courses = (data || []).map((item: any) => item.courses).filter(Boolean);
    return { success: true, data: courses };
    
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch courses' };
  }
}

/**
 * Get all available courses (for browsing)
 */
export async function getAllCourses(): DatabaseActionResult<Course[]> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: courses || [] };
    
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch courses' };
  }
}

/**
 * Get course details by ID
 */
export async function getCourse(courseId: string): DatabaseActionResult<Course> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_active', true)
      .single();

    if (error || !course) {
      return { success: false, error: 'Course not found' };
    }

    return { success: true, data: course };
    
  } catch (error) {
    console.error('Error fetching course details:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch course details' };
  }
}

// Legacy function name for backward compatibility
export const getCourseDetails = getCourse;

/**
 * Check if user has access to a specific course (with detailed logging)
 */
export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    console.log('🔍 Checking access for user:', userId, 'course:', courseId);
    
    const supabase = await getSupabaseClient();
    
    // First, try to get course access directly
    const { data: accessData, error: accessError } = await supabase
      .from('course_access')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    // If we got data without error, check expiration
    if (!accessError && accessData) {
      console.log('✅ Direct access found:', accessData);
      
      // Check if access has expired
      if (accessData.expires_at && new Date(accessData.expires_at) < new Date()) {
        console.log('❌ Access expired');
        return false;
      }
      
      return true;
    }

    // If no direct access found, check if it was purchased
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single();

    if (!purchaseError && purchaseData) {
      console.log('✅ Purchase found, granting access:', purchaseData);
      
      // Automatically grant access based on purchase
      await supabase
        .from('course_access')
        .insert({
          user_id: userId,
          course_id: courseId,
          access_type: 'purchased'
        });
      
      return true;
    }

    console.log('❌ No access found');
    return false;
    
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

/**
 * Get user's purchase history
 */
export async function getUserPurchases(userId: string): DatabaseActionResult<Purchase[]> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        *,
        courses (
          title,
          instructor_name,
          thumbnail_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: purchases || [] };
    
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch purchases' };
  }
}

/**
 * Revoke course access (admin function)
 */
export async function revokeCourseAccess(userId: string, courseId: string): DatabaseActionResult {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('course_access')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error revoking course access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke access' };
  }
}