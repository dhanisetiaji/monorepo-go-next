'use client'

import React, { useState, useEffect } from 'react'
import { authService, User, Role, Permission } from '../lib/auth'

interface NewRole {
  name: string
  description: string
  permissionIds: string[]
}

interface NewPermission {
  name: string
  description: string
  resource: string
  action: string
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'security'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showNewRoleModal, setShowNewRoleModal] = useState(false)
  const [showNewPermissionModal, setShowNewPermissionModal] = useState(false)
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [newRole, setNewRole] = useState<NewRole>({
    name: '',
    description: '',
    permissionIds: []
  })
  const [newPermission, setNewPermission] = useState<NewPermission>({
    name: '',
    description: '',
    resource: '',
    action: ''
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load current user
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      
      // Load all admin data
      await loadData()
    } catch (err) {
      console.error('Error loading admin data:', err)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setError(null)
      const [usersData, rolesData, permissionsData] = await Promise.all([
        authService.getUsers(),
        authService.getRoles(),
        authService.getPermissions()
      ])
      setUsers(usersData.users || usersData)
      setRoles(rolesData.roles || rolesData)
      setPermissions(permissionsData.permissions || permissionsData)
    } catch (err) {
      setError('Failed to load data')
      console.error('Error loading data:', err)
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authService.createRole(newRole)
      setNewRole({ name: '', description: '', permissionIds: [] })
      setShowNewRoleModal(false)
      await loadData()
    } catch (err) {
      setError('Failed to create role')
    }
  }

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authService.createPermission(newPermission)
      setNewPermission({ name: '', description: '', resource: '', action: '' })
      setShowNewPermissionModal(false)
      await loadData()
    } catch (err) {
      setError('Failed to create permission')
    }
  }

  const handleAssignRoles = async (userId: string, roleIds: string[]) => {
    try {
      await authService.assignRoles(userId, roleIds)
      setShowAssignRoleModal(false)
      setSelectedUser(null)
      loadData()
    } catch (err) {
      setError('Failed to assign roles')
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await authService.updateUser(userId, { is_active: !isActive })
      loadData()
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await authService.deleteRole(roleId)
        loadData()
      } catch (err) {
        setError('Failed to delete role')
      }
    }
  }

  const getRoleColor = (roleName: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      editor: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
      user: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[roleName as keyof typeof colors] || 'bg-purple-100 text-purple-800 border-purple-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['users', 'roles', 'permissions', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Users Management</h2>
              <div className="text-sm text-gray-500">
                Total Users: {users.length}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                              {userItem.first_name?.[0] || userItem.username[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.first_name} {userItem.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userItem.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              @{userItem.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {userItem.roles?.map((role) => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role.name)}`}
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userItem.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(userItem)
                              setShowAssignRoleModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign Roles
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                            className={`${
                              userItem.is_active 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {userItem.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Roles Management</h2>
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Role
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Permissions:</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 3).map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                        >
                          {permission.name}
                        </span>
                      ))}
                      {role.permissions && role.permissions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Users with this role: {role.users?.length || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Permissions Management</h2>
              <button
                onClick={() => setShowNewPermissionModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Permission
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {permission.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {permission.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {permission.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {permission.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Security Monitoring</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Active Sessions</h3>
                <div className="text-3xl font-bold text-blue-600">24</div>
                <p className="text-sm text-gray-500">Currently active user sessions</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed Logins</h3>
                <div className="text-3xl font-bold text-red-600">3</div>
                <p className="text-sm text-gray-500">In the last 24 hours</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">API Requests</h3>
                <div className="text-3xl font-bold text-green-600">1.2k</div>
                <p className="text-sm text-gray-500">In the last hour</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {[
                  { type: 'info', message: 'User admin logged in from 192.168.1.100', time: '5 minutes ago' },
                  { type: 'warning', message: 'Failed login attempt for user john_doe', time: '12 minutes ago' },
                  { type: 'info', message: 'New role "editor" created by admin', time: '1 hour ago' },
                  { type: 'error', message: 'Multiple failed login attempts from 10.0.0.1', time: '2 hours ago' },
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{event.message}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2 p-1">
                      <input
                        type="checkbox"
                        checked={newRole.permissionIds.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({
                              ...newRole,
                              permissionIds: [...newRole.permissionIds, permission.id]
                            })
                          } else {
                            setNewRole({
                              ...newRole,
                              permissionIds: newRole.permissionIds.filter(id => id !== permission.id)
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{permission.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Create New Permission</h3>
            <form onSubmit={handleCreatePermission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Name
                </label>
                <input
                  type="text"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., users.read"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource
                </label>
                <input
                  type="text"
                  value={newPermission.resource}
                  onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., users"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select action</option>
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="delete">Delete</option>
                  <option value="execute">Execute</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPermissionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">
              Assign Roles to {selectedUser.first_name} {selectedUser.last_name}
            </h3>
            <div className="space-y-3">
              {roles.map((role) => {
                const isAssigned = selectedUser.roles?.some(userRole => userRole.id === role.id)
                return (
                  <label key={role.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked={isAssigned}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignRoleModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Get selected role IDs from checkboxes
                  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
                  const roleIds = Array.from(checkboxes).map((_, index) => roles[index].id)
                  handleAssignRoles(selectedUser.id, roleIds)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Assign Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
