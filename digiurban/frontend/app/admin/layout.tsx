'use client'

import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SidebarProvider } from '@/hooks/use-sidebar'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <SidebarProvider>
        <AdminLayout>
          {children}
        </AdminLayout>
      </SidebarProvider>
    </AdminAuthProvider>
  )
}