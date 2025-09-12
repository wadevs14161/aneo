// Enhanced authentication hook with user state management and performance monitoring
'use client'
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserProfile, Profile } from '@/lib/database';
import { ensureProfileExists } from '@/lib/profileUtils';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// Cache for auth state to reduce redundant calls
const AUTH_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let authCache: { data: AuthState; timestamp: number } | null = null;

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

  const getInitialSession = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      // Check cache first
      if (authCache && Date.now() - authCache.timestamp < AUTH_CACHE_DURATION) {
        console.log('Using cached auth state');
        setAuthState(authCache.data);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Ensure profile exists for existing users
        await ensureProfileExists(session.user.id);
        const profile = await getCurrentUserProfile();
        
        const newAuthState = {
          user: session.user,
          profile,
          loading: false
        };
        
        // Cache the auth state
        authCache = {
          data: newAuthState,
          timestamp: Date.now()
        };
        
        setAuthState(newAuthState);
        console.log(`Auth initialized in: ${performance.now() - startTime}ms`);
      } else {
        const newAuthState = {
          user: null,
          profile: null,
          loading: false
        };
        
        authCache = {
          data: newAuthState,
          timestamp: Date.now()
        };
        
        setAuthState(newAuthState);
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      const errorAuthState = {
        user: null,
        profile: null,
        loading: false
      };
      setAuthState(errorAuthState);
    }
  }, []);

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