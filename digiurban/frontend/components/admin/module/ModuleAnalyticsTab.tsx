'use client';

/**
 * ABA 5: Analytics e Estatísticas
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, FileCheck, XCircle, Clock } from 'lucide-react';

interface ModuleAnalyticsTabProps {
  protocols: any[];
  service: any;
}

export function ModuleAnalyticsTab({ protocols, service }: ModuleAnalyticsTabProps) {
  const stats = useMemo(() => {
    const total = protocols.length;
    const concluidos = protocols.filter(p => p.status === 'CONCLUIDO').length;
    const cancelados = protocols.filter(p => p.status === 'CANCELADO').length;
    const emProgresso = protocols.filter(p => p.status === 'PROGRESSO').length;
    const pendentes = protocols.filter(p => p.status === 'VINCULADO').length;

    const taxaAprovacao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;

    return {
      total,
      concluidos,
      cancelados,
      emProgresso,
      pendentes,
      taxaAprovacao,
      taxaCancelamento,
    };
  }, [protocols]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Protocolos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Registrados no sistema</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.taxaAprovacao}%</div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{stats.concluidos} concluídos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Cancelamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.taxaCancelamento}%</div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{stats.cancelados} cancelados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <span>Concluídos</span>
              </div>
              <span className="font-semibold">{stats.concluidos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Em Progresso</span>
              </div>
              <span className="font-semibold">{stats.emProgresso}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Pendentes</span>
              </div>
              <span className="font-semibold">{stats.pendentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Cancelados</span>
              </div>
              <span className="font-semibold">{stats.cancelados}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
