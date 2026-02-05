'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Download,
  Play,
  Trash2,
  Clock,
  AlertCircle,
  BarChart3,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ====================== INTERFACES ======================

interface Report {
  id: string
  name: string
  description?: string
  type: 'OPERATIONAL' | 'MANAGERIAL' | 'EXECUTIVE' | 'CUSTOM'
  category: string
  config: any
  template?: string
  schedule?: any
  accessLevel: number
  departments?: string[]
  isActive: boolean
  isPublic: boolean
  createdBy: string
  lastRun?: string
  createdAt: string
  updatedAt: string
  _count?: {
    executions: number
  }
}

interface ReportExecution {
  id: string
  reportId: string
  parameters?: any
  filters?: any
  data?: any
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  fileUrl?: string
  fileSize?: number
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  errorMessage?: string
  executedBy?: string
  createdAt: string
  completedAt?: string
}

interface ReportData {
  totalProtocols: number
  completedCount: number
  overdueCount: number
  avgCompletionDays?: number
  appliedFilters: Record<string, unknown>
  byStatus: Record<string, number>
  byDepartment: Record<string, number>
  byService: Record<string, number>
  byPriority: Record<string, number>
  protocolsList: Array<{
    numero: string
    titulo: string
    status: string
    prioridade: string
    departamento: string
    servico: string
    cidadao: string
    criado: string
    conclusao: string
    vencimento: string
  }>
}

// ====================== LABELS & COLORS ======================

const reportTypeLabels: Record<string, string> = {
  OPERATIONAL: 'Operacional',
  MANAGERIAL: 'Gerencial',
  EXECUTIVE: 'Executivo',
  CUSTOM: 'Personalizado'
}

const reportTypeColors: Record<string, string> = {
  OPERATIONAL: 'bg-blue-100 text-blue-800',
  MANAGERIAL: 'bg-green-100 text-green-800',
  EXECUTIVE: 'bg-purple-100 text-purple-800',
  CUSTOM: 'bg-orange-100 text-orange-800'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  GENERATING: 'Gerando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado'
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600'
}

const protocolStatusLabels: Record<string, string> = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em Progresso',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  PENDENCIA: 'Pendência',
  CANCELADO: 'Cancelado'
}

// ====================== HELPER: BAIXAR BLOB ======================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ====================== HELPER: HEADERS AUTENTICADOS ======================

function authHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
    'X-Tenant-ID': 'demo',
    'Content-Type': 'application/json'
  }
}

// ====================== COMPONENTE PRINCIPAL ======================

export default function RelatoriosPage() {
  const { user } = useAdminAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [executions, setExecutions] = useState<ReportExecution[]>([])

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Resultado JSON após execução
  const [executionResult, setExecutionResult] = useState<ReportData | null>(null)
  const [isResultOpen, setIsResultOpen] = useState(false)

  // Loading de execução
  const [isExecuting, setIsExecuting] = useState(false)

  // Filtros da UI de execução (estruturados, não JSON livre)
  const [executeData, setExecuteData] = useState<{
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
    filterStatus: string
    filterDepartmentId: string
    filterServiceId: string
    filterStartDate: string
    filterEndDate: string
  }>({
    format: 'JSON',
    filterStatus: '',
    filterDepartmentId: '',
    filterServiceId: '',
    filterStartDate: '',
    filterEndDate: ''
  })

  // Form criação
  const [formData, setFormData] = useState<{
    name: string
    description: string
    type: 'OPERATIONAL' | 'MANAGERIAL' | 'EXECUTIVE' | 'CUSTOM'
    category: string
    config: string
    accessLevel: number
    isPublic: boolean
  }>({
    name: '',
    description: '',
    type: 'OPERATIONAL',
    category: '',
    config: '{}',
    accessLevel: 0,
    isPublic: false
  })

  // Form edição (espelha formData mas pre-populated)
  const [editData, setEditData] = useState<{
    name: string
    description: string
    type: 'OPERATIONAL' | 'MANAGERIAL' | 'EXECUTIVE' | 'CUSTOM'
    category: string
    config: string
    accessLevel: number
    isActive: boolean
    isPublic: boolean
  }>({
    name: '',
    description: '',
    type: 'OPERATIONAL',
    category: '',
    config: '{}',
    accessLevel: 0,
    isActive: true,
    isPublic: false
  })

  // ====================== FETCH ======================

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/admin/relatorios`, {
        headers: authHeaders(),
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao buscar relatórios')

      const data = await response.json()
      setReports(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExecutions = async (reportId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${reportId}/executions`, {
        headers: authHeaders(),
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao buscar execuções')

      const data = await response.json()
      setExecutions(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // ====================== CRIAR ======================

  const createReport = async () => {
    try {
      let parsedConfig = {}
      try { parsedConfig = JSON.parse(formData.config) } catch { /* mantém vazio */ }

      const response = await fetch(`${API_URL}/admin/relatorios`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          config: parsedConfig
        })
      })

      if (!response.ok) throw new Error('Erro ao criar relatório')

      await fetchReports()
      setIsCreateDialogOpen(false)
      resetCreateForm()
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      alert('Erro ao criar relatório')
    }
  }

  // ====================== EDITAR ======================

  const updateReport = async () => {
    if (!selectedReport) return
    try {
      let parsedConfig = {}
      try { parsedConfig = JSON.parse(editData.config) } catch { /* mantém vazio */ }

      const response = await fetch(`${API_URL}/admin/relatorios/${selectedReport.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          type: editData.type,
          category: editData.category,
          config: parsedConfig,
          accessLevel: editData.accessLevel,
          isActive: editData.isActive,
          isPublic: editData.isPublic
        })
      })

      if (!response.ok) throw new Error('Erro ao atualizar relatório')

      await fetchReports()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error)
      alert('Erro ao atualizar relatório')
    }
  }

  // ====================== EXECUTAR ======================

  const buildFiltersPayload = (): Record<string, unknown> => {
    const filters: Record<string, unknown> = {}
    if (executeData.filterStatus) filters.status = executeData.filterStatus
    if (executeData.filterDepartmentId) filters.departmentId = executeData.filterDepartmentId
    if (executeData.filterServiceId) filters.serviceId = executeData.filterServiceId
    if (executeData.filterStartDate) filters.startDate = executeData.filterStartDate
    if (executeData.filterEndDate) filters.endDate = executeData.filterEndDate
    return filters
  }

  const executeReport = async () => {
    if (!selectedReport) return
    setIsExecuting(true)

    try {
      const filters = buildFiltersPayload()
      const format = executeData.format

      const response = await fetch(`${API_URL}/admin/relatorios/${selectedReport.id}/execute`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          format,
          parameters: {},
          filters
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'Erro ao executar relatório')
      }

      if (format === 'PDF') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.pdf`)
      } else if (format === 'EXCEL') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.xlsx`)
      } else if (format === 'CSV') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.csv`)
      } else {
        // JSON — exibir resultado na UI
        const data = await response.json()
        if (data.data?.reportData) {
          setExecutionResult(data.data.reportData as ReportData)
          setIsResultOpen(true)
        }
      }

      // Atualizar lista e histórico
      await fetchReports()
      await fetchExecutions(selectedReport.id)
      resetExecuteForm()
    } catch (error) {
      console.error('Erro ao executar relatório:', error)
      alert('Erro ao executar relatório')
    } finally {
      setIsExecuting(false)
    }
  }

  // ====================== DELETAR ======================

  const deleteReport = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este relatório?')) return

    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao deletar relatório')

      await fetchReports()
    } catch (error) {
      console.error('Erro ao deletar relatório:', error)
      alert('Erro ao deletar relatório')
    }
  }

  // ====================== RE-EXECUTAR (baixar novamente formato anterior) ======================

  const reExecuteFromHistory = async (execution: ReportExecution) => {
    if (!selectedReport) return
    setIsExecuting(true)

    try {
      const filters = (execution.filters as Record<string, unknown>) || {}
      const format = execution.format

      const response = await fetch(`${API_URL}/admin/relatorios/${selectedReport.id}/execute`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          format,
          parameters: execution.parameters || {},
          filters
        })
      })

      if (!response.ok) throw new Error('Erro ao re-executar relatório')

      if (format === 'PDF') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.pdf`)
      } else if (format === 'EXCEL') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.xlsx`)
      } else if (format === 'CSV') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${selectedReport.name.replace(/\s+/g, '_')}.csv`)
      } else {
        const data = await response.json()
        if (data.data?.reportData) {
          setExecutionResult(data.data.reportData as ReportData)
          setIsResultOpen(true)
        }
      }

      await fetchExecutions(selectedReport.id)
    } catch (error) {
      console.error('Erro ao re-executar relatório:', error)
      alert('Erro ao re-executar relatório')
    } finally {
      setIsExecuting(false)
    }
  }

  // ====================== RESETS ======================

  const resetCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'OPERATIONAL',
      category: '',
      config: '{}',
      accessLevel: 0,
      isPublic: false
    })
  }

  const resetExecuteForm = () => {
    setExecuteData({
      format: 'JSON',
      filterStatus: '',
      filterDepartmentId: '',
      filterServiceId: '',
      filterStartDate: '',
      filterEndDate: ''
    })
  }

  // ====================== OPEN DIALOGS ======================

  const openExecuteDialog = (report: Report) => {
    setSelectedReport(report)
    fetchExecutions(report.id)
    setIsExecuteDialogOpen(true)
  }

  const openEditDialog = (report: Report) => {
    setSelectedReport(report)
    setEditData({
      name: report.name,
      description: report.description || '',
      type: report.type,
      category: report.category,
      config: JSON.stringify(report.config, null, 2),
      accessLevel: report.accessLevel,
      isActive: report.isActive,
      isPublic: report.isPublic
    })
    setIsEditDialogOpen(true)
  }

  // ====================== RENDER: não autenticado ======================

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Não autenticado</h3>
          <p className="mt-1 text-sm text-gray-500">Faça login para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // ====================== RENDER PRINCIPAL ======================

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie e execute relatórios do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Relatório</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Criar Novo Relatório</DialogTitle>
              <DialogDescription className="text-sm">
                Preencha os dados para criar um novo relatório
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name" className="text-sm">Nome</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do relatório"
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-description" className="text-sm">Descrição</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do relatório"
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-type" className="text-sm">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Operacional</SelectItem>
                      <SelectItem value="MANAGERIAL">Gerencial</SelectItem>
                      <SelectItem value="EXECUTIVE">Executivo</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-category" className="text-sm">Categoria</Label>
                  <Input
                    id="create-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: analytics, compliance"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-config" className="text-sm">Configuração (JSON)</Label>
                <Textarea
                  id="create-config"
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder={'{\n  "defaultFilters": { "status": ["PROGRESSO"] },\n  "fields": ["citizen", "service", "department"],\n  "limit": 500\n}'}
                  className="font-mono text-xs sm:text-sm"
                  rows={5}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-accessLevel" className="text-sm">Nível de Acesso</Label>
                <Input
                  id="create-accessLevel"
                  type="number"
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={createReport} className="w-full sm:w-auto">Criar Relatório</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de relatórios */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum relatório encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie um novo relatório para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Lista de Relatórios</CardTitle>
            <CardDescription className="text-sm">
              {reports.length} relatório(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Execuções</TableHead>
                    <TableHead className="hidden xl:table-cell">Última Execução</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{report.name}</span>
                          {report.description && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">{report.description}</span>
                          )}
                          <div className="flex flex-wrap gap-1 sm:hidden">
                            <Badge className={`${reportTypeColors[report.type]} text-xs`}>
                              {reportTypeLabels[report.type]}
                            </Badge>
                            <Badge variant={report.isActive ? "default" : "secondary"} className="text-xs">
                              {report.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={reportTypeColors[report.type]}>
                          {reportTypeLabels[report.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{report.category}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{report._count?.executions || 0}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {report.lastRun ? (
                          <div className="flex items-center text-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(report.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nunca executado</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={report.isActive ? "default" : "secondary"}>
                          {report.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openExecuteDialog(report)}
                            className="h-8 w-8 p-0"
                            title="Executar relatório"
                          >
                            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(report)}
                            className="h-8 w-8 p-0"
                            title="Editar relatório"
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteReport(report.id)}
                            className="h-8 w-8 p-0"
                            title="Deletar relatório"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====================== DIALOG: EXECUTAR ====================== */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Executar Relatório: {selectedReport?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Configure os filtros de execução, selecione o formato e execute
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-6 py-4">
            {/* Configuração de Execução */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-base md:text-lg">Configuração de Execução</h3>

              {/* Formato */}
              <div className="grid gap-2">
                <Label className="text-sm">Formato de Saída</Label>
                <Select
                  value={executeData.format}
                  onValueChange={(value) => setExecuteData({ ...executeData, format: value as any })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">JSON (visualizar na tela)</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros estruturados */}
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtros</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Select
                      value={executeData.filterStatus}
                      onValueChange={(value) => setExecuteData({ ...executeData, filterStatus: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="VINCULADO">Vinculado</SelectItem>
                        <SelectItem value="PROGRESSO">Em Progresso</SelectItem>
                        <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="PENDENCIA">Pendência</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Departamento ID</Label>
                    <Input
                      value={executeData.filterDepartmentId}
                      onChange={(e) => setExecuteData({ ...executeData, filterDepartmentId: e.target.value })}
                      placeholder="ID do departamento"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Serviço ID</Label>
                    <Input
                      value={executeData.filterServiceId}
                      onChange={(e) => setExecuteData({ ...executeData, filterServiceId: e.target.value })}
                      placeholder="ID do serviço"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-1">
                    {/* spacer */}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Data Inicial</Label>
                    <Input
                      type="date"
                      value={executeData.filterStartDate}
                      onChange={(e) => setExecuteData({ ...executeData, filterStartDate: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-gray-500">Data Final</Label>
                    <Input
                      type="date"
                      value={executeData.filterEndDate}
                      onChange={(e) => setExecuteData({ ...executeData, filterEndDate: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 h-auto py-0.5"
                  onClick={() => setExecuteData(prev => ({
                    ...prev,
                    filterStatus: '',
                    filterDepartmentId: '',
                    filterServiceId: '',
                    filterStartDate: '',
                    filterEndDate: ''
                  }))}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>

            {/* Histórico de Execuções */}
            <div className="grid gap-3">
              <h3 className="font-semibold text-base md:text-lg">Histórico de Execuções</h3>
              {executions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma execução encontrada</p>
              ) : (
                <div className="space-y-2">
                  {executions.slice(0, 8).map((execution) => (
                    <div key={execution.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={statusColors[execution.status]}>
                            {statusLabels[execution.status]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {execution.format}
                          </Badge>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(execution.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {execution.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{execution.errorMessage}</p>
                        )}
                      </div>
                      {execution.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => reExecuteFromHistory(execution)}
                          disabled={isExecuting}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <Download className="h-3 w-3 mr-1" />
                          <span className="text-xs">Baixar novamente</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={executeReport} disabled={isExecuting} className="w-full sm:w-auto">
              {isExecuting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Relatório
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DIALOG: EDITAR ====================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Editar Relatório</DialogTitle>
            <DialogDescription className="text-sm">
              Modifique os dados do relatório
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm">Nome</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Nome do relatório"
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-sm">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Descrição do relatório"
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type" className="text-sm">Tipo</Label>
                <Select
                  value={editData.type}
                  onValueChange={(value) => setEditData({ ...editData, type: value as any })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operacional</SelectItem>
                    <SelectItem value="MANAGERIAL">Gerencial</SelectItem>
                    <SelectItem value="EXECUTIVE">Executivo</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category" className="text-sm">Categoria</Label>
                <Input
                  id="edit-category"
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  placeholder="Ex: analytics, compliance"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-config" className="text-sm">Configuração (JSON)</Label>
              <Textarea
                id="edit-config"
                value={editData.config}
                onChange={(e) => setEditData({ ...editData, config: e.target.value })}
                placeholder={'{\n  "defaultFilters": {},\n  "fields": [],\n  "limit": 1000\n}'}
                className="font-mono text-xs sm:text-sm"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-accessLevel" className="text-sm">Nível de Acesso</Label>
                <Input
                  id="edit-accessLevel"
                  type="number"
                  value={editData.accessLevel}
                  onChange={(e) => setEditData({ ...editData, accessLevel: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-isActive" className="text-sm">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isPublic"
                  checked={editData.isPublic}
                  onChange={(e) => setEditData({ ...editData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-isPublic" className="text-sm">Público</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={updateReport} className="w-full sm:w-auto">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== PAINEL DE RESULTADO JSON ====================== */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Resultado do Relatório</DialogTitle>
            <DialogDescription className="text-sm">
              Dados gerados pela última execução
            </DialogDescription>
          </DialogHeader>

          {executionResult && (
            <div className="space-y-6 py-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{executionResult.totalProtocols}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Protocolos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{executionResult.completedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Concluídos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {executionResult.avgCompletionDays !== undefined ? `${executionResult.avgCompletionDays}d` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Média Conclusão</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${executionResult.overdueCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {executionResult.overdueCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Vencidos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição por Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(executionResult.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      const pct = executionResult.totalProtocols > 0 ? Math.round((count / executionResult.totalProtocols) * 100) : 0
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-xs w-24 text-right flex-shrink-0">{protocolStatusLabels[status] || status}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            >
                              <span className="text-xs text-white font-semibold" style={{ display: pct >= 10 ? 'block' : 'none' }}>{pct}%</span>
                            </div>
                          </div>
                          <span className="text-xs w-12 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Departamento */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Distribuição por Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(executionResult.byDepartment).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
                      const pct = executionResult.totalProtocols > 0 ? Math.round((count / executionResult.totalProtocols) * 100) : 0
                      return (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-xs w-36 text-right flex-shrink-0 truncate">{dept}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            >
                              <span className="text-xs text-white font-semibold" style={{ display: pct >= 10 ? 'block' : 'none' }}>{pct}%</span>
                            </div>
                          </div>
                          <span className="text-xs w-12 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Serviços */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Top 10 Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(executionResult.byService).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([svc, count]) => {
                      const pct = executionResult.totalProtocols > 0 ? Math.round((count / executionResult.totalProtocols) * 100) : 0
                      return (
                        <div key={svc} className="flex items-center gap-3">
                          <span className="text-xs w-40 text-right flex-shrink-0 truncate">{svc}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            >
                              <span className="text-xs text-white font-semibold" style={{ display: pct >= 10 ? 'block' : 'none' }}>{pct}%</span>
                            </div>
                          </div>
                          <span className="text-xs w-12 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Protocolos */}
              {executionResult.protocolsList && executionResult.protocolsList.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Lista de Protocolos ({executionResult.protocolsList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Número</TableHead>
                            <TableHead className="text-xs">Título</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Prioridade</TableHead>
                            <TableHead className="text-xs">Departamento</TableHead>
                            <TableHead className="text-xs">Serviço</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executionResult.protocolsList.slice(0, 50).map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono">{p.numero}</TableCell>
                              <TableCell className="text-xs">{p.titulo}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className="text-xs">{protocolStatusLabels[p.status] || p.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{p.prioridade}</TableCell>
                              <TableCell className="text-xs">{p.departamento}</TableCell>
                              <TableCell className="text-xs">{p.servico}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {executionResult.protocolsList.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Mostrando 50 de {executionResult.protocolsList.length}. Use CSV ou Excel para exportar todos.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
