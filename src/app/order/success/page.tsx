'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid'
import { getOrderDetails } from '@/lib/cart-actions'

interface OrderDetails {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: {
    course_id: string
    course_title: string
    price: number
  }[]
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams?.get('orderId')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !user) {
        setError('Order ID not found or user not authenticated')
        setLoading(false)
        return
      }

      try {
        const result = await getOrderDetails(orderId)
        if (result.success && result.data) {
          setOrderDetails(result.data)
        } else {
          setError(result.error || 'Failed to fetch order details')
        }
      } catch (err) {
        setError('An error occurred while fetching order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, user])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  // Only show login message after auth is confirmed to be null
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your order</h2>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your courses are now available.
            </p>
          </div>

          {/* Order Details */}
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Order ID:</span>
                    <span className="ml-2 text-gray-600 font-mono">{orderDetails.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-green-600 capitalize">{orderDetails.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Order Date:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(orderDetails.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total Amount:</span>
                    <span className="ml-2 text-gray-900 font-semibold">
                      ${orderDetails.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Courses */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Courses</h3>
              <div className="space-y-3">
                {orderDetails.order_items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.course_title}</h4>
                      <p className="text-sm text-gray-600">Course access granted</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${item.price.toFixed(2)}
                      </div>
                      <button
                        onClick={() => router.push(`/course/${item.course_id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        Start Learning
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/profile/purchases')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View All Purchases
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}