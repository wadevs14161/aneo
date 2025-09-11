// Enhanced authentication hook with user state management
'use client'
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserProfile, Profile } from '@/lib/database';
import { ensureProfileExists } from '@/lib/profileUtils';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true
  });

  useEffect(() => {
    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, session?.user?.email);
        
        if (session?.user) {
          // Only ensure profile exists for new logins, not for token refresh
          if (event === 'SIGNED_IN') {
            console.log('User signed in, ensuring profile exists');
            await ensureProfileExists(session.user.id);
          }
          const profile = await getCurrentUserProfile();
          setAuthState({
            user: session.user,
            profile,
            loading: false
          });
        } else {
          // User logged out
          console.log('User logged out');
          setAuthState({
            user: null,
            profile: null,
            loading: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Ensure profile exists for existing users
        await ensureProfileExists(session.user.id);
        const profile = await getCurrentUserProfile();
        setAuthState({
          user: session.user,
          profile,
          loading: false
        });
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      setAuthState({
        user: null,
        profile: null,
        loading: false
      });
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // State will be updated automatically by the auth listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    ...authState,
    signOut,
    isAuthenticated: !!authState.user
  };
}

export default useAuth;