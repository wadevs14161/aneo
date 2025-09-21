'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'

interface Course {
  id: string
  title: string
  description: string
  price: number
  thumbnail_url?: string
  video_url?: string
  category?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId)

      if (error) throw error
      
      // Update local state
      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, is_active: !currentStatus }
          : course
      ))
    } catch (error) {
      console.error('Error updating course status:', error)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      
      // Update local state
      setCourses(courses.filter(course => course.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && course.is_active) ||
                         (filterStatus === 'inactive' && !course.is_active)
    
    return matchesSearch && matchesFilter
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
      day: 'numeric'
    })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Manage your courses, videos, and content</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            {/* Course Thumbnail */}
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎓</div>
                    <p className="text-sm">No thumbnail</p>
                  </div>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                  {course.title}
                </h3>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  course.is_active 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(course.price)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(course.created_at)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-center py-2 px-3 rounded-lg text-sm font-medium"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/courses/${course.id}/videos`}
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-center py-2 px-3 rounded-lg text-sm font-medium"
                >
                  Videos
                </Link>
                <button
                  onClick={() => toggleCourseStatus(course.id, course.is_active || false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    course.is_active
                      ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}
                  title={course.is_active ? 'Deactivate' : 'Activate'}
                >
                  {course.is_active ? '📴' : '✅'}
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No courses found' : 'No courses yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first course'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link
              href="/admin/courses/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create First Course
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-500">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.is_active).length}
            </div>
            <div className="text-sm text-gray-500">Active Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(courses.reduce((sum, course) => sum + course.price, 0))}
            </div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  )
}