'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card } from '@/components/ui/card'

// Sistema de detecção de modo
import { getProtocolViewMode, ProtocolViewMode } from '@/lib/protocol-view-mode'

// Views especializadas por modo
import { CompletingProtocolView } from '@/components/admin/protocol/CompletingProtocolView'
import { ArchivedProtocolView } from '@/components/admin/protocol/ArchivedProtocolView'

// Componentes para modo ACTIVE
import { ProtocolHeader } from '@/components/admin/protocol/ProtocolHeader'
import { WorkflowProgressBar } from '@/components/admin/protocol/WorkflowProgressBar'
import { StageFocusCard } from '@/components/admin/protocol/StageFocusCard'
import { DynamicProtocolTabs } from '@/components/admin/protocol/DynamicProtocolTabs'
import { CompactSLACard } from '@/components/admin/protocol/CompactSLACard'
import { ProtocolSummaryTab } from '@/components/admin/protocol/ProtocolSummaryTab'
import { ProtocolDocumentsUnified } from '@/components/admin/protocol/ProtocolDocumentsUnified'
import { ProtocolDataTab } from '@/components/admin/protocol/ProtocolDataTab'
import { ProtocolPendingsTab } from '@/components/admin/protocol/ProtocolPendingsTab'
import { ProtocolCommunicationTab } from '@/components/admin/protocol/ProtocolCommunicationTab'
import { TabsContent } from '@/components/ui/tabs'

// Services
import { getProtocolDocuments } from '@/services/protocol-documents.service'
import { getProtocolPendings } from '@/services/protocol-pendings.service'
import { getProtocolStages } from '@/services/protocol-stages.service'
import { getProtocolInteractions } from '@/services/protocol-interactions.service'

// Hooks
import { useToast } from '@/hooks/use-toast'
import { StageStatus } from '@/types/protocol-enhancements'
import { Clock, FileText, AlertCircle, MessageSquare, Users } from 'lucide-react'
import { CardContent } from '@/components/ui/card'

export default function ProtocolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const protocolId = params.id as string

  // Estados
  const [protocol, setProtocol] = useState<any>(null)
  const [sla, setSLA] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [pendings, setPendings] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [citizenLinks, setCitizenLinks] = useState<any[]>([])
  const [validation, setValidation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')

  // Detectar modo de visualização
  const viewModeResult = useMemo(() => {
    if (!protocol || stages.length === 0) {
      return {
        mode: ProtocolViewMode.ACTIVE,
        currentStage: undefined,
        isLastStage: false,
        availableTabs: ['resumo'],
        primaryTab: 'resumo'
      }
    }

    return getProtocolViewMode(protocol.status, stages)
  }, [protocol, stages])

  const { mode, currentStage, availableTabs, primaryTab } = viewModeResult

  // Inicializar tab ativo quando modo for detectado
  useEffect(() => {
    if (availableTabs.length > 0 && !activeTab) {
      setActiveTab(primaryTab || availableTabs[0])
    }
  }, [availableTabs, primaryTab, activeTab])

  // Carregar dados do protocolo
  useEffect(() => {
    if (protocolId) {
      loadProtocolData()
    }
  }, [protocolId])

  const loadProtocolData = async () => {
    try {
      setIsLoading(true)

      // Carregar protocolo
      const protocolData = await apiRequest(`/protocols/${protocolId}`)
      if (protocolData.success) {
        setProtocol(protocolData.data)
      }

      // Carregar SLA (opcional)
      try {
        const slaData = await apiRequest(`/protocols/${protocolId}/sla`)
        if (slaData.success) setSLA(slaData.data)
      } catch (err) {
        console.log('SLA not available')
      }

      // Carregar documentos
      try {
        const docs = await getProtocolDocuments(protocolId)
        setDocuments(docs)
      } catch (err) {
        console.error('Error loading documents:', err)
        setDocuments([])
      }

      // Carregar pendências
      try {
        const pends = await getProtocolPendings(protocolId)
        setPendings(pends)
      } catch (err) {
        console.error('Error loading pendings:', err)
        setPendings([])
      }

      // Carregar etapas
      try {
        const stgs = await getProtocolStages(protocolId)
        setStages(stgs)

        // Se há etapa em progresso, carregar validação
        const currentStage = stgs.find((s: any) => s.status === StageStatus.IN_PROGRESS)
        if (currentStage) {
          loadValidation(currentStage.id)
        }
      } catch (err) {
        console.error('Error loading stages:', err)
        setStages([])
      }

      // Carregar interações
      try {
        const ints = await getProtocolInteractions(protocolId)
        setInteractions(ints)
      } catch (err) {
        console.error('Error loading interactions:', err)
        setInteractions([])
      }

      // Carregar vínculos de cidadãos
      try {
        const linksData = await apiRequest(`/protocols/${protocolId}/citizen-links`)
        if (linksData.success) {
          setCitizenLinks(linksData.data || [])
        }
      } catch (err) {
        console.log('No citizen links')
        setCitizenLinks([])
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

  const loadValidation = async (stageId: string) => {
    try {
      const response = await apiRequest(`/protocols/${protocolId}/stages/${stageId}/validate`)
      if (response.success) {
        setValidation(response.data.validation)
      }
    } catch (error) {
      console.error('Erro ao validar etapa:', error)
    }
  }

  // Loading state
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

  // Not found state
  if (!protocol) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Protocolo não encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O protocolo solicitado não existe ou você não tem permissão para visualizá-lo.
          </p>
        </Card>
      </div>
    )
  }

  // ==========================================
  // MODO: COMPLETING (Última etapa - finalização)
  // ==========================================
  if (mode === ProtocolViewMode.COMPLETING) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProtocolHeader
          protocolId={protocolId}
          protocolNumber={protocol.number || protocol.protocolNumber}
          serviceName={protocol.service?.name || protocol.title}
          status={protocol.status}
          citizenName={protocol.citizen?.name}
          currentStage={currentStage}
          onActionComplete={loadProtocolData}
          onBack={() => router.push('/admin/protocolos')}
        />

        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
          <CompletingProtocolView
            protocol={protocol}
            stages={stages}
            documents={documents}
            formData={protocol.formData || {}}
            onComplete={loadProtocolData}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MODO: ARCHIVED (Protocolo concluído/cancelado)
  // ==========================================
  if (mode === ProtocolViewMode.ARCHIVED) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProtocolHeader
          protocolId={protocolId}
          protocolNumber={protocol.number || protocol.protocolNumber}
          serviceName={protocol.service?.name || protocol.title}
          status={protocol.status}
          citizenName={protocol.citizen?.name}
          currentStage={undefined}
          onActionComplete={loadProtocolData}
          onBack={() => router.push('/admin/protocolos')}
        />

        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
          <ArchivedProtocolView
            protocol={protocol}
            stages={stages}
            documents={documents}
            pendings={pendings}
            interactions={interactions}
            citizenLinks={citizenLinks}
            onReopen={loadProtocolData}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MODO: ACTIVE (Workflow em progresso - abas contextuais)
  // ==========================================
  const openPendings = pendings.filter(p => p.status === 'OPEN' || p.status === 'IN_PROGRESS')
  const unreadMessages = interactions.filter(i => !i.isRead).length

  // Badges dinâmicos para as abas
  const tabBadges: Record<string, number> = {
    documentos: documents.filter(d => d.status === 'PENDING').length,
    pendencias: openPendings.length,
    comunicacao: unreadMessages
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo com Ações Primárias */}
      <ProtocolHeader
        protocolId={protocolId}
        protocolNumber={protocol.number || protocol.protocolNumber}
        serviceName={protocol.service?.name || protocol.title}
        status={protocol.status}
        citizenName={protocol.citizen?.name}
        currentStage={currentStage}
        onActionComplete={loadProtocolData}
        onBack={() => router.push('/admin/protocolos')}
      />

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {/* Barra de Progresso do Workflow */}
        {stages.length > 0 && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <WorkflowProgressBar stages={stages} />
          </div>
        )}

        {/* Stage Focus Card - Mostra o que precisa ser feito AGORA */}
        {currentStage && (
          <div className="mb-6">
            <StageFocusCard
              currentStage={currentStage}
              totalStages={stages.length}
              validation={validation}
              documents={documents}
              pendings={pendings}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Área de Conteúdo Principal (3/4) */}
          <div className="lg:col-span-3">
            {/* Abas Dinâmicas Contextuais */}
            <DynamicProtocolTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              availableTabs={availableTabs}
              primaryTab={primaryTab}
              badges={tabBadges}
            >
              {/* Tab: Resumo */}
              {availableTabs.includes('resumo') && (
                <TabsContent value="resumo" className="mt-0">
                  <ProtocolSummaryTab
                    protocol={protocol}
                    citizenLinks={citizenLinks}
                  />
                </TabsContent>
              )}

              {/* Tab: Documentos */}
              {availableTabs.includes('documentos') && (
                <TabsContent value="documentos" className="mt-0">
                  <ProtocolDocumentsUnified
                    protocolId={protocolId}
                    documents={documents}
                    currentStageMetadata={currentStage?.metadata}
                    onRefresh={loadProtocolData}
                  />
                </TabsContent>
              )}

              {/* Tab: Dados */}
              {availableTabs.includes('dados') && (
                <TabsContent value="dados" className="mt-0">
                  <ProtocolDataTab
                    protocolId={protocolId}
                    formData={protocol.formData}
                    metadata={protocol.metadata}
                    onRefresh={loadProtocolData}
                  />
                </TabsContent>
              )}

              {/* Tab: Pendências */}
              {availableTabs.includes('pendencias') && (
                <TabsContent value="pendencias" className="mt-0">
                  <ProtocolPendingsTab
                    protocolId={protocolId}
                    pendings={pendings}
                    onRefresh={loadProtocolData}
                  />
                </TabsContent>
              )}

              {/* Tab: Comunicação (Workflow + Mensagens) */}
              {availableTabs.includes('comunicacao') && (
                <TabsContent value="comunicacao" className="mt-0">
                  <ProtocolCommunicationTab
                    protocolId={protocolId}
                    stages={stages}
                    interactions={interactions}
                    onRefresh={loadProtocolData}
                  />
                </TabsContent>
              )}
            </DynamicProtocolTabs>
          </div>

          {/* Sidebar Compacta (1/4) */}
          <div className="space-y-4">
            {/* SLA Compacto */}
            <CompactSLACard
              sla={sla}
              onClick={() => {
                toast({
                  title: 'SLA Detalhado',
                  description: 'Clique para ver detalhes completos do SLA'
                })
              }}
            />

            {/* Estatísticas Rápidas */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Etapas</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {stages.filter(s => s.status === 'COMPLETED').length}/{stages.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Documentos</span>
                  </div>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Pendências</span>
                  </div>
                  <span className={`font-medium ${openPendings.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {openPendings.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensagens</span>
                  </div>
                  <span className="font-medium text-gray-900">{interactions.length}</span>
                </div>

                {citizenLinks.length > 0 && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Vínculos</span>
                    </div>
                    <span className="font-medium text-gray-900">{citizenLinks.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
