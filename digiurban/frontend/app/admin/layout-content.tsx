'use client'

import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { RemoteAssistConsent } from '@/components/admin/RemoteAssistConsent'

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
        {/*
          Assistência remota (2026-09-15): fica montado em TODO o painel admin
          porque o convite pode chegar em qualquer página. Sem sessão ativa não
          renderiza nada nem captura nada — só escuta o WebSocket.
        */}
        <RemoteAssistConsent />
      </SidebarProvider>
    </AdminAuthProvider>
  )
}
