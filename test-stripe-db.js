/**
 * Test script to verify Stripe database tables exist and are accessible
 */

console.log('🚀 Starting Stripe Database Tests\n');

// Manual environment variables for testing
const supabaseUrl = 'https://dwopsdsnigioybevgmnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3b3BzZHNuaWdpb3liZXZnbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODI2NDgsImV4cCI6MjA3MzE1ODY0OH0.58aN1wscfgQffnTm2ITfzMbzvdwLOfQj46lsKDoCuF8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStripeTablesExist() {
  console.log('🔍 Testing Stripe database tables...\n');

  const tables = [
    'stripe_customers',
    'stripe_payment_methods', 
    'stripe_webhooks_log',
    'orders',
    'purchases'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Testing table: ${table}`);
      
      // Try to select from the table (limit 0 to just test existence)
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists (${count} records)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}' exception:`, err);
    }
    console.log('');
  }
}

async function testInsertStripeCustomer() {
  console.log('🧪 Testing Stripe customer creation...\n');
  
  try {
    const testCustomer = {
      user_id: 'test-user-' + Date.now(),
      stripe_customer_id: 'cus_test_' + Date.now(),  
      email: 'test@example.com',
      name: 'Test User'
    };

    console.log('📝 Attempting to insert test customer:', testCustomer);

    const { data, error } = await supabase
      .from('stripe_customers')
      .insert(testCustomer)
      .select()
      .single();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('Full error:', error);
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up - delete the test record
      await supabase
        .from('stripe_customers')
        .delete()
        .eq('id', data.id);
      console.log('🧹 Test record cleaned up');
    }
  } catch (err) {
    console.log('❌ Exception during insert test:', err);
  }
}

async function main() {
  console.log('🚀 Starting Stripe Database Tests\n');
  
  await testStripeTablesExist();
  await testInsertStripeCustomer();
  
  console.log('✨ Tests completed!');
}

main().catch((error) => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});