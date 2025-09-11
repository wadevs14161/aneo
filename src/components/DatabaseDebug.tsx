// Debug component to test database connection and profile creation
'use client'
import { useState } from 'react';
import { checkDatabaseSetup, ensureProfileExists } from '@/lib/profileUtils';
import { getCurrentUser } from '@/lib/database';
import { testProfilesTable } from '@/lib/testProfiles';

export default function DatabaseDebug() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setStatus('Testing database connection and profiles table...');
    
    try {
      const tableTest = await testProfilesTable();
      
      if (tableTest) {
        setStatus('✅ Database connected, profiles table exists and working');
      } else {
        setStatus('❌ Profiles table test failed - check console for details');
      }
    } catch (error) {
      setStatus('❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setLoading(false);
  };

  const testProfileCreation = async () => {
    setLoading(true);
    setStatus('Testing profile creation...');
    
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        setStatus('❌ No authenticated user found');
        setLoading(false);
        return;
      }

      const profileExists = await ensureProfileExists(user.id);
      
      if (profileExists) {
        setStatus('✅ Profile exists or was created successfully for user: ' + user.email);
      } else {
        setStatus('❌ Failed to create profile for user: ' + user.email);
      }
    } catch (error) {
      setStatus('❌ Profile test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      minWidth: '300px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
        Database Debug Tools
      </h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test DB
        </button>
        
        <button
          onClick={testProfileCreation}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Profile
        </button>
      </div>
      
      {status && (
        <div style={{
          fontSize: '12px',
          color: status.includes('✅') ? 'green' : status.includes('❌') ? 'red' : 'blue',
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}