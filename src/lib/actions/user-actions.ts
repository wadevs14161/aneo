'use server'
import { getSupabaseClient } from '@/lib/database/utils';
import type { Profile, DatabaseActionResult } from '@/lib/database/schema';

// Cache to prevent repeated profile existence checks
const profileExistsCache = new Map<string, boolean>();
const profileCheckPromises = new Map<string, Promise<boolean>>();

// Rate limiting to prevent spam
const profileCheckRateLimit = new Map<string, number>();
const PROFILE_CHECK_COOLDOWN = 5000; // 5 seconds

/**
 * Interface for creating a new user profile
 */
export interface CreateProfileData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
}

/**
 * Clear profile cache for a specific user or all users
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileExistsCache.delete(userId);
    profileCheckPromises.delete(userId);
    profileCheckRateLimit.delete(userId);
  } else {
    profileExistsCache.clear();
    profileCheckPromises.clear();
    profileCheckRateLimit.clear();
  }
}

/**
 * Create a user profile in the database
 */
export async function createUserProfile(profileData: CreateProfileData): DatabaseActionResult<Profile> {
  try {
    console.log('🔄 Checking/Creating profile for user:', profileData.id);
    console.log('📝 Profile data:', profileData);
    
    const supabase = await getSupabaseClient();
    
    // First check if profile already exists (database trigger might have created it)
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileData.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', selectError.message);
      return { success: false, error: selectError.message };
    }

    if (existingProfile) {
      console.log('✅ Profile already exists (created by trigger):', existingProfile);
      
      // Check if we need to update any missing fields
      const needsUpdate = 
        (!existingProfile.full_name && profileData.full_name) ||
        (!existingProfile.phone && profileData.phone) ||
        (!existingProfile.date_of_birth && profileData.date_of_birth);
        
      if (needsUpdate) {
        console.log('🔄 Updating profile with additional data...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profileData.full_name || existingProfile.full_name,
            phone: profileData.phone || existingProfile.phone,
            date_of_birth: profileData.date_of_birth || existingProfile.date_of_birth
          })
          .eq('id', profileData.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Profile update error:', updateError);
          return { success: false, error: updateError.message };
        }
        
        console.log('✅ Profile updated successfully:', updatedProfile);
        return { success: true, data: updatedProfile };
      }
      
      return { success: true, data: existingProfile };
    }

    // Profile doesn't exist, try to create it
    console.log('🔄 Profile does not exist, creating new profile...');
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone: profileData.phone || null,
        date_of_birth: profileData.date_of_birth || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a duplicate error (race condition with trigger)
      if (error.code === '23505' || error.code === '42501') {
        console.log('✅ Profile likely created by trigger during race condition');
        // Try to fetch the profile that was created by the trigger
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileData.id)
          .single();
        return { success: true, data: createdProfile };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Profile created successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Unexpected profile creation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create profile' };
  }
}

/**
 * Ensure a user profile exists, creating one if necessary
 */
export async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
    // Check rate limiting first
    const now = Date.now();
    const lastCheck = profileCheckRateLimit.get(userId) || 0;
    
    if (now - lastCheck < PROFILE_CHECK_COOLDOWN) {
      console.log(`Profile check rate limited for user: ${userId} (${now - lastCheck}ms ago)`);
      return profileExistsCache.get(userId) || false;
    }

    // Check cache first
    if (profileExistsCache.has(userId)) {
      const exists = profileExistsCache.get(userId)!;
      if (exists) {
        console.log('Profile exists (cached):', userId);
        return true;
      }
    }

    // Check if there's already a pending check for this user
    if (profileCheckPromises.has(userId)) {
      console.log('Profile check already in progress for user:', userId);
      return await profileCheckPromises.get(userId)!;
    }

    // Update rate limit timestamp
    profileCheckRateLimit.set(userId, now);

    // Create a new promise for this profile check
    const checkPromise = performProfileCheck(userId);
    profileCheckPromises.set(userId, checkPromise);

    try {
      const result = await checkPromise;
      profileExistsCache.set(userId, result);
      return result;
    } finally {
      profileCheckPromises.delete(userId);
    }
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return false;
  }
}

/**
 * Internal function to perform profile existence check and creation
 */
async function performProfileCheck(userId: string): Promise<boolean> {
  try {
    console.log('Checking if profile exists for user:', userId);
    
    const supabase = await getSupabaseClient();
    
    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking profile existence:', selectError);
      return false;
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return true;
    }

    console.log('Profile does not exist, checking if user is verified...');
      
    // Get user data from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      console.error('User not found or ID mismatch');
      return false;
    }

    console.log('Creating profile for user...');

    // Create basic profile from auth data
    const profileData: CreateProfileData = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email || 'User',
      phone: user.user_metadata?.phone,
      date_of_birth: user.user_metadata?.date_of_birth
    };

    console.log('Creating profile with data:', profileData);
    const result = await createUserProfile(profileData);
    return result.success;
  } catch (error) {
    console.error('Error in performProfileCheck:', error);
    return false;
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): DatabaseActionResult<Profile> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get profile' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): DatabaseActionResult<Profile> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear cache to force refresh
    clearProfileCache(user.id);

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

/**
 * Get user profile by ID (admin function)
 */
export async function getUserProfileById(userId: string): DatabaseActionResult<Profile> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error getting user profile by ID:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get profile' };
  }
}

/**
 * Delete user profile (admin function)
 */
export async function deleteUserProfile(userId: string): DatabaseActionResult {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear cache
    clearProfileCache(userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete profile' };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check database setup and table existence
 */
export async function checkDatabaseSetup(): Promise<{ 
  connected: boolean; 
  profilesTableExists: boolean; 
  error?: string 
}> {
  try {
    const supabase = await getSupabaseClient();
    
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return {
        connected: true,
        profilesTableExists: false,
        error: error.message
      };
    }

    return {
      connected: true,
      profilesTableExists: true
    };
  } catch (error) {
    return {
      connected: false,
      profilesTableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}