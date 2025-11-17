'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
  FileText,
  Plus,
  Download,
  Play,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  executedBy: string
  createdAt: string
  completedAt?: string
}

const reportTypeLabels = {
  OPERATIONAL: 'Operacional',
  MANAGERIAL: 'Gerencial',
  EXECUTIVE: 'Executivo',
  CUSTOM: 'Personalizado'
}

const reportTypeColors = {
  OPERATIONAL: 'bg-blue-100 text-blue-800',
  MANAGERIAL: 'bg-green-100 text-green-800',
  EXECUTIVE: 'bg-purple-100 text-purple-800',
  CUSTOM: 'bg-orange-100 text-orange-800'
}

const statusLabels = {
  PROCESSING: 'Processando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado'
}

const statusColors = {
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function RelatoriosPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [executions, setExecutions] = useState<ReportExecution[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'OPERATIONAL' as const,
    category: '',
    config: '{}',
    accessLevel: 0,
    isPublic: false
  })

  const [executeData, setExecuteData] = useState({
    format: 'JSON' as const,
    parameters: '{}',
    filters: '{}'
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('${API_URL}/admin/relatorios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
          'X-Tenant-ID': 'demo',
          'Content-Type': 'application/json'
        },
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
  }

  const fetchExecutions = async (reportId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${reportId}/executions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
          'X-Tenant-ID': 'demo',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao buscar execuções')

      const data = await response.json()
      setExecutions(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
    }
  }

  const createReport = async () => {
    try {
      const response = await fetch('${API_URL}/admin/relatorios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
          'X-Tenant-ID': 'demo',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          config: JSON.parse(formData.config)
        })
      })

      if (!response.ok) throw new Error('Erro ao criar relatório')

      await fetchReports()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      alert('Erro ao criar relatório')
    }
  }

  const executeReport = async () => {
    if (!selectedReport) return

    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${selectedReport.id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
          'X-Tenant-ID': 'demo',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          format: executeData.format,
          parameters: JSON.parse(executeData.parameters),
          filters: JSON.parse(executeData.filters)
        })
      })

      if (!response.ok) throw new Error('Erro ao executar relatório')

      await fetchReports()
      await fetchExecutions(selectedReport.id)
      setIsExecuteDialogOpen(false)
      resetExecuteForm()
    } catch (error) {
      console.error('Erro ao executar relatório:', error)
      alert('Erro ao executar relatório')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este relatório?')) return

    try {
      const response = await fetch(`${API_URL}/admin/relatorios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digiurban_admin_token')}`,
          'X-Tenant-ID': 'demo',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao deletar relatório')

      await fetchReports()
    } catch (error) {
      console.error('Erro ao deletar relatório:', error)
      alert('Erro ao deletar relatório')
    }
  }

  const resetForm = () => {
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
      parameters: '{}',
      filters: '{}'
    })
  }

  const openExecuteDialog = (report: Report) => {
    setSelectedReport(report)
    fetchExecutions(report.id)
    setIsExecuteDialogOpen(true)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gerencie e execute relatórios do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo relatório
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do relatório"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do relatório"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: analytics, compliance"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="config">Configuração (JSON)</Label>
                <Textarea
                  id="config"
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder='{"filtros": [], "campos": []}'
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accessLevel">Nível de Acesso</Label>
                <Input
                  id="accessLevel"
                  type="number"
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createReport}>Criar Relatório</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            <CardTitle>Lista de Relatórios</CardTitle>
            <CardDescription>
              {reports.length} relatório(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge className={reportTypeColors[report.type]}>
                        {reportTypeLabels[report.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.category}</TableCell>
                    <TableCell>{report._count?.executions || 0}</TableCell>
                    <TableCell>
                      {report.lastRun ? (
                        <div className="flex items-center text-sm">
                          <Clock className="mr-1 h-3 w-3" />
                          {format(new Date(report.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca executado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.isActive ? "default" : "secondary"}>
                        {report.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openExecuteDialog(report)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog para executar relatório */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Executar Relatório: {selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Configure os parâmetros de execução e visualize o histórico
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <h3 className="font-semibold">Configuração de Execução</h3>
              <div className="grid gap-2">
                <Label htmlFor="format">Formato</Label>
                <Select
                  value={executeData.format}
                  onValueChange={(value: any) => setExecuteData({ ...executeData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EXCEL">Excel</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parameters">Parâmetros (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={executeData.parameters}
                  onChange={(e) => setExecuteData({ ...executeData, parameters: e.target.value })}
                  placeholder='{}'
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filters">Filtros (JSON)</Label>
                <Textarea
                  id="filters"
                  value={executeData.filters}
                  onChange={(e) => setExecuteData({ ...executeData, filters: e.target.value })}
                  placeholder='{}'
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4">
              <h3 className="font-semibold">Histórico de Execuções</h3>
              {executions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma execução encontrada</p>
              ) : (
                <div className="space-y-2">
                  {executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[execution.status]}>
                            {statusLabels[execution.status]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(execution.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">Formato: {execution.format}</p>
                      </div>
                      {execution.fileUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeReport}>
              <Play className="mr-2 h-4 w-4" />
              Executar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
