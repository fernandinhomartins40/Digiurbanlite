'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Sparkles,
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
  accessLevel: number
  isActive: boolean
  isPublic: boolean
  lastRun?: string
  createdAt: string
  _count?: { executions: number }
}

interface ReportExecution {
  id: string
  reportId: string
  filters?: any
  parameters?: any
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  errorMessage?: string
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
  protocolsList: Array<any>
}

// ====================== TEMPLATES PRÉ-CONFIGURADOS ======================

const REPORT_TEMPLATES = [
  {
    id: 'template-protocolos-geral',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50',
    name: 'Protocolos Gerais',
    description: 'Visão geral de todos os protocolos do sistema',
    type: 'OPERATIONAL' as const,
    category: 'analytics',
    config: {
      defaultFilters: {},
      fields: ['citizen', 'service', 'department'],
      limit: 1000
    }
  },
  {
    id: 'template-protocolos-andamento',
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-50',
    name: 'Protocolos em Andamento',
    description: 'Protocolos em progresso e pendências',
    type: 'OPERATIONAL' as const,
    category: 'tracking',
    config: {
      defaultFilters: { status: ['PROGRESSO', 'PENDENCIA'] },
      fields: ['citizen', 'service', 'department'],
      limit: 500
    }
  },
  {
    id: 'template-protocolos-concluidos',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    name: 'Protocolos Concluídos',
    description: 'Análise de protocolos finalizados',
    type: 'MANAGERIAL' as const,
    category: 'performance',
    config: {
      defaultFilters: { status: ['CONCLUIDO'] },
      fields: ['citizen', 'service', 'department', 'stages'],
      limit: 1000
    }
  },
  {
    id: 'template-protocolos-vencidos',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    name: 'Protocolos Vencidos',
    description: 'Lista de protocolos que ultrapassaram o prazo',
    type: 'OPERATIONAL' as const,
    category: 'compliance',
    config: {
      defaultFilters: {},
      fields: ['citizen', 'service', 'department'],
      limit: 500
    }
  },
  {
    id: 'template-desempenho-departamentos',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50',
    name: 'Desempenho por Departamento',
    description: 'Análise comparativa entre departamentos',
    type: 'MANAGERIAL' as const,
    category: 'performance',
    config: {
      defaultFilters: {},
      fields: ['service', 'department', 'stages'],
      limit: 2000
    }
  },
  {
    id: 'template-executivo',
    icon: Sparkles,
    color: 'text-indigo-600 bg-indigo-50',
    name: 'Dashboard Executivo',
    description: 'Visão estratégica com KPIs principais',
    type: 'EXECUTIVE' as const,
    category: 'analytics',
    config: {
      defaultFilters: {},
      fields: ['service', 'department'],
      limit: 5000
    }
  },
]

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

// ====================== HELPERS ======================

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
  const [activeTab, setActiveTab] = useState<'templates' | 'meus-relatorios'>('templates')

  // Dialog states
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [executionResult, setExecutionResult] = useState<ReportData | null>(null)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)

  // Execute data
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

  // Edit data
  const [editData, setEditData] = useState<{
    name: string
    description: string
    isActive: boolean
  }>({
    name: '',
    description: '',
    isActive: true
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

  // ====================== CRIAR DO TEMPLATE ======================

  const createReportFromTemplate = async (template: typeof REPORT_TEMPLATES[0]) => {
    setIsCreatingFromTemplate(true)
    try {
      const response = await fetch(`${API_URL}/admin/relatorios`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          type: template.type,
          category: template.category,
          config: template.config,
          accessLevel: 0,
          isPublic: true
        })
      })

      if (!response.ok) throw new Error('Erro ao criar relatório')

      await fetchReports()
      setActiveTab('meus-relatorios')
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      alert('Erro ao criar relatório do template')
    } finally {
      setIsCreatingFromTemplate(false)
    }
  }

  // ====================== EDITAR ======================

  const updateReport = async () => {
    if (!selectedReport) return
    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${selectedReport.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          isActive: editData.isActive
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
        body: JSON.stringify({ format, parameters: {}, filters })
      })

      if (!response.ok) throw new Error('Erro ao executar relatório')

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

  const quickExecuteReport = async (report: Report, format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' = 'PDF') => {
    setIsExecuting(true)
    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${report.id}/execute`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ format, parameters: {}, filters: {} })
      })

      if (!response.ok) throw new Error('Erro ao executar relatório')

      if (format === 'PDF') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${report.name.replace(/\s+/g, '_')}.pdf`)
      } else if (format === 'EXCEL') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${report.name.replace(/\s+/g, '_')}.xlsx`)
      } else if (format === 'CSV') {
        const blob = await response.blob()
        downloadBlob(blob, `relatorio_${report.name.replace(/\s+/g, '_')}.csv`)
      } else {
        const data = await response.json()
        if (data.data?.reportData) {
          setExecutionResult(data.data.reportData as ReportData)
          setIsResultOpen(true)
        }
      }

      await fetchReports()
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

  // ====================== RESETS & HELPERS ======================

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
      isActive: report.isActive
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Crie relatórios a partir de templates prontos ou execute seus relatórios personalizados
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates">Templates Prontos</TabsTrigger>
          <TabsTrigger value="meus-relatorios">
            Meus Relatórios {reports.length > 0 && `(${reports.length})`}
          </TabsTrigger>
        </TabsList>

        {/* TAB: TEMPLATES */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map((template) => {
              const Icon = template.icon
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${template.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reportTypeLabels[template.type]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => createReportFromTemplate(template)}
                      disabled={isCreatingFromTemplate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Relatório
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB: MEUS RELATÓRIOS */}
        <TabsContent value="meus-relatorios" className="mt-6">
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
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhum relatório criado ainda</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Crie seu primeiro relatório a partir de um template
                </p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ver Templates Prontos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {report.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <Badge className={reportTypeColors[report.type]}>
                        {reportTypeLabels[report.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {report._count?.executions || 0} execuções
                      </div>
                      {report.lastRun && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.lastRun), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => quickExecuteReport(report, 'PDF')}
                        disabled={isExecuting}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => quickExecuteReport(report, 'EXCEL')}
                        disabled={isExecuting}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openExecuteDialog(report)}
                        disabled={isExecuting}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => openEditDialog(report)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====================== DIALOG: EXECUTAR AVANÇADO ====================== */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Executar: {selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Configure filtros avançados e formato de saída
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Formato de Saída</Label>
              <Select
                value={executeData.format}
                onValueChange={(value: any) => setExecuteData({ ...executeData, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">JSON (visualizar)</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase">Filtros Avançados</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={executeData.filterStatus}
                    onValueChange={(value) => setExecuteData({ ...executeData, filterStatus: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Todos" />
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

                <div className="grid gap-1.5">
                  <Label className="text-xs">Departamento ID</Label>
                  <Input
                    value={executeData.filterDepartmentId}
                    onChange={(e) => setExecuteData({ ...executeData, filterDepartmentId: e.target.value })}
                    placeholder="ID do departamento"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    value={executeData.filterStartDate}
                    onChange={(e) => setExecuteData({ ...executeData, filterStartDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    value={executeData.filterEndDate}
                    onChange={(e) => setExecuteData({ ...executeData, filterEndDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1"
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

            {/* Histórico */}
            {executions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Últimas Execuções</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between gap-2 p-2 border rounded text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className={statusColors[execution.status]} variant="secondary">
                          {statusLabels[execution.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(execution.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-xs">{execution.format}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeReport} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DIALOG: EDITAR ====================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Relatório</DialogTitle>
            <DialogDescription>Modifique as informações do relatório</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={editData.isActive}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">Relatório Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateReport}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DIALOG: RESULTADO JSON ====================== */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultado do Relatório</DialogTitle>
            <DialogDescription>Dados gerados pela execução</DialogDescription>
          </DialogHeader>

          {executionResult && (
            <div className="space-y-6 py-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{executionResult.totalProtocols}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Média</p>
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

              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(executionResult.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      const pct = executionResult.totalProtocols > 0 ? Math.round((count / executionResult.totalProtocols) * 100) : 0
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-xs w-24 text-right">{protocolStatusLabels[status] || status}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4">
                            <div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, 4)}%` }}>
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
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsResultOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
