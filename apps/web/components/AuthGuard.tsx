'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '../lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
}

export default function AuthGuard({ children, requiredRole, redirectTo = '/login' }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        // Redirect to login with current path as redirect parameter
        const currentPath = pathname || '/'
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      setIsAuthenticated(true)

      // If a specific role is required, check user's roles
      if (requiredRole) {
        try {
          const user = await authService.getCurrentUser()
          const hasRole = user.roles?.some(role => role.name === requiredRole)
          
          if (!hasRole) {
            // User doesn't have required role, redirect to unauthorized page
            router.push('/unauthorized')
            return
          }
          
          setHasPermission(true)
        } catch (error) {
          console.error('Error checking user roles:', error)
          // If there's an error getting user info, redirect to login
          authService.removeTokens()
          const currentPath = pathname || '/'
          router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
          return
        }
      } else {
        setHasPermission(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear tokens and redirect to login
      authService.removeTokens()
      const currentPath = pathname || '/'
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access this page.</p>
          <button
            onClick={() => {
              const currentPath = pathname || '/'
              router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show error if user doesn't have required role
  if (requiredRole && !hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Required role: <strong>{requiredRole}</strong>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Render children if authenticated and has permission
  return <>{children}</>
}
