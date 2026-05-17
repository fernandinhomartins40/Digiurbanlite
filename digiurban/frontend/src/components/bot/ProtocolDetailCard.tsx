'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  SkipForward,
  AlertTriangle,
  Building2,
  FileText,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StageData {
  id: string;
  name: string;
  order: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface ProtocolDetailCardData {
  type?: string;
  protocol: {
    id?: string;
    number: string;
    title: string;
    status: string;
    priority?: number;
    createdAt: string;
    concludedAt?: string | null;
  };
  service: {
    name: string;
    estimatedDays?: number | null;
    category?: string | null;
  };
  department: {
    name: string;
  };
  stages: StageData[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  sla?: {
    expectedEndDate?: string;
    isOverdue?: boolean;
    daysOverdue?: number;
  } | null;
  openPendingsCount: number;
}

interface ProtocolDetailCardProps {
  data: ProtocolDetailCardData;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  VINCULADO: { label: 'Vinculado', className: 'bg-blue-50 text-blue-800 border border-blue-200' },
  PROGRESSO: { label: 'Em Progresso', className: 'bg-blue-50 text-blue-800 border border-blue-200' },
  PENDENCIA: { label: 'Pendencia', className: 'bg-amber-50 text-amber-800 border border-amber-200' },
  ATUALIZACAO: { label: 'Atualizado', className: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
  CONCLUIDO: { label: 'Concluido', className: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  CANCELADO: { label: 'Cancelado', className: 'bg-rose-50 text-rose-800 border border-rose-200' },
};

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function StageIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-blue-700 animate-pulse flex-shrink-0" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
    case 'SKIPPED':
      return <SkipForward className="h-4 w-4 text-gray-400 flex-shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />;
  }
}

export function ProtocolDetailCard({ data }: ProtocolDetailCardProps) {
  const { protocol, service, department, stages, progress, sla, openPendingsCount } = data;
  const statusConfig = STATUS_CONFIG[protocol.status] || { label: protocol.status, className: 'bg-gray-100 text-gray-800' };
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <Card className="w-full min-w-0 max-w-full border-blue-100 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header: Numero + Status */}
        <div className="flex min-w-0 items-start justify-between gap-2 p-3 pb-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate font-mono font-medium">#{protocol.number}</span>
            </div>
            <h4 className="text-sm font-semibold leading-tight line-clamp-2">
              {protocol.title || service.name}
            </h4>
          </div>
          <Badge className={`${statusConfig.className} text-xs whitespace-nowrap flex-shrink-0 max-[360px]:max-w-[96px] max-[360px]:truncate`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Info: Servico + Departamento */}
        <div className="px-3 py-2 space-y-1 border-b text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{service.name}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{department.name}</span>
          </div>
        </div>

        {/* Stages Timeline (vertical) */}
        {sortedStages.length > 0 && (
          <div className="px-3 py-2 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progresso</span>
              <span className="text-xs text-muted-foreground">
                {progress.completed}/{progress.total} ({progress.percent}%)
              </span>
            </div>
            <Progress value={progress.percent} className="h-2 mb-3" />

            <div className="space-y-0">
              {sortedStages.map((stage, index) => {
                const isCurrentStage = stage.status === 'IN_PROGRESS';
                const isCompleted = stage.status === 'COMPLETED';
                const isLast = index === sortedStages.length - 1;

                return (
                  <div key={stage.id} className="flex items-stretch gap-2">
                    {/* Linha vertical + icone */}
                    <div className="flex flex-col items-center w-4">
                      <StageIcon status={stage.status} />
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[12px] ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Nome da etapa */}
                    <div className={`min-w-0 flex-1 pb-2 ${isLast ? 'pb-0' : ''}`}>
                      <span className={`text-xs leading-tight ${
                        isCurrentStage ? 'font-semibold text-blue-700' :
                        isCompleted ? 'text-emerald-700' :
                        'text-muted-foreground'
                      } break-words [overflow-wrap:anywhere]`}>
                        {stage.name}
                      </span>
                      {isCurrentStage && (
                        <Badge variant="default" className="ml-1.5 bg-teal-700 text-[10px] px-1.5 py-0 h-4">
                          Atual
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Datas + Alertas */}
        <div className="px-3 py-2 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Criado em {formatDate(protocol.createdAt)}</span>
          </div>

          {protocol.concludedAt && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Concluido em {formatDate(protocol.concludedAt)}</span>
            </div>
          )}

          {service.estimatedDays && !protocol.concludedAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Prazo estimado: {service.estimatedDays} dias uteis</span>
            </div>
          )}

          {sla?.isOverdue && (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>SLA vencido ha {sla.daysOverdue} dia{(sla.daysOverdue || 0) > 1 ? 's' : ''}</span>
            </div>
          )}

          {openPendingsCount > 0 && (
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{openPendingsCount} pendencia{openPendingsCount > 1 ? 's' : ''} aberta{openPendingsCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
