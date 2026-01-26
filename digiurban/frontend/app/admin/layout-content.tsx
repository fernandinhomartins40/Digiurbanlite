'use client'

import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SidebarProvider } from '@/hooks/use-sidebar'

export function AdminLayoutContent({
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
