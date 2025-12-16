// ============================================================
// DYNAMIC MODULE VIEW - Painel Multi-Funcional Universal
// ============================================================
// Funciona para TODAS as 13 secretarias e 101+ moduleTypes

'use client';

import { useState, useMemo } from 'react';
import { useService } from '@/hooks/useService';
import { useProtocols } from '@/hooks/useProtocols';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ProtocolList } from './ProtocolList';
import { ApprovalQueue } from './ApprovalQueue';
import { GenericDataTable } from './GenericDataTable';
import { AdvancedFeaturesTab } from './AdvancedFeaturesTab';
import { ModuleDashboard } from './ModuleDashboard';
import { ProtocolDocumentsTab } from '@/components/admin/protocol/ProtocolDocumentsTab';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ProtocolDetailModal } from './ProtocolDetailModal';
import { AssignProtocolDialog } from '@/components/admin/AssignProtocolDialog';
import { ProtocolDocumentsPanel } from './ProtocolDocumentsPanel';
import { ProtocolWorkflowPanel } from './ProtocolWorkflowPanel';
import { ProtocolPendingsPanel } from './ProtocolPendingsPanel';
import { CurrentStageHighlight } from '@/components/admin/protocol/CurrentStageHighlight';
import { WorkflowProgress } from '@/components/admin/protocol/WorkflowProgress';
import { ChecklistTab } from '@/components/admin/protocol/ChecklistTab';
import { ProtocolDocumentsTabEnhanced } from '@/components/admin/protocol/ProtocolDocumentsTabEnhanced';
import { ProtocolPendingsTab } from '@/components/admin/protocol/ProtocolPendingsTab';
import { ProtocolStagesTab } from '@/components/admin/protocol/ProtocolStagesTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, List, CheckCircle, BarChart3, FileText, MapPin, PieChart, UserPlus, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicModuleViewProps {
  department: string;
  module: string;
}

export function DynamicModuleView({ department, module }: DynamicModuleViewProps) {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  // Hook busca service do backend
  const { service, loading: serviceLoading, error: serviceError } = useService(department, module);

  // Hook busca protocolos do módulo
  const { protocols, loading: protocolsLoading, refetch } = useProtocols(service?.id);

  // Filtrar protocolos por atribuição
  const filteredProtocols = useMemo(() => {
    if (assignedFilter === 'all') return protocols;
    if (assignedFilter === 'me') {
      return protocols.filter(p => (p as any).assignedUserId === user?.id);
    }
    if (assignedFilter === 'unassigned') {
      return protocols.filter(p => !(p as any).assignedUserId);
    }
    if (assignedFilter === 'assigned') {
      return protocols.filter(p => (p as any).assignedUserId);
    }
    return protocols;
  }, [protocols, assignedFilter, user?.id]);

  // Criar novo protocolo
  const handleCreateProtocol = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: service?.id,
          customData: data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar protocolo');
      }

      const result = await response.json();
      toast.success('Protocolo criado com sucesso!', {
        description: `Número: ${result.protocol?.protocolNumber}`
      });

      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Erro ao criar protocolo:', error);
      toast.error(error.message || 'Erro ao criar protocolo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir detalhes do protocolo
  const handleViewDetails = (protocol: any) => {
    setSelectedProtocol(protocol);
    setIsDetailModalOpen(true);
  };

  // Abrir dialog de atribuição
  const handleAssignProtocol = (protocol: any) => {
    setSelectedProtocol(protocol);
    setIsAssignDialogOpen(true);
  };

  // Contar pendentes
  const pendingCount = filteredProtocols.filter(
    (p) => p.status === 'VINCULADO' || p.status === 'PENDENCIA'
  ).length;

  // Contar não atribuídos
  const unassignedCount = filteredProtocols.filter(p => !(p as any).assignedUserId).length;

  // Verificar se tem recursos avançados
  const hasAdvancedFeatures = protocols.some(
    (p) =>
      (p.latitude && p.longitude) ||
      (p.customData?.images && p.customData.images.length > 0) ||
      p.customData?.appointmentDate ||
      p.customData?.scheduleDate ||
      p.customData?.eventDate
  );

  // Loading state
  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Carregando módulo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (serviceError || !service) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao Carregar Módulo</CardTitle>
            <CardDescription>
              {serviceError || 'Serviço não encontrado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          {service.description && (
            <p className="text-muted-foreground mt-2">{service.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">
              {typeof service.department === 'string'
                ? service.department
                : service.department?.name || 'Sem departamento'}
            </Badge>
            {service.moduleType && (
              <Badge variant="secondary">{service.moduleType}</Badge>
            )}
          </div>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Filtro de Atribuição */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrar por atribuição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Protocolos</SelectItem>
                  <SelectItem value="me">Atribuídos a Mim</SelectItem>
                  <SelectItem value="unassigned">Não Atribuídos</SelectItem>
                  <SelectItem value="assigned">Atribuídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Exibindo <span className="font-semibold">{filteredProtocols.length}</span> de {protocols.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Rápidos */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protocols.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {protocols.filter((p) => p.status === 'VINCULADO').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {protocols.filter((p) => p.status === 'PROGRESSO').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {protocols.filter((p) => p.status === 'CONCLUIDO').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Não Atribuídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unassignedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Solicitações
          </TabsTrigger>

          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprovações
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="data" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dados
          </TabsTrigger>

          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>

          {hasAdvancedFeatures && (
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Recursos
            </TabsTrigger>
          )}

          <TabsTrigger value="reports" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: SOLICITAÇÕES (Lista Compacta) */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lista de Solicitações</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={protocolsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${protocolsLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {protocolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProtocolList protocols={filteredProtocols} onSelect={handleViewDetails} />
          )}
        </TabsContent>

        {/* ABA 2: APROVAÇÕES (Fila de Aprovação) */}
        <TabsContent value="approval" className="space-y-4">
          {service?.serviceType === 'COM_DADOS' && selectedProtocol ? (
            <>
              <h2 className="text-xl font-semibold">Gestão de Workflow - {selectedProtocol.number}</h2>
              <Tabs defaultValue="workflow" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="workflow">Etapas</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="pendings">Pendências</TabsTrigger>
                </TabsList>
                <TabsContent value="workflow">
                  <ProtocolWorkflowPanel protocolId={selectedProtocol.id} />
                </TabsContent>
                <TabsContent value="documents">
                  <ProtocolDocumentsPanel protocolId={selectedProtocol.id} />
                </TabsContent>
                <TabsContent value="pendings">
                  <ProtocolPendingsPanel protocolId={selectedProtocol.id} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Fila de Aprovação</h2>
              <ApprovalQueue
                protocols={protocols}
                service={service}
                onViewDetails={handleViewDetails}
                onRefresh={refetch}
              />
            </>
          )}
        </TabsContent>

        {/* ABA 3: DADOS COLETADOS (Tabela Genérica) */}
        <TabsContent value="data" className="space-y-4">
          <h2 className="text-xl font-semibold">Dados Coletados</h2>
          <GenericDataTable
            protocols={protocols}
            service={service}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        {/* ABA 4: DOCUMENTOS */}
        <TabsContent value="documents" className="space-y-4">
          <h2 className="text-xl font-semibold">Gestão de Documentos</h2>

          {protocols.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Nenhuma solicitação criada ainda. Crie uma solicitação para gerenciar documentos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {protocols.map((protocol) => {
                // Extrair documentos do campo JSON
                const protocolDocs = protocol.documents && Array.isArray(protocol.documents)
                  ? protocol.documents
                  : [];

                return (
                  <Card key={protocol.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Protocolo: {protocol.number}
                          </CardTitle>
                          <CardDescription>
                            {protocol.title || service.name}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          protocol.status === 'CONCLUIDO' ? 'default' :
                          protocol.status === 'PROGRESSO' ? 'secondary' :
                          protocol.status === 'VINCULADO' ? 'outline' : 'destructive'
                        }>
                          {protocol.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {protocolDocs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum documento enviado ainda</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {protocolDocs.map((doc: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {doc.originalName || doc.filename}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.mimetype} • {(doc.size / 1024).toFixed(2)} KB
                                    {doc.uploadedAt && ` • ${new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Download do documento
                                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                                  const downloadUrl = `${backendUrl}/uploads/${doc.path || doc.filename}`;
                                  window.open(downloadUrl, '_blank');
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA 5: RECURSOS AVANÇADOS (Mapa, Imagens, Calendário) */}
        {hasAdvancedFeatures && (
          <TabsContent value="advanced" className="space-y-4">
            <h2 className="text-xl font-semibold">Recursos Avançados</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Selecione uma solicitação para visualizar recursos avançados
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ABA 6: RELATÓRIOS (Dashboard + Exportação) */}
        <TabsContent value="reports" className="space-y-4">
          <h2 className="text-xl font-semibold">Relatórios e Métricas</h2>
          <ModuleDashboard protocols={protocols} service={service} />
        </TabsContent>
      </Tabs>

      {/* Modal para CRIAR Protocolo */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Solicitação - {service.name}</DialogTitle>
          </DialogHeader>

          {service?.formSchema && (
            <DynamicForm
              schema={service.formSchema}
              onSubmit={handleCreateProtocol}
              defaultValues={{}}
              submitLabel="Criar Solicitação"
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Modal COMPLETO para VISUALIZAR/EDITAR Protocolo                 */}
      {/* Com CurrentStageHighlight, WorkflowProgress, ChecklistTab, etc  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedProtocol && (
        <Dialog open={isDetailModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsDetailModalOpen(false);
            setSelectedProtocol(null);
          }
        }}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">
                  Protocolo #{selectedProtocol.number}
                </DialogTitle>
                <Badge variant={
                  selectedProtocol.status === 'CONCLUIDO' ? 'default' :
                  selectedProtocol.status === 'PROGRESSO' ? 'secondary' :
                  selectedProtocol.status === 'VINCULADO' ? 'outline' : 'destructive'
                }>
                  {selectedProtocol.status}
                </Badge>
              </div>
            </DialogHeader>

            {/* Highlight da Etapa Atual */}
            {selectedProtocol.stages && selectedProtocol.stages.length > 0 && selectedProtocol.stages.find((s: any) => s.status === 'IN_PROGRESS') && (
              <CurrentStageHighlight
                protocolId={selectedProtocol.id}
                currentStage={selectedProtocol.stages.find((s: any) => s.status === 'IN_PROGRESS')!}
                totalStages={selectedProtocol.stages.length}
                onNavigateToDocuments={() => {
                  // Scroll to documents tab
                  const tabsElement = document.querySelector('[value="documents"]');
                  if (tabsElement) {
                    (tabsElement as HTMLElement).click();
                  }
                }}
                onNavigateToChecklist={() => {
                  // Scroll to checklist tab
                  const tabsElement = document.querySelector('[value="checklist"]');
                  if (tabsElement) {
                    (tabsElement as HTMLElement).click();
                  }
                }}
              />
            )}

            {/* Barra de Progresso do Workflow */}
            {selectedProtocol.stages && selectedProtocol.stages.length > 0 && (
              <WorkflowProgress stages={selectedProtocol.stages || []} />
            )}

            {/* Tabs Completas */}
            <Tabs defaultValue="checklist" className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="pendings">Pendências</TabsTrigger>
                <TabsTrigger value="stages">Etapas</TabsTrigger>
                <TabsTrigger value="data">Dados</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="space-y-4">
                <ChecklistTab
                  protocolId={selectedProtocol.id}
                  currentStage={selectedProtocol.stages?.find((s: any) => s.status === 'IN_PROGRESS') || null}
                  onNavigateToDocuments={() => {
                    const tabsElement = document.querySelector('[value="documents"]');
                    if (tabsElement) {
                      (tabsElement as HTMLElement).click();
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <ProtocolDocumentsTabEnhanced
                  protocolId={selectedProtocol.id}
                  documents={selectedProtocol.documentFiles || []}
                  onRefresh={refetch}
                />
              </TabsContent>

              <TabsContent value="pendings" className="space-y-4">
                <ProtocolPendingsTab
                  protocolId={selectedProtocol.id}
                  pendings={selectedProtocol.pendings || []}
                  onRefresh={refetch}
                />
              </TabsContent>

              <TabsContent value="stages" className="space-y-4">
                <ProtocolStagesTab
                  protocolId={selectedProtocol.id}
                  stages={selectedProtocol.stages || []}
                  onRefresh={refetch}
                />
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Coletados</CardTitle>
                    <CardDescription>
                      Informações capturadas no formulário de solicitação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProtocol.customData ? (
                      <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-sm">
                        {JSON.stringify(selectedProtocol.customData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">Nenhum dado disponível</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedProtocol(null);
                }}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAssignProtocol(selectedProtocol)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para ATRIBUIR Protocolo */}
      <AssignProtocolDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        protocol={selectedProtocol}
        onSuccess={() => {
          refetch();
          setIsAssignDialogOpen(false);
        }}
      />
    </div>
  );
}
