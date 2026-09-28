'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal'
import {
  Search,
  Eye,
  MessageSquare,
  AlertCircle,
  Clock,
  MoreVertical,
  UserPlus,
  UserCheck,
  ArrowRightLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  getPriorityLabel,
  getPriorityBadgeClass,
  getProtocolStatusLabel,
  getProtocolStatusClass,
  getSlaInfo,
  ProtocolSlaSnapshot,
} from '@/lib/protocol-helpers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { AssignProtocolDialog } from '@/components/protocols/AssignProtocolDialog'
import { DelegateProtocolDialog } from '@/components/protocols/DelegateProtocolDialog'
import { ForwardProtocolDialog } from '@/components/protocols/ForwardProtocolDialog'
import { AssignTeamDialog } from '@/components/protocols/AssignTeamDialog'

interface Protocol {
  id: string
  number: string
  title: string
  description?: string
  status: string
  priority: number // ✅ INT (1-5)
  createdAt: string
  updatedAt: string
  concludedAt?: string
  citizen?: { id: string; name: string }
  service?: { id: string; name: string }
  department?: { id: string; name: string }
  assignedUser?: { id: string; name: string }
  sla?: ProtocolSlaSnapshot | null
  _count?: { history: number }
}

type QueueView = 'active' | 'mine' | 'unassigned' | 'overdue' | 'due_soon' | 'all'
type QueueSummary = Partial<Record<QueueView, number>>

const QUEUE_VIEWS: { id: QueueView; label: string; hint: string; tone?: string; managersOnly?: boolean }[] = [
  { id: 'active', label: 'Em aberto', hint: 'Tudo que ainda não foi concluído ou cancelado' },
  { id: 'mine', label: 'Minha fila', hint: 'Em aberto e sob sua responsabilidade' },
  { id: 'unassigned', label: 'Sem responsável', hint: 'Em aberto e ainda sem servidor atribuído', managersOnly: true },
  { id: 'overdue', label: 'Atrasados', hint: 'Prazo do serviço já venceu', tone: 'text-red-700' },
  { id: 'due_soon', label: 'Vencem em 48h', hint: 'Prazo termina nas próximas 48 horas', tone: 'text-amber-700' },
  { id: 'all', label: 'Todos', hint: 'Inclui concluídos e cancelados' },
]

const SORT_OPTIONS = [
  { id: 'due', label: 'Prazo mais próximo' },
  { id: 'recent', label: 'Mais recentes' },
  { id: 'oldest', label: 'Mais antigos' },
]

const PAGE_SIZE = 20

function ProtocolsQueue() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, apiRequest, loading: authLoading } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  // Filtros vivem na URL: links da home funcionam e o "voltar" do detalhe preserva a fila
  const view = (searchParams.get('view') as QueueView) || 'active'
  const statusFilter = searchParams.get('status') || 'all'
  const priorityFilter = searchParams.get('priority') || 'all'
  const sort = searchParams.get('sort') || 'due'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const search = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<QueueSummary>({})
  const [dataLoading, setDataLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false)

  const [showAssignServerDialog, setShowAssignServerDialog] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const [showAssignTeamDialog, setShowAssignTeamDialog] = useState(false)
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null)

  const canAssign = hasPermission('protocols:assign')

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') params.delete(key)
        else params.set(key, value)
      })
      // 'all' é valor real de view (diferente do default 'active')
      if (changes.view === 'all') params.set('view', 'all')
      if (resetPage) params.delete('page')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Busca com debounce: uma requisição ao parar de digitar, não uma por tecla
  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(() => updateParams({ search: searchInput.trim() || null }), 400)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  // Sincroniza campo quando a URL muda externamente (ex.: link da home)
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const loadProtocols = useCallback(async () => {
    try {
      setDataLoading(true)
      setLoadError(null)
      const params = new URLSearchParams({ view, sort, page: String(page), limit: String(PAGE_SIZE) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (search) params.set('search', search)

      const response = await apiRequest(`/api/protocols?${params.toString()}`)
      setProtocols(response.protocols || [])
      setTotal(response.pagination?.total ?? (response.protocols || []).length)
      setTotalPages(Math.max(1, response.pagination?.totalPages ?? 1))
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error)
      setProtocols([])
      setLoadError('Não foi possível carregar os protocolos.')
    } finally {
      setDataLoading(false)
    }
    // apiRequest é recriado a cada render pelo contexto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sort, page, statusFilter, priorityFilter, search])

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiRequest('/api/protocols/queue-summary')
      if (response?.success) setSummary(response.data || {})
    } catch (error) {
      console.error('Erro ao carregar resumo da fila:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!authLoading && user) loadProtocols()
  }, [authLoading, user, loadProtocols])

  useEffect(() => {
    if (!authLoading && user) loadSummary()
  }, [authLoading, user, loadSummary])

  const refreshAll = () => {
    loadProtocols()
    loadSummary()
  }

  const closeDialogsAndRefresh = () => {
    setShowAssignServerDialog(false)
    setShowDelegateDialog(false)
    setShowForwardDialog(false)
    setShowAssignTeamDialog(false)
    setActiveProtocolId(null)
    refreshAll()
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const visibleViews = QUEUE_VIEWS.filter((v) => !v.managersOnly || canAssign)
  const hasExtraFilters = statusFilter !== 'all' || priorityFilter !== 'all' || !!search
  const currentView = QUEUE_VIEWS.find((v) => v.id === view)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciador de Protocolos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {user?.role === 'USER' ? 'Seus protocolos atribuídos' :
             user?.role === 'ADMIN' ? 'Todos os protocolos municipais' :
             'Protocolos do seu setor'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshAll} disabled={dataLoading} aria-label="Atualizar lista">
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          {hasPermission('protocols:create') && (
            <Button onClick={() => setShowServiceSelectorModal(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Novo Protocolo
            </Button>
          )}
        </div>
      </div>

      {/* Visões da fila */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex gap-2 px-1 min-w-max" role="tablist" aria-label="Visões da fila">
          {visibleViews.map((v) => {
            const count = summary[v.id]
            const selected = view === v.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={selected}
                title={v.hint}
                onClick={() => updateParams({ view: v.id === 'active' ? null : v.id, status: null })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : `bg-white hover:bg-gray-50 ${v.tone || 'text-gray-700'}`
                }`}
              >
                <span className="font-medium">{v.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`rounded-full px-2 text-xs font-semibold ${
                      selected ? 'bg-white/20' : v.id === 'overdue' && count > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Número, título ou cidadão..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
                aria-label="Buscar protocolos"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => updateParams({ status: value })}>
              <SelectTrigger aria-label="Filtrar por status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="VINCULADO">Vinculado</SelectItem>
                <SelectItem value="PROGRESSO">Em Progresso</SelectItem>
                <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                <SelectItem value="PENDENCIA">Pendência</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value) => updateParams({ priority: value })}>
              <SelectTrigger aria-label="Filtrar por prioridade">
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="1">Muito Baixa</SelectItem>
                <SelectItem value="2">Baixa</SelectItem>
                <SelectItem value="3">Normal</SelectItem>
                <SelectItem value="4">Alta</SelectItem>
                <SelectItem value="5">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => updateParams({ sort: value === 'due' ? null : value })}>
              <SelectTrigger aria-label="Ordenar">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    Ordenar: {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span>
              {dataLoading ? 'Carregando...' : `${total} protocolo${total === 1 ? '' : 's'}`}
              {currentView && currentView.id !== 'all' && ` · ${currentView.hint.toLowerCase()}`}
            </span>
            {hasExtraFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput('')
                  updateParams({ status: null, priority: null, search: null })
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Protocolos */}
      {loadError ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-red-600">{loadError}</p>
            <Button variant="outline" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : dataLoading && protocols.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className={`space-y-3 sm:space-y-4 ${dataLoading ? 'opacity-60' : ''}`}>
          {protocols.map((protocol) => {
            const slaInfo = getSlaInfo(protocol.sla, protocol.status)
            const detailHref = `/admin/protocolos/${protocol.id}`
            return (
              <Card
                key={protocol.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  slaInfo?.tone === 'overdue' ? 'border-l-4 border-l-red-500' : ''
                }`}
                onClick={() => router.push(detailHref)}
              >
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold">#{protocol.number}</h3>
                        <Badge variant="secondary" className={`text-xs ${getProtocolStatusClass(protocol.status)}`}>
                          {getProtocolStatusLabel(protocol.status)}
                        </Badge>
                        <Badge variant="outline" className={`border text-xs ${getPriorityBadgeClass(protocol.priority)}`}>
                          {getPriorityLabel(protocol.priority)}
                        </Badge>
                        {slaInfo && (
                          <Badge variant="outline" className={`border text-xs ${slaInfo.className}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {slaInfo.label}
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-1">{protocol.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{protocol.description || 'Sem descrição'}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="truncate">
                          <span className="font-medium">Cidadão:</span> {protocol.citizen?.name || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Serviço:</span> {protocol.service?.name || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Departamento:</span> {protocol.department?.name || 'N/A'}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Responsável:</span>{' '}
                        {protocol.assignedUser?.name || <span className="text-amber-700">Sem responsável</span>}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                        <span className="whitespace-nowrap">Criado em {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center whitespace-nowrap">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {protocol._count?.history || 0} interações
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row gap-2 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(detailHref)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">Abrir</span>
                      </Button>

                      {canAssign && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" aria-label="Mais ações">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() => {
                                setActiveProtocolId(protocol.id)
                                setShowAssignServerDialog(true)
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              <span>Atribuir Servidor</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActiveProtocolId(protocol.id)
                                setShowDelegateDialog(true)
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              <span>Delegar Temporário</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setActiveProtocolId(protocol.id)
                                setShowForwardDialog(true)
                              }}
                            >
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              <span>Encaminhar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActiveProtocolId(protocol.id)
                                setShowAssignTeamDialog(true)
                              }}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              <span>Atribuir Equipe</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {protocols.length === 0 && !dataLoading && (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-gray-700 font-medium">
                  {view === 'overdue' ? 'Nenhum protocolo atrasado. 👏' :
                   view === 'due_soon' ? 'Nada vencendo nas próximas 48 horas.' :
                   view === 'unassigned' ? 'Todos os protocolos em aberto têm responsável.' :
                   'Nenhum protocolo encontrado.'}
                </p>
                {(hasExtraFilters || view !== 'all') && (
                  <Button variant="link" onClick={() => { setSearchInput(''); updateParams({ view: 'all', status: null, priority: null, search: null }) }}>
                    Ver todos os protocolos
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || dataLoading}
                onClick={() => updateParams({ page: String(page - 1) }, false)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || dataLoading}
                onClick={() => updateParams({ page: String(page + 1) }, false)}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Seleção de Serviços */}
      <ServiceSelectorModal
        open={showServiceSelectorModal}
        onOpenChange={setShowServiceSelectorModal}
      />

      {/* Diálogos de Atribuição de Protocolos */}
      {activeProtocolId && (
        <>
          <AssignProtocolDialog
            open={showAssignServerDialog}
            onOpenChange={setShowAssignServerDialog}
            protocolId={activeProtocolId}
            departmentId={protocols.find(p => p.id === activeProtocolId)?.department?.id || ''}
            onSuccess={closeDialogsAndRefresh}
          />

          <DelegateProtocolDialog
            open={showDelegateDialog}
            onOpenChange={setShowDelegateDialog}
            protocolId={activeProtocolId}
            onSuccess={closeDialogsAndRefresh}
          />

          <ForwardProtocolDialog
            open={showForwardDialog}
            onOpenChange={setShowForwardDialog}
            protocolId={activeProtocolId}
            onSuccess={closeDialogsAndRefresh}
          />

          <AssignTeamDialog
            open={showAssignTeamDialog}
            onOpenChange={setShowAssignTeamDialog}
            protocolId={activeProtocolId}
            onSuccess={closeDialogsAndRefresh}
          />
        </>
      )}
    </div>
  )
}

// useSearchParams exige Suspense no App Router (pré-renderização)
export default function ProtocolsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProtocolsQueue />
    </Suspense>
  )
}
