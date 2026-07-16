'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  listarLotes,
  listarLotesProximosVencimento,
  listarLotesVencidos,
  listarUnidadesSaude,
  darBaixaLote,
  adicionarQuantidadeLote,
} from '@/lib/api/farmacia-api';
import { Boxes, Search, CalendarClock, CalendarX2, MinusCircle, PlusCircle } from 'lucide-react';

type Lote = {
  id: string;
  lote: string;
  quantidade: number;
  dataValidade: string;
  dataEntrada?: string;
  fornecedor?: string | null;
  notaFiscal?: string | null;
  medicamento?: { nome?: string; principioAtivo?: string } | null;
  unidade?: { nome?: string } | null;
};

function diasParaVencer(dataValidade: string) {
  return Math.floor(
    (new Date(dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function VencimentoBadge({ dataValidade }: { dataValidade: string }) {
  const dias = diasParaVencer(dataValidade);
  if (dias < 0) return <Badge variant="destructive">Vencido há {Math.abs(dias)}d</Badge>;
  if (dias <= 30) return <Badge className="bg-orange-600">Vence em {dias}d</Badge>;
  if (dias <= 90) return <Badge className="bg-yellow-600">Vence em {dias}d</Badge>;
  return <Badge className="bg-green-600">Válido</Badge>;
}

export default function LotesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('todos');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [proximos, setProximos] = useState<Lote[]>([]);
  const [vencidos, setVencidos] = useState<Lote[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog de baixa/adição
  const [acaoLote, setAcaoLote] = useState<{ lote: Lote; tipo: 'baixa' | 'adicionar' } | null>(null);
  const [quantidadeAcao, setQuantidadeAcao] = useState('');
  const [motivoAcao, setMotivoAcao] = useState('');
  const [salvando, setSalvando] = useState(false);

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
    const filtroUnidade = unidadeId !== 'TODAS' ? unidadeId : undefined;
    try {
      const [todos, prox, venc] = await Promise.all([
        listarLotes({ unidadeId: filtroUnidade, limit: 200 }),
        listarLotesProximosVencimento(90, filtroUnidade),
        listarLotesVencidos(filtroUnidade),
      ]);
      setLotes(Array.isArray(todos) ? todos : []);
      setProximos(Array.isArray(prox) ? prox : []);
      setVencidos(Array.isArray(venc) ? venc : []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      toast({
        title: 'Erro ao carregar lotes',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrar = (lista: Lote[]) => {
    if (!searchTerm) return lista;
    const termo = searchTerm.toLowerCase();
    return lista.filter(
      (l) =>
        l.medicamento?.nome?.toLowerCase().includes(termo) ||
        l.lote?.toLowerCase().includes(termo) ||
        l.fornecedor?.toLowerCase().includes(termo)
    );
  };

  const listaAtiva = useMemo(() => {
    if (tab === 'proximos') return filtrar(proximos);
    if (tab === 'vencidos') return filtrar(vencidos);
    return filtrar(lotes);
  }, [tab, lotes, proximos, vencidos, searchTerm]);

  const executarAcao = async () => {
    if (!acaoLote) return;
    const quantidade = parseInt(quantidadeAcao, 10);
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      toast({ title: 'Informe uma quantidade válida', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      if (acaoLote.tipo === 'baixa') {
        await darBaixaLote(acaoLote.lote.id, quantidade, motivoAcao || undefined);
        toast({ title: 'Baixa registrada no lote' });
      } else {
        await adicionarQuantidadeLote(acaoLote.lote.id, quantidade, motivoAcao || undefined);
        toast({ title: 'Quantidade adicionada ao lote' });
      }
      setAcaoLote(null);
      setQuantidadeAcao('');
      setMotivoAcao('');
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Não foi possível concluir',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lotes & Validade</h1>
          <p className="text-gray-500 mt-1">
            Controle de lotes de medicamentos, vencimentos e baixas
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="h-4 w-4" /> Lotes com estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-orange-600" /> Vencem em 90 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{proximos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarX2 className="h-4 w-4 text-red-600" /> Vencidos com estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{vencidos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por medicamento, lote ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Abas */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos ({lotes.length})</TabsTrigger>
          <TabsTrigger value="proximos">Próximos do vencimento ({proximos.length})</TabsTrigger>
          <TabsTrigger value="vencidos">Vencidos ({vencidos.length})</TabsTrigger>
        </TabsList>

        {['todos', 'proximos', 'vencidos'].map((t) => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Carregando lotes...</div>
                ) : listaAtiva.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum lote encontrado</div>
                ) : (
                  <div className="space-y-3">
                    {listaAtiva.map((lote) => (
                      <div
                        key={lote.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {lote.medicamento?.nome || 'Medicamento'}
                            {lote.medicamento?.principioAtivo && (
                              <span className="text-sm text-gray-500 font-normal ml-2">
                                ({lote.medicamento.principioAtivo})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Lote: {lote.lote} | Unidade: {lote.unidade?.nome || '-'}
                            {lote.fornecedor && ` | Fornecedor: ${lote.fornecedor}`}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Validade: {new Date(lote.dataValidade).toLocaleDateString('pt-BR')}
                            {lote.dataEntrada &&
                              ` | Entrada: ${new Date(lote.dataEntrada).toLocaleDateString('pt-BR')}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">{lote.quantidade}</div>
                            <div className="text-xs text-gray-500">em estoque</div>
                          </div>
                          <VencimentoBadge dataValidade={lote.dataValidade} />
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAcaoLote({ lote, tipo: 'baixa' })}
                            >
                              <MinusCircle className="h-4 w-4 mr-1" /> Baixa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAcaoLote({ lote, tipo: 'adicionar' })}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de baixa/adição */}
      <Dialog open={!!acaoLote} onOpenChange={(open) => !open && setAcaoLote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoLote?.tipo === 'baixa' ? 'Dar baixa no lote' : 'Adicionar quantidade ao lote'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {acaoLote?.lote.medicamento?.nome} — Lote {acaoLote?.lote.lote} (
              {acaoLote?.lote.quantidade} em estoque)
            </div>
            <div>
              <Label htmlFor="quantidade-acao">Quantidade</Label>
              <Input
                id="quantidade-acao"
                type="number"
                min={1}
                value={quantidadeAcao}
                onChange={(e) => setQuantidadeAcao(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="motivo-acao">Motivo (opcional)</Label>
              <Input
                id="motivo-acao"
                placeholder={
                  acaoLote?.tipo === 'baixa'
                    ? 'Ex.: perda, vencimento, ajuste de inventário'
                    : 'Ex.: entrada complementar'
                }
                value={motivoAcao}
                onChange={(e) => setMotivoAcao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcaoLote(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={executarAcao} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
