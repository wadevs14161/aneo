// Authentication provider for handling auth state changes and redirects
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Handle auth state changes (like email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user came from a redirect
        const redirectTo = sessionStorage.getItem('authRedirectTo');
        if (redirectTo) {
          sessionStorage.removeItem('authRedirectTo');
          router.push(redirectTo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}