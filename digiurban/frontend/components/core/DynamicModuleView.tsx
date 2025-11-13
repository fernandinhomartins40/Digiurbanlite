// ============================================================
// DYNAMIC MODULE VIEW - Painel Multi-Funcional Universal
// ============================================================
// Funciona para TODAS as 13 secretarias e 101+ moduleTypes

'use client';

import { useState } from 'react';
import { useService } from '@/hooks/useService';
import { useProtocols } from '@/hooks/useProtocols';
import { ProtocolList } from './ProtocolList';
import { ApprovalQueue } from './ApprovalQueue';
import { GenericDataTable } from './GenericDataTable';
import { AdvancedFeaturesTab } from './AdvancedFeaturesTab';
import { ModuleDashboard } from './ModuleDashboard';
import { ProtocolDocumentsTab } from '@/components/admin/protocol/ProtocolDocumentsTab';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ProtocolDetailModal } from './ProtocolDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, RefreshCw, List, CheckCircle, BarChart3, FileText, MapPin, PieChart } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicModuleViewProps {
  department: string;
  module: string;
}

export function DynamicModuleView({ department, module }: DynamicModuleViewProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook busca service do backend
  const { service, loading: serviceLoading, error: serviceError } = useService(department, module);

  // Hook busca protocolos do módulo
  const { protocols, loading: protocolsLoading, refetch } = useProtocols(service?.id);

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

  // Contar pendentes
  const pendingCount = protocols.filter(
    (p) => p.status === 'VINCULADO' || p.status === 'PENDENCIA'
  ).length;

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
            <Badge variant="outline">{service.departmentId}</Badge>
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

      {/* KPIs Rápidos */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <ProtocolList protocols={protocols} onSelect={handleViewDetails} />
          )}
        </TabsContent>

        {/* ABA 2: APROVAÇÕES (Fila de Aprovação) */}
        <TabsContent value="approval" className="space-y-4">
          <h2 className="text-xl font-semibold">Fila de Aprovação</h2>
          <ApprovalQueue
            protocols={protocols}
            service={service}
            onViewDetails={handleViewDetails}
            onRefresh={refetch}
          />
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
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Selecione uma solicitação na aba "Solicitações" para gerenciar documentos
              </p>
            </CardContent>
          </Card>
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

      {/* Modal para VISUALIZAR/EDITAR Protocolo */}
      {selectedProtocol && (
        <ProtocolDetailModal
          protocol={selectedProtocol}
          service={service}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProtocol(null);
          }}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}
