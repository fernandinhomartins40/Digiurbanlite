'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

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

export function MessageCard({ card, onAction }: MessageCardProps) {
  const handleAction = () => {
    if (onAction) {
      onAction(card);
    }
  };

  const getStatusColor = (status?: string) => {
    const statusColors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_ANALYSIS': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };

    return statusColors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status?: string) => {
    const statusLabels: Record<string, string> = {
      'PENDING': 'Pendente',
      'IN_ANALYSIS': 'Em Análise',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'COMPLETED': 'Concluído',
      'CANCELLED': 'Cancelado'
    };

    return statusLabels[status || ''] || status;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleAction}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold line-clamp-2">
                {card.title}
              </CardTitle>
              {card.description && (
                <CardDescription className="text-xs mt-1 line-clamp-2">
                  {card.description}
                </CardDescription>
              )}
            </div>
          </div>
          {card.status && (
            <Badge className={`${getStatusColor(card.status)} text-xs whitespace-nowrap`}>
              {getStatusLabel(card.status)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {card.department && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{card.department}</span>
            </div>
          )}

          {card.estimatedDays !== undefined && card.estimatedDays !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {card.estimatedDays > 0 ? `${card.estimatedDays} dias` : 'Imediato'}
              </span>
            </div>
          )}

          {card.date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{card.date}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {card.action && (
          <Button
            onClick={handleAction}
            variant="outline"
            size="sm"
            className="w-full text-xs group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
          >
            {card.action.label}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para múltiplos cards
interface MessageCardsProps {
  cards: MessageCardData[];
  onAction?: (card: MessageCardData) => void;
}

export function MessageCards({ cards, onAction }: MessageCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
      {cards.map((card) => (
        <MessageCard key={card.id} card={card} onAction={onAction} />
      ))}
    </div>
  );
}
