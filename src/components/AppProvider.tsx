'use client'
import React from 'react';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/contexts/CartContext';
import { CourseAccessProvider } from '@/contexts/CourseAccessContext';

interface AppProviderProps {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <CourseAccessProvider>
          {children}
        </CourseAccessProvider>
      </CartProvider>
    </AuthProvider>
  );
}