'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface PurchasedCourse {
  id: string
  course_id: string
  granted_at: string
  course: {
    id: string
    title: string
    description: string
    thumbnail_url: string
    instructor_name: string
    price: number
  }
}

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('PurchasesPage - Auth state:', { user: !!user, authLoading, userEmail: user?.email })
    
    if (authLoading) return
    
    if (!user) {
      console.log('PurchasesPage - No user found, redirecting to login')
      router.push('/login?redirectTo=/profile/purchases')
      return
    }

    console.log('PurchasesPage - User authenticated, loading courses')
    loadPurchasedCourses()
  }, [user, authLoading, router])

  const loadPurchasedCourses = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Get user's course access with course details
      const { data, error: queryError } = await supabase
        .from('course_access')
        .select(`
          id,
          course_id,
          granted_at,
          course:courses (
            id,
            title,
            description,
            thumbnail_url,
            instructor_name,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('granted_at', { ascending: false })

      if (queryError) {
        throw queryError
      }

      // Transform and filter data
      const transformedData: PurchasedCourse[] = (data || [])
        .filter(item => item.course) // Filter out any null course references
        .map(item => ({
          id: item.id,
          course_id: item.course_id,
          granted_at: item.granted_at,
          course: Array.isArray(item.course) ? item.course[0] : item.course
        }))

      setPurchasedCourses(transformedData)
    } catch (err) {
      console.error('Error loading purchased courses:', err)
      setError('Failed to load your purchased courses')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/course/${courseId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your purchased courses...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Courses</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadPurchasedCourses}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Purchased Courses</h1>
          <p className="text-gray-600">
            {purchasedCourses.length} {purchasedCourses.length === 1 ? 'course' : 'courses'} in your library
          </p>
        </div>

        {/* Courses Table */}
        {purchasedCourses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Courses Yet</h2>
            <p className="text-gray-500 mb-6">You haven't purchased any courses yet. Browse our course catalog to get started!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          /* Courses Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchased Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchasedCourses.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-16">
                            <img
                              className="h-12 w-16 rounded object-cover"
                              src={purchase.course.thumbnail_url}
                              alt={purchase.course.title}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-course.jpg'
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs">
                              {purchase.course.title}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {purchase.course.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.course.instructor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(purchase.granted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${purchase.course.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewCourse(purchase.course_id)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v18a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h8l4 4z" />
                          </svg>
                          View Course
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}