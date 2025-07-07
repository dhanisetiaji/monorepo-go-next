'use client'

import React, { useState, useEffect } from 'react'
import { authService, User, Role } from '../lib/auth'
import { roleAccessMap } from '../lib/menu'

interface RolePermissionManagerProps {
  user?: User
}

export default function RolePermissionManager({ user }: RolePermissionManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [assigningRole, setAssigningRole] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersResponse, rolesResponse] = await Promise.all([
        authService.getUsers(),
        authService.getRoles()
      ])
      setUsers(usersResponse.users || usersResponse)
      setRoles(rolesResponse.roles || rolesResponse)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleInfo = (roleName: string) => {
    return roleAccessMap[roleName as keyof typeof roleAccessMap] || {
      name: roleName,
      description: 'Unknown role',
      color: 'gray',
      menus: []
    }
  }

  const getRoleColor = (roleName: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      editor: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
      support: 'bg-purple-100 text-purple-800',
      user: 'bg-yellow-100 text-yellow-800'
    }
    return colors[roleName as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    return authService.hasPermission('users', 'write', user) || 
           authService.hasRole('admin', user)
  }

  const canManageRoles = () => {
    if (!user) return false
    return authService.hasRole('admin', user)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading users and roles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Role Access Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(roleAccessMap).map(([roleKey, roleInfo]) => (
            <div key={roleKey} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{roleInfo.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(roleKey)}`}>
                  {roleKey}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{roleInfo.description}</p>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Menu Access:</div>
                <div className="flex flex-wrap gap-1">
                  {roleInfo.menus.slice(0, 3).map((menu) => (
                    <span key={menu} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {menu}
                    </span>
                  ))}
                  {roleInfo.menus.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{roleInfo.menus.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Role Assignment */}
      {canManageRoles() && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Roles
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
                  <tr key={userItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userItem.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {userItem.roles?.map((role) => (
                          <span
                            key={role.id}
                            className={`px-2 py-1 rounded-full text-xs ${getRoleColor(role.name)}`}
                          >
                            {role.name}
                          </span>
                        )) || <span className="text-gray-400 text-sm">No roles</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedUser(userItem)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Manage Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Assignment Modal (Simple) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Manage Roles for {selectedUser.username}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="text-sm text-gray-600">Current Roles:</div>
              <div className="flex flex-wrap gap-2">
                {selectedUser.roles?.map((role) => (
                  <span
                    key={role.id}
                    className={`px-3 py-1 rounded-full text-sm ${getRoleColor(role.name)}`}
                  >
                    {role.name}
                  </span>
                )) || <span className="text-gray-400">No roles assigned</span>}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm text-gray-600">Available Roles:</div>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const hasRole = selectedUser.roles?.some(r => r.id === role.id)
                  const roleInfo = getRoleInfo(role.name)
                  return (
                    <div
                      key={role.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        hasRole ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{roleInfo.name}</div>
                      <div className="text-xs text-gray-500">{roleInfo.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement role assignment
                  alert('Role assignment would be implemented here')
                  setSelectedUser(null)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
