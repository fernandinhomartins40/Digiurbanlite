'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Building2, Clock, ArrowRight } from 'lucide-react';

export interface MessageCardData {
  id: string;
  title: string;
  description?: string;
  department?: string;
  estimatedDays?: number | null;
  date?: string;
  status?: string;
  action?: {
    type: 'open_service' | 'open_protocol' | 'open_document' | 'custom';
    label: string;
    serviceId?: string;
    protocolId?: string;
    url?: string;
  };
}

interface MessageCardProps {
  card: MessageCardData;
  onAction?: (card: MessageCardData) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
  IN_ANALYSIS: 'bg-blue-50 text-blue-800 border border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border border-rose-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_ANALYSIS: 'Em Análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export function MessageCard({ card, onAction }: MessageCardProps) {
  const handleAction = () => onAction?.(card);
  const handleButtonAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAction?.(card);
  };

  return (
    <Card className="w-full min-w-0 max-w-full border-blue-100 bg-white hover:border-teal-400 hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={handleAction}>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 p-2 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg ring-1 ring-blue-100">
            <FileText className="w-4 h-4 text-blue-700" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold break-words leading-snug">
              {card.title}
            </CardTitle>
            {card.description && (
              <CardDescription className="text-xs mt-1 break-words leading-relaxed">
                {card.description}
              </CardDescription>
            )}
          </div>
          {card.status && (
            <Badge className={`${STATUS_COLORS[card.status] ?? 'bg-gray-100 text-gray-800'} text-[10px] shrink-0 whitespace-nowrap max-[360px]:max-w-[96px] max-[360px]:truncate`}>
              {STATUS_LABELS[card.status] ?? card.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-1.5 mb-3">
          {card.department && (
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-600">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{card.department}</span>
            </div>
          )}
          {card.estimatedDays !== undefined && card.estimatedDays !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{card.estimatedDays > 0 ? `${card.estimatedDays} dias` : 'Imediato'}</span>
            </div>
          )}
          {card.date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{card.date}</span>
            </div>
          )}
        </div>

        {card.action && (
          <Button
            onClick={handleButtonAction}
            variant="outline"
            size="sm"
            className="w-full rounded-lg text-xs group border-blue-200 text-blue-800 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-500"
          >
            <span className="truncate">{card.action.label}</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface MessageCardsProps {
  cards: MessageCardData[];
  onAction?: (card: MessageCardData) => void;
}

export function MessageCards({ cards, onAction }: MessageCardsProps) {
  if (!cards || cards.length === 0) return null;
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 my-2">
      {cards.map((card) => (
        <MessageCard key={card.id} card={card} onAction={onAction} />
      ))}
    </div>
  );
}
