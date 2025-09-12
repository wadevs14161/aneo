// Database utility functions for user management and course access
import { supabase } from './supabaseClient';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  video_url: string;
  cloudfront_key?: string;
  price: number;
  instructor_name: string;
  instructor_bio?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
}

export interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  amount_paid: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchased_at: string;
}

export interface CourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  access_type: 'purchased' | 'gifted' | 'promotional' | 'admin';
  expires_at?: string;
  granted_at: string;
  granted_by?: string;
}

// **Profile Management**
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        // No rows returned - user profile doesn't exist yet
        console.log('Profile not found for user:', userId);
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

// **Course Management**
export async function getAllCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

// **Purchase Management**
export async function createPurchase(purchase: Omit<Purchase, 'id' | 'purchased_at'>): Promise<Purchase | null> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchase)
      .select()
      .single();

    if (error) throw error;

    // Also grant course access
    await grantCourseAccess(purchase.user_id, purchase.course_id, 'purchased');
    
    return data;
  } catch (error) {
    console.error('Error creating purchase:', error);
    return null;
  }
}

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        course:course_id (
          title,
          thumbnail_url,
          instructor_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return [];
  }
}

export async function hasPurchased(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single();

    return !error && data !== null;
  } catch (error) {
    return false;
  }
}

// **Course Access Management**
export async function grantCourseAccess(
  userId: string, 
  courseId: string, 
  accessType: CourseAccess['access_type'] = 'purchased',
  expiresAt?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('course_access')
      .upsert({
        user_id: userId,
        course_id: courseId,
        access_type: accessType,
        expires_at: expiresAt || null
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error granting course access:', error);
    return false;
  }
}

export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    console.log('🔍 Checking access for user:', userId, 'course:', courseId);
    
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

    // If no direct access found (PGRST116 = not found), check purchases as fallback
    if (accessError?.code === 'PGRST116') {
      console.log('ℹ️ No direct access, checking purchases...');
      
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'completed')
        .single();

      if (!purchaseError && purchaseData) {
        console.log('✅ Valid purchase found, granting access');
        
        // Auto-create course access from purchase (optional)
        try {
          const { error: insertError } = await supabase
            .from('course_access')
            .insert({
              user_id: userId,
              course_id: courseId,
              access_type: 'purchased'
            });
          
          if (insertError) {
            console.warn('⚠️ Could not create access record:', insertError);
          }
        } catch (insertErr) {
          console.warn('⚠️ Access record creation failed:', insertErr);
        }
        
        return true;
      }
    }

    // Log other errors for debugging
    if (accessError && accessError.code !== 'PGRST116') {
      console.error('❌ Access check error:', accessError);
    }

    console.log('❌ No access found');
    return false;
    
  } catch (error) {
    console.error('❌ Unexpected error checking access:', error);
    return false;
  }
}

export async function getUserAccessibleCourses(userId: string): Promise<Course[]> {
  try {
    const startTime = performance.now();
    
    // Single optimized query with join to get both access and course data
    const { data, error } = await supabase
      .from('course_access')
      .select(`
        course_id,
        expires_at,
        access_type,
        courses!inner (
          id,
          title,
          description,
          price,
          thumbnail_url,
          video_url,
          instructor_name,
          category,
          is_published,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('courses.is_published', true);

    if (error) throw error;

    // Filter out expired access and extract course data
    const validCourses = data?.filter(access => {
      if (!access.expires_at) return true; // No expiration
      return new Date(access.expires_at) > new Date(); // Not expired
    }).map(access => access.courses as unknown as Course) || [];

    console.log(`Accessible courses loaded in: ${performance.now() - startTime}ms`);
    return validCourses;
  } catch (error) {
    console.error('Error fetching accessible courses:', error);
    return [];
  }
}

// **Authentication helpers**
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  
  return await getProfile(user.id);
}