'use client';

import { Suspense } from 'react';
import DashboardOverview from '@/components/admin/analytics/DashboardOverview';
import TrendsChart from '@/components/admin/analytics/TrendsChart';
import ReportFilters from '@/components/admin/analytics/ReportFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, FileSpreadsheet, Activity } from 'lucide-react';

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Analytics e Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Análise completa de desempenho, métricas e insights do sistema de protocolos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <DashboardOverview />
          </Suspense>
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <TrendsChart />
          </Suspense>
        </TabsContent>

        {/* Relatórios e Exportação */}
        <TabsContent value="reports" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <ReportFilters />
          </Suspense>

          {/* Informações adicionais sobre relatórios */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Métricas Disponíveis</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Volume de protocolos (total, novos, concluídos, cancelados)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Tempo médio de conclusão e primeira resposta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Taxa de cumprimento de SLA e desvios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Satisfação do cidadão (avaliações)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Análise de documentos (aprovação/rejeição)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Gestão de pendências e tempo de resolução</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Identificação de gargalos e pontos de melhoria</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Relatórios por Categoria</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Performance Geral</p>
                  <p className="text-muted-foreground">
                    Visão consolidada de todos os protocolos do sistema
                  </p>
                </div>
                <div>
                  <p className="font-medium">Por Departamento</p>
                  <p className="text-muted-foreground">
                    Métricas específicas de cada secretaria/departamento
                  </p>
                </div>
                <div>
                  <p className="font-medium">Por Serviço</p>
                  <p className="text-muted-foreground">
                    Análise detalhada de cada tipo de serviço oferecido
                  </p>
                </div>
                <div>
                  <p className="font-medium">Por Servidor</p>
                  <p className="text-muted-foreground">
                    Performance individual de cada servidor público
                  </p>
                </div>
                <div>
                  <p className="font-medium">Gargalos</p>
                  <p className="text-muted-foreground">
                    Identificação de etapas que causam atrasos no processo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
