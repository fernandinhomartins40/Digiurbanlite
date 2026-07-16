'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  obterEstatisticasEstoque,
  obterEstatisticasDispensacao,
  gerarRelatorioAuditoria,
  listarUnidadesSaude,
} from '@/lib/api/farmacia-api';
import { BarChart3, Download, FileSearch, Package, Pill, Users } from 'lucide-react';

function primeiroDiaDoMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
}

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

export default function RelatoriosFarmaciaPage() {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('TODAS');
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeISO());

  const [statsEstoque, setStatsEstoque] = useState<any>(null);
  const [statsDispensacao, setStatsDispensacao] = useState<any>(null);
  const [auditoria, setAuditoria] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listarUnidadesSaude()
      .then(setUnidades)
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gerar = async () => {
    setLoading(true);
    const unidade = unidadeId !== 'TODAS' ? unidadeId : undefined;
    try {
      const [estoque, dispensacao, aud] = await Promise.all([
        obterEstatisticasEstoque(unidade).catch(() => null),
        obterEstatisticasDispensacao({ unidadeId: unidade, dataInicio, dataFim }).catch(() => null),
        gerarRelatorioAuditoria({ unidadeId: unidade, dataInicio, dataFim }).catch(() => null),
      ]);
      setStatsEstoque(estoque);
      setStatsDispensacao(dispensacao);
      setAuditoria(aud);
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar relatório',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    const linhas = auditoria?.dispensacoes || [];
    if (linhas.length === 0) {
      toast({ title: 'Nada para exportar no período', variant: 'destructive' });
      return;
    }
    const cabecalho = 'Data;Medicamento;Cidadão;CPF;Quantidade;Responsável;Status\n';
    const corpo = linhas
      .map((d: any) =>
        [
          d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '',
          d.medicamento?.nome || '',
          d.citizen?.name || '',
          d.citizen?.cpf || '',
          d.quantidade,
          d.responsavel?.name || '',
          d.status || '',
        ].join(';')
      )
      .join('\n');
    // BOM UTF-8 para compatibilidade com Excel
    const blob = new Blob(['﻿' + cabecalho + corpo], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-dispensacao-${dataInicio}-a-${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios da Farmácia</h1>
          <p className="text-gray-500 mt-1">
            Estatísticas de estoque, dispensação e auditoria por período
          </p>
        </div>
        <Button variant="outline" onClick={exportarCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Unidade</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger>
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
            </div>
            <div>
              <Label htmlFor="rel-inicio">De</Label>
              <Input
                id="rel-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rel-fim">Até</Label>
              <Input
                id="rel-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <Button onClick={gerar} disabled={loading}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estoque */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" /> Situação do estoque
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lotes ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsEstoque?.totalLotes ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medicamentos distintos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsEstoque?.totalMedicamentos ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unidades em estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsEstoque?.quantidadeTotal ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vencem em 30 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsEstoque?.lotesProximosVencimento ?? '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lotes vencidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statsEstoque?.lotesVencidos ?? '-'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dispensação */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Pill className="h-5 w-5" /> Dispensação no período
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dispensações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsDispensacao?.totalDispensacoes ?? auditoria?.total ?? '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quantidade dispensada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsDispensacao?.quantidadeTotal ?? auditoria?.quantidadeTotal ?? '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Users className="h-4 w-4" /> Cidadãos atendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsDispensacao?.cidadaosUnicos ?? auditoria?.cidadaosUnicos ?? '-'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Auditoria de dispensações
            <Badge variant="secondary">{auditoria?.total ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auditoria || (auditoria.dispensacoes || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma dispensação no período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Medicamento</th>
                    <th className="py-2 pr-4">Cidadão</th>
                    <th className="py-2 pr-4">Qtd.</th>
                    <th className="py-2 pr-4">Responsável</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.dispensacoes.map((d: any) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        {d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-2 pr-4">{d.medicamento?.nome || '-'}</td>
                      <td className="py-2 pr-4">
                        {d.citizen?.name || '-'}
                        {d.citizen?.cpf && (
                          <span className="text-gray-400 ml-1">({d.citizen.cpf})</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{d.quantidade}</td>
                      <td className="py-2 pr-4">{d.responsavel?.name || '-'}</td>
                      <td className="py-2">
                        {d.status === 'CANCELADO' ? (
                          <Badge variant="destructive">Cancelada</Badge>
                        ) : (
                          <Badge className="bg-green-600">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
