import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Always show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if no user
  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to /auth')
    return <Navigate to="/auth" replace />
  }

  // User is authenticated, render children
  console.log('[ProtectedRoute] User authenticated:', user.email)
  return <>{children}</>
}
