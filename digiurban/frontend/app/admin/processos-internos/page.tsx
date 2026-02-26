'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  flowClient,
  InternalProcess,
  ProcessType,
  DashboardData,
  ProcessDetail,
  CreateProcessInput,
} from '@/lib/flow-client'
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Send,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Archive,
  BarChart3,
  Inbox,
  FileDown,
  Eye,
  Building2,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react'

// ============================================================================
// STATUS BADGES
// ============================================================================

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'outline', icon: FileText },
  ABERTO: { label: 'Aberto', variant: 'default', icon: Clock },
  EM_TRAMITACAO: { label: 'Em Tramitação', variant: 'secondary', icon: Send },
  PENDENTE: { label: 'Pendente', variant: 'outline', icon: AlertTriangle },
  CONCLUIDO: { label: 'Concluído', variant: 'default', icon: CheckCircle },
  ARQUIVADO: { label: 'Arquivado', variant: 'outline', icon: Archive },
  CANCELADO: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  0: { label: 'Normal', color: 'text-gray-500' },
  1: { label: 'Urgente', color: 'text-orange-500' },
  2: { label: 'Urgentíssimo', color: 'text-red-600 font-bold' },
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: Clock }
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProcessosInternosPage() {
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [processes, setProcesses] = useState<InternalProcess[]>([])
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetail | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  // ─── Criar Processo ───
  const [newProcess, setNewProcess] = useState<Partial<CreateProcessInput>>({
    priority: 0,
    sigilo: 'PUBLICO',
  })

  // ============================================================================
  // LOADERS
  // ============================================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const data = await flowClient.getDashboard()
      setDashboard(data)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true)
      const result = await flowClient.listProcesses({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        orderBy: 'createdAt',
        orderDir: 'desc',
      })
      setProcesses(result.data)
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar processos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, toast])

  const loadProcessTypes = useCallback(async () => {
    try {
      const types = await flowClient.listProcessTypes()
      setProcessTypes(types)
    } catch {
      // Silencioso — tipos podem não estar disponíveis
    }
  }, [])

  const loadProcessDetail = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const detail = await flowClient.getProcess(id)
      setSelectedProcess(detail)
      setShowDetailPanel(true)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar detalhes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadProcessTypes()
  }, [loadProcessTypes])

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard()
    if (activeTab === 'processos') loadProcesses()
  }, [activeTab, loadDashboard, loadProcesses])

  // ============================================================================
  // AÇÕES
  // ============================================================================

  async function handleCreateProcess() {
    if (!newProcess.typeId || !newProcess.subject || !newProcess.originSectorId) {
      toast({ title: 'Atenção', description: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      await flowClient.createProcess(newProcess as CreateProcessInput)
      toast({ title: 'Sucesso', description: 'Processo criado com sucesso' })
      setShowCreateDialog(false)
      setNewProcess({ priority: 0, sigilo: 'PUBLICO' })
      loadProcesses()
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleConclude(id: string) {
    try {
      await flowClient.concludeProcess(id, 'Concluído via painel administrativo')
      toast({ title: 'Sucesso', description: 'Processo concluído' })
      loadProcesses()
      setShowDetailPanel(false)
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' })
    }
  }

  async function handleGenerateDocument(processId: string, templateName: string) {
    try {
      setLoading(true)
      await flowClient.generateDocument(processId, templateName)
      toast({ title: 'Sucesso', description: 'Documento gerado com sucesso' })
      if (selectedProcess?.id === processId) {
        loadProcessDetail(processId)
      }
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Processos Internos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de tramitação administrativa interna
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Processo Interno</DialogTitle>
              <DialogDescription>
                Preencha os dados para abrir um novo processo administrativo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Tipo de Processo *</Label>
                <Select
                  value={newProcess.typeId || ''}
                  onValueChange={(v) => setNewProcess({ ...newProcess, typeId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {processTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.prefix} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assunto *</Label>
                <Input
                  placeholder="Descreva o assunto do processo"
                  value={newProcess.subject || ''}
                  onChange={(e) => setNewProcess({ ...newProcess, subject: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Detalhes adicionais (opcional)"
                  value={newProcess.description || ''}
                  onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={String(newProcess.priority || 0)}
                    onValueChange={(v) => setNewProcess({ ...newProcess, priority: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Urgente</SelectItem>
                      <SelectItem value="2">Urgentíssimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sigilo</Label>
                  <Select
                    value={newProcess.sigilo || 'PUBLICO'}
                    onValueChange={(v) => setNewProcess({ ...newProcess, sigilo: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLICO">Público</SelectItem>
                      <SelectItem value="RESTRITO">Restrito</SelectItem>
                      <SelectItem value="CONFIDENCIAL">Confidencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Setor de Origem *</Label>
                <Input
                  placeholder="ID do setor"
                  value={newProcess.originSectorId || ''}
                  onChange={(e) => setNewProcess({
                    ...newProcess,
                    originSectorId: e.target.value,
                    originSectorName: e.target.value,
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProcess} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Processo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="processos" className="gap-2">
            <FileText className="w-4 h-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="w-4 h-4" />
            Caixa de Entrada
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: Dashboard ─── */}
        <TabsContent value="dashboard">
          {loading && !dashboard ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboard ? (
            <div className="space-y-6">
              {/* KPIs principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{dashboard.resumo.ativos}</div>
                    <p className="text-sm text-muted-foreground">Processos Ativos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{dashboard.resumo.concluidos}</div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-500">{dashboard.resumo.urgentes}</div>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{dashboard.resumo.vencidos}</div>
                    <p className="text-sm text-muted-foreground">Vencidos (SLA)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{dashboard.ultimos30Dias.criados}</div>
                    <p className="text-sm text-muted-foreground">Criados (30d)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhamento */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Por Tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Por Tipo de Processo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.porTipo.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum processo ativo</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.porTipo.map((t) => (
                          <div key={t.tipoId} className="flex items-center justify-between">
                            <span className="text-sm">{t.tipoNome}</span>
                            <Badge variant="secondary">{t.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por Setor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Por Setor (ativos)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.porSetor.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum processo ativo</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.porSetor.map((s) => (
                          <div key={s.setorId} className="flex items-center justify-between">
                            <span className="text-sm">{s.setorNome}</span>
                            <Badge variant="secondary">{s.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">{dashboard.resumo.abertos}</div>
                      <p className="text-xs text-muted-foreground">Abertos</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">{dashboard.resumo.emTramitacao}</div>
                      <p className="text-xs text-muted-foreground">Em Tramitação</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-500">{dashboard.resumo.pendentes}</div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{dashboard.resumo.concluidos}</div>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-500">{dashboard.resumo.cancelados}</div>
                      <p className="text-xs text-muted-foreground">Cancelados</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-500">{dashboard.resumo.arquivados}</div>
                      <p className="text-xs text-muted-foreground">Arquivados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* ─── TAB: Processos ─── */}
        <TabsContent value="processos">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por número, assunto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProcesses()}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ABERTO">Abertos</SelectItem>
                <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
                <SelectItem value="CANCELADO">Cancelados</SelectItem>
                <SelectItem value="ARQUIVADO">Arquivados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadProcesses} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Lista de Processos */}
          {loading && processes.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : processes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum processo encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Processo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {processes.map((proc) => (
                <Card
                  key={proc.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => loadProcessDetail(proc.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-blue-600">
                            {proc.number}
                          </span>
                          <StatusBadge status={proc.status} />
                          {proc.priority > 0 && (
                            <span className={`text-xs font-medium ${priorityConfig[proc.priority]?.color}`}>
                              {priorityConfig[proc.priority]?.label}
                            </span>
                          )}
                        </div>
                        <p className="font-medium truncate">{proc.subject}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {proc.currentSectorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {proc.currentUserName || 'Sem responsável'}
                          </span>
                          <span>{proc.type?.name}</span>
                          <span>{new Date(proc.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {proc._count && (
                          <Badge variant="outline" className="text-xs">
                            {proc._count.dispatches} tram.
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB: Inbox ─── */}
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Caixa de Entrada
              </CardTitle>
              <CardDescription>
                Processos pendentes no seu setor. Selecione o setor para ver os processos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Selecione um setor no filtro acima para ver os processos pendentes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Painel de Detalhes (Slide Over) ─── */}
      {showDetailPanel && selectedProcess && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowDetailPanel(false)}>
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header do painel */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowDetailPanel(false)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-bold font-mono text-blue-600">
                      {selectedProcess.number}
                    </h2>
                    <StatusBadge status={selectedProcess.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 ml-10">
                    {selectedProcess.type?.name}
                  </p>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assunto</span>
                      <p className="font-medium">{selectedProcess.subject}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setor Atual</span>
                      <p className="font-medium">{selectedProcess.currentSectorName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Responsável</span>
                      <p className="font-medium">{selectedProcess.currentUserName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado por</span>
                      <p className="font-medium">{selectedProcess.createdByName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data Abertura</span>
                      <p>{new Date(selectedProcess.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prazo</span>
                      <p>{selectedProcess.dueAt ? new Date(selectedProcess.dueAt).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {selectedProcess.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedProcess.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Ações rápidas */}
                {!['CONCLUIDO', 'CANCELADO', 'ARQUIVADO'].includes(selectedProcess.status) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Ações</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleGenerateDocument(selectedProcess.id, 'despacho')}>
                        <FileDown className="w-4 h-4 mr-1" />
                        Gerar Despacho
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGenerateDocument(selectedProcess.id, 'memorando')}>
                        <FileDown className="w-4 h-4 mr-1" />
                        Gerar Memorando
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGenerateDocument(selectedProcess.id, 'capa-processo')}>
                        <FileDown className="w-4 h-4 mr-1" />
                        Gerar Capa
                      </Button>
                      <Separator orientation="vertical" className="h-8 mx-1" />
                      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleConclude(selectedProcess.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluir
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Histórico */}
                {selectedProcess.history.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Histórico de Tramitação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProcess.history.map((h) => (
                          <div key={h.id} className="flex gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <div>
                              <p className="font-medium">{h.description}</p>
                              {h.note && <p className="text-muted-foreground text-xs mt-1">{h.note}</p>}
                              <p className="text-xs text-muted-foreground">
                                {h.userName} — {new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Documentos */}
                {selectedProcess.documents.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Documentos ({selectedProcess.documents.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedProcess.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 rounded border text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-red-500" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.documentType} — {(doc.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                                <FileDown className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
