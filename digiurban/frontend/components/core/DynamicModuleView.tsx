// ============================================================
// DYNAMIC MODULE VIEW - Componente Universal para Todos os Módulos
// ============================================================

'use client';

import { useState } from 'react';
import { useService } from '@/hooks/useService';
import { useProtocols } from '@/hooks/useProtocols';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ProtocolDetailModal } from './ProtocolDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicModuleViewProps {
  department: string;
  module: string;
}

export function DynamicModuleView({ department, module }: DynamicModuleViewProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 Hook busca service do backend (com cache Redis + WebSocket)
  const { service, loading: serviceLoading, error: serviceError } = useService(department, module);

  // 📊 Hook busca protocolos do módulo
  const { protocols, loading: protocolsLoading, refetch } = useProtocols(service?.id);

  // 📝 Criar novo protocolo
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

      if (!response.ok) throw new Error('Erro ao criar protocolo');

      const result = await response.json();
      toast.success('Protocolo criado com sucesso!', {
        description: `Número: ${result.protocol?.protocolNumber}`
      });

      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
      toast.error('Erro ao criar protocolo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 👁️ Abrir detalhes do protocolo
  const handleRowClick = (protocol: any) => {
    setSelectedProtocol(protocol);
    setIsDetailModalOpen(true);
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
      {/* 📌 Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          {service.description && (
            <p className="text-muted-foreground mt-2">{service.description}</p>
          )}
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Protocolo
        </Button>
      </div>

      {/* 📊 Stats Cards */}
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
            <div className="text-2xl font-bold">
              {protocols.filter((p) => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {protocols.filter((p) => p.status === 'inProgress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {protocols.filter((p) => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📋 Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Protocolos</CardTitle>
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
        </CardHeader>
        <CardContent>
          {protocolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DynamicTable
              data={protocols}
              schema={service.formSchema}
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>

      {/* 🎨 Conditional Features */}
      {service.hasScheduling && (
        <Card>
          <CardHeader>
            <CardTitle>📅 Calendário de Agendamentos</CardTitle>
            <CardDescription>
              Visualize os agendamentos deste módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Feature em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      )}

      {service.hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle>🗺️ Mapa de Localizações</CardTitle>
            <CardDescription>
              Visualize as localizações no mapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Feature em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 📄 Modal para CRIAR Protocolo */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Protocolo</DialogTitle>
          </DialogHeader>

          {service?.formSchema && (
            <DynamicForm
              schema={service.formSchema}
              onSubmit={handleCreateProtocol}
              defaultValues={{}}
              submitLabel="Criar Protocolo"
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 👁️ Modal para VISUALIZAR/EDITAR Protocolo */}
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
