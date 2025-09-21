'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface PurchaseDetail {
  id: string
  user_id: string
  course_id: string
  amount: number
  status: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  stripe_charge_id?: string
  created_at: string
  updated_at: string
  user: {
    email: string
    full_name?: string
    created_at: string
  }
  course: {
    title: string
    description: string
    price: number
    thumbnail_url?: string
  }
}

export default function PurchaseDetail({ params }: { params: { id: string } }) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPurchaseDetail()
    }
  }, [params.id])

  const fetchPurchaseDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          course_id,
          amount,
          status,
          stripe_payment_intent_id,
          stripe_customer_id,
          stripe_charge_id,
          created_at,
          updated_at,
          profiles!orders_user_id_fkey(email, full_name, created_at),
          courses!orders_course_id_fkey(title, description, price, thumbnail_url)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      const purchaseDetail: PurchaseDetail = {
        id: data.id,
        user_id: data.user_id,
        course_id: data.course_id,
        amount: data.amount || 0,
        status: data.status || 'pending',
        stripe_payment_intent_id: data.stripe_payment_intent_id,
        stripe_customer_id: data.stripe_customer_id,
        stripe_charge_id: data.stripe_charge_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          email: (data.profiles as any)?.email || 'Unknown',
          full_name: (data.profiles as any)?.full_name,
          created_at: (data.profiles as any)?.created_at
        },
        course: {
          title: (data.courses as any)?.title || 'Unknown Course',
          description: (data.courses as any)?.description || '',
          price: (data.courses as any)?.price || 0,
          thumbnail_url: (data.courses as any)?.thumbnail_url
        }
      }

      setPurchase(purchaseDetail)
    } catch (error) {
      console.error('Error fetching purchase detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!purchase) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.id)

      if (error) throw error
      
      // Update local state
      setPurchase({
        ...purchase,
        status: newStatus,
        updated_at: new Date().toISOString()
      })

      // Log admin activity
      await supabase
        .from('admin_activity_log')
        .insert([{
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: 'UPDATE',
          resource_type: 'ORDER',
          resource_id: purchase.id,
          details: { status: newStatus }
        }])
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status. Please try again.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase not found</h3>
        <Link
          href="/admin/purchases"
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Purchases
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/purchases" className="hover:text-gray-700">Purchases</Link>
            <span>→</span>
            <span>Order #{purchase.id.slice(-8)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Details</h1>
        </div>
        <div className="flex space-x-3">
          {purchase.status === 'pending' && (
            <button
              onClick={() => updateOrderStatus('completed')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Mark Completed
            </button>
          )}
          {purchase.status === 'completed' && (
            <button
              onClick={() => updateOrderStatus('pending')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Mark Pending
            </button>
          )}
          <button
            onClick={() => updateOrderStatus('failed')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Mark Failed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Purchase Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{purchase.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-lg">{formatCurrency(purchase.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(purchase.status)}`}>
                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span>{formatDate(purchase.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{formatDate(purchase.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Stripe Information */}
          {(purchase.stripe_payment_intent_id || purchase.stripe_customer_id || purchase.stripe_charge_id) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stripe Payment Details</h3>
              <div className="space-y-3">
                {purchase.stripe_payment_intent_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Intent ID:</span>
                    <span className="font-mono text-sm">{purchase.stripe_payment_intent_id}</span>
                  </div>
                )}
                {purchase.stripe_customer_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer ID:</span>
                    <span className="font-mono text-sm">{purchase.stripe_customer_id}</span>
                  </div>
                )}
                {purchase.stripe_charge_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charge ID:</span>
                    <span className="font-mono text-sm">{purchase.stripe_charge_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Course Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
            <div className="flex space-x-4">
              {purchase.course.thumbnail_url && (
                <div className="flex-shrink-0">
                  <img
                    src={purchase.course.thumbnail_url}
                    alt={purchase.course.title}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{purchase.course.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{purchase.course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(purchase.course.price)}
                  </span>
                  <Link
                    href={`/admin/courses/${purchase.course_id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit Course →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 text-sm">Name:</span>
                <div className="font-medium">
                  {purchase.user.full_name || 'Not provided'}
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Email:</span>
                <div className="font-medium">{purchase.user.email}</div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Customer ID:</span>
                <div className="font-mono text-sm">{purchase.user_id}</div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Member Since:</span>
                <div className="text-sm">
                  {purchase.user.created_at ? formatDate(purchase.user.created_at) : 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href={`/admin/users/${purchase.user_id}`}
                className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
              >
                View Customer Profile
              </Link>
              <Link
                href={`/course/${purchase.course_id}`}
                target="_blank"
                className="block w-full text-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
              >
                View Course Page
              </Link>
              {purchase.stripe_payment_intent_id && (
                <a
                  href={`https://dashboard.stripe.com/payments/${purchase.stripe_payment_intent_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium"
                >
                  View in Stripe
                </a>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Order Created</div>
                  <div className="text-xs text-gray-500">{formatDate(purchase.created_at)}</div>
                </div>
              </div>
              {purchase.updated_at !== purchase.created_at && (
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    purchase.status === 'completed' ? 'bg-green-500' :
                    purchase.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">Status: {purchase.status}</div>
                    <div className="text-xs text-gray-500">{formatDate(purchase.updated_at)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}