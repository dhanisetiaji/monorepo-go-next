'use client'

import { useState, useEffect } from 'react'
import { authService, type User } from '../../lib/auth'
import AuthGuard from '../../components/AuthGuard'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.href = '/login?logout=true'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      authService.removeTokens()
      window.location.href = '/login?logout=true'
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Simplified sidebar navigation */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200">
            <div className="flex items-center justify-center h-16 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Monorepo App</h2>
            </div>
            
            <nav className="mt-8 px-4">
              <ul className="space-y-2">
                <li>
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Profile
                  </a>
                </li>
                {user && authService.hasRole('admin', user) && (
                  <li>
                    <a
                      href="/admin"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Admin Panel
                    </a>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="flex-1 ml-64">
            {/* Top navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      Welcome, <span className="font-medium">{user?.first_name || user?.username}</span>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main content */}
            <main className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* User Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Username:</strong> {user?.username}</div>
                    <div><strong>Email:</strong> {user?.email}</div>
                    <div><strong>Name:</strong> {user?.first_name} {user?.last_name}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roles Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Roles</h3>
                  <div className="space-y-2">
                    {user?.roles?.map((role) => (
                      <div key={role.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{role.name}</span>
                        <span className="text-xs text-gray-500">{role.permissions?.length || 0} permissions</span>
                      </div>
                    ))}
                    {(!user?.roles || user.roles.length === 0) && (
                      <p className="text-sm text-gray-500">No roles assigned</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <a
                      href="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Edit Profile
                    </a>
                    
                    {user && authService.hasRole('admin', user) && (
                      <a
                        href="/admin"
                        className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        Admin Panel
                      </a>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Welcome to your Dashboard!
                </h3>
                <p className="text-gray-600 mb-4">
                  You're successfully logged in to the monorepo application. This dashboard provides
                  an overview of your account and quick access to various features.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• JWT-based authentication</li>
                      <li>• Role-based access control</li>
                      <li>• Session management</li>
                      <li>• Automatic token refresh</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Available Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• User management</li>
                      <li>• Role & permission system</li>
                      <li>• Admin panel (for admins)</li>
                      <li>• Profile management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
