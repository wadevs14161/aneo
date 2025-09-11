// Quick test script for debugging registration issues
// Run this in the browser console on any page of your app

console.log('🧪 Starting Registration System Test...');

// Test 1: Check if Supabase client is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client is available');
} else {
  console.log('❌ Supabase client not found - check imports');
}

// Test 2: Test database connection
async function testDatabaseConnection() {
  try {
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Database test error:', err.message);
    return false;
  }
}

// Test 3: Check authentication state
async function checkAuthState() {
  try {
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ User is authenticated:', session.user.email);
      
      // Check if profile exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.log('⚠️ Profile not found or error:', error.message);
      } else {
        console.log('✅ User profile exists:', profile);
      }
    } else {
      console.log('ℹ️ No authenticated user');
    }
  } catch (err) {
    console.log('❌ Auth state check error:', err.message);
  }
}

// Test 4: Test profile creation (only for authenticated users)
async function testProfileCreation() {
  try {
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('ℹ️ Skipping profile creation test - no authenticated user');
      return;
    }
    
    console.log('🔍 Testing profile operations...');
    
    // Try to read existing profile
    const { data: existing, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (readError && readError.code !== 'PGRST116') { // PGRST116 = not found
      console.log('❌ Profile read error:', readError.message);
    } else if (existing) {
      console.log('✅ Existing profile found:', existing);
    } else {
      console.log('ℹ️ No existing profile found');
    }
    
  } catch (err) {
    console.log('❌ Profile test error:', err.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive tests...\n');
  
  await testDatabaseConnection();
  await checkAuthState();
  await testProfileCreation();
  
  console.log('\n✨ Test complete! Check results above.');
  console.log('📋 To test registration:');
  console.log('   1. Go to /register');
  console.log('   2. Fill out the form');
  console.log('   3. Check console for detailed logs');
}

// Auto-run tests
runAllTests();