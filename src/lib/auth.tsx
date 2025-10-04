'use client'
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// ========================================
// Types
// ========================================

export type UserType = 'guest' | 'user' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role?: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  // Core user data
  user: User | null;
  profile: Profile | null;
  
  // Auth status
  loading: boolean;
  userType: UserType;
  isAuthenticated: boolean;
  
  // Convenience getters
  isGuest: boolean;
  isUser: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  // Methods
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Global auth state to prevent unnecessary re-initialization
let globalAuthState: {
  initialized: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
} = {
  initialized: false,
  user: null,
  profile: null,
  loading: true
};

// ========================================
// Context
// ========================================

const AuthContext = createContext<AuthState | undefined>(undefined);

// ========================================
// Hook
// ========================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ========================================
// Provider Component
// ========================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(globalAuthState.user);
  const [profile, setProfile] = useState<Profile | null>(globalAuthState.profile);
  const [loading, setLoading] = useState<boolean>(globalAuthState.loading);

  // Initialize authentication only once globally
  useEffect(() => {
    // If already initialized, use the global state
    if (globalAuthState.initialized) {
      setUser(globalAuthState.user);
      setProfile(globalAuthState.profile);
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: First-time initialization...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          globalAuthState = { initialized: true, user: null, profile: null, loading: false };
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const newUser = session?.user ?? null;
        let newProfile = null;
        
        if (newUser) {
          newProfile = await fetchProfile(newUser.id);
        }

        // Update global state
        globalAuthState = {
          initialized: true,
          user: newUser,
          profile: newProfile,
          loading: false
        };

        if (mounted) {
          setUser(newUser);
          setProfile(newProfile);
          setLoading(false);
          console.log('AuthProvider: First-time initialization complete');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        globalAuthState = { initialized: true, user: null, profile: null, loading: false };
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (only real authentication events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        
        // Only handle actual sign in/out events, ignore token refreshes and initial events
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          const newUser = session?.user ?? null;
          let newProfile = null;
          
          if (newUser && event === 'SIGNED_IN') {
            newProfile = await fetchProfile(newUser.id);
          }

          // Update global state
          globalAuthState = {
            initialized: true,
            user: newUser,
            profile: newProfile,
            loading: false
          };

          // Update component state
          setUser(newUser);
          setProfile(newProfile);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // No dependencies to prevent re-initialization

  // Fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('AuthProvider: Fetching profile for user', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      console.log('AuthProvider: Profile fetched successfully', data.role);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      // Update global state
      globalAuthState = {
        initialized: true,
        user: null,
        profile: null,
        loading: false
      };
      
      // Update component state
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh auth state
  const refresh = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Compute derived state
  const isAuthenticated = !!user;
  const userType: UserType = !user 
    ? 'guest' 
    : profile?.role === 'superadmin'
    ? 'superadmin'
    : profile?.role === 'admin'
    ? 'admin'
    : 'user';

  const authState: AuthState = {
    user,
    profile,
    loading,
    userType,
    isAuthenticated,
    isGuest: userType === 'guest',
    isUser: userType === 'user',
    isAdmin: userType === 'admin' || userType === 'superadmin',
    isSuperAdmin: userType === 'superadmin',
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// Protection Components
// ========================================

interface ProtectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

// Require user to be logged in
export function RequireAuth({ children, fallback, redirectTo = '/login' }: ProtectionProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Require admin access
export function RequireAdmin({ children, fallback, redirectTo = '/unauthorized' }: ProtectionProps) {
  const { isAdmin, isAuthenticated, loading, user, profile } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isStable, setIsStable] = useState(false);

  // Debounce auth state to prevent rapid re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStable(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, isAdmin]);

  useEffect(() => {
    // Only redirect once per mount and only when auth state is stable
    if (!loading && isStable && !hasRedirected) {
      if (!isAuthenticated) {
        console.log('RequireAdmin: User not authenticated, redirecting to login');
        setHasRedirected(true);
        const currentPath = window.location.pathname;
        const redirectUrl = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
        router.push(redirectUrl);
      } else if (isAuthenticated && !isAdmin) {
        console.log('RequireAdmin: User not admin, redirecting to unauthorized');
        setHasRedirected(true);
        router.push(redirectTo);
      }
    }
  }, [loading, isAuthenticated, isAdmin, hasRedirected, isStable, router, redirectTo]);

  // Reset redirect flag when user changes (for proper re-evaluation)
  useEffect(() => {
    setHasRedirected(false);
    setIsStable(false);
  }, [user?.id]);

  // Handle visibility change to prevent unnecessary re-auth when switching apps
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Silently preserve auth state when app becomes visible
      // No need to log this as it's expected behavior
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Show loading while auth is initializing
  if (loading || !isStable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting (prevents flash of content)
  if (!isAuthenticated || !isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!isAuthenticated ? 'Redirecting to login...' : 'Access denied...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Show content based on user type
interface ConditionalRenderProps {
  children: ReactNode;
  userTypes: UserType[];
  fallback?: ReactNode;
}

export function ShowForUserTypes({ children, userTypes, fallback }: ConditionalRenderProps) {
  const { userType, loading } = useAuth();

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (userTypes.includes(userType)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ========================================
// Utility Functions (for server components)
// ========================================

// Check if user has access to a course (server-side safe)
export async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('course_access')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

// Get current user from session (for server components)
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get current user profile (for server components)
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error getting profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting current profile:', error);
    return null;
  }
}