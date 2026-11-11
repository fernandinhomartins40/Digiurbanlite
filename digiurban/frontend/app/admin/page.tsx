'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useAnalytics, usePageTracking } from '@/hooks/useAnalytics'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WelcomeCard } from '@/components/admin/activation/WelcomeCard'
import { ActivationCard } from '@/components/admin/activation/ActivationCard'
import { WorkbenchHeader, WorkbenchList, useWorkbench } from '@/components/admin/workbench/Workbench'
import {
  AlertCircle,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  Cpu,
  FileSignature,
  FileText,
  GraduationCap,
  HandHeart,
  Heart,
  Mail,
  Map,
  MessageCircle,
  ScrollText,
  Settings,
  Sparkles,
  Sprout,
  TrendingUp,
  UserPlus,
  Zap,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  USER: 'Servidor',
  COORDINATOR: 'Coordenador',
  MANAGER: 'Secretário',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super-admin',
  GUEST: 'Visitante',
}

interface ShortcutUsage {
  title: string
  href: string
  category: string
  section: string
  count: number
  firstAccessedAt: string
  lastAccessedAt: string
}

interface TrackableShortcut {
  title: string
  href: string
  category: string
  section: string
}

interface QuickAction extends TrackableShortcut {
  description: string
  icon: typeof FileText
  color: string
  bg: string
}

interface SecretaryShortcut extends TrackableShortcut {
  icon: typeof FileText
}

function sortShortcutUsage(items: ShortcutUsage[]) {
  return [...items].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
  })
}

function applyShortcutUsage(prev: ShortcutUsage[], action: TrackableShortcut) {
  const now = new Date().toISOString()
  const existing = prev.find((item) => item.href === action.href)
  const next = existing
    ? prev.map((item) =>
        item.href === action.href
          ? {
              ...item,
              title: action.title,
              category: action.category,
              section: action.section,
              count: item.count + 1,
              lastAccessedAt: now,
            }
          : item
      )
    : [
        ...prev,
        {
          title: action.title,
          href: action.href,
          category: action.category,
          section: action.section,
          count: 1,
          firstAccessedAt: now,
          lastAccessedAt: now,
        },
      ]

  return sortShortcutUsage(next).slice(0, 30)
}

export default function AdminPage() {
  const { user, stats, loading, apiRequest } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()
  // perfil Gabinete do Prefeito (o Super-admin sempre pode)
  const hasGabinete = user?.role === 'SUPER_ADMIN' || user?.gabineteAccess === true
  const { trackCardClick } = useAnalytics()
  const workbench = useWorkbench()
  const [shortcutUsage, setShortcutUsage] = useState<ShortcutUsage[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)
  const [secretaryUsage, setSecretaryUsage] = useState<ShortcutUsage[]>([])

  usePageTracking('Admin Inicio')

  useEffect(() => {
    if (loading || !user) return

    let active = true

    async function loadShortcutUsage() {
      try {
        setLoadingShortcuts(true)
        const response = await apiRequest('/admin/preferences/shortcuts?section=Atalhos')
        const usage = response?.data || []

        if (active && Array.isArray(usage)) {
          setShortcutUsage(usage)
        }
      } catch (error: any) {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao carregar atalhos dinamicos:', error)
        }
        if (active) setShortcutUsage([])
      } finally {
        if (active) setLoadingShortcuts(false)
      }
    }

    loadShortcutUsage()

    return () => {
      active = false
    }
    // apiRequest is intentionally omitted because the auth context exposes it as a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id])

  useEffect(() => {
    if (loading || !user || !hasMinRole('COORDINATOR')) return

    let active = true

    async function loadSecretaryUsage() {
      try {
        const response = await apiRequest('/admin/preferences/shortcuts?section=Secretarias')
        const usage = response?.data || []

        if (active && Array.isArray(usage)) {
          setSecretaryUsage(usage)
        }
      } catch (error: any) {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao carregar secretarias dinamicas:', error)
        }
        if (active) setSecretaryUsage([])
      }
    }

    loadSecretaryUsage()

    return () => {
      active = false
    }
    // apiRequest is intentionally omitted because the auth context exposes it as a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, user?.role])

  const safeStats = stats || {
    totalProtocols: 0,
    pendingProtocols: 0,
    completedProtocols: 0,
    pendingCitizens: 0,
    unreadMessages: 0,
    protocolsByStatus: [],
  }

  const completionRate = safeStats.totalProtocols > 0
    ? Math.round((safeStats.completedProtocols / safeStats.totalProtocols) * 100)
    : 0

  const availableQuickActions = useMemo(() => {
    const actions = [
      hasPermission('protocols:read') && {
        title: 'Protocolos',
        description: `${safeStats.pendingProtocols} pendentes`,
        href: '/admin/protocolos',
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        category: 'Atendimento',
        section: 'Atalhos',
      },
      hasPermission('citizens:read') && {
        title: 'Cidadãos',
        description: safeStats.pendingCitizens > 0 ? `${safeStats.pendingCitizens} aguardando conferência` : 'Cadastro do município',
        href: safeStats.pendingCitizens > 0 ? '/admin/cidadaos/pendentes' : '/admin/cidadaos',
        icon: UserPlus,
        color: 'text-green-600',
        bg: 'bg-green-50',
        category: 'Atendimento',
        section: 'Atalhos',
      },
      (hasPermission('services:create') || hasPermission('services:update')) && {
        title: 'Serviços',
        description: 'Catálogo e regras',
        href: '/admin/servicos',
        icon: Settings,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        category: 'Servicos',
        section: 'Atalhos',
      },
      hasPermission('messages:read') && {
        title: 'Mensagens',
        description: safeStats.unreadMessages ? `${safeStats.unreadMessages} não lidas` : 'Central de atendimento',
        href: '/admin/mensagens',
        icon: MessageCircle,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        category: 'Comunicacao',
        section: 'Atalhos',
      },
      hasGabinete && {
        title: 'Demandas do Gabinete',
        description: 'Enviar e acompanhar',
        href: '/admin/gabinete/painel-prefeito?aba=demandas',
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      (hasPermission('reports:department') || hasPermission('reports:full')) && {
        title: 'Relatórios',
        description: 'Indicadores e exportações',
        href: '/admin/relatorios',
        icon: BarChart3,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        category: 'Analise',
        section: 'Atalhos',
      },
      hasMinRole('COORDINATOR') && {
        title: 'Análises',
        description: 'Leitura avançada',
        href: '/admin/analytics',
        icon: TrendingUp,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        category: 'Analise',
        section: 'Atalhos',
      },
      hasMinRole('MANAGER') && {
        title: 'E-mails do sistema',
        description: 'Avisos enviados por e-mail',
        href: '/admin/email',
        icon: Mail,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        category: 'Comunicacao',
        section: 'Atalhos',
      },
      {
        title: 'Meus documentos',
        description: 'Arquivos e assinaturas',
        href: '/admin/meus-documentos',
        icon: FileText,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        category: 'Documentos',
        section: 'Atalhos',
      },
      hasMinRole('COORDINATOR') && {
        title: 'Assinaturas',
        description: 'Assinatura de documentos',
        href: '/admin/assinaturas-digitais',
        icon: FileSignature,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        category: 'Documentos',
        section: 'Atalhos',
      },
      {
        title: 'Agenda',
        description: 'Compromissos',
        href: '/admin/agenda',
        icon: Calendar,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        category: 'Atendimento',
        section: 'Atalhos',
      },
      hasGabinete && {
        title: 'Painel do Prefeito',
        description: 'Hoje, secretarias, território',
        href: '/admin/gabinete/painel-prefeito',
        icon: Building2,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      hasPermission('protocols:read') && {
        title: 'Mapa dos pedidos',
        description: 'Pedidos no território',
        href: '/admin/mapa',
        icon: Map,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        category: 'Atendimento',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'IA',
        description: 'Assistente dos servidores',
        href: '/admin/ia',
        icon: Bot,
        color: 'text-fuchsia-600',
        bg: 'bg-fuchsia-50',
        category: 'Automacao',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'DigiBot',
        description: 'Assistente do cidadão',
        href: '/admin/digibot',
        icon: Cpu,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        category: 'Automacao',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Modelos de documento',
        description: 'Modelos oficiais',
        href: '/admin/templates-documentos',
        icon: ScrollText,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        category: 'Documentos',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Configurações',
        description: 'Preferências do sistema',
        href: '/admin/configuracoes',
        icon: Settings,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        category: 'Sistema',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Integrações',
        description: 'Ligações com outros sistemas',
        href: '/admin/integracoes',
        icon: Zap,
        color: 'text-lime-700',
        bg: 'bg-lime-50',
        category: 'Sistema',
        section: 'Atalhos',
      },
    ]

    return actions.filter(Boolean) as QuickAction[]
  }, [hasGabinete, hasMinRole, hasPermission, safeStats.pendingCitizens, safeStats.pendingProtocols, safeStats.unreadMessages])

  const quickActionMap = useMemo(() => {
    return new globalThis.Map(availableQuickActions.map((action) => [action.href, action]))
  }, [availableQuickActions])

  const quickActions = useMemo(() => {
    const usedActions = shortcutUsage
      .map((item) => quickActionMap.get(item.href))
      .filter(Boolean) as QuickAction[]
    const usedHrefs = new Set(usedActions.map((action) => action.href))
    const fallbackActions = availableQuickActions.filter((action) => !usedHrefs.has(action.href))

    return [...usedActions, ...fallbackActions].slice(0, 6)
  }, [availableQuickActions, quickActionMap, shortcutUsage])

  const availableSecretaries = useMemo<SecretaryShortcut[]>(() => [
    { title: 'Saúde', href: '/admin/secretarias/saude', icon: Heart, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Educação', href: '/admin/secretarias/educacao', icon: GraduationCap, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Assistência Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Administração', href: '/admin/secretarias/administracao', icon: Building2, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Tecnologia', href: '/admin/secretarias/tecnologia-inovacao', icon: Cpu, category: 'Secretarias', section: 'Secretarias' },
  ], [])

  const secretaryMap = useMemo(() => {
    return new globalThis.Map(availableSecretaries.map((secretary) => [secretary.href, secretary]))
  }, [availableSecretaries])

  const secretaries = useMemo(() => {
    const usedSecretaries = secretaryUsage
      .map((item) => secretaryMap.get(item.href))
      .filter(Boolean) as SecretaryShortcut[]
    const usedHrefs = new Set(usedSecretaries.map((secretary) => secretary.href))
    const fallbackSecretaries = availableSecretaries.filter((secretary) => !usedHrefs.has(secretary.href))

    return [...usedSecretaries, ...fallbackSecretaries].slice(0, 6)
  }, [availableSecretaries, secretaryMap, secretaryUsage])

  const trackShortcut = (item: TrackableShortcut, setUsage: typeof setShortcutUsage) => {
    trackCardClick(item.title, item.href, item.category)
    setUsage((prev) => applyShortcutUsage(prev, item))

    apiRequest('/admin/preferences/shortcuts/track', {
      method: 'POST',
      body: JSON.stringify({
        title: item.title,
        href: item.href,
        category: item.category,
        section: item.section,
      }),
    })
      .then((response) => {
        if (Array.isArray(response?.data)) {
          setUsage(response.data)
        }
      })
      .catch((error: any) => {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao registrar atalho dinamico:', error)
        }
      })
  }

  if (loading || !user) {
    return (
      <main className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-11 w-full rounded-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </main>
    )
  }

  const emptySuggestion = hasPermission('protocols:read')
    ? { label: 'Ver todos os pedidos em aberto', href: '/admin/protocolos?view=active' }
    : { label: 'Ver a agenda', href: '/admin/agenda' }

  return (
    <main className="min-h-screen space-y-6">
      <WelcomeCard />
      <ActivationCard />

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{roleLabels[user.role] || user.role}</Badge>
          {user.department && <Badge variant="secondary">{user.department.name}</Badge>}
        </div>
        <WorkbenchHeader data={workbench.data} loading={workbench.isLoading} />
      </section>

      <WorkbenchList
        data={workbench.data}
        loading={workbench.isLoading}
        error={workbench.isError}
        emptySuggestion={emptySuggestion}
      />

      {hasPermission('protocols:read') && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/admin/protocolos" className="hover:underline">
            {safeStats.totalProtocols} protocolos
          </Link>
          <Link href="/admin/protocolos?view=active" className="hover:underline">
            {safeStats.pendingProtocols} pendentes
          </Link>
          <Link href="/admin/protocolos?view=all&status=CONCLUIDO" className="hover:underline">
            {safeStats.completedProtocols} concluídos
          </Link>
          <span>{completionRate}% de conclusão</span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Atalhos mais usados
          </CardTitle>
          <CardDescription>As telas que você mais abre aparecem primeiro.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loadingShortcuts && shortcutUsage.length === 0
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            : quickActions.map((action) => (
                <ActionCard
                  key={action.href}
                  {...action}
                  onClick={() => trackShortcut(action, setShortcutUsage)}
                />
              ))}
        </CardContent>
      </Card>

      {hasMinRole('COORDINATOR') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Secretarias
            </CardTitle>
            <CardDescription>Ordenadas pelo seu uso.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {secretaries.map((secretary) => (
              <MiniLink
                key={secretary.href}
                title={secretary.title}
                href={secretary.href}
                icon={secretary.icon}
                onClick={() => trackShortcut(secretary, setSecretaryUsage)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
  bg,
  onClick,
}: {
  title: string
  description: string
  href: string
  icon: typeof FileText
  color: string
  bg: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex min-h-24 items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/30"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

function MiniLink({
  title,
  href,
  icon: Icon,
  onClick,
}: {
  title: string
  href: string
  icon: typeof FileText
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border p-3 text-center text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted/40"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="leading-tight">{title}</span>
    </Link>
  )
}
