// Database Profile Verification Script
// Use this in the browser console to check if profiles are being created

async function checkUserProfile(userId) {
  try {
    // Import Supabase client
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    console.log('🔍 Checking profile for user:', userId);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ No profile found for user:', userId);
      } else {
        console.log('❌ Error checking profile:', error.message);
      }
      return false;
    }
    
    console.log('✅ Profile found:', profile);
    return profile;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

// Check the most recent user (replace with actual user ID)
// Use this after registering: checkUserProfile('your-user-id-from-console')

console.log('📋 Profile verification script loaded!');
console.log('Usage: checkUserProfile("your-user-id-here")');

// Auto-check current authenticated user
async function checkCurrentUser() {
  try {
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('🔍 Checking current authenticated user...');
      await checkUserProfile(session.user.id);
    } else {
      console.log('ℹ️ No authenticated user found');
    }
  } catch (err) {
    console.log('❌ Error checking current user:', err.message);
  }
}

// Auto-run for current user
checkCurrentUser();

// Make function available globally
window.checkUserProfile = checkUserProfile;