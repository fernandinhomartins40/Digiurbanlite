'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  listarAlertas,
  marcarAlertaVisualizado,
  resolverAlerta,
  verificarAlertasAutomaticos,
  listarUnidadesSaude,
} from '@/lib/api/farmacia-api';
import { AlertTriangle, Eye, CheckCircle2, RefreshCw } from 'lucide-react';

type Alerta = {
  id: string;
  tipoAlerta?: string;
  tipo?: string;
  mensagem?: string;
  quantidadeAtual?: number | null;
  quantidadeMinima?: number | null;
  dataVencimento?: string | null;
  dataGeracao?: string;
  visualizado?: boolean;
  medicamento?: { nome?: string } | string | null;
  unidade?: { nome?: string } | string | null;
};

const TIPO_LABEL: Record<string, { label: string; className: string }> = {
  ESTOQUE_BAIXO: { label: 'Estoque baixo', className: 'bg-orange-600' },
  ESTOQUE_CRITICO: { label: 'Estoque crítico', className: 'bg-red-600' },
  VENCIMENTO_PROXIMO: { label: 'Vencimento próximo', className: 'bg-yellow-600' },
  VENCIDO: { label: 'Vencido', className: 'bg-red-700' },
};

function nomeDe(campo: Alerta['medicamento']): string {
  if (!campo) return '-';
  if (typeof campo === 'string') return campo;
  return campo.nome || '-';
}

export default function AlertasPage() {
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('TODAS');
  const [somenteAtivos, setSomenteAtivos] = useState('ATIVOS');
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    listarUnidadesSaude()
      .then(setUnidades)
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    loadData();
  }, [unidadeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listarAlertas(unidadeId !== 'TODAS' ? unidadeId : undefined);
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const listaFiltrada = useMemo(() => {
    if (somenteAtivos === 'ATIVOS') return alertas.filter((a) => !a.visualizado);
    if (somenteAtivos === 'VISUALIZADOS') return alertas.filter((a) => a.visualizado);
    return alertas;
  }, [alertas, somenteAtivos]);

  const verificar = async () => {
    setVerificando(true);
    try {
      await verificarAlertasAutomaticos(unidadeId !== 'TODAS' ? unidadeId : undefined);
      toast({ title: 'Verificação de alertas executada' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro na verificação automática',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setVerificando(false);
    }
  };

  const agir = async (id: string, acao: 'visualizar' | 'resolver') => {
    try {
      if (acao === 'visualizar') await marcarAlertaVisualizado(id);
      else await resolverAlerta(id);
      toast({ title: acao === 'visualizar' ? 'Alerta marcado como visto' : 'Alerta resolvido' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar alerta',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas de Estoque</h1>
          <p className="text-gray-500 mt-1">
            Estoque baixo, crítico e medicamentos próximos do vencimento
          </p>
        </div>
        <Button onClick={verificar} disabled={verificando} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${verificando ? 'animate-spin' : ''}`} />
          Verificar agora
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alertas.filter((a) => !a.visualizado).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas.filter((a) => a.visualizado).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as unidades</SelectItem>
                {unidades.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={somenteAtivos} onValueChange={setSomenteAtivos}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVOS">Somente ativos</SelectItem>
                <SelectItem value="VISUALIZADOS">Visualizados</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertas
            <Badge variant="secondary">{listaFiltrada.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando alertas...</div>
          ) : listaFiltrada.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum alerta — estoque em dia 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {listaFiltrada.map((alerta) => {
                const tipo = TIPO_LABEL[alerta.tipoAlerta || alerta.tipo || ''] || {
                  label: alerta.tipoAlerta || alerta.tipo || 'Alerta',
                  className: 'bg-gray-600',
                };
                return (
                  <div
                    key={alerta.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={tipo.className}>{tipo.label}</Badge>
                        <span className="font-medium">{nomeDe(alerta.medicamento)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {alerta.mensagem || '-'} | Unidade: {nomeDe(alerta.unidade)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {typeof alerta.quantidadeAtual === 'number' &&
                          `Atual: ${alerta.quantidadeAtual}`}
                        {typeof alerta.quantidadeMinima === 'number' &&
                          ` | Mínimo: ${alerta.quantidadeMinima}`}
                        {alerta.dataVencimento &&
                          ` | Vencimento: ${new Date(alerta.dataVencimento).toLocaleDateString('pt-BR')}`}
                        {alerta.dataGeracao &&
                          ` | Gerado em ${new Date(alerta.dataGeracao).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alerta.visualizado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => agir(alerta.id, 'visualizar')}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Visto
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => agir(alerta.id, 'resolver')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
