'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Archive
} from 'lucide-react';

type Status =
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'cancelled'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'archived';

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
}

const statusConfig: Record<Status, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  className?: string;
}> = {
  pending: {
    label: 'Pendente',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  pending_approval: {
    label: 'Aguardando Aprovação',
    variant: 'secondary',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  approved: {
    label: 'Aprovado',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  active: {
    label: 'Ativo',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  rejected: {
    label: 'Rejeitado',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300'
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300'
  },
  in_progress: {
    label: 'Em Andamento',
    variant: 'default',
    icon: PlayCircle,
    className: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  completed: {
    label: 'Concluído',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  on_hold: {
    label: 'Em Espera',
    variant: 'secondary',
    icon: PauseCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  archived: {
    label: 'Arquivado',
    variant: 'outline',
    icon: Archive,
    className: 'bg-gray-50 text-gray-600 border-gray-200'
  }
};

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {customLabel || config.label}
    </Badge>
  );
}
