export interface MenuAccess {
  name: string
  label: string
  icon: string
  path: string
  permission: string
  children?: MenuAccess[]
  accessible?: boolean
}

export interface FeatureAccess {
  export: boolean
  import: boolean
  backup: boolean
  maintenance: boolean
}

export interface MenuAccessResponse {
  menus: MenuAccess[]
  features: FeatureAccess
}

// Client-side menu configuration with icons and metadata
export const menuConfig: Omit<MenuAccess, 'accessible'>[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    path: '/dashboard',
    permission: 'menu.dashboard'
  },
  {
    name: 'admin-panel',
    label: 'Admin Panel',
    icon: 'Shield',
    path: '/admin',
    permission: 'menu.admin-panel'
  },
  {
    name: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    path: '/analytics',
    permission: 'menu.analytics'
  },
  {
    name: 'reports',
    label: 'Reports',
    icon: 'FileText',
    path: '/reports',
    permission: 'menu.reports'
  },
  {
    name: 'admin',
    label: 'Administration',
    icon: 'Settings',
    path: '/admin',
    permission: 'menu.admin',
    children: [
      {
        name: 'users',
        label: 'User Management',
        icon: 'Users',
        path: '/admin/users',
        permission: 'menu.users'
      },
      {
        name: 'roles',
        label: 'Role Management',
        icon: 'Shield',
        path: '/admin/roles',
        permission: 'menu.roles'
      },
      {
        name: 'audit',
        label: 'Audit Logs',
        icon: 'Clock',
        path: '/admin/audit',
        permission: 'menu.audit'
      }
    ]
  },
  {
    name: 'billing',
    label: 'Billing',
    icon: 'CreditCard',
    path: '/billing',
    permission: 'menu.billing'
  },
  {
    name: 'support',
    label: 'Support',
    icon: 'HelpCircle',
    path: '/support',
    permission: 'menu.support'
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: 'Cog',
    path: '/settings',
    permission: 'menu.settings'
  }
]

// Role-based access documentation for UI
export const roleAccessMap = {
  admin: {
    name: 'Administrator',
    description: 'Full system access including admin panel',
    color: 'red',
    menus: ['Dashboard', 'Analytics', 'Reports', 'Administration', 'Admin Panel', 'Billing', 'Support', 'Settings']
  },
  manager: {
    name: 'Manager', 
    description: 'Business analytics access',
    color: 'blue',
    menus: ['Dashboard', 'Analytics', 'Reports', 'Billing']
  },
  editor: {
    name: 'Editor',
    description: 'Content management access', 
    color: 'green',
    menus: ['Dashboard', 'User Management', 'Support']
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    color: 'gray',
    menus: ['Dashboard', 'Analytics', 'Reports']
  },
  support: {
    name: 'Support Staff',
    description: 'User assistance access',
    color: 'purple',
    menus: ['Dashboard', 'Support', 'User Management']
  },
  user: {
    name: 'User',
    description: 'Basic dashboard access',
    color: 'yellow', 
    menus: ['Dashboard']
  }
}
