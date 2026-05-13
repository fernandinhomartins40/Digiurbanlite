'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { SearchBar } from '@/components/admin/SearchBar'
import { useAnalytics, usePageTracking } from '@/hooks/useAnalytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  Award,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  FileSignature,
  FileText,
  GraduationCap,
  HandHeart,
  Heart,
  Mail,
  Map,
  MessageCircle,
  Network,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sprout,
  TrendingUp,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'

const roleLabels = {
  USER: 'Funcionario',
  COORDINATOR: 'Coordenador',
  MANAGER: 'Secretario',
  ADMIN: 'Prefeito',
  SUPER_ADMIN: 'Super Admin',
  GUEST: 'Visitante',
}

const statusLabels: Record<string, string> = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em progresso',
  ATUALIZACAO: 'Atualizacao',
  CONCLUIDO: 'Concluido',
  PENDENCIA: 'Pendencia',
}

const statusColors: Record<string, string> = {
  VINCULADO: 'bg-blue-100 text-blue-800',
  PROGRESSO: 'bg-yellow-100 text-yellow-800',
  ATUALIZACAO: 'bg-orange-100 text-orange-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  PENDENCIA: 'bg-red-100 text-red-800',
}

interface PendingProtocol {
  id: string
  number: string
  title: string
  status: string
  priority: number
  createdAt: string
  citizen?: { name?: string }
  department?: { name?: string }
  assignedUser?: { name?: string }
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

const getSearchItems = () => [
  { title: 'Inicio', description: 'Metricas, atalhos e pendencias', href: '/admin', category: 'Principal', keywords: ['inicio', 'dashboard', 'painel'] },
  { title: 'Protocolos', description: 'Gestao de protocolos', href: '/admin/protocolos', category: 'Atendimento', keywords: ['protocolo', 'solicitacao', 'atendimento'] },
  { title: 'Cidadaos', description: 'Base de cidadaos', href: '/admin/cidadaos', category: 'Atendimento', keywords: ['cidadao', 'municipes', 'cadastro'] },
  { title: 'Cidadaos Pendentes', description: 'Validacoes aguardando analise', href: '/admin/cidadaos/pendentes', category: 'Atendimento', keywords: ['pendente', 'validacao', 'aprovacao'] },
  { title: 'Catalogo de Servicos', description: 'Configurar servicos municipais', href: '/admin/servicos', category: 'Servicos', keywords: ['servico', 'catalogo', 'configuracao'] },
  { title: 'Gestao de Servicos', description: 'Acompanhar servicos municipais', href: '/admin/gerenciamento-servicos', category: 'Servicos', keywords: ['gestao', 'servicos', 'indicadores'] },
  { title: 'Mensagens', description: 'Central de mensagens', href: '/admin/mensagens', category: 'Comunicacao', keywords: ['mensagem', 'chat', 'notificacao'] },
  { title: 'Email', description: 'Email institucional', href: '/admin/email', category: 'Comunicacao', keywords: ['email', 'correio'] },
  { title: 'Relatorios', description: 'Relatorios e BI', href: '/admin/relatorios', category: 'Analise', keywords: ['relatorio', 'bi', 'analytics'] },
  { title: 'Analytics', description: 'Analise avancada de dados', href: '/admin/analytics', category: 'Analise', keywords: ['analytics', 'dados', 'metricas'] },
  { title: 'IA Centralizada', description: 'Chat operacional e API de IA', href: '/admin/ia', category: 'Automacao', keywords: ['ia', 'chat', 'api'] },
  { title: 'Fluxos do Bot', description: 'Automacao de processos', href: '/admin/bot-flows', category: 'Automacao', keywords: ['bot', 'fluxos', 'automacao'] },
  { title: 'Meus Documentos', description: 'Documentos pessoais e assinados', href: '/admin/meus-documentos', category: 'Documentos', keywords: ['documentos', 'assinatura'] },
  { title: 'Templates de Documentos', description: 'Modelos oficiais', href: '/admin/templates-documentos', category: 'Documentos', keywords: ['template', 'modelo'] },
  { title: 'Assinaturas Digitais', description: 'Assinatura eletronica de documentos', href: '/admin/assinaturas-digitais', category: 'Documentos', keywords: ['assinatura', 'digital'] },
  { title: 'Painel do Prefeito', description: 'Visao executiva municipal', href: '/admin/gabinete/painel-prefeito', category: 'Gabinete', keywords: ['prefeito', 'executivo'] },
  { title: 'Criar Chamado', description: 'Demanda interna para setores', href: '/admin/chamados', category: 'Gabinete', keywords: ['chamado', 'demanda'] },
  { title: 'Agenda', description: 'Agenda centralizada', href: '/admin/agenda', category: 'Gabinete', keywords: ['agenda', 'calendario'] },
  { title: 'Mapa de Demandas', description: 'Mapa dos protocolos', href: '/admin/gabinete/mapa-demandas', category: 'Gabinete', keywords: ['mapa', 'demandas'] },
  { title: 'Equipe', description: 'Equipe e permissoes', href: '/admin/servidores/equipe', category: 'Sistema', keywords: ['equipe', 'servidores'] },
  { title: 'Organograma', description: 'Estrutura administrativa', href: '/admin/organograma', category: 'Sistema', keywords: ['organograma', 'estrutura'] },
  { title: 'Configuracoes', description: 'Configuracoes do sistema', href: '/admin/configuracoes', category: 'Sistema', keywords: ['configuracao', 'sistema'] },
  { title: 'Integracoes', description: 'APIs e integracoes externas', href: '/admin/integracoes', category: 'Sistema', keywords: ['integracao', 'api'] },
]

export default function AdminPage() {
  const { user, stats, loading, apiRequest } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()
  const { trackCardClick } = useAnalytics()
  const [mounted, setMounted] = useState(false)
  const [pendingProtocols, setPendingProtocols] = useState<PendingProtocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)
  const [shortcutUsage, setShortcutUsage] = useState<ShortcutUsage[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)
  const [secretaryUsage, setSecretaryUsage] = useState<ShortcutUsage[]>([])
  const [loadingSecretaries, setLoadingSecretaries] = useState(false)

  usePageTracking('Admin Inicio')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (loading || user?.role !== 'ADMIN' || !hasPermission('protocols:read')) return

    let active = true

    async function loadPendingProtocols() {
      try {
        setLoadingProtocols(true)
        const response = await apiRequest('/protocols?limit=5')
        const protocols = response?.protocols || response?.data?.protocols || []

        if (!active || !Array.isArray(protocols)) return

        setPendingProtocols(
          protocols.filter((protocol: PendingProtocol) => protocol.status !== 'CONCLUIDO')
        )
      } catch (error: any) {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao carregar protocolos pendentes:', error)
        }
        if (active) setPendingProtocols([])
      } finally {
        if (active) setLoadingProtocols(false)
      }
    }

    loadPendingProtocols()

    return () => {
      active = false
    }
    // apiRequest is intentionally omitted because the auth context exposes it as a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.role])

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
        setLoadingSecretaries(true)
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
      } finally {
        if (active) setLoadingSecretaries(false)
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

  const statusRows = safeStats.protocolsByStatus || []

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
        title: 'Cidadaos',
        description: safeStats.pendingCitizens > 0 ? `${safeStats.pendingCitizens} aguardando validacao` : 'Base municipal',
        href: safeStats.pendingCitizens > 0 ? '/admin/cidadaos/pendentes' : '/admin/cidadaos',
        icon: UserPlus,
        color: 'text-green-600',
        bg: 'bg-green-50',
        category: 'Atendimento',
        section: 'Atalhos',
      },
      (hasPermission('services:create') || hasPermission('services:update')) && {
        title: 'Servicos',
        description: 'Catalogo e regras',
        href: '/admin/servicos',
        icon: Settings,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        category: 'Servicos',
        section: 'Atalhos',
      },
      hasPermission('messages:read') && {
        title: 'Mensagens',
        description: safeStats.unreadMessages ? `${safeStats.unreadMessages} nao lidas` : 'Central de atendimento',
        href: '/admin/mensagens',
        icon: MessageCircle,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        category: 'Comunicacao',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Criar Chamado',
        description: 'Acionar setor',
        href: '/admin/chamados',
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      (hasPermission('reports:department') || hasPermission('reports:full')) && {
        title: 'Relatorios',
        description: 'Indicadores e exportacoes',
        href: '/admin/relatorios',
        icon: BarChart3,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        category: 'Analise',
        section: 'Atalhos',
      },
      hasMinRole('COORDINATOR') && {
        title: 'Analytics',
        description: 'Leitura avancada',
        href: '/admin/analytics',
        icon: TrendingUp,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        category: 'Analise',
        section: 'Atalhos',
      },
      hasMinRole('COORDINATOR') && {
        title: 'Email',
        description: 'Caixa institucional',
        href: '/admin/email',
        icon: Mail,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        category: 'Comunicacao',
        section: 'Atalhos',
      },
      {
        title: 'Meus Documentos',
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
        description: 'Assinatura digital',
        href: '/admin/assinaturas-digitais',
        icon: FileSignature,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        category: 'Documentos',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Agenda',
        description: 'Compromissos',
        href: '/admin/agenda',
        icon: Calendar,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Painel do Prefeito',
        description: 'KPIs executivos',
        href: '/admin/gabinete/painel-prefeito',
        icon: Building2,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Mapa de Demandas',
        description: 'Visao territorial',
        href: '/admin/gabinete/mapa-demandas',
        icon: Map,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        category: 'Gabinete',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'IA Centralizada',
        description: 'Chat operacional',
        href: '/admin/ia',
        icon: Bot,
        color: 'text-fuchsia-600',
        bg: 'bg-fuchsia-50',
        category: 'Automacao',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Fluxos do Bot',
        description: 'Automacao',
        href: '/admin/bot-flows',
        icon: Cpu,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        category: 'Automacao',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Templates',
        description: 'Modelos oficiais',
        href: '/admin/templates-documentos',
        icon: ScrollText,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        category: 'Documentos',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Configuracoes',
        description: 'Preferencias do sistema',
        href: '/admin/configuracoes',
        icon: Settings,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        category: 'Sistema',
        section: 'Atalhos',
      },
      hasMinRole('ADMIN') && {
        title: 'Integracoes',
        description: 'APIs e canais',
        href: '/admin/integracoes',
        icon: Zap,
        color: 'text-lime-700',
        bg: 'bg-lime-50',
        category: 'Sistema',
        section: 'Atalhos',
      },
    ]

    return actions.filter(Boolean) as QuickAction[]
  }, [hasMinRole, hasPermission, safeStats.pendingCitizens, safeStats.pendingProtocols, safeStats.unreadMessages])

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
    { title: 'Saude', href: '/admin/secretarias/saude', icon: Heart, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Educacao', href: '/admin/secretarias/educacao', icon: GraduationCap, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Assistencia Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout, category: 'Secretarias', section: 'Secretarias' },
    { title: 'Administracao', href: '/admin/secretarias/administracao', icon: Building2, category: 'Secretarias', section: 'Secretarias' },
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

  const handleShortcutClick = (action: QuickAction) => {
    trackCardClick(action.title, action.href, action.category)
    setShortcutUsage((prev) => applyShortcutUsage(prev, action))

    apiRequest('/admin/preferences/shortcuts/track', {
      method: 'POST',
      body: JSON.stringify({
        title: action.title,
        href: action.href,
        category: action.category,
        section: action.section,
      }),
    })
      .then((response) => {
        if (Array.isArray(response?.data)) {
          setShortcutUsage(response.data)
        }
      })
      .catch((error: any) => {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao registrar atalho dinamico:', error)
        }
      })
  }

  const handleSecretaryClick = (secretary: SecretaryShortcut) => {
    trackCardClick(secretary.title, secretary.href, secretary.category)
    setSecretaryUsage((prev) => applyShortcutUsage(prev, secretary))

    apiRequest('/admin/preferences/shortcuts/track', {
      method: 'POST',
      body: JSON.stringify({
        title: secretary.title,
        href: secretary.href,
        category: secretary.category,
        section: secretary.section,
      }),
    })
      .then((response) => {
        if (Array.isArray(response?.data)) {
          setSecretaryUsage(response.data)
        }
      })
      .catch((error: any) => {
        if (!error?.message?.includes('autenticado')) {
          console.error('Erro ao registrar secretaria dinamica:', error)
        }
      })
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <main className={`min-h-screen space-y-6 ${mounted ? 'animate-in fade-in-0 duration-500' : 'opacity-0'}`}>
      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Inicio
              </h1>
              <Badge variant="outline">{roleLabels[user.role]}</Badge>
              {user.department && <Badge variant="secondary">{user.department.name}</Badge>}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Visao operacional do municipio com metricas, pendencias e atalhos para as tarefas mais usadas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {hasPermission('protocols:read') && (
              <Button asChild>
                <Link href="/admin/protocolos">
                  <FileText className="mr-2 h-4 w-4" />
                  Protocolos
                </Link>
              </Button>
            )}
            {hasMinRole('ADMIN') && (
              <Button asChild variant="outline">
                <Link href="/admin/agenda">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agenda
                </Link>
              </Button>
            )}
          </div>
        </div>

        <SearchBar items={getSearchItems()} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Protocolos"
          value={safeStats.totalProtocols}
          description={user.role === 'USER' ? 'Atribuidos a voce' : user.role === 'ADMIN' ? 'Todo o municipio' : 'Do seu setor'}
          icon={FileText}
          href="/admin/protocolos"
        />
        <MetricCard
          title="Pendentes"
          value={safeStats.pendingProtocols}
          description="Requerem atencao"
          icon={Clock}
          href="/admin/protocolos"
          accent="text-orange-600"
        />
        <MetricCard
          title="Concluidos"
          value={safeStats.completedProtocols}
          description={`Taxa de conclusao: ${completionRate}%`}
          icon={CheckCircle2}
          href="/admin/protocolos"
          accent="text-green-600"
        />
        <MetricCard
          title="Eficiencia"
          value={`${completionRate}%`}
          description="Protocolos finalizados"
          icon={TrendingUp}
          progress={completionRate}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Atalhos do dia
            </CardTitle>
            <CardDescription>
              {loadingShortcuts && shortcutUsage.length === 0
                ? 'Carregando atalhos personalizados...'
                : 'Acesso rapido adaptado aos atalhos mais usados por voce.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <ActionCard
                key={action.href}
                {...action}
                onClick={() => handleShortcutClick(action)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Status dos protocolos
            </CardTitle>
            <CardDescription>Distribuicao atual da fila de atendimento.</CardDescription>
          </CardHeader>
          <CardContent>
            {statusRows.length > 0 ? (
              <div className="space-y-3">
                {statusRows.map((item) => {
                  const count = item._count?._all || 0
                  const percentage = safeStats.totalProtocols > 0
                    ? Math.round((count / safeStats.totalProtocols) * 100)
                    : 0

                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <Badge variant="secondary" className={statusColors[item.status] || ''}>
                            {statusLabels[item.status] || item.status}
                          </Badge>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Sem dados de status no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {user.role === 'ADMIN' && hasPermission('protocols:read') && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Protocolos que pedem atencao
                </CardTitle>
                <CardDescription>Fila recente de protocolos ainda nao concluidos.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/protocolos">
                  Ver todos
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProtocols ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : pendingProtocols.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500" />
                Nenhum protocolo pendente no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingProtocols.map((protocol) => (
                  <Link
                    key={protocol.id}
                    href={`/admin/protocolos?search=${protocol.number}`}
                    className="flex flex-col gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-primary">#{protocol.number}</span>
                        <Badge variant="secondary" className={statusColors[protocol.status] || ''}>
                          {statusLabels[protocol.status] || protocol.status}
                        </Badge>
                      </div>
                      <p className="truncate text-sm font-medium">{protocol.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {protocol.citizen?.name || 'Cidadao nao informado'} - {protocol.department?.name || 'Setor nao definido'}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <FeatureGroup
          title="Gestao municipal"
          description="Operacao diaria e atendimento ao cidadao."
          items={[
            hasPermission('protocols:read') && { title: 'Protocolos', href: '/admin/protocolos', icon: FileText },
            hasPermission('citizens:read') && { title: 'Cidadaos', href: '/admin/cidadaos', icon: Users },
            (hasPermission('services:create') || hasPermission('services:update')) && { title: 'Catalogo de servicos', href: '/admin/servicos', icon: Settings },
            hasMinRole('COORDINATOR') && { title: 'Equipe', href: '/admin/servidores/equipe', icon: UserCheck },
          ]}
        />
        <FeatureGroup
          title="Documentos e automacao"
          description="Documentos, IA e fluxos digitais."
          items={[
            { title: 'Meus documentos', href: '/admin/meus-documentos', icon: FileText },
            hasMinRole('COORDINATOR') && { title: 'Assinaturas digitais', href: '/admin/assinaturas-digitais', icon: FileSignature },
            hasMinRole('ADMIN') && { title: 'Templates', href: '/admin/templates-documentos', icon: ScrollText },
            hasMinRole('ADMIN') && { title: 'IA centralizada', href: '/admin/ia', icon: Bot },
            FEATURE_FLAGS.WORKFLOWS && hasMinRole('ADMIN') && { title: 'Workflows', href: '/admin/workflows', icon: Network },
          ]}
        />
        <FeatureGroup
          title="Comunicacao e sistema"
          description="Canais, analises e administracao."
          items={[
            hasPermission('messages:read') && { title: 'Mensagens', href: '/admin/mensagens', icon: MessageCircle },
            hasMinRole('COORDINATOR') && { title: 'Email', href: '/admin/email', icon: Mail },
            (hasPermission('reports:department') || hasPermission('reports:full')) && { title: 'Relatorios', href: '/admin/relatorios', icon: BarChart3 },
            hasMinRole('ADMIN') && { title: 'Integracoes', href: '/admin/integracoes', icon: Zap },
          ]}
        />
      </section>

      {hasMinRole('ADMIN') && (
        <section className="grid gap-4 lg:grid-cols-4">
          <ActionCard title="Painel do Prefeito" description="KPIs executivos" href="/admin/gabinete/painel-prefeito" icon={Building2} color="text-yellow-600" bg="bg-yellow-50" />
          <ActionCard title="Agenda" description="Compromissos e reunioes" href="/admin/agenda" icon={Calendar} color="text-blue-600" bg="bg-blue-50" />
          <ActionCard title="Mapa de Demandas" description="Protocolos no territorio" href="/admin/gabinete/mapa-demandas" icon={Map} color="text-green-600" bg="bg-green-50" />
          <ActionCard title="Fluxos do Bot" description="Automacao do atendimento" href="/admin/bot-flows" icon={Cpu} color="text-cyan-600" bg="bg-cyan-50" />
        </section>
      )}

      {hasMinRole('COORDINATOR') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Secretarias
            </CardTitle>
            <CardDescription>
              {loadingSecretaries && secretaryUsage.length === 0
                ? 'Carregando secretarias personalizadas...'
                : 'Modulos setoriais ordenados pelo seu uso mais frequente.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {secretaries.map((secretary) => (
              <MiniLink
                key={secretary.href}
                title={secretary.title}
                href={secretary.href}
                icon={secretary.icon}
                onClick={() => handleSecretaryClick(secretary)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  accent = 'text-foreground',
  progress,
}: {
  title: string
  value: string | number
  description: string
  icon: typeof FileText
  href?: string
  accent?: string
  progress?: number
}) {
  const content = (
    <Card className={href ? 'transition-colors hover:border-primary/50 hover:bg-muted/30' : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-4 h-2" />}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
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

function FeatureGroup({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: Array<false | { title: string; href: string; icon: typeof FileText }>
}) {
  const visibleItems = items.filter(Boolean) as Array<{ title: string; href: string; icon: typeof FileText }>

  if (visibleItems.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
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
