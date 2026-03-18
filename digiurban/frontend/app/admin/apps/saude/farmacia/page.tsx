'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import {
  listarEstoque,
  listarAlertas,
  obterEstatisticasDispensacao,
} from '@/lib/api/farmacia-api';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  ArrowRight,
  Pill,
  Plus,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function FarmaciaPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar estatÃ­sticas
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const statsData = await obterEstatisticasDispensacao({
        dataInicio: inicioMes.toISOString().split('T')[0],
        dataFim: hoje.toISOString().split('T')[0],
      });
      setStats(statsData);

      // Carregar alertas
      const alertasData = await listarAlertas();
      setAlertas(alertasData.slice(0, 5)); // Top 5 alertas

      // Carregar estoque baixo
      const estoqueData = await listarEstoque();
      const baixo = estoqueData.filter((item: any) => {
        const percentual = (item.quantidadeAtual / item.quantidadeMaxima) * 100;
        return percentual <= 20;
      });
      setEstoqueBaixo(baixo.slice(0, 5)); // Top 5 itens com estoque baixo
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
      <HealthAppHeader
        title="Farmácia Municipal"
        description="Gestão de estoque e dispensação de medicamentos."
        icon={Pill}
        actions={
          <>
            <Button
              onClick={() => router.push('/admin/apps/saude/farmacia/dispensacao/nova')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Pill className="h-4 w-4 mr-2" />
              Nova dispensação
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/apps/saude/farmacia/estoque/novo')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao estoque
            </Button>
          </>
        }
      />


      {/* EstatÃ­sticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              DispensaÃ§Ãµes do MÃªs
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalDispensacoes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.mediaDiaria || 0} por dia em mÃ©dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Itens em Estoque
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalItensEstoque || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {estoqueBaixo.length} com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Dispensado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats?.valorTotalDispensado || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Medicamentos dispensados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Ativos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas.length}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenÃ§Ã£o imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas de Estoque
              </CardTitle>
              <Link href="/admin/apps/saude/farmacia/estoque">
                <Button variant="ghost" size="sm">
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum alerta ativo
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{alerta.medicamento}</div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        {alerta.tipo === 'ESTOQUE_BAIXO' && (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            <span>Estoque baixo</span>
                          </>
                        )}
                        {alerta.tipo === 'ESTOQUE_MINIMO' && (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Estoque mÃ­nimo</span>
                          </>
                        )}
                        {alerta.tipo === 'VALIDADE_PROXIMA' && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Vencimento prÃ³ximo</span>
                          </>
                        )}
                        {alerta.tipo === 'VENCIDO' && (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Medicamento vencido</span>
                          </>
                        )}
                      </div>
                      {alerta.dataValidade && (
                        <div className="text-xs text-gray-400 mt-1">
                          Validade: {new Date(alerta.dataValidade).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        alerta.tipo === 'VENCIDO' || alerta.tipo === 'ESTOQUE_MINIMO'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {alerta.quantidadeAtual || 0} un
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estoque Baixo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Estoque Baixo
              </CardTitle>
              <Link href="/admin/apps/saude/farmacia/estoque">
                <Button variant="ghost" size="sm">
                  Ver Estoque
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {estoqueBaixo.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Todos os itens com estoque adequado
              </div>
            ) : (
              <div className="space-y-3">
                {estoqueBaixo.map((item) => {
                  const percentual = (item.quantidadeAtual / item.quantidadeMaxima) * 100;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.medicamento}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Lote: {item.lote || '-'}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentual <= 10
                                  ? 'bg-red-600'
                                  : percentual <= 20
                                  ? 'bg-orange-600'
                                  : 'bg-yellow-600'
                              }`}
                              style={{ width: `${Math.max(percentual, 5)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {percentual.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold">{item.quantidadeAtual}</div>
                        <div className="text-xs text-gray-500">de {item.quantidadeMaxima}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AÃ§Ãµes RÃ¡pidas */}
      <Card>
        <CardHeader>
          <CardTitle>AÃ§Ãµes RÃ¡pidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/apps/saude/farmacia/dispensacao">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Nova DispensaÃ§Ã£o</span>
              </Button>
            </Link>
            <Link href="/admin/apps/saude/farmacia/estoque">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Gerenciar Estoque</span>
              </Button>
            </Link>
            <Link href="/admin/apps/saude/farmacia/relatorios">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>RelatÃ³rios</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
