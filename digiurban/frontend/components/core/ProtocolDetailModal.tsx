// ============================================================
// PROTOCOL DETAIL MODAL - Visualização Completa do Protocolo
// ============================================================
// Modal rico 100% genérico que funciona para todas as 13 secretarias

'use client';

import { useState } from 'react';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ApprovalActions } from '@/components/admin/ApprovalActions';
import { AdvancedFeaturesTab } from './AdvancedFeaturesTab';
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
  X,
  Image as ImageIcon,
  History
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
  initialTab?: string;
}

export function ProtocolDetailModal({
  protocol,
  service,
  isOpen,
  onClose,
  onUpdate,
  initialTab = 'details'
}: ProtocolDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [documents, setDocuments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Status colors - 100% genérico
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    VINCULADO: { label: 'Vinculado', color: 'bg-blue-100 text-blue-800', icon: Clock },
    PROGRESSO: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    PENDENCIA: { label: 'Pendência', color: 'bg-orange-100 text-orange-800', icon: XCircle },
    CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const currentStatus = statusConfig[protocol.status] || statusConfig.VINCULADO;
  const StatusIcon = currentStatus.icon;

  // Detectar recursos avançados disponíveis
  const hasLocation = Boolean(protocol.latitude && protocol.longitude);
  const hasImages = Boolean(protocol.customData?.images?.length > 0);
  const hasScheduling = Boolean(
    protocol.customData?.appointmentDate ||
    protocol.customData?.scheduleDate ||
    protocol.customData?.eventDate
  );
  const hasAdvancedFeatures = hasLocation || hasImages || hasScheduling;

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

  // Carregar documentos quando aba for aberta
  const loadDocuments = async () => {
    if (documents.length > 0) return;

    setIsLoadingDocs(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocol.id}/documents`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Carregar histórico quando aba for aberta
  const loadHistory = async () => {
    if (history.length > 0) return;

    setIsLoadingHistory(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocol.id}/history`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handler para mudança de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'documents') loadDocuments();
    if (value === 'timeline') loadHistory();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl">
                Protocolo #{protocol.number || protocol.protocolNumber}
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full ${hasAdvancedFeatures ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
            {hasAdvancedFeatures && (
              <TabsTrigger value="advanced">
                {hasLocation && <MapPin className="h-4 w-4 mr-2" />}
                {hasImages && <ImageIcon className="h-4 w-4 mr-2" />}
                Recursos
              </TabsTrigger>
            )}
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
                  {isLoadingHistory ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Carregando histórico...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Evento: Criação */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          {history.length > 0 && <div className="h-full w-px bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="font-medium">Protocolo Criado</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Por: {protocol.citizen?.name || 'Sistema'}
                          </div>
                        </div>
                      </div>

                      {/* Eventos do histórico */}
                      {history.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {event.action === 'STATUS_CHANGE' && <AlertCircle className="h-5 w-5 text-blue-600" />}
                              {event.action === 'APPROVED' && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {event.action === 'REJECTED' && <XCircle className="h-5 w-5 text-red-600" />}
                              {event.action === 'COMMENT' && <FileText className="h-5 w-5 text-gray-600" />}
                            </div>
                            {index < history.length - 1 && <div className="h-full w-px bg-border mt-2" />}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="font-medium">{event.description || event.action}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                            {event.performedBy && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Por: {event.performedBy.name}
                              </div>
                            )}
                            {event.notes && (
                              <div className="text-sm mt-2 p-2 bg-muted rounded">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {history.length === 0 && !isLoadingHistory && (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Nenhum evento adicional registrado
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* ========== ABA: DOCUMENTOS ========== */}
          <TabsContent value="documents" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {isLoadingDocs ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando documentos...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Cabeçalho com resumo */}
                  {documents.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{documents.length}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {documents.filter(d => d.status === 'APPROVED').length}
                              </div>
                              <div className="text-xs text-muted-foreground">Aprovados</div>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-600">
                                {documents.filter(d => d.status === 'PENDING' || d.status === 'UPLOADED').length}
                              </div>
                              <div className="text-xs text-muted-foreground">Pendentes</div>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {documents.filter(d => d.status === 'REJECTED').length}
                              </div>
                              <div className="text-xs text-muted-foreground">Rejeitados</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documentos Obrigatórios */}
                  {documents.filter(d => d.isRequired).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Documentos Obrigatórios
                      </h4>
                      <div className="space-y-3">
                        {documents.filter(d => d.isRequired).map((doc) => (
                          <Card key={doc.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h5 className="font-medium">{doc.documentType || doc.fileName}</h5>
                                    <Badge
                                      variant={
                                        doc.status === 'APPROVED' ? 'default' :
                                        doc.status === 'REJECTED' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {doc.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                      {doc.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                                      {doc.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                                      {doc.status}
                                    </Badge>
                                    <Badge variant="destructive" className="text-xs">
                                      Obrigatório
                                    </Badge>
                                  </div>
                                  {doc.fileName && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Arquivo:</strong> {doc.fileName}
                                      {doc.fileSize && ` (${(doc.fileSize / 1024).toFixed(2)} KB)`}
                                    </p>
                                  )}
                                  {doc.uploadedAt && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Enviado em:</strong>{' '}
                                      {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  )}
                                  {doc.validatedAt && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Validado em:</strong>{' '}
                                      {format(new Date(doc.validatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  )}
                                  {doc.rejectionReason && (
                                    <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
                                      <strong>Motivo da rejeição:</strong> {doc.rejectionReason}
                                    </p>
                                  )}
                                </div>
                                {doc.fileUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Abrir
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documentos Opcionais */}
                  {documents.filter(d => !d.isRequired).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Documentos Opcionais</h4>
                      <div className="space-y-3">
                        {documents.filter(d => !d.isRequired).map((doc) => (
                          <Card key={doc.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h5 className="font-medium">{doc.documentType || doc.fileName}</h5>
                                    <Badge
                                      variant={
                                        doc.status === 'APPROVED' ? 'default' :
                                        doc.status === 'REJECTED' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {doc.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                      {doc.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                                      {doc.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                                      {doc.status}
                                    </Badge>
                                  </div>
                                  {doc.fileName && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Arquivo:</strong> {doc.fileName}
                                      {doc.fileSize && ` (${(doc.fileSize / 1024).toFixed(2)} KB)`}
                                    </p>
                                  )}
                                  {doc.uploadedAt && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Enviado em:</strong>{' '}
                                      {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  )}
                                </div>
                                {doc.fileUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Abrir
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estado vazio */}
                  {documents.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum documento requerido para este protocolo</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ========== ABA: RECURSOS AVANÇADOS ========== */}
          {hasAdvancedFeatures && (
            <TabsContent value="advanced" className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                <AdvancedFeaturesTab protocol={protocol} service={service} />
              </ScrollArea>
            </TabsContent>
          )}

          {/* ========== ABA: AÇÕES ========== */}
          <TabsContent value="actions" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(protocol.status === 'VINCULADO' || protocol.status === 'PENDENCIA') && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Este protocolo está pendente de processamento. Escolha uma ação:
                      </p>
                      <ApprovalActions
                        itemId={protocol.id}
                        itemType="Protocolo"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        size="default"
                      />
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Outras Ações</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveTab('details');
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Dados
                          </Button>
                          {hasAdvancedFeatures && (
                            <Button variant="outline" onClick={() => setActiveTab('advanced')}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Ver Recursos
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {protocol.status === 'PROGRESSO' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900">Protocolo em Progresso</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Este protocolo está sendo processado pela equipe responsável.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setActiveTab('timeline')}>
                          <History className="h-4 w-4 mr-2" />
                          Ver Histórico
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('documents')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Documentos
                        </Button>
                      </div>
                    </div>
                  )}

                  {protocol.status === 'CONCLUIDO' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900">Protocolo Concluído</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Este protocolo foi concluído com sucesso.
                            </p>
                            {protocol.completedAt && (
                              <p className="text-sm text-green-600 mt-2">
                                Finalizado em: {format(new Date(protocol.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setActiveTab('timeline')}>
                          <History className="h-4 w-4 mr-2" />
                          Ver Histórico Completo
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('documents')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Documentos
                        </Button>
                      </div>
                    </div>
                  )}

                  {protocol.status === 'CANCELADO' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-900">Protocolo Cancelado</h4>
                            <p className="text-sm text-red-700 mt-1">
                              Este protocolo foi cancelado.
                            </p>
                            {protocol.cancellationReason && (
                              <p className="text-sm text-red-600 mt-2">
                                <strong>Motivo:</strong> {protocol.cancellationReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => setActiveTab('timeline')}>
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </Button>
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
