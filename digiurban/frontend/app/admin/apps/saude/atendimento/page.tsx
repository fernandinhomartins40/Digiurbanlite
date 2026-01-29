'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Clock,
  AlertCircle,
  ClipboardList,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { ListaAtendimentosPage } from '@/components/apps/saude/fila-atendimento/ListaAtendimentosPage';

export default function AtendimentoPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Conectar com API real /api/saude/fila-atendimento/stats
      const response = await fetch('/api/saude/fila-atendimento');
      if (response.ok) {
        const fila = await response.json();

        setStats({
          filaTotal: fila.length,
          filaAguardando: fila.filter((f: any) => f.status === 'AGUARDANDO').length,
          filaEmAtendimento: fila.filter((f: any) =>
            ['EM_ESCUTA_INICIAL', 'EM_TRIAGEM', 'EM_CONSULTA'].includes(f.status)
          ).length,
          filaUrgente: fila.filter((f: any) =>
            ['URGENTE', 'MUITO_URGENTE', 'EMERGENCIA'].includes(f.prioridade)
          ).length,
          tempoMedioEspera: 0,
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
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Atendimento</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              PEC e-SUS
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Fluxo completo: Recepção → Escuta Inicial → Triagem → Consulta
          </p>
        </div>
      </div>

      {/* Estatísticas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaTotal || 0}</div>
            <p className="text-xs text-muted-foreground">Pacientes aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaEmAtendimento || 0}</div>
            <p className="text-xs text-muted-foreground">Escuta, triagem e consulta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.filaUrgente || 0}</div>
            <p className="text-xs text-muted-foreground">Prioridade alta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tempoMedioEspera || 0} min</div>
            <p className="text-xs text-muted-foreground">Tempo de espera</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Atendimento - Componente Funcional */}
      <ListaAtendimentosPage />
    </div>
  );
}
