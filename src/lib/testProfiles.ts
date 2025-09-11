// Simple test to verify profiles table setup
import { supabase } from './supabaseClient';
import { getCurrentUser } from './database';

export async function testProfilesTable() {
  try {
    console.log('🔍 Testing profiles table...');
    
    // Test 1: Check if table exists (this should work with RLS)
    const { data: tableTest, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error('❌ Table test failed:', tableError);
      return false;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Test 2: Check if user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('ℹ️ No authenticated user - skipping insert test');
      console.log('ℹ️ Table structure test passed - profiles table is ready');
      return true;
    }
    
    console.log('👤 Authenticated user found:', user.email);
    
    // Test 3: Check if current user has a profile (this tests RLS permissions)
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Profile select test failed:', selectError);
      return false;
    }
    
    if (existingProfile) {
      console.log('✅ User profile exists:', existingProfile);
    } else {
      console.log('ℹ️ User profile does not exist yet');
    }
    
    console.log('✅ All profile table tests passed');
    return true;
  } catch (error) {
    console.error('❌ Profile table test failed:', error);
    return false;
  }
}