'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
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
  const hasRedirected = useRef(false)

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!loading && !user && pathname !== '/admin/login' && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace('/admin/login')
    }
  }, [user, loading, pathname, router])

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando portal administrativo...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário e não está na página de login, não renderizar nada
  // (o redirect irá acontecer)
  if (!user && pathname !== '/admin/login') {
    return null
  }

  // Se estiver na página de login, renderizar apenas o conteúdo
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Layout principal do admin
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fixa */}
      <AdminSidebar />

      {/* Conteúdo principal com margem para compensar sidebar */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <AdminHeader />

        {/* Conteúdo da página */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}