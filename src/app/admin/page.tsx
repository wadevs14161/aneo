'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalOrders: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    user_email: string
    course_title: string
    amount: number
    status: string
    created_at: string
  }>
  recentUsers: Array<{
    id: string
    email: string
    full_name: string | null
    created_at: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      // Fetch total orders and revenue
      const { data: orders, count: ordersCount } = await supabase
        .from('orders')
        .select('amount', { count: 'exact' })

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0

      // Fetch recent orders with user and course info
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          id,
          amount,
          status,
          created_at,
          profiles!orders_user_id_fkey(email, full_name),
          courses!orders_course_id_fkey(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent users
      const { data: recentUsersData } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents to dollars
        recentOrders: recentOrdersData?.map(order => ({
          id: order.id,
          user_email: (order.profiles as any)?.email || 'Unknown',
          course_title: (order.courses as any)?.title || 'Unknown Course',
          amount: (order.amount || 0) / 100,
          status: order.status || 'pending',
          created_at: order.created_at
        })) || [],
        recentUsers: recentUsersData?.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at
        })) || []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-blue-600">
                  👥
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin/users"
                className="font-medium text-blue-700 hover:text-blue-900"
              >
                View all users
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-green-600">
                  🎓
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Courses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalCourses.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin/courses"
                className="font-medium text-green-700 hover:text-green-900"
              >
                Manage courses
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-purple-600">
                  💳
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalOrders.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/admin/purchases"
                className="font-medium text-purple-700 hover:text-purple-900"
              >
                View purchases
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 text-yellow-600">
                  💰
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">
                From {stats.totalOrders} orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Orders
            </h3>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <li key={order.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.course_title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {order.user_email}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-4">
                    <p className="text-sm text-gray-500">No recent orders</p>
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href="/admin/purchases"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all orders
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Users
            </h3>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <li key={user.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.full_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name || user.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-gray-500">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-4">
                    <p className="text-sm text-gray-500">No recent users</p>
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href="/admin/users"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all users
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}