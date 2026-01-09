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
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { WorkflowFormModal } from '@/components/admin/workflows/WorkflowFormModal'
import { useToast } from '@/hooks/use-toast'
import { HelpButton } from '@/components/common/HelpButton'
import { HelpModal } from '@/components/common/HelpModal'
import { workflowsHelpContent } from '@/src/content/help/workflows-help'

// ✅ ATUALIZADO: ServiceWorkflow (novo modelo)
interface ServiceWorkflow {
  id: string
  serviceId: string
  name: string
  description: string | null
  defaultSLA: number | null
  stages: any[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  service: {
    id: string
    name: string
    department: {
      name: string
    }
  }
}

export default function WorkflowsPage() {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<ServiceWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<ServiceWorkflow | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [creatingDefaults, setCreatingDefaults] = useState(false)

  useEffect(() => {
    loadWorkflows()
    loadStats()
  }, [])

  // ✅ ATUALIZADO: Usa /service-workflows
  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/service-workflows')
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

  // ✅ ATUALIZADO: Usa /service-workflows/stats
  const loadStats = async () => {
    try {
      const response = await apiRequest('/service-workflows/stats')
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // ✅ ATUALIZADO: Usa /service-workflows/seed-all
  const handleCreateDefaults = async () => {
    if (!confirm('Isso criará workflows GENÉRICOS para todos os serviços sem workflow. Continuar?')) {
      return
    }

    try {
      setCreatingDefaults(true)
      const response = await apiRequest('/service-workflows/seed-all', {
        method: 'POST'
      })

      if (response.success) {
        const { created, errors, total } = response.data || {}

        toast({
          title: '✅ Workflows criados com sucesso',
          description: `${total || 0} workflows genéricos criados. ${errors?.length > 0 ? `${errors.length} erros.` : ''}`,
          duration: 5000
        })

        // Mostrar detalhes se houver erros
        if (errors && errors.length > 0) {
          console.error('Erros ao criar workflows:', errors)
        }

        loadWorkflows()
        loadStats()
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar workflows padrão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setCreatingDefaults(false)
    }
  }

  // ✅ ATUALIZADO: Usa /service-workflows/service/:serviceId
  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o workflow de "${serviceName}"?`)) {
      return
    }

    try {
      const response = await apiRequest(`/service-workflows/service/${serviceId}`, {
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

  const handleEdit = (workflow: ServiceWorkflow) => {
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

  // ✅ ATUALIZADO: Busca por nome do serviço ao invés de moduleType
  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.service.department.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold">Workflows de Serviços</h1>
          </div>
          <HelpButton
            onClick={() => setShowHelp(true)}
            position="inline"
            label="Como usar Workflows?"
            size="md"
          />
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie os fluxos de trabalho com etapas, aprovações e SLAs para todos os serviços
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
              <p className="text-xs text-muted-foreground mt-1">
                de 125 serviços
              </p>
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
          <Card className={stats.servicesWithoutWorkflow > 0 ? 'border-orange-500' : 'border-green-500'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Serviços Sem Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${stats.servicesWithoutWorkflow > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {stats.servicesWithoutWorkflow || 0}
                </div>
                {stats.servicesWithoutWorkflow === 0 && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              {stats.servicesWithoutWorkflow > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Clique em "Criar Workflows Padrão"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 max-w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por serviço, workflow ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCreateDefaults}
            disabled={loading || creatingDefaults}
            className="w-full sm:w-auto"
          >
            {creatingDefaults ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden md:inline">Criar Workflows Padrão</span>
                <span className="md:hidden">Workflows Padrão</span>
              </>
            )}
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
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
                  : 'Comece criando workflows padrão para todos os serviços ou crie um workflow personalizado'
                }
              </p>
              {!searchTerm && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleCreateDefaults}
                    disabled={creatingDefaults}
                    className="w-full sm:w-auto"
                  >
                    <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="hidden md:inline">Criar Workflows Padrão</span>
                    <span className="md:hidden">Workflows Padrão</span>
                  </Button>
                  <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
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
            <Card key={workflow.id} className={`hover:shadow-md transition-shadow ${!workflow.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <CardTitle className="text-lg sm:text-xl truncate">{workflow.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="w-fit">{workflow.service.name}</Badge>
                        <Badge variant="outline" className="w-fit">{workflow.service.department.name}</Badge>
                        {!workflow.isActive && (
                          <Badge variant="destructive" className="w-fit">Inativo</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {workflow.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                      title="Editar workflow"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workflow.serviceId, workflow.service.name)}
                      title="Deletar workflow"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
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
                  <div className="sm:col-span-2 lg:col-span-1">
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

      {/* Sistema de Ajuda */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        content={workflowsHelpContent}
      />

      {/* Botão de Ajuda Flutuante */}
      <HelpButton
        onClick={() => setShowHelp(true)}
        position="fixed"
        label="Precisa de ajuda com Workflows?"
      />
    </div>
  )
}
