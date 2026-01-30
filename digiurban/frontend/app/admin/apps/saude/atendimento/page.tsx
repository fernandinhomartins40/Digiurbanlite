'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnidade } from '@/contexts/UnidadeContext';
import {
  Building2,
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
  Activity,
  MapPin,
  Phone,
} from 'lucide-react';

interface UnidadeComStats {
  id: string;
  nome: string;
  tipo: string;
  cnes?: string;
  endereco?: string;
  telefone?: string;
  stats: {
    aguardando: number;
    emAtendimento: number;
    totalDia: number;
    urgencias: number;
  };
}

export default function AtendimentoPage() {
  const router = useRouter();
  const { selecionarUnidade } = useUnidade();
  const [unidades, setUnidades] = useState<UnidadeComStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnidadesComStats();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadUnidadesComStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnidadesComStats = async () => {
    try {
      // Buscar unidades ativas
      const unidadesResponse = await fetch('/api/apps/saude/cadastros/unidades?isActive=true', {
        credentials: 'include',
      });

      if (!unidadesResponse.ok) {
        console.error('Erro ao carregar unidades');
        setUnidades([]);
        return;
      }

      const unidadesData = await unidadesResponse.json();

      // Para cada unidade, buscar estatísticas da fila
      const unidadesComStats = await Promise.all(
        unidadesData.map(async (unidade: any) => {
          try {
            const filaResponse = await fetch(
              `/api/saude/fila-atendimento?unidadeId=${unidade.id}`,
              { credentials: 'include' }
            );

            let stats = {
              aguardando: 0,
              emAtendimento: 0,
              totalDia: 0,
              urgencias: 0,
            };

            if (filaResponse.ok) {
              const fila = await filaResponse.json();
              stats = {
                aguardando: fila.filter((f: any) => f.status === 'AGUARDANDO').length,
                emAtendimento: fila.filter((f: any) =>
                  ['EM_ESCUTA_INICIAL', 'EM_TRIAGEM', 'EM_CONSULTA', 'EM_ATENDIMENTO'].includes(f.status)
                ).length,
                totalDia: fila.length,
                urgencias: fila.filter((f: any) =>
                  ['URGENTE', 'MUITO_URGENTE', 'EMERGENCIA'].includes(f.prioridade)
                ).length,
              };
            }

            return {
              ...unidade,
              stats,
            };
          } catch (error) {
            console.error(`Erro ao carregar stats da unidade ${unidade.id}:`, error);
            return {
              ...unidade,
              stats: {
                aguardando: 0,
                emAtendimento: 0,
                totalDia: 0,
                urgencias: 0,
              },
            };
          }
        })
      );

      setUnidades(unidadesComStats);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setUnidades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarUnidade = (unidade: UnidadeComStats) => {
    // Salvar no contexto
    selecionarUnidade({
      id: unidade.id,
      nome: unidade.nome,
      tipo: unidade.tipo,
      cnes: unidade.cnes,
    });

    // Redirecionar para fila
    router.push('/admin/apps/saude/atendimento/fila');
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      UBS: 'bg-blue-100 text-blue-700',
      UPA: 'bg-red-100 text-red-700',
      Hospital: 'bg-purple-100 text-purple-700',
      Clínica: 'bg-green-100 text-green-700',
      Posto: 'bg-yellow-100 text-yellow-700',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando unidades de saúde...</div>
        </div>
      </div>
    );
  }

  if (unidades.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Atendimento</h1>
          <p className="text-gray-500 mt-1">Selecione uma unidade para iniciar</p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Nenhuma unidade de saúde cadastrada
            </h3>
            <p className="text-amber-700 mb-4">
              Cadastre unidades de saúde antes de usar o sistema de atendimento
            </p>
            <Button
              onClick={() => router.push('/admin/apps/saude/cadastros/unidades')}
              variant="outline"
              className="border-amber-300"
            >
              Ir para Cadastros
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Sistema de Atendimento
          </h1>
          <p className="text-gray-500 mt-1">
            Selecione uma unidade de saúde para acessar a fila de atendimento
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/admin/apps/saude/cadastros')}
        >
          Gerenciar Cadastros
        </Button>
      </div>

      {/* Cards de Unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unidades.map((unidade) => (
          <Card
            key={unidade.id}
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-400"
            onClick={() => handleSelecionarUnidade(unidade)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <Badge className={getTipoColor(unidade.tipo)}>
                      {unidade.tipo}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{unidade.nome}</CardTitle>
                  {unidade.cnes && (
                    <CardDescription className="mt-1">
                      CNES: {unidade.cnes}
                    </CardDescription>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informações de Contato */}
              {(unidade.endereco || unidade.telefone) && (
                <div className="space-y-2 text-sm text-gray-600 pb-4 border-b">
                  {unidade.endereco && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{unidade.endereco}</span>
                    </div>
                  )}
                  {unidade.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{unidade.telefone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Estatísticas da Fila */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Aguardando</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {unidade.stats.aguardando}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className="h-4 w-4" />
                    <span>Em Atendimento</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {unidade.stats.emAtendimento}
                  </span>
                </div>

                {unidade.stats.urgencias > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Urgências</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {unidade.stats.urgencias}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Total do Dia</span>
                  </div>
                  <span className="text-lg font-bold text-gray-700">
                    {unidade.stats.totalDia}
                  </span>
                </div>
              </div>

              {/* Botão de Ação */}
              <Button
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelecionarUnidade(unidade);
                }}
              >
                Acessar Fila de Atendimento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rodapé */}
      <div className="text-center text-sm text-gray-500 pt-6 border-t">
        <p>
          Atualização automática a cada 30 segundos • Sistema compatível com PEC e-SUS
        </p>
      </div>
    </div>
  );
}
