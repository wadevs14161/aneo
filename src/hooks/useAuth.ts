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

// Rate limiting for profile operations
let lastProfileCheck = 0;
const PROFILE_CHECK_COOLDOWN = 5000; // 5 seconds between profile checks

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true
  });

  // Clear any stale state on component mount
  useEffect(() => {
    // Reset rate limiting on new component mount
    lastProfileCheck = 0;
  }, []);

  useEffect(() => {
    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, session?.user?.email);
        
        if (session?.user) {
          // Always ensure profile exists for signed-in users (no email verification required)
          const now = Date.now();
          if (event === 'SIGNED_IN' && (now - lastProfileCheck) > PROFILE_CHECK_COOLDOWN) {
            console.log('User signed in, ensuring profile exists');
            lastProfileCheck = now;
            // Clear any stale cache on sign in
            authCache = null;
            await ensureProfileExists(session.user.id);
          }
          
          // Skip profile check if this is just a token refresh
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed, skipping profile operations');
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              loading: false
            }));
            return;
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
        // Always ensure profile exists for authenticated users (no email verification required)
        const now = Date.now();
        if ((now - lastProfileCheck) > PROFILE_CHECK_COOLDOWN) {
          console.log('Ensuring profile exists for user:', session.user.id);
          lastProfileCheck = now;
          await ensureProfileExists(session.user.id);
        } else {
          console.log('Profile check rate limited, skipping');
        }
        
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