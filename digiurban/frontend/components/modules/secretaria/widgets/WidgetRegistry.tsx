'use client';

/**
 * ============================================================================
 * WidgetRegistry — mapeia WidgetType → componente de widget
 * ============================================================================
 * O DataWorkspace usa este registro para renderizar cada widget do layout.
 * Cada widget recebe (code, schema, config). Novos tipos entram aqui.
 * Ver PLANO-MODULO-GESTAO-DADOS-WIDGETS.md.
 * ============================================================================
 */

import dynamic from 'next/dynamic';
import type { EntityType, WidgetType } from '@/services/registry.service';
import { StatsWidget } from './StatsWidget';
import { TableWidget } from './TableWidget';
import { FilterWidget } from './FilterWidget';
import { ChartWidget } from './ChartWidget';
import { TimelineWidget } from './TimelineWidget';
import { ApprovalWidget } from './ApprovalWidget';
import { EnrollmentWidget } from './EnrollmentWidget';
import { CardsWidget } from './CardsWidget';
import { AgendaWidget } from './AgendaWidget';

// Mapa só no cliente (Leaflet).
const MapWidget = dynamic(() => import('./MapWidget').then((m) => m.MapWidget), { ssr: false, loading: () => <WidgetSkeleton label="mapa" /> });

export interface WidgetProps {
  code: string;
  schema: EntityType;
  config?: Record<string, unknown>;
  /** filtros compartilhados entre widgets (ex.: FilterWidget alimenta TableWidget). */
  sharedFilters?: Record<string, unknown>;
  onFiltersChange?: (f: Record<string, unknown>) => void;
  reloadKey?: number;
  onChanged?: () => void;
}

export function WidgetSkeleton({ label }: { label: string }) {
  return <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">Carregando {label}…</div>;
}

const REGISTRY: Partial<Record<WidgetType, React.ComponentType<WidgetProps>>> = {
  STATS: StatsWidget,
  TABLE: TableWidget,
  CARDS: CardsWidget,
  FILTER: FilterWidget,
  CHART: ChartWidget,
  TIMELINE: TimelineWidget,
  APPROVAL: ApprovalWidget,
  ENROLLMENT: EnrollmentWidget,
  AGENDA: AgendaWidget,
  MAP: MapWidget as unknown as React.ComponentType<WidgetProps>,
  // DETAIL/RELATIONS/SAVED_QUERY: DETAIL e RELATIONS abrem no clique do registro;
  // SAVED_QUERY é renderizado como TABLE/CHART/STATS conforme config.view (W5).
};

export function renderWidget(type: WidgetType, props: WidgetProps): React.ReactNode {
  // SAVED_QUERY: delega ao componente da visualização escolhida, aplicando os
  // filtros salvos no config (fixos, sobrepõem os filtros compartilhados).
  if (type === 'SAVED_QUERY') {
    const view = (props.config?.view as WidgetType) || 'TABLE';
    const Comp = REGISTRY[view] || TableWidget;
    const savedFilters = (props.config?.filters as Record<string, unknown>) || {};
    return <Comp {...props} sharedFilters={{ ...props.sharedFilters, ...savedFilters }} />;
  }
  const Comp = REGISTRY[type];
  if (!Comp) return null;
  return <Comp {...props} />;
}

/** Largura padrão de cada tipo na grade (colunas de 12). */
export function widgetSpan(type: WidgetType): number {
  switch (type) {
    case 'STATS': return 12;
    case 'FILTER': return 12;
    case 'TABLE': return 12;
    case 'ENROLLMENT': return 12;
    case 'APPROVAL': return 12;
    case 'MAP': return 8;
    case 'AGENDA': return 8;
    case 'CHART': return 6;
    case 'TIMELINE': return 6;
    case 'CARDS': return 12;
    default: return 6;
  }
}
