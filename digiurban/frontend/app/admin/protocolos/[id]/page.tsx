'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, MessageSquare, AlertCircle, CheckSquare, Clock, GitBranch, Users } from 'lucide-react'
import { ProtocolSLAIndicator } from '@/components/admin/protocol/ProtocolSLAIndicator'
import { ProtocolInteractionsTab } from '@/components/admin/protocol/ProtocolInteractionsTab'
import { ProtocolDocumentsTabEnhanced } from '@/components/admin/protocol/ProtocolDocumentsTabEnhanced'
import { ProtocolPendingsTab } from '@/components/admin/protocol/ProtocolPendingsTab'
import { ProtocolStagesTab } from '@/components/admin/protocol/ProtocolStagesTab'
import { CurrentStageHighlight } from '@/components/admin/protocol/CurrentStageHighlight'
import { WorkflowProgress } from '@/components/admin/protocol/WorkflowProgress'
import { ChecklistTab } from '@/components/admin/protocol/ChecklistTab'
import { ProtocolStageActions } from '@/components/admin/protocol/ProtocolStageActions'
import { CitizenLinksDisplay } from '@/components/protocol/CitizenLinksDisplay'
import { getProtocolDocuments } from '@/services/protocol-documents.service'
import { getProtocolPendings } from '@/services/protocol-pendings.service'
import { getProtocolStages } from '@/services/protocol-stages.service'
import { useToast } from '@/hooks/use-toast'
import { StageStatus } from '@/types/protocol-enhancements'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função auxiliar para formatar datas com segurança
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Data não disponível'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Data inválida'
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

const formatDateOnly = (date: string | Date | null | undefined): string => {
  if (!date) return 'Data não disponível'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Data inválida'
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export default function ProtocolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const protocolId = params.id as string

  const [protocol, setProtocol] = useState<any>(null)
  const [sla, setSLA] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [pendings, setPendings] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('checklist')

  useEffect(() => {
    if (protocolId) {
      loadProtocolData()
    }
  }, [protocolId])

  const loadProtocolData = async () => {
    try {
      setIsLoading(true)

      // Carregar protocolo
      console.log('Carregando protocolo:', protocolId)
      const protocolData = await apiRequest(`/protocols/${protocolId}`)
      console.log('Resposta do protocolo:', protocolData)
      if (protocolData.success) {
        console.log('Dados do protocolo:', protocolData.data)
        setProtocol(protocolData.data)
      } else {
        console.error('Erro na resposta do protocolo:', protocolData)
      }

      // Carregar SLA (opcional)
      try {
        const slaData = await apiRequest(`/protocols/${protocolId}/sla`)
        if (slaData.success) setSLA(slaData.data)
      } catch (err) {
        // SLA pode não existir
        console.log('SLA not available for this protocol')
      }

      // Carregar documentos REAIS
      try {
        const docs = await getProtocolDocuments(protocolId)
        setDocuments(docs)
      } catch (err) {
        console.error('Error loading documents:', err)
        setDocuments([])
      }

      // Carregar pendências REAIS
      try {
        const pends = await getProtocolPendings(protocolId)
        setPendings(pends)
      } catch (err) {
        console.error('Error loading pendings:', err)
        setPendings([])
      }

      // Carregar etapas REAIS
      try {
        const stgs = await getProtocolStages(protocolId)
        setStages(stgs)
      } catch (err) {
        console.error('Error loading stages:', err)
        setStages([])
      }

    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando protocolo...</p>
        </div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Protocolo não encontrado</h1>
          <Button onClick={() => router.push('/admin/protocolos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/protocolos')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Protocolos
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <CardTitle className="text-xl sm:text-2xl break-words">{protocol.number}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{protocol.status}</Badge>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground mb-2 break-words">{protocol.title}</p>
                {protocol.description && (
                  <p className="text-sm text-muted-foreground break-words">{protocol.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {protocol.citizen && (
                <div>
                  <p className="text-muted-foreground mb-1">Cidadão</p>
                  <p className="font-medium">{protocol.citizen.name}</p>
                </div>
              )}
              {protocol.service && (
                <div>
                  <p className="text-muted-foreground mb-1">Serviço</p>
                  <p className="font-medium">{protocol.service.name}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Criado em</p>
                <p className="font-medium">
                  {formatDate(protocol.createdAt)}
                </p>
              </div>
              {protocol.assignedUser && (
                <div>
                  <p className="text-muted-foreground mb-1">Responsável</p>
                  <p className="font-medium">{protocol.assignedUser.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Stage Highlight (se houver etapa em progresso) */}
      {stages.find(s => s.status === StageStatus.IN_PROGRESS) && (
        <div className="mb-6">
          <CurrentStageHighlight
            protocolId={protocolId}
            currentStage={stages.find(s => s.status === StageStatus.IN_PROGRESS)!}
            totalStages={stages.length}
            pendings={pendings}
            onNavigateToDocuments={() => setActiveTab('documents')}
            onNavigateToChecklist={() => setActiveTab('checklist')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="checklist" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Histórico</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-6">
              <ChecklistTab
                protocolId={protocolId}
                currentStage={
                  // Prioridade: IN_PROGRESS > última COMPLETED > null
                  stages.find(s => s.status === StageStatus.IN_PROGRESS) ||
                  [...stages].sort((a, b) => (b.stageOrder || 0) - (a.stageOrder || 0)).find(s => s.status === StageStatus.COMPLETED) ||
                  null
                }
                onNavigateToDocuments={() => setActiveTab('documents')}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <ProtocolDocumentsTabEnhanced
                protocolId={protocolId}
                documents={documents}
                currentStageMetadata={stages.find(s => s.status === StageStatus.IN_PROGRESS)?.metadata}
                onRefresh={loadProtocolData}
              />
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <ProtocolStagesTab
                protocolId={protocolId}
                stages={stages}
                onRefresh={loadProtocolData}
              />
            </TabsContent>

            <TabsContent value="interactions" className="mt-6">
              <ProtocolInteractionsTab protocolId={protocolId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Progresso do Workflow */}
          {stages.length > 0 && (
            <WorkflowProgress stages={stages} />
          )}

          {/* Ações da Etapa Atual */}
          {stages.find(s => s.status === StageStatus.IN_PROGRESS) && (
            <ProtocolStageActions
              protocolId={protocolId}
              stageId={stages.find(s => s.status === StageStatus.IN_PROGRESS)!.id}
              stageName={stages.find(s => s.status === StageStatus.IN_PROGRESS)!.stageName}
              stageStatus={stages.find(s => s.status === StageStatus.IN_PROGRESS)!.status}
              metadata={stages.find(s => s.status === StageStatus.IN_PROGRESS)!.metadata}
              onActionComplete={loadProtocolData}
            />
          )}

          {/* Indicador de SLA */}
          <ProtocolSLAIndicator sla={sla} />

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Última Atualização</p>
                <p className="font-medium text-sm break-words">
                  {formatDate(protocol.updatedAt)}
                </p>
              </div>
              {protocol.dueDate && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Data de Vencimento</p>
                  <p className="font-medium text-sm break-words">
                    {formatDateOnly(protocol.dueDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Prioridade</p>
                <p className="font-medium text-sm">Nível {protocol.priority}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
