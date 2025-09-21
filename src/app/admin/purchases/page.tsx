'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Purchase {
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
  }
  course: {
    title: string
    thumbnail_url?: string
  }
}

type FilterStatus = 'all' | 'completed' | 'pending' | 'failed'
type SortField = 'created_at' | 'amount' | 'status'
type SortDirection = 'asc' | 'desc'

export default function PurchaseManagement() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
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
          profiles!orders_user_id_fkey(email, full_name),
          courses!orders_course_id_fkey(title, thumbnail_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedPurchases: Purchase[] = (data || []).map(order => ({
        id: order.id,
        user_id: order.user_id,
        course_id: order.course_id,
        amount: order.amount || 0,
        status: order.status || 'pending',
        stripe_payment_intent_id: order.stripe_payment_intent_id,
        stripe_customer_id: order.stripe_customer_id,
        stripe_charge_id: order.stripe_charge_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
        user: {
          email: (order.profiles as any)?.email || 'Unknown',
          full_name: (order.profiles as any)?.full_name
        },
        course: {
          title: (order.courses as any)?.title || 'Unknown Course',
          thumbnail_url: (order.courses as any)?.thumbnail_url
        }
      }))

      setPurchases(formattedPurchases)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      
      // Update local state
      setPurchases(purchases.map(purchase => 
        purchase.id === orderId 
          ? { ...purchase, status: newStatus, updated_at: new Date().toISOString() }
          : purchase
      ))

      // Log admin activity
      await supabase
        .from('admin_activity_log')
        .insert([{
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: 'UPDATE',
          resource_type: 'ORDER',
          resource_id: orderId,
          details: { status: newStatus }
        }])
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status. Please try again.')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredAndSortedPurchases = purchases
    .filter(purchase => {
      const matchesSearch = 
        purchase.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || purchase.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  // Calculate stats
  const stats = {
    totalOrders: purchases.length,
    totalRevenue: purchases.reduce((sum, p) => sum + p.amount, 0) / 100,
    completedOrders: purchases.filter(p => p.status === 'completed').length,
    pendingOrders: purchases.filter(p => p.status === 'pending').length,
    failedOrders: purchases.filter(p => p.status === 'failed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
        <p className="text-gray-600">Monitor and manage all course purchases and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-blue-600">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-green-600">💰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalRevenue * 100)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-green-600">✅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completedOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-yellow-600">⏳</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-red-600">❌</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.failedOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, course, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  Amount {getSortIcon('amount')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Date {getSortIcon('created_at')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{purchase.id.slice(-8)}
                    </div>
                    {purchase.stripe_payment_intent_id && (
                      <div className="text-xs text-gray-500">
                        PI: {purchase.stripe_payment_intent_id.slice(-8)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {purchase.user.full_name || purchase.user.email.split('@')[0]}
                    </div>
                    <div className="text-sm text-gray-500">{purchase.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {purchase.course.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(purchase.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {purchase.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(purchase.id, 'completed')}
                          className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-200 rounded"
                        >
                          Complete
                        </button>
                      )}
                      {purchase.status === 'completed' && (
                        <button
                          onClick={() => updateOrderStatus(purchase.id, 'pending')}
                          className="text-yellow-600 hover:text-yellow-900 text-xs px-2 py-1 border border-yellow-200 rounded"
                        >
                          Pending
                        </button>
                      )}
                      <Link
                        href={`/admin/purchases/${purchase.id}`}
                        className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedPurchases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Orders will appear here when customers make purchases'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}