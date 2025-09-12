'use client'
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EmailVerificationNotice from '@/components/EmailVerificationNotice';

export default function CartPage() {
  const { items, total, removeFromCart, loading, itemCount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [removingItems, setRemovingItems] = useState<string[]>([]);
  const router = useRouter();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated (only after auth check completes)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to log in to view your cart.</p>
          <Link href="/login?redirectTo=/cart">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRemoveFromCart = async (courseId: string, courseName: string) => {
    if (removingItems.includes(courseId)) return;
    
    setRemovingItems(prev => [...prev, courseId]);
    
    try {
      const result = await removeFromCart(courseId);
      if (!result.success) {
        console.error('Failed to remove item:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setRemovingItems(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleCheckout = () => {
    if (items.length > 0) {
      router.push('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-gray-300 rounded"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Email Verification Notice */}
        <EmailVerificationNotice />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <div className="text-lg text-gray-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Cart Content */}
        {items.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a1 1 0 001 1h7a1 1 0 001-1v-6M7 13H5" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Browse our courses and add some to your cart!</p>
            <Link href="/">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Courses
              </button>
            </Link>
          </div>
        ) : (
          /* Cart Items */
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4">
                {/* Course Thumbnail */}
                <div className="flex-shrink-0">
                  <Image
                    src={item.thumbnail_url}
                    alt={item.title}
                    width={96}
                    height={64}
                    className="rounded object-cover"
                  />
                </div>

                {/* Course Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Instructor: {item.instructor_name}
                  </p>
                  <div className="text-sm text-gray-500">
                    Added on {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${item.price.toFixed(2)}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleRemoveFromCart(item.course_id, item.title)}
                    disabled={removingItems.includes(item.course_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    title="Remove from cart"
                  >
                    {removingItems.includes(item.course_id) ? (
                      <div className="animate-spin w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Summary & Checkout */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-semibold">Total: ${total.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{itemCount} courses</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1">
                <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </button>
              </Link>
              
              <button
                onClick={handleCheckout}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}