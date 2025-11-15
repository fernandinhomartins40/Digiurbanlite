'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  GitBranch,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Zap,
  AlertCircle
} from 'lucide-react'
import { WorkflowFormModal } from '@/components/admin/workflows/WorkflowFormModal'
import { useToast } from '@/hooks/use-toast'

interface ModuleWorkflow {
  id: string
  moduleType: string
  name: string
  description: string | null
  defaultSLA: number | null
  stages: any[]
  createdAt: string
  updatedAt: string
}

export default function WorkflowsPage() {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<ModuleWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<ModuleWorkflow | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadWorkflows()
    loadStats()
  }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/workflows')
      if (response.success) {
        setWorkflows(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar workflows:', error)
      toast({
        title: 'Erro ao carregar workflows',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiRequest('/workflows/stats')
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateDefaults = async () => {
    try {
      const response = await apiRequest('/workflows/seed-defaults', {
        method: 'POST'
      })

      if (response.success) {
        toast({
          title: 'Workflows padrão criados',
          description: response.message || 'Workflows criados com sucesso',
        })
        loadWorkflows()
        loadStats()
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar workflows padrão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (moduleType: string) => {
    if (!confirm(`Tem certeza que deseja deletar o workflow "${moduleType}"?`)) {
      return
    }

    try {
      const response = await apiRequest(`/workflows/${moduleType}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast({
          title: 'Workflow deletado',
          description: 'Workflow removido com sucesso'
        })
        loadWorkflows()
        loadStats()
      }
    } catch (error) {
      toast({
        title: 'Erro ao deletar workflow',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (workflow: ModuleWorkflow) => {
    setEditingWorkflow(workflow)
    setShowCreateModal(true)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingWorkflow(null)
  }

  const handleSaveSuccess = () => {
    handleModalClose()
    loadWorkflows()
    loadStats()
  }

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.moduleType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Workflows de Módulos</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie os fluxos de trabalho com etapas, aprovações e SLAs
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkflows || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Protocolos com Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.protocolsWithWorkflow || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Etapas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStages || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                SLA Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageSLA || 0} dias</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateDefaults}
            disabled={loading}
          >
            <Zap className="h-4 w-4 mr-2" />
            Criar Workflows Padrão
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando workflows...</p>
          </div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum workflow encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente buscar por outro termo'
                  : 'Comece criando workflows padrão ou crie um novo workflow personalizado'
                }
              </p>
              {!searchTerm && (
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleCreateDefaults}>
                    <Zap className="h-4 w-4 mr-2" />
                    Criar Workflows Padrão
                  </Button>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Workflow
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{workflow.name}</CardTitle>
                      <Badge variant="secondary">{workflow.moduleType}</Badge>
                    </div>
                    <CardDescription>
                      {workflow.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workflow.moduleType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Etapas:</span>{' '}
                    <span className="font-medium">{workflow.stages.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SLA Padrão:</span>{' '}
                    <span className="font-medium">
                      {workflow.defaultSLA ? `${workflow.defaultSLA} dias` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última atualização:</span>{' '}
                    <span className="font-medium">
                      {new Date(workflow.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <WorkflowFormModal
          workflow={editingWorkflow}
          onClose={handleModalClose}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  )
}
