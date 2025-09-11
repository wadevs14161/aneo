'use client'
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';

interface AddToCartButtonProps {
  courseId: string;
  courseName?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}

export default function AddToCartButton({ 
  courseId, 
  courseName = 'course',
  variant = 'primary',
  className = '' 
}: AddToCartButtonProps) {
  const { addToCart, isInCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddToCart = async () => {
    if (!user) {
      setMessage('Please log in to add courses to cart');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (isInCart(courseId)) {
      setMessage('Course already in cart');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const result = await addToCart(courseId);
      
      if (result.success) {
        setMessage(`${courseName} added to cart!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.error || 'Failed to add to cart');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage('An error occurred');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-300 rounded w-32"></div>
      </div>
    );
  }

  const inCart = isInCart(courseId);
  const buttonDisabled = isLoading || inCart;

  // Icon variant (for smaller spaces)
  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleAddToCart}
          disabled={buttonDisabled}
          className={`
            p-2 rounded-full transition-all duration-200
            ${inCart 
              ? 'bg-green-100 text-green-600 cursor-default' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }
            ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
          title={inCart ? 'In Cart' : `Add ${courseName} to Cart`}
        >
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : inCart ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a1 1 0 001 1h7a1 1 0 001-1v-6M7 13H5" />
            </svg>
          )}
        </button>
        {message && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            {message}
          </div>
        )}
      </div>
    );
  }

  // Primary/Secondary button variants
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px]";
  
  const variantClasses = {
    primary: inCart
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg",
    secondary: inCart
      ? "bg-green-100 text-green-700 border border-green-200"
      : "border border-blue-600 text-blue-600 hover:bg-blue-50"
  };

  return (
    <div className="relative">
      <button
        onClick={handleAddToCart}
        disabled={buttonDisabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
            Adding...
          </>
        ) : inCart ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            In Cart
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a1 1 0 001 1h7a1 1 0 001-1v-6M7 13H5" />
            </svg>
            Add to Cart
          </>
        )}
      </button>
      
      {message && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded whitespace-nowrap z-10 shadow-lg">
          {message}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
}