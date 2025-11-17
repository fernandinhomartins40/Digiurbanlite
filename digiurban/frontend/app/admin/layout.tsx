'use client'

import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthProvider>
  )
}