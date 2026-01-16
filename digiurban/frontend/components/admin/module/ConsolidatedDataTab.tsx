'use client';

/**
 * ABA: Dados Consolidados
 * Componente inteligente que adapta visualização baseado no tipo de serviço
 */

import { useMemo } from 'react';
import { detectConsolidatedMode } from '@/lib/consolidated-data-intelligence';
import { useConsolidatedData } from '@/hooks/useConsolidatedData';

// Views específicas por modo
import { CadastrosView } from './consolidated-views/CadastrosView';
import { InscricoesView } from './consolidated-views/InscricoesView';
import { DenunciasMapView } from './consolidated-views/DenunciasMapView';
import { LicencasTimelineView } from './consolidated-views/LicencasTimelineView';
import { AgendamentosCalendarView } from './consolidated-views/AgendamentosCalendarView';
import { GenericTableView } from './consolidated-views/GenericTableView';

interface ConsolidatedDataTabProps {
  protocols: any[];
  service: any;
}

export function ConsolidatedDataTab({ protocols, service }: ConsolidatedDataTabProps) {
  // Detectar modo automaticamente
  const config = useMemo(() => detectConsolidatedMode(service), [service]);

  // Buscar e processar dados
  const consolidatedData = useConsolidatedData({ protocols, config });

  // Renderizar view baseada no modo
  switch (config.mode) {
    case 'CADASTRO':
      return <CadastrosView config={config} data={consolidatedData} />;

    case 'INSCRICOES':
      return <InscricoesView config={config} data={consolidatedData} />;

    case 'DENUNCIA':
      return <DenunciasMapView config={config} data={consolidatedData} />;

    case 'LICENCA':
      return <LicencasTimelineView config={config} data={consolidatedData} />;

    case 'AGENDAMENTO':
      return <AgendamentosCalendarView config={config} data={consolidatedData} />;

    default:
      return <GenericTableView config={config} data={consolidatedData} />;
  }
}
