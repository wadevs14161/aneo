'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserOrders } from '@/lib/cart-actions'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

interface OrderItem {
  course_id: string
  course_title: string
  price: number
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const result = await getUserOrders()
        if (result.success && result.data) {
          setOrders(result.data)
        } else {
          setError(result.error || 'Failed to fetch orders')
        }
      } catch (err) {
        setError('An error occurred while fetching orders')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchOrders()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your purchases</h2>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Purchases</h1>
          <p className="text-gray-600">View all your course purchases and access your content</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No purchases yet</h2>
            <p className="text-gray-600 mb-6">Start learning today by browsing our course catalog</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}...
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </div>
                      <div className="text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Course{order.order_items.length > 1 ? 's' : ''} Purchased</h4>
                  <div className="space-y-3">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.course_title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.status === 'completed' ? 'Access granted' : 'Access pending'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                          {order.status === 'completed' && (
                            <button
                              onClick={() => router.push(`/course/${item.course_id}`)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Start Learning
                              <ArrowRightIcon className="h-4 w-4 ml-1" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => router.push(`/order/success?orderId=${order.id}`)}
                      className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      View Order Details
                    </button>
                    {order.status === 'completed' && order.order_items.length === 1 && (
                      <button
                        onClick={() => router.push(`/course/${order.order_items[0].course_id}`)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Access Course
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}