'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MapPin,
  Image,
  AlertTriangle
} from 'lucide-react';

interface ProtocolListProps {
  protocols: any[];
  onSelect: (protocol: any) => void;
}

export function ProtocolList({ protocols, onSelect }: ProtocolListProps) {
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    VINCULADO: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    PROGRESSO: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle },
    CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
    PENDENCIA: { label: 'Com Pendência', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle }
  };

  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object' && value instanceof Date) {
      return format(value, 'dd/MM/yyyy', { locale: ptBR });
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return value;
      }
    }
    return String(value);
  };

  if (protocols.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {protocols.map((protocol) => {
        const statusInfo = statusConfig[protocol.status] || statusConfig.VINCULADO;
        const StatusIcon = statusInfo.icon;

        // Extrair primeiros campos do customData para preview
        const previewFields = protocol.customData
          ? Object.entries(protocol.customData).slice(0, 3)
          : [];

        return (
          <Card
            key={protocol.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
            onClick={() => onSelect(protocol)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono">
                    #{protocol.number || protocol.protocolNumber}
                  </Badge>
                  <Badge variant="outline" className={statusInfo.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  {protocol.priority === 1 && (
                    <Badge variant="destructive">Urgente</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(protocol.createdAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <h4 className="font-medium text-lg">{protocol.title}</h4>

              {protocol.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {protocol.description}
                </p>
              )}

              {/* Preview dos dados customData */}
              {previewFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t">
                  {previewFields.map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {formatFieldName(key)}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {formatValue(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Badges de recursos */}
              <div className="flex gap-2 flex-wrap pt-2">
                {protocol.documentFiles && protocol.documentFiles.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {protocol.documentFiles.length} documento(s)
                  </Badge>
                )}
                {protocol.latitude && protocol.longitude && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Localização
                  </Badge>
                )}
                {protocol.customData?.images && protocol.customData.images.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Image className="h-3 w-3 mr-1" />
                    {protocol.customData.images.length} foto(s)
                  </Badge>
                )}
                {protocol.pendings && protocol.pendings.filter((p: any) => p.status === 'OPEN').length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {protocol.pendings.filter((p: any) => p.status === 'OPEN').length} pendência(s)
                  </Badge>
                )}
              </div>

              {/* Informações adicionais */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                {protocol.citizen?.name && (
                  <span>👤 {protocol.citizen.name}</span>
                )}
                {protocol.createdAt && (
                  <span>📅 {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
