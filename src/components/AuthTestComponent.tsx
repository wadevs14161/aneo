'use client'

import { useAuth } from '@/hooks/useAuth'
import { addToCart } from '@/lib/actions/cart-actions'
import { useState } from 'react'

export default function AuthTestComponent() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAddToCart = async () => {
    setLoading(true)
    setTestResult('')

    try {
      // Test with a dummy course ID
      const result = await addToCart('dummy-course-id')
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-md">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      <div className="mb-4">
        <strong>User Status:</strong>
        <p className="text-sm mt-1">
          {user ? (
            <span className="text-green-600">
              Logged in as: {user.email}
            </span>
          ) : (
            <span className="text-red-600">Not logged in</span>
          )}
        </p>
      </div>

      <button
        onClick={testAddToCart}
        disabled={!user || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
      >
        {loading ? 'Testing...' : 'Test Add to Cart'}
      </button>

      {testResult && (
        <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  )
}