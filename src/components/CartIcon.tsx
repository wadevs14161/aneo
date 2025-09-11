'use client'
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function CartIcon() {
  const { itemCount, loading } = useCart();
  const { user } = useAuth();

  // Don't show cart icon if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
      {/* Cart Icon */}
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a1 1 0 001 1h7a1 1 0 001-1v-6M7 13H5" 
        />
      </svg>
      
      {/* Item Count Badge */}
      {!loading && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          <div className="animate-spin w-2 h-2 border border-white border-t-transparent rounded-full"></div>
        </span>
      )}
    </Link>
  );
}