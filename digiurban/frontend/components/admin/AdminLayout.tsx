'use client'

/**
 * Casca do painel do servidor — DigiUrban Glass (Liquid Glass).
 *
 * Sem barra lateral: barra inferior flutuante no estilo Dock (AdminDock) —
 * Início · atalhos fixados por cada servidor (salvos no banco) · Mais — e a
 * busca no círculo. "Mais" abre, em vidro, todo o menu com as regras de
 * permissão e o alfinete para fixar telas na barra.
 * No topo: secretaria, pendentes, tema e conta.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Loader2, LogOut, Settings, User } from 'lucide-react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { ROLE_DISPLAY_NAMES } from '@/types/roles'
import { LgAmbient } from '@/components/liquid-glass/LgAmbient'
import { ThemeToggleButton } from '@/components/liquid-glass/ThemeToggleButton'
import { AdminMoreSheet } from './navigation/AdminMoreSheet'
import { AdminDock } from './navigation/AdminDock'
import { PinnedShortcutsProvider } from './navigation/PinnedShortcuts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminLayoutProps {
  children: React.ReactNode
}

const PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

const initialsOf = (value?: string) =>
  (value || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout, stats } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()
  const pathname = usePathname() || ''
  const router = useRouter()
  const isRedirecting = useRef(false)
  const [more, setMore] = useState<{ open: boolean; search: boolean }>({ open: false, search: false })
  const [organizeSignal, setOrganizeSignal] = useState(0)

  // Notificações em tempo real (SSE)
  useNotifications()

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))

  useEffect(() => {
    if (user) isRedirecting.current = false
  }, [user])

  useEffect(() => {
    if (!loading && !user && !isPublicPath && !isRedirecting.current) {
      isRedirecting.current = true
      router.replace('/admin/login')
    }
  }, [user, loading, pathname, router, isPublicPath])

  // Fecha o "Mais" ao trocar de página
  useEffect(() => {
    setMore({ open: false, search: false })
  }, [pathname])

  const closeMore = useCallback(() => setMore({ open: false, search: false }), [])

  if (loading || (!user && !isPublicPath)) {
    return (
      <div className="lg-root min-h-screen flex items-center justify-center">
        <LgAmbient />
        <div className="relative text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--lg-blue)]" />
          <p className="text-[var(--lg-ink2)]">Carregando portal administrativo...</p>
        </div>
      </div>
    )
  }

  if (isPublicPath) return <>{children}</>
  if (!user) return null

  const pending = stats?.pendingProtocols || 0
  const roleLabel = ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ?? user.role

  return (
    <PinnedShortcutsProvider>
    <div className="lg-root min-h-screen relative overflow-x-hidden">
      <LgAmbient />

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-5 pt-[max(12px,env(safe-area-inset-top))] pointer-events-none">
        <Link
          href="/admin"
          className="pointer-events-auto lg-glass lg-bar rounded-full h-10 px-4 inline-flex items-center gap-2 text-sm font-semibold min-w-0"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--lg-green)]" />
          <span className="truncate max-w-[42vw] sm:max-w-sm">{user.department?.name || 'Portal Administrativo'}</span>
        </Link>

        <div className="pointer-events-auto lg-glass lg-bar rounded-full p-1 flex items-center gap-0.5">
          {hasPermission('protocols:read') && (
            <Link
              href="/admin/protocolos"
              aria-label={pending ? `${pending} pedidos pendentes` : 'Pedidos pendentes'}
              title="Pedidos pendentes"
              className="lg-tab relative h-10 w-10 rounded-full flex items-center justify-center"
            >
              <Bell className="h-[19px] w-[19px]" />
              {pending > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--lg-red)] text-white text-[10px] font-bold leading-4 text-center">
                  {pending > 99 ? '99+' : pending}
                </span>
              )}
            </Link>
          )}
          <ThemeToggleButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Minha conta"
                className="h-10 w-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white bg-gradient-to-br from-[#5AA9FF] to-[#6A5CFF]"
              >
                {initialsOf(user.name || user.email)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-[var(--lg-fill)] px-2 py-0.5 text-[11px] font-semibold">
                  {roleLabel}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/perfil')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu perfil
              </DropdownMenuItem>
              {hasMinRole('ADMIN') && (
                <DropdownMenuItem onClick={() => router.push('/admin/configuracoes')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-[var(--lg-red)] focus:text-[var(--lg-red)]">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-3 sm:px-5 lg:px-8 pt-20 pb-36">{children}</main>

      <AdminMoreSheet
        open={more.open}
        focusSearch={more.search}
        onClose={closeMore}
        onOrganize={() => {
          closeMore()
          setOrganizeSignal((n) => n + 1)
        }}
      />

      <AdminDock
        badges={pending ? { '/admin/protocolos': pending } : {}}
        moreOpen={more.open && !more.search}
        searchOpen={more.open && more.search}
        onToggleMore={() => setMore((m) => ({ open: !m.open || m.search, search: false }))}
        onToggleSearch={() => setMore((m) => ({ open: !(m.open && m.search), search: true }))}
        organizeSignal={organizeSignal}
      />
    </div>
    </PinnedShortcutsProvider>
  )
}
