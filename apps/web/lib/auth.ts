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
  access_token: string
  refresh_token: string
  expires_at: number
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
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    // Get tokens from localStorage on client side
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
      this.refreshToken = localStorage.getItem('refresh_token')
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
    this.setTokens(data.access_token, data.refresh_token)
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
    this.setTokens(data.access_token, data.refresh_token)
    return data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.authenticatedRequest('/api/v1/auth/me')
    const data = await response.json()
    return data.user
  }

  async getMenuAccess(): Promise<{ menus: any[]; features: any }> {
    const response = await this.authenticatedRequest('/api/v1/auth/menu-access')
    const data = await response.json()
    return data
  }

  async logout(): Promise<void> {
    try {
      // Send refresh token to logout endpoint
      if (this.refreshToken) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.removeTokens()
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await this.authenticatedRequest('/api/v1/auth/logout-all', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      this.removeTokens()
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      })

      if (!response.ok) {
        this.removeTokens()
        return false
      }

      const data = await response.json()
      this.setTokens(data.access_token, data.refresh_token)
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      this.removeTokens()
      return false
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
    if (!this.accessToken) {
      throw new Error('No authentication token available')
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    })

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        // Retry request with new token
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers,
          },
        })
      } else {
        this.removeTokens()
        throw new Error('Authentication expired')
      }
    }

    return response
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  removeTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
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
