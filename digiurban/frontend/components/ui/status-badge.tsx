'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusVariants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  secondary: 'bg-secondary text-secondary-foreground',
};

const sizeVariants = {
  sm: 'px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs',
  md: 'px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm',
  lg: 'px-3 md:px-4 py-1 md:py-2 text-sm md:text-base',
};

// Predefined status mappings for common use cases
const statusMappings: Record<string, { variant: keyof typeof statusVariants; label: string }> = {
  // Tenant Status
  ACTIVE: { variant: 'success', label: 'Ativo' },
  INACTIVE: { variant: 'default', label: 'Inativo' },
  SUSPENDED: { variant: 'warning', label: 'Suspenso' },
  TRIAL: { variant: 'info', label: 'Trial' },
  CANCELLED: { variant: 'error', label: 'Cancelado' },

  // Invoice Status
  PENDING: { variant: 'warning', label: 'Pendente' },
  PAID: { variant: 'success', label: 'Pago' },
  OVERDUE: { variant: 'error', label: 'Vencido' },

  // Protocol Status
  VINCULADO: { variant: 'info', label: 'Vinculado' },
  PROGRESSO: { variant: 'warning', label: 'Em Progresso' },
  ATUALIZACAO: { variant: 'secondary', label: 'Atualização' },
  CONCLUIDO: { variant: 'success', label: 'Concluído' },
  PENDENCIA: { variant: 'error', label: 'Pendência' },

  // User Status
  USER: { variant: 'default', label: 'Usuário' },
  COORDINATOR: { variant: 'info', label: 'Coordenador' },
  MANAGER: { variant: 'warning', label: 'Gerente' },
  ADMIN: { variant: 'success', label: 'Admin' },
  SUPER_ADMIN: { variant: 'error', label: 'Super Admin' },

  // Plan Status
  STARTER: { variant: 'info', label: 'Starter' },
  PROFESSIONAL: { variant: 'warning', label: 'Professional' },
  ENTERPRISE: { variant: 'success', label: 'Enterprise' },

  // Generic Status
  NEW: { variant: 'info', label: 'Novo' },
  PROCESSING: { variant: 'warning', label: 'Processando' },
  COMPLETED: { variant: 'success', label: 'Completo' },
  FAILED: { variant: 'error', label: 'Falhou' },
  DRAFT: { variant: 'default', label: 'Rascunho' },
  PUBLISHED: { variant: 'success', label: 'Publicado' },
  ARCHIVED: { variant: 'secondary', label: 'Arquivado' },
};

export function StatusBadge({
  status,
  variant,
  size = 'md',
  className
}: StatusBadgeProps) {
  // Use predefined mapping if available, otherwise use provided variant or default
  const mapping = statusMappings[status];
  const badgeVariant = variant || mapping?.variant || 'default';
  const displayLabel = mapping?.label || status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        statusVariants[badgeVariant],
        sizeVariants[size],
        className
      )}
    >
      {displayLabel}
    </span>
  );
}

// Component for status with icon
interface StatusBadgeWithIconProps extends StatusBadgeProps {
  icon?: React.ReactNode;
  showDot?: boolean;
}

export function StatusBadgeWithIcon({
  status,
  variant,
  size = 'md',
  icon,
  showDot = true,
  className
}: StatusBadgeWithIconProps) {
  const mapping = statusMappings[status];
  const badgeVariant = variant || mapping?.variant || 'default';
  const displayLabel = mapping?.label || status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium gap-1.5',
        statusVariants[badgeVariant],
        sizeVariants[size],
        className
      )}
    >
      {showDot && !icon && (
        <div className="w-2 h-2 rounded-full bg-current opacity-75" />
      )}
      {icon && <span className="w-3 h-3">{icon}</span>}
      {displayLabel}
    </span>
  );
}

// Predefined status badges for common use cases
export function TenantStatusBadge({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} className={className} />;
}

export function InvoiceStatusBadge({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} className={className} />;
}

export function ProtocolStatusBadge({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} className={className} />;
}

export function UserRoleBadge({ role, className }: { role: string; className?: string }) {
  return <StatusBadge status={role} className={className} />;
}

export function PlanBadge({ plan, className }: { plan: string; className?: string }) {
  return <StatusBadge status={plan} className={className} />;
}