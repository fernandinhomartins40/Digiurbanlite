// ============================================================
// PÁGINA: SERVIÇOS GERAIS (SEM_DADOS)
// ============================================================
// Página agregada para gerenciar múltiplos serviços SEM_DADOS

'use client';

import { use } from 'react';
import { NoDataServicesView } from '@/components/admin/modules/NoDataServicesView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{
    department: string;
  }>;
}

// Mapeamento de slugs para nomes dos departamentos
const DEPARTMENT_NAMES: Record<string, string> = {
  'agricultura': 'Agricultura',
  'assistencia-social': 'Assistência Social',
  'cultura': 'Cultura',
  'educacao': 'Educação',
  'esportes': 'Esportes',
  'habitacao': 'Habitação',
  'meio-ambiente': 'Meio Ambiente',
  'obras-publicas': 'Obras Públicas',
  'planejamento-urbano': 'Planejamento Urbano',
  'saude': 'Saúde',
  'seguranca-publica': 'Segurança Pública',
  'servicos-publicos': 'Serviços Públicos',
  'turismo': 'Turismo'
};

export default function ServicosGeraisPage({ params }: PageProps) {
  const { department } = use(params);
  const departmentName = DEPARTMENT_NAMES[department] || department;

  return (
    <div className="container mx-auto py-6 px-4">
      <NoDataServicesView
        departmentSlug={department}
        departmentName={departmentName}
      />
    </div>
  );
}
