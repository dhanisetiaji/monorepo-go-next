'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  roles: Role[]
  created_at: string
  updated_at: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
}

interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
}

interface AuthResponse {
  token: string
  user: User
}

interface LoginRequest {
  username: string
  password: string
}

interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data: AuthResponse = await response.json()
    this.setToken(data.token)
    return data
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data: AuthResponse = await response.json()
    this.setToken(data.token)
    return data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.authenticatedRequest('/api/v1/auth/me')
    const data = await response.json()
    return data.user
  }

  async logout(): Promise<void> {
    try {
      await this.authenticatedRequest('/api/v1/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.removeToken()
    }
  }

  async getUsers(params?: { page?: number; limit?: number; search?: string; active?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())

    const response = await this.authenticatedRequest(`/api/v1/users?${searchParams}`)
    return response.json()
  }

  async getRoles() {
    const response = await this.authenticatedRequest('/api/v1/roles')
    return response.json()
  }

  async getPermissions() {
    const response = await this.authenticatedRequest('/api/v1/permissions')
    return response.json()
  }

  private async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    })

    if (response.status === 401) {
      this.removeToken()
      throw new Error('Authentication expired')
    }

    return response
  }

  setToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  removeToken(): void {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  hasPermission(resource: string, action: string, user?: User): boolean {
    if (!user) return false
    
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (permission.resource === resource && permission.action === action) {
          return true
        }
      }
    }
    return false
  }

  hasRole(roleName: string, user?: User): boolean {
    if (!user) return false
    return user.roles.some(role => role.name === roleName)
  }
}

export const authService = new AuthService()
export type { User, Role, Permission, AuthResponse, LoginRequest, RegisterRequest }
