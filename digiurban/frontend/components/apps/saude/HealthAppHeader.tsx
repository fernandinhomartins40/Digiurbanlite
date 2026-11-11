'use client';

/**
 * Cabeçalho das telas da Saúde no mesmo visual do AppShell (voltar, título com
 * ícone, descrição de uma linha, ações). Props mantidas para as ~10 telas.
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface HealthAppHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  backHref?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  /** Mantido por compatibilidade: o ícone agora fica ao lado do título, sem caixa */
  iconContainerClassName?: string;
  iconClassName?: string;
}

export function HealthAppHeader({
  title,
  description,
  icon: Icon,
  backHref = '/admin/secretarias/saude',
  actions,
  badge,
  iconClassName,
}: HealthAppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }

    router.back();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-sm text-[var(--lg-blue)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              <Icon className={cn('h-8 w-8 shrink-0 text-red-600', iconClassName)} />
              {title}
            </h1>
            {badge}
          </div>
          <p className="mt-1 text-gray-500">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
