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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
          isInitializing = false;
          console.log('AuthProvider: Initialization complete');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          isInitializing = false;
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'isInitializing:', isInitializing);
        
        if (!mounted || isInitializing) return;

        // Temporarily set loading during profile fetch for existing users
        if (session?.user && !user) {
          setLoading(true);
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // No dependencies to prevent re-initialization

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      // Skip if we already have a profile for this user
      if (profile && profile.id === userId) {
        console.log('AuthProvider: Profile already cached for user', userId);
        return;
      }

      console.log('AuthProvider: Fetching profile for user', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      console.log('AuthProvider: Profile fetched successfully', data.role);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
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

  useEffect(() => {
    // Only redirect once per mount and only when auth state is stable
    if (!loading && !hasRedirected) {
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
  }, [loading, isAuthenticated, isAdmin, hasRedirected]); // Removed router and redirectTo from deps

  // Reset redirect flag when user changes (for proper re-evaluation)
  useEffect(() => {
    setHasRedirected(false);
  }, [user?.id]);

  // Show loading while auth is initializing
  if (loading) {
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