'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  GitBranch, Plus, Search, Trash2, Edit, Eye, Zap, AlertCircle,
  CheckCircle2, ChevronRight, FileText, Clock, BarChart3,
  RefreshCw, Filter, Layers
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpButton } from '@/components/common/HelpButton'
import { HelpModal } from '@/components/common/HelpModal'
import { workflowsHelpContent } from '@/src/content/help/workflows-help'

interface ServiceWorkflow {
  id: string
  serviceId: string
  name: string
  description: string | null
  defaultSLA: number | null
  stages: any[]
  supportAssignmentsCount?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  service: {
    id: string
    name: string
    moduleType: string | null
    serviceType: string
    department: { id: string; name: string }
  }
}

export default function WorkflowsPage() {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [workflows, setWorkflows] = useState<ServiceWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [creatingDefaults, setCreatingDefaults] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/service-workflows')
      if (response.success) setWorkflows(response.data || [])
    } catch (error) {
      toast({ title: 'Erro ao carregar workflows', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [apiRequest, toast])

  const loadStats = useCallback(async () => {
    try {
      const response = await apiRequest('/service-workflows/stats')
      if (response.success) setStats(response.data)
    } catch {}
  }, [apiRequest])

  useEffect(() => { loadWorkflows(); loadStats() }, [loadWorkflows, loadStats])

  const handleCreateDefaults = async () => {
    if (!confirm('Isso criará/atualizará workflows para todos os serviços. Continuar?')) return
    try {
      setCreatingDefaults(true)
      const response = await apiRequest('/service-workflows/seed-all', { method: 'POST' })
      if (response.success) {
        toast({ title: 'Workflows criados', description: response.message || 'Todos os workflows foram criados/atualizados' })
        loadWorkflows(); loadStats()
      }
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' })
    } finally { setCreatingDefaults(false) }
  }

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Deletar o workflow de "${serviceName}"?`)) return
    try {
      await apiRequest(`/service-workflows/service/${serviceId}`, { method: 'DELETE' })
      toast({ title: 'Workflow deletado' })
      loadWorkflows(); loadStats()
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Erro', variant: 'destructive' })
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('ATENÇÃO! Isso irá DELETAR TODOS OS WORKFLOWS. Esta ação NÃO PODE SER DESFEITA.')) return
    if (prompt('Digite "DELETAR TUDO" para confirmar:') !== 'DELETAR TUDO') return
    try {
      setDeletingAll(true)
      const response = await apiRequest('/service-workflows/delete-all', { method: 'DELETE' })
      if (response.success) {
        toast({ title: 'Todos os workflows foram deletados', description: `${response.data?.deletedCount || 0} workflow(s) removido(s)` })
        loadWorkflows(); loadStats()
      }
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Erro', variant: 'destructive' })
    } finally { setDeletingAll(false) }
  }

  const departments = Array.from(new Set(workflows.map(w => w.service.department.name))).sort()

  const filteredWorkflows = workflows.filter(w => {
    const s = searchTerm.toLowerCase()
    const matchesSearch = !s ||
      w.name.toLowerCase().includes(s) ||
      w.service.name.toLowerCase().includes(s) ||
      w.service.department.name.toLowerCase().includes(s) ||
      (w.service.moduleType || '').toLowerCase().includes(s)
    const matchesDept = departmentFilter === 'all' || w.service.department.name === departmentFilter
    return matchesSearch && matchesDept
  })

  const hasDocumentTabs = (stages: any[]) =>
    stages.some(s => s.availableTabs?.some((t: string) => ['generated', 'document-generation', 'documentos-gerados'].includes(t)))

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Workflows de Serviços</h1>
          </div>
          <HelpButton onClick={() => setShowHelp(true)} position="inline" label="Como usar?" size="md" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie fluxos de trabalho com etapas, documentos, aprovações e SLAs</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Total Workflows</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalWorkflows}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Protocolos Ativos</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.protocolsWithWorkflow}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Etapas Ativas</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.activeStages}</div></CardContent>
          </Card>
          <Card className={stats.servicesWithoutWorkflow > 0 ? 'border-orange-500/50' : 'border-green-500/50'}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />Sem Workflow</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${stats.servicesWithoutWorkflow > 0 ? 'text-orange-600' : 'text-green-600'}`}>{stats.servicesWithoutWorkflow}</span>
                {stats.servicesWithoutWorkflow === 0 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" />Apoios</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.stageSupportAssignments || 0}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por serviço, workflow, módulo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[220px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCreateDefaults} disabled={loading || creatingDefaults || deletingAll}>
            {creatingDefaults ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Criando...</> : <><Zap className="h-4 w-4 mr-2" />Criar/Atualizar Todos</>}
          </Button>
          <Button variant="destructive" onClick={handleDeleteAll} disabled={loading || creatingDefaults || deletingAll || workflows.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />Deletar Todos
          </Button>
          <Button onClick={() => router.push('/admin/workflows/new')}>
            <Plus className="h-4 w-4 mr-2" />Novo Workflow
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center"><RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Carregando...</p></div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum workflow encontrado</h3>
          <p className="text-muted-foreground mb-4">{searchTerm || departmentFilter !== 'all' ? 'Limpe os filtros' : 'Comece criando workflows'}</p>
          {!searchTerm && departmentFilter === 'all' && (
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCreateDefaults}><Zap className="h-4 w-4 mr-2" />Criar Padrão</Button>
              <Button onClick={() => router.push('/admin/workflows/new')}><Plus className="h-4 w-4 mr-2" />Novo</Button>
            </div>
          )}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{filteredWorkflows.length} de {workflows.length} workflows</p>
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className={`hover:shadow-md transition-all cursor-pointer group ${!workflow.isActive ? 'opacity-60' : ''}`} onClick={() => router.push(`/admin/workflows/${workflow.id}/view`)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold truncate">{workflow.name}</h3>
                      {!workflow.isActive && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="secondary" className="text-xs">{workflow.service.name}</Badge>
                      <Badge variant="outline" className="text-xs">{workflow.service.department.name}</Badge>
                      {workflow.service.moduleType && <Badge variant="outline" className="text-xs font-mono">{workflow.service.moduleType}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{workflow.stages.length} etapas</span>
                      {workflow.defaultSLA && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />SLA {workflow.defaultSLA}d</span>}
                      {hasDocumentTabs(workflow.stages) && <span className="flex items-center gap-1 text-blue-600"><FileText className="h-3 w-3" />Geração de docs</span>}
                      {(workflow.supportAssignmentsCount || 0) > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600"><GitBranch className="h-3 w-3" />{workflow.supportAssignmentsCount} apoios</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/admin/workflows/${workflow.id}/view`) }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/admin/workflows/${workflow.id}/edit`) }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(workflow.serviceId, workflow.service.name) }}><Trash2 className="h-4 w-4" /></Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} content={workflowsHelpContent} />
      <HelpButton onClick={() => setShowHelp(true)} position="fixed" label="Ajuda" />
    </div>
  )
}
