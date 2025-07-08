'use client'

import { useState, useEffect } from 'react'
import { authService, type User } from '../../lib/auth'
import AuthGuard from '../../components/AuthGuard'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || ''
      })
    } catch (error) {
      console.error('Error loading user:', error)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setError(null)
      setSuccess(null)
      
      await authService.updateUser(user.id, formData)
      setSuccess('Profile updated successfully!')
      setEditing(false)
      await loadUser() // Reload user data
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update profile')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.href = '/login?logout=true'
    } catch (error) {
      console.error('Logout error:', error)
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
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
                <div className="flex space-x-4">
                  <a
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  {user && authService.hasRole('admin', user) && (
                    <a
                      href="/admin"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                      Admin Panel
                    </a>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{success}</div>
                </div>
              )}

              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false)
                        setError(null)
                        setSuccess(null)
                        // Reset form data
                        if (user) {
                          setFormData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || ''
                          })
                        }
                      }}
                      className="bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">First Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.first_name || 'Not set'}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.last_name || 'Not set'}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user?.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Roles</dt>
                    <dd className="flex flex-wrap gap-2">
                      {user?.roles?.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                        >
                          {role.name}
                        </span>
                      ))}
                      {(!user?.roles || user.roles.length === 0) && (
                        <span className="text-sm text-gray-500">No roles assigned</span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
