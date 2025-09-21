'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface CourseFormData {
  title: string
  description: string
  price: number
  category: string
  thumbnail_url: string
  video_url: string
  is_active: boolean
}

export default function EditCourse({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courseLoading, setCourseLoading] = useState(true)
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    price: 0,
    category: '',
    thumbnail_url: '',
    video_url: '',
    is_active: true
  })

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: (data.price || 0) / 100, // Convert from cents
        category: data.category || '',
        thumbnail_url: data.thumbnail_url || '',
        video_url: data.video_url || '',
        is_active: data.is_active ?? true
      })
    } catch (error) {
      console.error('Error fetching course:', error)
      router.push('/admin/courses')
    } finally {
      setCourseLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...formData,
          price: Math.round(formData.price * 100), // Convert to cents
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      // Log admin activity
      await supabase
        .from('admin_activity_log')
        .insert([{
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: 'UPDATE',
          resource_type: 'COURSE',
          resource_id: params.id,
          details: { title: formData.title, price: formData.price }
        }])

      router.push('/admin/courses')
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Error updating course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Edit Course</h1>
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/courses/${params.id}/videos`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Videos
              </Link>
              <Link
                href="/admin/courses"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what students will learn in this course"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Programming, Design, Business"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 1280x720 pixels (16:9 aspect ratio)
                </p>
              </div>

              <div>
                <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Main Video URL
                </label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/video.mp4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Main course video. Manage additional videos in the Videos section.
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Make course active and visible to students
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/courses"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium"
            >
              {loading ? 'Updating...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}