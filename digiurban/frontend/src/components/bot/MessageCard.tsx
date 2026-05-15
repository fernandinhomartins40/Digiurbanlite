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
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_ANALYSIS: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
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
    <Card className="w-full min-w-0 max-w-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={handleAction}>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 p-2 bg-blue-100 rounded-lg">
            <FileText className="w-4 h-4 text-blue-600" />
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
            className="w-full text-xs group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
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
