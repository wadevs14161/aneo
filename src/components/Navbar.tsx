// Mobile-responsive authentication-aware navbar component
'use client'
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import CartIcon from './CartIcon';

export default function Navbar() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="w-full bg-gray-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/Aneo-logo.png" 
                alt="Aneo Logo" 
                width={120} 
                height={40} 
                priority
                className="cursor-pointer"
                style={{ width: 'auto', height: '40px' }}
              />
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors duration-200"
            >
              About
            </Link>
            
            {isAuthenticated && (
              <Link 
                href="/profile/purchases" 
                className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors duration-200"
              >
                My Courses
              </Link>
            )}
            
            {loading ? (
              <div className="text-gray-600 text-sm">Loading...</div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <CartIcon />
                {user?.email && (
                  <span className="text-gray-700 text-sm font-medium hidden lg:block">
                    Hi, {user.email.split('@')[0]}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <button className="px-3 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm font-medium rounded-md transition-colors duration-200 hover: cursor-pointer">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 hover: cursor-pointer">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/about" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium text-base rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {isAuthenticated && (
                <Link 
                  href="/profile/purchases" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium text-base rounded-md transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Courses
                </Link>
              )}
              
              {loading ? (
                <div className="px-3 py-2 text-gray-600 text-base">Loading...</div>
              ) : isAuthenticated ? (
                <div className="px-3 py-2 space-y-2">
                  {user?.email && (
                    <div className="text-gray-700 text-sm font-medium">
                      Hi, {user.email.split('@')[0]}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <CartIcon />
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2 my-2 text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm font-medium rounded-md transition-colors duration-200">
                      Login
                    </button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2 my-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}