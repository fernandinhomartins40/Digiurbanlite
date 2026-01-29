'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ListaAtendimentosPage } from '@/components/apps/saude/fila-atendimento/ListaAtendimentosPage';

export default function AtendimentoPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Auto-refresh a cada 30 segundos (como no PEC e-SUS)
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/saude/fila-atendimento');
      if (response.ok) {
        const fila = await response.json();

        setStats({
          filaTotal: fila.length,
          filaAguardando: fila.filter((f: any) => f.status === 'AGUARDANDO').length,
          filaEmAtendimento: fila.filter((f: any) =>
            ['EM_ESCUTA_INICIAL', 'EM_TRIAGEM', 'EM_CONSULTA', 'EM_PROCEDIMENTO', 'EM_VACINACAO'].includes(f.status)
          ).length,
          filaUrgente: fila.filter((f: any) =>
            ['URGENTE', 'MUITO_URGENTE', 'EMERGENCIA'].includes(f.prioridade)
          ).length,
          tempoMedioEspera: 0, // TODO: calcular tempo médio real
        });
      } else {
        setStats({
          filaTotal: 0,
          filaAguardando: 0,
          filaEmAtendimento: 0,
          filaUrgente: 0,
          tempoMedioEspera: 0,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats({
        filaTotal: 0,
        filaAguardando: 0,
        filaEmAtendimento: 0,
        filaUrgente: 0,
        tempoMedioEspera: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando sistema de atendimento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Estilo PEC e-SUS */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Atendimento</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Compatível PEC e-SUS
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Gestão completa de atendimentos ambulatoriais • Fluxo: Recepção → Escuta → Triagem → Consulta
          </p>
        </div>
      </div>

      {/* Painel de Indicadores - Similar ao PEC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.filaAguardando || 0} aguardando atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaEmAtendimento || 0}</div>
            <p className="text-xs text-muted-foreground">
              Escuta, triagem, consulta e procedimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgências</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.filaUrgente || 0}</div>
            <p className="text-xs text-muted-foreground">
              Casos prioritários (Manchester)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tempoMedioEspera || 0} min</div>
            <p className="text-xs text-muted-foreground">
              Tempo de espera estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Área de Trabalho Principal - Fila de Atendimento */}
      <Card className="border-2">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Fila de Atendimento em Tempo Real
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Adicione pacientes, realize escuta inicial, triagem e encaminhe para consultas médicas
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Componente de Fila Funcional */}
          <ListaAtendimentosPage />
        </CardContent>
      </Card>

      {/* Rodapé com informações do sistema */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Sistema de Atendimento DigiUrban • Compatível com padrões PEC e-SUS •
          Atualização automática a cada 30 segundos
        </p>
      </div>
    </div>
  );
}
