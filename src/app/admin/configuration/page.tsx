'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

interface EnvVariable {
  key: string
  value: string
  description: string
  required: boolean
  type: 'text' | 'password' | 'url'
}

const ENV_VARIABLES: EnvVariable[] = [
  // Supabase Configuration
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: '',
    description: 'Supabase project URL',
    required: true,
    type: 'url'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: '',
    description: 'Supabase anonymous public key',
    required: true,
    type: 'password'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: '',
    description: 'Supabase service role key (server-side)',
    required: true,
    type: 'password'
  },
  
  // AWS Configuration
  {
    key: 'AWS_ACCESS_KEY_ID',
    value: '',
    description: 'AWS IAM access key ID for S3 and CloudFront',
    required: false,
    type: 'password'
  },
  {
    key: 'AWS_SECRET_ACCESS_KEY',
    value: '',
    description: 'AWS IAM secret access key',
    required: false,
    type: 'password'
  },
  {
    key: 'AWS_REGION',
    value: '',
    description: 'AWS region for S3 bucket (e.g., eu-west-2)',
    required: false,
    type: 'text'
  },
  {
    key: 'S3_BUCKET_NAME',
    value: '',
    description: 'S3 bucket name for video storage',
    required: false,
    type: 'text'
  },
  
  // Stripe Configuration
  {
    key: 'STRIPE_SECRET_KEY',
    value: '',
    description: 'Stripe secret key for payments (starts with sk_)',
    required: true,
    type: 'password'
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    value: '',
    description: 'Stripe publishable key for client-side (starts with pk_)',
    required: true,
    type: 'text'
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    value: '',
    description: 'Stripe webhook endpoint secret (starts with whsec_)',
    required: false,
    type: 'password'
  },
  {
    key: 'STRIPE_CURRENCY',
    value: '',
    description: 'Currency code for Stripe payments (e.g., gbp, usd)',
    required: false,
    type: 'text'
  },
  
  // Domain Configuration
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: '',
    description: 'Application base URL for redirects and webhooks',
    required: true,
    type: 'url'
  },
  {
    key: 'NEXT_PUBLIC_DOMAIN',
    value: '',
    description: 'Public domain for Stripe checkout URLs',
    required: false,
    type: 'url'
  }
]

export default function ConfigurationPage() {
  const { isAdmin } = useAuth()
  const [envVars, setEnvVars] = useState<EnvVariable[]>(ENV_VARIABLES)
  const [originalEnvVars, setOriginalEnvVars] = useState<EnvVariable[]>(ENV_VARIABLES)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    loadCurrentEnvVars()
  }, [])

  const loadCurrentEnvVars = async () => {
    try {
      const response = await fetch('/api/admin/env', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const currentEnv = await response.json()
        const updatedVars = ENV_VARIABLES.map(envVar => ({
          ...envVar,
          value: currentEnv[envVar.key] || ''
        }))
        setEnvVars(updatedVars)
        setOriginalEnvVars(updatedVars) // Store original values for comparison
      }
    } catch (error) {
      console.error('Error loading environment variables:', error)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setEnvVars(prevVars =>
      prevVars.map(envVar =>
        envVar.key === key ? { ...envVar, value } : envVar
      )
    )
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Only send changed values
      const envData = envVars.reduce((acc, envVar, index) => {
        if (envVar.value !== originalEnvVars[index]?.value) {
          acc[envVar.key] = envVar.value
        }
        return acc
      }, {} as { [key: string]: string })

      const response = await fetch('/api/admin/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envData),
      })

      if (response.ok) {
        setOriginalEnvVars([...envVars]) // Update original values after successful save
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        throw new Error('Failed to save environment variables')
      }
    } catch (error) {
      console.error('Error saving environment variables:', error)
      alert('Error saving environment variables. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = () => {
    return envVars.some((envVar, index) => 
      envVar.value !== originalEnvVars[index]?.value
    )
  }

  const validateForm = () => {
    // Allow save if there are changes and no required fields are empty when they have values
    return hasChanges() && envVars.every(envVar => {
      // If the field has a value, it must not be empty
      if (envVar.value && envVar.value.trim() === '') {
        return false
      }
      // Don't block save if required field is empty but unchanged
      return true
    })
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Only</h2>
          <p className="text-gray-600">This configuration page is restricted to administrators only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Environment variables saved successfully!
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Configuration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage environment variables and application secrets. Changes take effect immediately.
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Security Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Be extremely careful when modifying these values. Incorrect configuration may break the application.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Supabase Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">📡 Supabase Configuration</h4>
              <div className="space-y-4">
                {envVars.filter(envVar => envVar.key.includes('SUPABASE')).map((envVar) => (
                  <div key={envVar.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {envVar.key}
                      {envVar.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{envVar.description}</p>
                    <div className="relative">
                      <input
                        type={envVar.type === 'password' && !showPasswords[envVar.key] ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => handleInputChange(envVar.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-600"
                        placeholder={`Enter ${envVar.key.toLowerCase()}`}
                      />
                      {envVar.type === 'password' && (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility(envVar.key)}
                        >
                          {showPasswords[envVar.key] ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121-3.121L21 21" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AWS Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">☁️ AWS Configuration</h4>
              <div className="space-y-4">
                {envVars.filter(envVar => envVar.key.startsWith('AWS_') || envVar.key.startsWith('S3_')).map((envVar) => (
                  <div key={envVar.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {envVar.key}
                      {envVar.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{envVar.description}</p>
                    <div className="relative">
                      <input
                        type={envVar.type === 'password' && !showPasswords[envVar.key] ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => handleInputChange(envVar.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-600"
                        placeholder={`Enter ${envVar.key.toLowerCase()}`}
                      />
                      {envVar.type === 'password' && (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility(envVar.key)}
                        >
                          {showPasswords[envVar.key] ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121-3.121L21 21" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stripe Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">💳 Stripe Configuration</h4>
              <div className="space-y-4">
                {envVars.filter(envVar => envVar.key.includes('STRIPE')).map((envVar) => (
                  <div key={envVar.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {envVar.key}
                      {envVar.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{envVar.description}</p>
                    <div className="relative">
                      <input
                        type={envVar.type === 'password' && !showPasswords[envVar.key] ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => handleInputChange(envVar.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-600"
                        placeholder={`Enter ${envVar.key.toLowerCase()}`}
                      />
                      {envVar.type === 'password' && (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility(envVar.key)}
                        >
                          {showPasswords[envVar.key] ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121-3.121L21 21" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Domain Configuration */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">🌐 Domain Configuration</h4>
              <div className="space-y-4">
                {envVars.filter(envVar => envVar.key.includes('DOMAIN') || envVar.key.includes('APP_URL')).map((envVar) => (
                  <div key={envVar.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {envVar.key}
                      {envVar.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{envVar.description}</p>
                    <div className="relative">
                      <input
                        type={envVar.type === 'password' && !showPasswords[envVar.key] ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => handleInputChange(envVar.key, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-600"
                        placeholder={`Enter ${envVar.key.toLowerCase()}`}
                      />
                      {envVar.type === 'password' && (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility(envVar.key)}
                        >
                          {showPasswords[envVar.key] ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121-3.121L21 21" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={loadCurrentEnvVars}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !validateForm()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {hasChanges() ? 'Save Changes' : 'Save Configuration'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}