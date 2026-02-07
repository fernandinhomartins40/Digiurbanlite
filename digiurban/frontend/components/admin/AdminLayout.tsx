'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { Loader2 } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAdminAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isRedirecting = useRef(false)

  // Conectar ao sistema de notificações em tempo real
  const { connected } = useNotifications()

  // Log de conexão SSE (apenas desenvolvimento)
  useEffect(() => {
    if (connected) {
      console.log('[AdminLayout] Sistema de notificações conectado')
    }
  }, [connected])

  // Páginas públicas que não precisam de autenticação
  const publicPaths = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password'
  ]
  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path))

  // Resetar flag de redirect quando o user volta a existir (login bem-sucedido)
  useEffect(() => {
    if (user) {
      isRedirecting.current = false
    }
  }, [user])

  // Redirecionar para login quando não autenticado
  useEffect(() => {
    if (!loading && !user && !isPublicPath && !isRedirecting.current) {
      isRedirecting.current = true
      router.replace('/admin/login')
    }
  }, [user, loading, pathname, router, isPublicPath])

  // Mostrar loading enquanto carrega ou enquanto redireciona
  if (loading || (!user && !isPublicPath)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando portal administrativo...</p>
        </div>
      </div>
    )
  }

  // Se estiver em página pública, renderizar apenas o conteúdo
  if (isPublicPath) {
    return <>{children}</>
  }

  // Layout principal do admin
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fixa */}
      <AdminSidebar />

      {/* Conteúdo principal com margem responsiva para compensar sidebar */}
      <div className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Header */}
        <AdminHeader />

        {/* Conteúdo da página */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}