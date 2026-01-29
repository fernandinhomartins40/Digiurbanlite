'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { obterEstatisticasAtendimento } from '@/lib/api/atendimento-api';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';

export default function AtendimentoPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const data = await obterEstatisticasAtendimento({
        dataInicio: inicioMes.toISOString().split('T')[0],
        dataFim: hoje.toISOString().split('T')[0],
      });
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Atendimento Médico</h1>
        <p className="text-gray-500 mt-1">
          Sistema integrado de atendimento, triagem e consultas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Atendimento
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.porStatus?.find((s: any) => s.status === 'EM_ANDAMENTO')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.tempoMedioAtendimento || 0} min
            </div>
            <p className="text-xs text-muted-foreground">
              Por atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finalizados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.porStatus?.find((s: any) => s.status === 'FINALIZADO')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classificação de Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Classificação de Risco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.porClassificacaoRisco?.map((item: any) => (
              <div key={item.classificacao} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${
                      item.classificacao === 'EMERGENCIA' ? 'bg-red-500' :
                      item.classificacao === 'MUITO_URGENTE' ? 'bg-orange-500' :
                      item.classificacao === 'URGENTE' ? 'bg-yellow-500' :
                      item.classificacao === 'POUCO_URGENTE' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{item.classificacao}</span>
                </div>
                <span className="text-sm text-gray-500">{item.count} atendimentos</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Fila de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Gerencie a fila de espera e chame os próximos pacientes
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Triagem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Realize triagem e classificação de risco dos pacientes
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Prontuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Acesse e gerencie prontuários eletrônicos dos pacientes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
