'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileBarChart,
  Users,
  Car,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  FileText,
  MapPin,
  DollarSign,
} from 'lucide-react';

interface TFDStats {
  totalSolicitacoes: number;
  aguardandoAnalise: number;
  aguardandoRegulacao: number;
  aguardandoGestao: number;
  agendados: number;
  emViagem: number;
  realizados: number;
  cancelados: number;
  viagensHoje: number;
  despesasMes: number;
  veiculosDisponiveis: number;
  motoristasDisponiveis: number;
}

export default function DashboardTFDPage() {
  const router = useRouter();
  const [stats, setStats] = useState<TFDStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // ✅ Chamada real à API
      const response = await fetch('/api/tfd/dashboard/stats');

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);

      // Fallback com dados vazios
      setStats({
        totalSolicitacoes: 0,
        aguardandoAnalise: 0,
        aguardandoRegulacao: 0,
        aguardandoGestao: 0,
        agendados: 0,
        emViagem: 0,
        realizados: 0,
        cancelados: 0,
        viagensHoje: 0,
        despesasMes: 0,
        veiculosDisponiveis: 0,
        motoristasDisponiveis: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">TFD - Tratamento Fora do Domicílio</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-orange-600" />
            TFD - Tratamento Fora do Domicílio
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de tratamentos médicos em outras cidades
          </p>
        </div>
        <Button
          size="lg"
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => router.push('/admin/servicos?search=TFD')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Solicitação (via Protocolo)
        </Button>
      </div>

      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSolicitacoes}</div>
            <p className="text-xs text-muted-foreground">
              +12 este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viagens Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viagensHoje}</div>
            <p className="text-xs text-muted-foreground">
              {stats.emViagem} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {(stats.despesasMes / stats.realizados).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Realização</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.realizados / (stats.realizados + stats.cancelados)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.realizados} realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filas Pendentes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Filas de Trabalho</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/50"
            onClick={() => router.push('/admin/apps/saude/tfd/analise-documental')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Análise Documental
              </CardTitle>
              <CardDescription>
                Solicitações aguardando verificação de documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.aguardandoAnalise}
                </div>
                <Button variant="outline" size="sm">
                  Analisar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 bg-blue-50/50"
            onClick={() => router.push('/admin/apps/saude/tfd/regulacao-medica')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Regulação Médica
              </CardTitle>
              <CardDescription>
                Aguardando parecer do médico regulador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.aguardandoRegulacao}
                </div>
                <Button variant="outline" size="sm">
                  Regular
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200 bg-purple-50/50"
            onClick={() => router.push('/admin/apps/saude/tfd/aprovacao')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Aprovação Gestão
              </CardTitle>
              <CardDescription>
                Aguardando aprovação orçamentária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.aguardandoGestao}
                </div>
                <Button variant="outline" size="sm">
                  Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/apps/saude/tfd/solicitacoes')}
              >
                Ver todas ({stats.totalSolicitacoes})
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/servicos?search=TFD')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova via Protocolo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/apps/saude/tfd/viagens')}
              >
                Ver viagens ({stats.agendados})
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/apps/saude/tfd/viagens/montar-lista')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Montar lista
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Frota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/apps/saude/tfd/frota/veiculos')}
              >
                Veículos ({stats.veiculosDisponiveis} disponíveis)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/apps/saude/tfd/frota/motoristas')}
              >
                Motoristas ({stats.motoristasDisponiveis} disponíveis)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert('Relatório mensal em desenvolvimento')}
              >
                Relatório mensal
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert('Relatório de despesas em desenvolvimento')}
              >
                Relatório de despesas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Solicitações</CardTitle>
          <CardDescription>Distribuição por etapa do processo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Aguardando Análise</span>
              </div>
              <Badge variant="outline" className="bg-yellow-50">
                {stats.aguardandoAnalise}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Aguardando Regulação</span>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                {stats.aguardandoRegulacao}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Aguardando Gestão</span>
              </div>
              <Badge variant="outline" className="bg-purple-50">
                {stats.aguardandoGestao}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm">Agendados</span>
              </div>
              <Badge variant="outline" className="bg-green-50">
                {stats.agendados}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Em Viagem</span>
              </div>
              <Badge variant="outline" className="bg-orange-50">
                {stats.emViagem}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">Realizados</span>
              </div>
              <Badge variant="outline" className="bg-emerald-50">
                {stats.realizados}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Cancelados</span>
              </div>
              <Badge variant="outline" className="bg-red-50">
                {stats.cancelados}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
