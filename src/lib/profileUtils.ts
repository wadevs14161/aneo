// Profile management utilities
import { supabase } from './supabaseClient';

export interface CreateProfileData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
}

// Cache to prevent repeated profile existence checks
const profileExistsCache = new Map<string, boolean>();
const profileCheckPromises = new Map<string, Promise<boolean>>();

// Function to clear cache (useful for testing or when user changes)
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileExistsCache.delete(userId);
    profileCheckPromises.delete(userId);
  } else {
    profileExistsCache.clear();
    profileCheckPromises.clear();
  }
}

export async function createUserProfile(profileData: CreateProfileData): Promise<boolean> {
  try {
    console.log('🔄 Checking/Creating profile for user:', profileData.id);
    console.log('📝 Profile data:', profileData);
    
    // First check if profile already exists (database trigger might have created it)
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, date_of_birth')
      .eq('id', profileData.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', selectError.message);
      return false;
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
          return false;
        }
        
        console.log('✅ Profile updated successfully:', updatedProfile);
      }
      
      return true;
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
        return true;
      }
      
      return false;
    }

    console.log('✅ Profile created successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Unexpected profile creation error:', error);
    return false;
  }
}

export async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
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

async function performProfileCheck(userId: string): Promise<boolean> {
  try {
    console.log('Checking if profile exists for user:', userId);
    
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

    console.log('Profile does not exist, creating...');
      
    // Get user data from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      console.error('User not found or ID mismatch');
      return false;
    }

    // Create basic profile from auth data
    const profileData: CreateProfileData = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email || 'User',
      phone: user.user_metadata?.phone,
      date_of_birth: user.user_metadata?.date_of_birth
    };

    console.log('Creating profile with data:', profileData);
    return await createUserProfile(profileData);
  } catch (error) {
    console.error('Error in performProfileCheck:', error);
    return false;
  }
}

// Debug function to check database connection and table existence
export async function checkDatabaseSetup(): Promise<{ 
  connected: boolean; 
  profilesTableExists: boolean; 
  error?: string 
}> {
  try {
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