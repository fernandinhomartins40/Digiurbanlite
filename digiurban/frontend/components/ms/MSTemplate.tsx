'use client';

import { ReactNode } from 'react';
import { MSLayout, MSTab } from './MSLayout';
import { MSDataTable, MSColumn, MSAction } from './MSDataTable';
import { WorkflowPanel } from './WorkflowPanel';
import { MSDashboard } from './MSDashboard';
import { useMS } from '@/hooks/useMS';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Settings, BarChart3, List, CheckSquare, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MSConfig {
  // Identificação
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  endpoint: string;
  departmentSlug?: string;

  // Colunas da tabela principal
  columns: MSColumn[];

  // Ações disponíveis em cada registro
  actions?: MSAction[];

  // Status possíveis (para badges e filtros)
  statuses?: {
    value: string;
    label: string;
    color: string;
  }[];

  // Configuração de métricas do dashboard
  metrics?: {
    total: { label: string };
    pending: { label: string };
    approved: { label: string };
    rejected: { label: string };
  };

  // Tabs adicionais customizados (além dos padrões)
  customTabs?: MSTab[];

  // Se possui workflow
  hasWorkflow?: boolean;

  // Se possui relatórios
  hasReports?: boolean;

  // Se possui configurações
  hasSettings?: boolean;

  // Campos do formulário de criação/edição
  formFields?: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'textarea' | 'number';
    required?: boolean;
    options?: { label: string; value: string }[];
  }[];
}

export interface MSTemplateProps {
  config: MSConfig;
}

export function MSTemplate({ config }: MSTemplateProps) {
  const {
    data,
    total,
    page,
    pageSize,
    isLoading,
    filters,
    setFilters,
    setPage,
    refresh,
    create,
    update,
    remove,
  } = useMS({
    endpoint: config.endpoint,
    autoFetch: true,
  });

  // Calcular métricas (para MSDashboard)
  const dashboardMetrics = config.metrics
    ? [
        {
          title: config.metrics.total.label,
          value: total,
          color: 'blue' as const,
        },
        {
          title: config.metrics.pending.label,
          value: data.filter((d) => d.status?.includes('PENDENTE') || d.status?.includes('AGUARDANDO')).length,
          color: 'yellow' as const,
        },
        {
          title: config.metrics.approved.label,
          value: data.filter((d) => d.status?.includes('APROVADO') || d.status?.includes('CONCLUIDO')).length,
          color: 'green' as const,
        },
        {
          title: config.metrics.rejected.label,
          value: data.filter((d) => d.status?.includes('REJEITADO') || d.status?.includes('CANCELADO')).length,
          color: 'red' as const,
        },
      ]
    : [];

  // Métricas para MSLayout (label em vez de title)
  const layoutMetrics = dashboardMetrics.map((m) => ({
    label: m.title,
    value: m.value,
    color: m.color,
  }));

  // Status distribution para o dashboard
  const statusDistribution = config.statuses
    ? config.statuses.map((status) => ({
        label: status.label,
        value: data.filter((d) => d.status === status.value).length,
        color: status.color,
      }))
    : [];

  // Atividades recentes (últimas 5)
  const recentActivity = data.slice(0, 5).map((item) => ({
    id: item.id,
    title: `#${item.id.slice(0, 8)} - ${item.status}`,
    description: item.observacoes || item.descricao || 'Sem descrição',
    timestamp: item.updatedAt || item.createdAt,
    type: item.status?.includes('APROVADO')
      ? ('success' as const)
      : item.status?.includes('REJEITADO')
      ? ('error' as const)
      : ('info' as const),
  }));

  // Tabs padrões
  const defaultTabs: MSTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <MSDashboard
          metrics={dashboardMetrics}
          statusDistribution={statusDistribution}
          recentActivity={recentActivity}
        />
      ),
    },
    {
      id: 'list',
      label: 'Listagem',
      icon: <List className="h-4 w-4" />,
      badge: total,
      content: (
        <MSDataTable
          data={data}
          columns={config.columns}
          actions={config.actions}
          isLoading={isLoading}
          searchPlaceholder={`Buscar em ${config.title}...`}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
          enableSelection={true}
          bulkActions={[
            {
              label: 'Exportar Selecionados',
              icon: <FileText className="h-4 w-4 mr-2" />,
              onClick: (rows) => {
                console.log('Exportar:', rows);
                alert(`Exportando ${rows.length} registros...`);
              },
            },
          ]}
        />
      ),
    },
  ];

  // Adicionar tab de workflow se configurado
  if (config.hasWorkflow) {
    defaultTabs.push({
      id: 'workflow',
      label: 'Fluxo de Trabalho',
      icon: <CheckSquare className="h-4 w-4" />,
      content: (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Selecione um registro na listagem para visualizar e gerenciar seu workflow.
            </p>
          </CardContent>
        </Card>
      ),
    });
  }

  // Adicionar tab de relatórios se configurado
  if (config.hasReports) {
    defaultTabs.push({
      id: 'reports',
      label: 'Relatórios',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold">Relatórios Disponíveis</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <FileText className="h-6 w-6 mb-2" />
                <span className="font-semibold">Relatório Geral</span>
                <span className="text-xs text-muted-foreground">
                  Visão completa de todos os registros
                </span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="font-semibold">Estatísticas</span>
                <span className="text-xs text-muted-foreground">
                  Gráficos e análises detalhadas
                </span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <Users className="h-6 w-6 mb-2" />
                <span className="font-semibold">Por Cidadão</span>
                <span className="text-xs text-muted-foreground">
                  Relatório individualizado
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
    });
  }

  // Adicionar tab de configurações se configurado
  if (config.hasSettings) {
    defaultTabs.push({
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Configurações do Módulo</h3>
            <p className="text-muted-foreground">
              Configurações específicas para {config.title} serão implementadas aqui.
            </p>
          </CardContent>
        </Card>
      ),
    });
  }

  // Combinar tabs padrão com tabs customizados
  const allTabs = [...defaultTabs, ...(config.customTabs || [])];

  return (
    <MSLayout
      title={config.title}
      description={config.description}
      icon={config.icon}
      departmentSlug={config.departmentSlug}
      tabs={allTabs}
      defaultTab="dashboard"
      actions={
        <>
          <Button onClick={refresh} variant="outline">
            Atualizar
          </Button>
          <Button onClick={() => alert('Modal de criação será implementado')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </>
      }
      metrics={layoutMetrics}
    />
  );
}
