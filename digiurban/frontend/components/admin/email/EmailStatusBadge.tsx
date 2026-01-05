import { CheckCircle, XCircle, Clock, Send, AlertCircle } from 'lucide-react';

interface EmailStatusBadgeProps {
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  QUEUED: {
    label: 'Na Fila',
    icon: Clock,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-200'
  },
  SENDING: {
    label: 'Enviando',
    icon: Send,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200'
  },
  SENT: {
    label: 'Enviado',
    icon: Send,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200'
  },
  DELIVERED: {
    label: 'Entregue',
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-200'
  },
  FAILED: {
    label: 'Falhou',
    icon: XCircle,
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200'
  },
  BOUNCED: {
    label: 'Rejeitado',
    icon: AlertCircle,
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-200'
  }
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    iconSize: 'h-3 w-3'
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    iconSize: 'h-4 w-4'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    iconSize: 'h-5 w-5'
  }
};

export function EmailStatusBadge({ status, size = 'md' }: EmailStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${config.color} ${config.border} ${sizeClass.padding} ${sizeClass.text}`}
    >
      <Icon className={sizeClass.iconSize} />
      {config.label}
    </span>
  );
}
