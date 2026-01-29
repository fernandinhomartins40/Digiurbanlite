'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  obterFilaUnidade,
  chamarProximo,
} from '@/lib/api/atendimento-api';
import { Users, Phone, AlertCircle } from 'lucide-react';

export default function FilaAtendimentoPage() {
  const [fila, setFila] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidadeId, setUnidadeId] = useState('');

  useEffect(() => {
    // TODO: Obter unidadeId do contexto do usuário
    const mockUnidadeId = 'unidade-padrao';
    setUnidadeId(mockUnidadeId);
    loadFila(mockUnidadeId);

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => loadFila(mockUnidadeId), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFila = async (uid: string) => {
    try {
      const data = await obterFilaUnidade(uid);
      setFila(data);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChamarProximo = async (consultorio: string) => {
    try {
      await chamarProximo(unidadeId, consultorio);
      loadFila(unidadeId);
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

  const filaAguardando = fila.filter((f) => f.status === 'AGUARDANDO');
  const filaEmAtendimento = fila.filter((f) => f.status === 'EM_ATENDIMENTO');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fila de Atendimento</h1>
          <p className="text-gray-500 mt-1">
            Gerencie a fila de espera em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadFila(unidadeId)}
            variant="outline"
          >
            Atualizar
          </Button>
          <Button onClick={() => handleChamarProximo('1')}>
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
            <div className="text-center py-8 text-gray-500">
              Nenhum paciente na fila de espera
            </div>
          ) : (
            <div className="space-y-3">
              {filaAguardando.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-2xl font-bold ${getPrioridadeColor(
                          item.prioridade
                        )}`}
                      >
                        #{item.ordem}
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.consulta?.citizen?.name || 'Paciente'}
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
                      {item.consulta?.citizen?.name || 'Paciente'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Consultório {item.consultorio}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <div className="text-sm text-gray-500">
                      {item.chamadaEm &&
                        new Date(item.chamadaEm).toLocaleTimeString('pt-BR', {
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
