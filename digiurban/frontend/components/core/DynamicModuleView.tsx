// ============================================================
// DYNAMIC MODULE VIEW - VERSÃO MODERNIZADA E INTELIGENTE
// ============================================================
// Sistema adaptativo com abas contextuais baseadas no serviço

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useService } from '@/hooks/useService';
import { useProtocols } from '@/hooks/useProtocols';
import { useModuleCapabilities } from '@/hooks/useModuleCapabilities';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

// Componentes Modernos
import { ModuleProtocolsList } from '@/components/admin/module/ModuleProtocolsList';
import { ModuleDataAnalysisTab } from '@/components/admin/module/ModuleDataAnalysisTab';
import { SmartDataVisualization } from '@/components/admin/module/SmartDataVisualization';
import { ModuleExportTab } from '@/components/admin/module/ModuleExportTab';
import { ModuleAnalyticsTab } from '@/components/admin/module/ModuleAnalyticsTab';
import { DynamicForm } from '@/components/forms/DynamicForm';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  RefreshCw,
  List,
  BarChart3,
  Eye,
  Download,
  PieChart,
  Map,
  Calendar,
  Images,
  Network,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface DynamicModuleViewProps {
  department: string;
  module: string;
}

export function DynamicModuleView({ department, module }: DynamicModuleViewProps) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('protocolos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks de dados
  const { service, loading: serviceLoading, error: serviceError } = useService(department, module);
  const { protocols, loading: protocolsLoading, refetch } = useProtocols(service?.id);

  // Sistema Inteligente - Detecta capacidades do módulo
  const { capabilities, tabs } = useModuleCapabilities(service);

  // Estatísticas rápidas
  const stats = useMemo(() => ({
    total: protocols.length,
    pendentes: protocols.filter(p => p.status === 'VINCULADO').length,
    progresso: protocols.filter(p => p.status === 'PROGRESSO').length,
    concluidos: protocols.filter(p => p.status === 'CONCLUIDO').length,
  }), [protocols]);

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
            <CardDescription>{serviceError || 'Serviço não encontrado'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // URL de retorno para navegação
  const currentUrl = `/admin/secretarias/${department}/${module}`;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header com Info do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{service.name}</h1>
          {service.description && (
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {typeof service.department === 'string'
                ? service.department
                : service.department?.name || 'Sem departamento'}
            </Badge>
            {service.moduleType && (
              <Badge variant="secondary" className="text-xs sm:text-sm">{service.moduleType}</Badge>
            )}
            <Badge variant="outline" className="text-xs sm:text-sm">
              Modo: {capabilities.mode}
            </Badge>
          </div>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* KPIs Compactos */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.progresso}</div>
            <div className="text-xs text-muted-foreground">Em Análise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.concluidos}</div>
            <div className="text-xs text-muted-foreground">Concluídos</div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Inteligentes e Contextuais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
          {/* ABA 1: Protocolos (sempre visível) */}
          <TabsTrigger value="protocolos" className="flex items-center gap-1">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Protocolos</span>
            <span className="sm:hidden">Lista</span>
          </TabsTrigger>

          {/* ABA 2: Análise de Dados (sempre visível) */}
          <TabsTrigger value="analise" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Análise</span>
            <span className="sm:hidden">Anál.</span>
          </TabsTrigger>

          {/* ABA 3: Visualização (sempre visível) */}
          <TabsTrigger value="visualizacao" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visualizar</span>
            <span className="sm:hidden">Ver</span>
          </TabsTrigger>

          {/* ABA 4: Exportação (sempre visível) */}
          <TabsTrigger value="exportacao" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exp.</span>
          </TabsTrigger>

          {/* ABA 5: Analytics (sempre visível) */}
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>

          {/* ABAS CONTEXTUAIS - Aparecem dinamicamente */}
          {tabs.showMap && (
            <TabsTrigger value="mapa" className="flex items-center gap-1">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
          )}
          {tabs.showCalendar && (
            <TabsTrigger value="agenda" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
          )}
          {tabs.showGallery && (
            <TabsTrigger value="galeria" className="flex items-center gap-1">
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Galeria</span>
            </TabsTrigger>
          )}
          {tabs.showLinkedCitizens && (
            <TabsTrigger value="vinculos" className="flex items-center gap-1">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Vínculos</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* CONTEÚDO DAS ABAS */}

        {/* ABA 1: Lista de Protocolos (com redirecionamento) */}
        <TabsContent value="protocolos">
          <ModuleProtocolsList
            protocols={protocols}
            service={service}
            returnUrl={currentUrl}
          />
        </TabsContent>

        {/* ABA 2: Análise de Dados (aprovação granular) */}
        <TabsContent value="analise">
          <ModuleDataAnalysisTab
            protocols={protocols}
            service={service}
          />
        </TabsContent>

        {/* ABA 3: Visualização Inteligente */}
        <TabsContent value="visualizacao">
          <SmartDataVisualization
            protocols={protocols}
            service={service}
          />
        </TabsContent>

        {/* ABA 4: Exportação */}
        <TabsContent value="exportacao">
          <ModuleExportTab
            protocols={protocols}
            service={service}
          />
        </TabsContent>

        {/* ABA 5: Analytics */}
        <TabsContent value="analytics">
          <ModuleAnalyticsTab
            protocols={protocols}
            service={service}
          />
        </TabsContent>

        {/* ABAS CONTEXTUAIS */}
        {tabs.showMap && (
          <TabsContent value="mapa">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Localiz ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded flex items-center justify-center">
                  <p className="text-muted-foreground">Mapa interativo será renderizado aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl pr-8">
              Nova Solicitação - {service.name}
            </DialogTitle>
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
    </div>
  );
}
