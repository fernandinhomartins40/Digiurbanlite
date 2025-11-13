'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ApprovalActions } from '@/components/admin/ApprovalActions';
import {
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Image as ImageIcon,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ApprovalQueueProps {
  protocols: any[];
  service: any;
  onViewDetails: (protocol: any) => void;
  onRefresh?: () => void;
}

export function ApprovalQueue({
  protocols,
  service,
  onViewDetails,
  onRefresh
}: ApprovalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtrar apenas protocolos pendentes de aprovação
  const pendingProtocols = protocols.filter(
    (p) => p.status === 'VINCULADO' || p.status === 'PENDENCIA'
  );

  // Formatar valor dinâmico
  const formatValue = (value: any, fieldSchema?: any): string => {
    if (value === null || value === undefined) return '—';

    if (fieldSchema?.type === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    if (fieldSchema?.format === 'date' || fieldSchema?.format === 'date-time') {
      try {
        return format(
          new Date(value),
          fieldSchema.format === 'date-time' ? "dd/MM/yyyy 'às' HH:mm" : 'dd/MM/yyyy',
          { locale: ptBR }
        );
      } catch {
        return String(value);
      }
    }

    if (fieldSchema?.enum && fieldSchema?.enumNames) {
      const index = fieldSchema.enum.indexOf(value);
      return fieldSchema.enumNames[index] || String(value);
    }

    return String(value);
  };

  // Aprovar protocolo
  const handleApprove = async (protocolId: string, notes?: string) => {
    setProcessingId(protocolId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar protocolo');
      }

      toast.success('Protocolo aprovado com sucesso!');
      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.message || 'Erro ao aprovar protocolo');
    } finally {
      setProcessingId(null);
    }
  };

  // Rejeitar protocolo
  const handleReject = async (protocolId: string, reason: string) => {
    setProcessingId(protocolId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao rejeitar protocolo');
      }

      toast.success('Protocolo rejeitado');
      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error);
      toast.error(error.message || 'Erro ao rejeitar protocolo');
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingProtocols.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium">Nenhuma solicitação pendente</p>
          <p className="text-sm text-muted-foreground">
            Todas as solicitações foram processadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Fila de Aprovação
              </CardTitle>
              <CardDescription>
                {pendingProtocols.length} solicitação(ões) aguardando análise
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de protocolos pendentes */}
      <div className="space-y-4">
        {pendingProtocols.map((protocol) => {
          // Extrair primeiros 4 campos do customData para preview
          const previewFields = protocol.customData
            ? Object.entries(protocol.customData).slice(0, 4)
            : [];

          const hasPendingDocuments = protocol.documentFiles?.some(
            (d: any) => d.status === 'UPLOADED' || d.status === 'PENDING'
          );

          return (
            <Card
              key={protocol.id}
              className={`border-2 ${
                protocol.status === 'PENDENCIA'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-yellow-200 bg-yellow-50/50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{protocol.number || protocol.protocolNumber}
                      </Badge>
                      {protocol.status === 'PENDENCIA' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Com Pendência
                        </Badge>
                      )}
                      {protocol.priority === 1 && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg">{protocol.title}</h4>
                      {protocol.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {protocol.description}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Solicitado há{' '}
                      {formatDistanceToNow(new Date(protocol.createdAt), {
                        locale: ptBR
                      })}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(protocol)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Completo
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preview dos dados */}
                {previewFields.length > 0 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {previewFields.map(([key, value]) => {
                        const fieldSchema = service?.formSchema?.properties?.[key];
                        const label = fieldSchema?.title || key;

                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              {label}
                            </Label>
                            <p className="text-sm font-medium">
                              {formatValue(value, fieldSchema)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Alertas */}
                {hasPendingDocuments && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      {protocol.documentFiles.filter(
                        (d: any) => d.status === 'UPLOADED' || d.status === 'PENDING'
                      ).length}{' '}
                      documento(s) aguardando validação
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recursos disponíveis */}
                <div className="flex gap-2 flex-wrap">
                  {protocol.latitude && protocol.longitude && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      Com Localização
                    </Badge>
                  )}
                  {protocol.customData?.images && protocol.customData.images.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {protocol.customData.images.length} Foto(s)
                    </Badge>
                  )}
                  {protocol.documentFiles && protocol.documentFiles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {protocol.documentFiles.length} Documento(s)
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Ações de aprovação */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {protocol.citizen?.name && (
                      <span>Solicitante: {protocol.citizen.name}</span>
                    )}
                  </div>

                  <ApprovalActions
                    itemId={protocol.id}
                    itemType="Protocolo"
                    onApprove={handleApprove}
                    onReject={handleReject}
                    size="default"
                    disabled={processingId === protocol.id}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
