'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface HealthAppHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  backHref?: string;
  actions?: ReactNode;
  badge?: ReactNode;
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
  iconContainerClassName,
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="mt-1 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'hidden rounded-xl border border-red-100 bg-red-50 p-3 text-red-600 sm:flex',
              iconContainerClassName
            )}
          >
            <Icon className={cn('h-6 w-6', iconClassName)} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
              {badge}
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
