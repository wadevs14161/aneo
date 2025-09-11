'use client'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthDebug() {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionInfo({ session: session ? { user: session.user?.id, email: session.user?.email } : null, error })
    }
    checkSession()
  }, [user])

  if (loading) return <div className="p-4 bg-yellow-100">Loading auth...</div>

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-blue-100 rounded-lg shadow-lg max-w-sm text-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div><strong>useAuth user:</strong> {user ? `${user.email} (${user.id})` : 'null'}</div>
      <div><strong>Session:</strong> {sessionInfo?.session ? `${sessionInfo.session.email}` : 'null'}</div>
      {sessionInfo?.error && <div className="text-red-600"><strong>Session Error:</strong> {sessionInfo.error.message}</div>}
    </div>
  )
}