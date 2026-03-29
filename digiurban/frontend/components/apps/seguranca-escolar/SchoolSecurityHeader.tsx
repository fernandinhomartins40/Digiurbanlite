'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SchoolSecurityHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

export function SchoolSecurityHeader({
  title,
  description,
  icon: Icon,
  actions,
}: SchoolSecurityHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/secretarias/educacao')}
          className="mt-1 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-3 text-amber-700 sm:flex'
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p>
          </div>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
