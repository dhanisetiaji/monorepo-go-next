'use client'

import AuthGuard from '../../components/AuthGuard'
import AdminPanel from '../../components/AdminPanel'

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminPanel />
    </AuthGuard>
  )
}
