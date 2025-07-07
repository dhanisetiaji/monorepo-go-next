'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authService } from '../lib/auth'
import { MenuAccess, FeatureAccess } from '../lib/menu'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [menuItems, setMenuItems] = useState<MenuAccess[]>([])
  const [features, setFeatures] = useState<FeatureAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const pathname = usePathname()

  useEffect(() => {
    loadMenuAccess()
  }, [])

  const loadMenuAccess = async () => {
    try {
      const { menus, features } = await authService.getMenuAccess()
      setMenuItems(menus)
      setFeatures(features)
    } catch (error) {
      console.error('Failed to load menu access:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSubmenu = (menuName: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName)
    } else {
      newExpanded.add(menuName)
    }
    setExpandedMenus(newExpanded)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const getIcon = (iconName: string) => {
    // Simple icon mapping - in a real app you'd use a proper icon library
    const icons: { [key: string]: string } = {
      'Home': '🏠',
      'BarChart3': '📊',
      'FileText': '📄',
      'Settings': '⚙️',
      'Users': '👥',
      'Shield': '🛡️',
      'Clock': '🕐',
      'CreditCard': '💳',
      'HelpCircle': '❓',
      'Cog': '⚙️'
    }
    return icons[iconName] || '•'
  }

  if (loading) {
    return (
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-white">Loading menu...</div>
        </div>
      </div>
    )
  }

  const renderMenuItem = (item: MenuAccess, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus.has(item.name)
    const active = isActive(item.path)
    
    return (
      <div key={item.name}>
        <div
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors duration-200 ${
            active ? 'bg-gray-700 text-white border-r-2 border-blue-500' : ''
          } ${level > 0 ? 'pl-8' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(item.name)
            }
          }}
        >
          <span className="mr-3">{getIcon(item.icon)}</span>
          <span className="flex-1">{item.label}</span>
          {hasChildren && (
            <span className={`transform transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}>
              ▶
            </span>
          )}
        </div>
        
        {!hasChildren && (
          <Link href={item.path} className="block">
            <div
              className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                active ? 'bg-gray-700 text-white border-r-2 border-blue-500' : ''
              } ${level > 0 ? 'pl-8' : ''}`}
            >
              <span className="mr-3">{getIcon(item.icon)}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="bg-gray-800">
            {item.children?.map((child: MenuAccess) => (
              <Link key={child.name} href={child.path}>
                {renderMenuItem(child, level + 1)}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Feature Access Indicators */}
        {features && (
          <div className="border-t border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Features</h3>
            <div className="space-y-1">
              {Object.entries(features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center text-xs">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    enabled ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className={enabled ? 'text-green-400' : 'text-gray-500'}>
                    {feature.charAt(0).toUpperCase() + feature.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
