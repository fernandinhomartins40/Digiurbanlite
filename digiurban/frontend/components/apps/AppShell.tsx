'use client';

/**
 * Moldura única dos apps (/admin/apps/*): voltar para Apps, título, descrição
 * de uma linha, ações, números do topo, abas e os estados padronizados
 * (carregando, vazio, erro). Só invólucro: a lógica fica em cada app.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Inbox, LucideIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface AppTab {
  value: string;
  label: ReactNode;
}

export function AppShell({
  title,
  description,
  icon: Icon,
  iconClassName,
  actions,
  header,
  summary,
  tabs,
  defaultTab,
  tab,
  onTabChange,
  backHref = '/admin/apps',
  className,
  children,
}: {
  title: ReactNode;
  /** Uma linha: o que se faz neste app */
  description?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  /** Botões à direita do título (filtro de secretaria, "Novo...") */
  actions?: ReactNode;
  /** Cabeçalho próprio do app (ex.: HealthAppHeader) no lugar do padrão */
  header?: ReactNode;
  /** Números e avisos entre o cabeçalho e as abas */
  summary?: ReactNode;
  /** Com abas, os filhos são os <TabsContent value="..."> */
  tabs?: AppTab[];
  defaultTab?: string;
  tab?: string;
  onTabChange?: (value: string) => void;
  backHref?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('space-y-6 p-4 sm:p-6', className)}>
      {header ?? (
        <div className="space-y-2">
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-[var(--lg-blue)] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Apps
          </Link>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                {Icon && <Icon className={cn('h-8 w-8 shrink-0 text-[var(--lg-blue)]', iconClassName)} />}
                {title}
              </h1>
              {description && <p className="mt-1 text-gray-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {summary}

      {tabs?.length ? (
        <Tabs defaultValue={defaultTab ?? tabs[0].value} value={tab} onValueChange={onTabChange}>
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList>
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {children}
        </Tabs>
      ) : (
        children
      )}
    </div>
  );
}

/** Carregando: linhas em esqueleto (no lugar de "Carregando...") */
export function AppLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Nada para mostrar: frase curta e, se fizer sentido, o que fazer */
export function AppEmpty({ title, hint, icon: Icon = Inbox, action }: { title: ReactNode; hint?: ReactNode; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="mb-2 h-8 w-8 text-gray-300" />
      <p className="text-gray-500">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-gray-400">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Não carregou: explica e deixa tentar de novo */
export function AppError({ message, onRetry }: { message?: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-amber-500" />
      <p className="font-medium text-gray-700">Não foi possível carregar</p>
      {message && <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          <RefreshCw className="mr-1 h-4 w-4" /> Tentar de novo
        </Button>
      )}
    </div>
  );
}

/** Os três estados de uma lista numa linha: carregando → erro → vazio → conteúdo */
export function AppState({ loading, error, onRetry, empty, isEmpty, children }: { loading?: boolean; error?: string | null; onRetry?: () => void; empty: ReactNode; isEmpty: boolean; children: ReactNode }) {
  if (loading) return <AppLoading />;
  if (error) return <AppError message={error} onRetry={onRetry} />;
  if (isEmpty) return typeof empty === 'string' ? <AppEmpty title={empty} /> : <>{empty}</>;
  return <>{children}</>;
}
