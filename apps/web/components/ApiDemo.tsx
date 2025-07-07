'use client'

import { useState, useEffect } from 'react'
import { authService, type User } from '../lib/auth'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function ApiDemo() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      if (authService.isAuthenticated()) {
        const user = await authService.getCurrentUser()
        setCurrentUser(user)
        await fetchUsers()
        await fetchHello()
      } else {
        setShowAuth(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setShowAuth(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers({ limit: 10 })
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchHello = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/hello')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      console.error('Error fetching hello:', error)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    checkAuthAndFetchData()
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
      setUsers([])
      setShowAuth(true)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (showAuth) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please login or register to access the API demo</p>
        </div>
        
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">API Demo with Authentication</h2>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <div className="text-sm">
              <span className="text-gray-600">Welcome, </span>
              <span className="font-semibold">{currentUser.username}</span>
              <div className="text-xs text-gray-500">
                Roles: {currentUser.roles.map(role => role.name).join(', ')}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>Backend says:</strong> {message}
        </div>
      )}

      {currentUser && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          <h3 className="font-semibold">Current User Info:</h3>
          <p><strong>ID:</strong> {currentUser.id}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Status:</strong> {currentUser.is_active ? 'Active' : 'Inactive'}</p>
          <p><strong>Member since:</strong> {new Date(currentUser.created_at).toLocaleDateString()}</p>
          
          <div className="mt-2">
            <h4 className="font-semibold">Permissions:</h4>
            <div className="text-sm">
              {currentUser.roles.map(role => (
                <div key={role.id} className="mt-1">
                  <strong>{role.name}:</strong> {role.permissions.map(p => p.name).join(', ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Users from Authenticated API
            {currentUser && authService.hasPermission('users', 'read', currentUser) && 
              <span className="ml-2 text-sm text-green-600">✓ Read Permission</span>
            }
          </h3>
        </div>
        <div className="p-6">
          {users.length > 0 ? (
            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {user.first_name} {user.last_name} ({user.username})
                      </h4>
                      <p className="text-gray-600">{user.email}</p>
                      <span className="text-sm text-gray-500">ID: {user.id}</span>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Roles:</div>
                      {user.roles.map(role => (
                        <span key={role.id} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mr-1">
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              {authService.hasPermission('users', 'read', currentUser || undefined) 
                ? 'No users found' 
                : 'You do not have permission to view users'
              }
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
