// ============================================================
// PROTOCOL DETAIL MODAL - Visualização Completa do Protocolo
// ============================================================
// Modal rico que mostra todos os detalhes, histórico, documentos e ações

'use client';

import { useState } from 'react';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ApprovalActions } from '@/components/admin/ApprovalActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Clock,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProtocolDetailModalProps {
  protocol: any;
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ProtocolDetailModal({
  protocol,
  service,
  isOpen,
  onClose,
  onUpdate
}: ProtocolDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status colors
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
    inProgress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
  };

  const currentStatus = statusConfig[protocol.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  // 📝 Atualizar protocolo
  const handleUpdate = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customData: data })
      });

      if (!response.ok) throw new Error('Erro ao atualizar protocolo');

      toast.success('Protocolo atualizado com sucesso!');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar protocolo:', error);
      toast.error('Erro ao atualizar protocolo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Aprovar protocolo
  const handleApprove = async (id: string, notes?: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/protocols/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notes })
    });

    if (!response.ok) throw new Error('Erro ao aprovar protocolo');

    onUpdate?.();
    onClose();
  };

  // ❌ Rejeitar protocolo
  const handleReject = async (id: string, reason: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/protocols/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) throw new Error('Erro ao rejeitar protocolo');

    onUpdate?.();
    onClose();
  };

  // Renderizar campo dinâmico
  const renderField = (key: string, value: any, schema: any) => {
    const fieldSchema = schema?.properties?.[key];
    if (!fieldSchema) return null;

    let displayValue = value;

    // Formatação por tipo
    if (fieldSchema.type === 'boolean') {
      displayValue = value ? 'Sim' : 'Não';
    } else if (fieldSchema.format === 'date' && value) {
      displayValue = format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
    } else if (fieldSchema.format === 'date-time' && value) {
      displayValue = format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } else if (fieldSchema.enum && fieldSchema.enumNames) {
      const index = fieldSchema.enum.indexOf(value);
      displayValue = fieldSchema.enumNames[index] || value;
    }

    return (
      <div key={key} className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">
          {fieldSchema.title || key}
        </div>
        <div className="text-sm">
          {displayValue || '—'}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl">
                Protocolo {protocol.protocolNumber}
              </DialogTitle>
              <Badge className={currentStatus.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {currentStatus.label}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          {/* ========== ABA: DETALHES ========== */}
          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Informações do Protocolo</span>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <DynamicForm
                      schema={service.formSchema}
                      onSubmit={handleUpdate}
                      defaultValues={protocol.customData}
                      submitLabel="Salvar Alterações"
                      isLoading={isSubmitting}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {protocol.customData && Object.entries(protocol.customData).map(([key, value]) =>
                        renderField(key, value, service.formSchema)
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadados */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Criação
                      </div>
                      <div className="text-sm">
                        {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Solicitante
                      </div>
                      <div className="text-sm">
                        {protocol.citizen?.name || '—'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Serviço
                      </div>
                      <div className="text-sm">
                        {service.name}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Última Atualização
                      </div>
                      <div className="text-sm">
                        {format(new Date(protocol.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* ========== ABA: HISTÓRICO ========== */}
          <TabsContent value="timeline" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Evento: Criação */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="h-full w-px bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="font-medium">Protocolo Criado</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Por: {protocol.citizen?.name}
                        </div>
                      </div>
                    </div>

                    {/* TODO: Adicionar eventos do histórico real quando implementado no backend */}
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Histórico completo em desenvolvimento...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* ========== ABA: DOCUMENTOS ========== */}
          <TabsContent value="documents" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos Anexados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Gerenciamento de documentos em desenvolvimento...
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* ========== ABA: AÇÕES ========== */}
          <TabsContent value="actions" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {protocol.status === 'pending' && service.requiresApproval && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Este protocolo está pendente de aprovação. Escolha uma ação:
                      </p>
                      <ApprovalActions
                        itemId={protocol.id}
                        itemType="Protocolo"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        size="default"
                      />
                    </div>
                  )}

                  {protocol.status !== 'pending' && (
                    <div className="text-sm text-muted-foreground">
                      Este protocolo já foi processado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
