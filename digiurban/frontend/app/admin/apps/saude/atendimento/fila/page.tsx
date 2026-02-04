'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnidade } from '@/contexts/UnidadeContext';
import { SeletorUnidade } from '@/components/saude/SeletorUnidade';
import {
  obterFilaUnidade,
  chamarProximo,
} from '@/lib/api/atendimento-api';
import { Users, Phone, AlertCircle, RefreshCw } from 'lucide-react';

export default function FilaAtendimentoPage() {
  const { unidadeSelecionada } = useUnidade();
  const [fila, setFila] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Recarregar fila quando unidade mudar
  useEffect(() => {
    if (unidadeSelecionada?.id) {
      loadFila(unidadeSelecionada.id);

      // Atualizar a cada 30 segundos
      const interval = setInterval(() => {
        loadFila(unidadeSelecionada.id);
      }, 30000);

      // Listener para mudança de unidade
      const handleUnidadeChanged = () => {
        if (unidadeSelecionada?.id) {
          loadFila(unidadeSelecionada.id);
        }
      };

      window.addEventListener('unidade-changed', handleUnidadeChanged);

      return () => {
        clearInterval(interval);
        window.removeEventListener('unidade-changed', handleUnidadeChanged);
      };
    }
  }, [unidadeSelecionada]);

  const loadFila = async (unidadeId: string) => {
    try {
      if (loading) {
        // Primeira carga
        setLoading(true);
      } else {
        // Atualização
        setAtualizando(true);
      }

      const data = await obterFilaUnidade(unidadeId);
      setFila(data);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      setFila([]);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  };

  const handleChamarProximo = async (consultorio: string) => {
    if (!unidadeSelecionada?.id) {
      alert('Selecione uma unidade primeiro');
      return;
    }

    try {
      await chamarProximo(unidadeSelecionada.id, consultorio);
      await loadFila(unidadeSelecionada.id);
    } catch (error) {
      console.error('Erro ao chamar próximo:', error);
      alert('Erro ao chamar próximo paciente');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      AGUARDANDO: { variant: 'secondary', label: 'Aguardando' },
      CHAMADO: { variant: 'default', label: 'Chamado' },
      EM_ATENDIMENTO: { variant: 'default', label: 'Em Atendimento' },
      FINALIZADO: { variant: 'secondary', label: 'Finalizado' },
    };

    const config = variants[status] || variants.AGUARDANDO;
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const getPrioridadeColor = (prioridade: number) => {
    if (prioridade >= 100) return 'text-red-600';
    if (prioridade >= 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando fila...</div>
        </div>
      </div>
    );
  }

  if (!unidadeSelecionada) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fila de Atendimento</h1>
          <p className="text-gray-500 mt-1">
            Selecione uma unidade para visualizar a fila
          </p>
        </div>
        <SeletorUnidade />
      </div>
    );
  }

  const filaAguardando = fila.filter((f) => f.status === 'AGUARDANDO');
  const filaEmAtendimento = fila.filter((f) => f.status === 'EM_ATENDIMENTO');

  return (
    <div className="p-6 space-y-6">
      {/* Seletor de Unidade */}
      <SeletorUnidade />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fila de Atendimento</h1>
          <p className="text-gray-500 mt-1">
            Fila exclusiva de <span className="font-semibold">{unidadeSelecionada.nome}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadFila(unidadeSelecionada.id)}
            variant="outline"
            disabled={atualizando}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${atualizando ? 'animate-spin' : ''}`} />
            {atualizando ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button onClick={() => handleChamarProximo('1')} disabled={filaAguardando.length === 0}>
            <Phone className="h-4 w-4 mr-2" />
            Chamar Próximo
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aguardando
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filaAguardando.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pacientes na fila
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Atendimento
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filaEmAtendimento.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              em consulta agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total do Dia
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fila.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              atendimentos hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Espera */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Aguardando</CardTitle>
        </CardHeader>
        <CardContent>
          {filaAguardando.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 font-medium">
                Nenhum paciente na fila de espera
              </div>
              <div className="text-sm text-gray-400 mt-1">
                A fila está vazia no momento
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filaAguardando.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-2xl font-bold ${getPrioridadeColor(
                          item.prioridade
                        )}`}
                      >
                        #{filaAguardando.indexOf(item) + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.citizen?.name || 'Paciente'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Prioridade: {item.prioridade}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    {item.consultorio && (
                      <Badge variant="outline">
                        Consultório {item.consultorio}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Em Atendimento */}
      {filaEmAtendimento.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Em Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filaEmAtendimento.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-blue-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.citizen?.name || 'Paciente'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.motivoBusca || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <div className="text-sm text-gray-500">
                      {item.dataHoraInicio &&
                        new Date(item.dataHoraInicio).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
