'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  video_url?: string
}

interface Video {
  id: string
  title: string
  url: string
  duration?: number
  order_index: number
  is_active: boolean
  created_at: string
}

export default function VideoManagement({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVideo, setNewVideo] = useState({
    title: '',
    url: '',
    duration: 0,
    is_active: true
  })

  useEffect(() => {
    if (params.id) {
      fetchCourseAndVideos()
    }
  }, [params.id])

  const fetchCourseAndVideos = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, video_url')
        .eq('id', params.id)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // For now, we'll simulate video data since we don't have a videos table yet
      // In a real implementation, you would create a separate videos table
      const mockVideos: Video[] = []
      
      if (courseData.video_url) {
        mockVideos.push({
          id: 'main-video',
          title: 'Main Course Video',
          url: courseData.video_url,
          duration: 0,
          order_index: 1,
          is_active: true,
          created_at: new Date().toISOString()
        })
      }

      setVideos(mockVideos)
    } catch (error) {
      console.error('Error fetching course and videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For now, we'll just add to local state
    // In a real implementation, you would insert into a videos table
    const newVideoData: Video = {
      id: `video-${Date.now()}`,
      title: newVideo.title,
      url: newVideo.url,
      duration: newVideo.duration,
      order_index: videos.length + 1,
      is_active: newVideo.is_active,
      created_at: new Date().toISOString()
    }

    setVideos([...videos, newVideoData])
    setNewVideo({ title: '', url: '', duration: 0, is_active: true })
    setShowAddForm(false)

    // Log admin activity
    await supabase
      .from('admin_activity_log')
      .insert([{
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: 'CREATE',
        resource_type: 'VIDEO',
        resource_id: newVideoData.id,
        details: { 
          course_id: params.id, 
          title: newVideo.title,
          url: newVideo.url
        }
      }])
  }

  const toggleVideoStatus = async (videoId: string) => {
    setVideos(videos.map(video => 
      video.id === videoId 
        ? { ...video, is_active: !video.is_active }
        : video
    ))
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    setVideos(videos.filter(video => video.id !== videoId))

    // Log admin activity
    await supabase
      .from('admin_activity_log')
      .insert([{
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: 'DELETE',
        resource_type: 'VIDEO',
        resource_id: videoId,
        details: { course_id: params.id }
      }])
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Unknown'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
        <Link
          href="/admin/courses"
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Courses
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
            <Link href="/admin/courses" className="hover:text-gray-700">Courses</Link>
            <span>→</span>
            <Link href={`/admin/courses/${params.id}`} className="hover:text-gray-700">{course.title}</Link>
            <span>→</span>
            <span>Videos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Video Management</h1>
          <p className="text-gray-600">Manage videos for: {course.title}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Add Video
          </button>
          <Link
            href={`/admin/courses/${params.id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
          >
            Edit Course
          </Link>
        </div>
      </div>

      {/* Add Video Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Video</h3>
          <form onSubmit={handleAddVideo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Course"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newVideo.duration}
                  onChange={(e) => setNewVideo({...newVideo, duration: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL *
              </label>
              <input
                type="url"
                required
                value={newVideo.url}
                onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newVideo.is_active}
                onChange={(e) => setNewVideo({...newVideo, is_active: e.target.checked})}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Make video active and visible
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Add Video
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Videos List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Videos</h3>
        </div>
        
        {videos.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {videos.map((video, index) => (
              <div key={video.id} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {video.title}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      video.is_active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {video.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>Duration: {formatDuration(video.duration || 0)}</span>
                    <span>Added: {formatDate(video.created_at)}</span>
                  </div>
                  <div className="mt-1">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 truncate block max-w-xs"
                    >
                      {video.url}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleVideoStatus(video.id)}
                    className={`p-2 rounded-lg text-sm font-medium ${
                      video.is_active
                        ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                        : 'bg-green-50 hover:bg-green-100 text-green-700'
                    }`}
                    title={video.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {video.is_active ? '📴' : '✅'}
                  </button>
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="p-2 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 text-red-700"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-500 mb-6">
              Start building your course by adding your first video
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Add First Video
            </button>
          </div>
        )}
      </div>

      {/* Video Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">🎥 Video Management Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload videos to a reliable hosting service (YouTube, Vimeo, AWS S3, etc.)</li>
          <li>• Use clear, descriptive titles for better organization</li>
          <li>• Include video duration for better user experience</li>
          <li>• Test video URLs to ensure they work properly</li>
          <li>• Consider video quality and loading speed for your audience</li>
        </ul>
      </div>
    </div>
  )
}