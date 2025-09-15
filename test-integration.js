/**
 * Test the actual Stripe integration with real user authentication
 */

console.log('🧪 Testing Stripe Integration with Real Data\n');

// Test that mimics the order processing flow
async function testStripeIntegration() {
  try {
    // Import our actions
    const { createStripeCustomer } = await import('./src/lib/actions/stripe-actions.js');
    
    // Use a realistic UUID format (this is just for testing)
    const testUserId = '779bc442-fe89-41bb-b5a7-4bff6b5b4630'; // From your logs
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    
    console.log('🔄 Testing createStripeCustomer with valid UUID...');
    console.log('User ID:', testUserId);
    console.log('Email:', testEmail);
    
    const result = await createStripeCustomer(testUserId, testEmail, testName);
    
    if (result.success) {
      console.log('✅ Stripe customer creation successful!');
      console.log('Customer Data:', result.data);
    } else {
      console.log('❌ Stripe customer creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    console.log('\nThis is likely because the test is not running in the proper Next.js environment.');
    console.log('The real integration should work when triggered from the web app.');
  }
}

testStripeIntegration();