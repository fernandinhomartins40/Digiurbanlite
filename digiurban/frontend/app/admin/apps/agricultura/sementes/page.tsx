'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Leaf, Plus, Package, AlertTriangle, CalendarClock, Send } from 'lucide-react';
import { MetricCard } from '@/components/agricultura/metric-card';
import { DataTable } from '@/components/agricultura/data-table';
import { useSementes, useProdutores } from '@/lib/hooks/use-agricultura-api';
import { useToast } from '@/components/ui/use-toast';

export default function DistribuicaoSementesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    listEstoque,
    createEstoque,
    updateEstoque,
    getEstoqueStatistics,
    createDistribuicao,
    listDistribuicoes,
    getDistribuicaoStatistics,
    loading,
  } = useSementes();
  const { listProdutores } = useProdutores();

  const [estoque, setEstoque] = useState<any[]>([]);
  const [distribuicoes, setDistribuicoes] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [statsEstoque, setStatsEstoque] = useState<any>(null);
  const [statsDistribuicao, setStatsDistribuicao] = useState<any>(null);

  // Novo item de estoque
  const [itemAberto, setItemAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({
    tipo: 'SEMENTE',
    cultura: '',
    variedade: '',
    unidadeMedida: 'kg',
    quantidade: '',
    estoqueMinimo: '',
    lote: '',
    validade: '',
    origem: '',
  });

  // Entrada de estoque
  const [itemEntrada, setItemEntrada] = useState<any>(null);
  const [qtdEntrada, setQtdEntrada] = useState('');

  // Nova distribuição
  const [distAberta, setDistAberta] = useState(false);
  const [novaDist, setNovaDist] = useState({
    estoqueId: '',
    produtorId: '',
    quantidade: '',
    safra: '',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [estoqueData, distData, statsE, statsD, produtoresData] = await Promise.all([
        listEstoque(),
        listDistribuicoes(),
        getEstoqueStatistics(),
        getDistribuicaoStatistics(),
        listProdutores(),
      ]);
      setEstoque(estoqueData);
      setDistribuicoes(distData);
      setStatsEstoque(statsE);
      setStatsDistribuicao(statsD);
      setProdutores(produtoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const criarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEstoque({
        ...novoItem,
        quantidade: novoItem.quantidade ? Number(novoItem.quantidade) : 0,
        estoqueMinimo: novoItem.estoqueMinimo ? Number(novoItem.estoqueMinimo) : 0,
        validade: novoItem.validade || undefined,
      });
      toast({ title: 'Sucesso!', description: 'Item de estoque cadastrado!' });
      setItemAberto(false);
      setNovoItem({
        tipo: 'SEMENTE',
        cultura: '',
        variedade: '',
        unidadeMedida: 'kg',
        quantidade: '',
        estoqueMinimo: '',
        lote: '',
        validade: '',
        origem: '',
      });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const registrarEntrada = async () => {
    if (!itemEntrada || !qtdEntrada) return;
    try {
      await updateEstoque(itemEntrada.id, {
        quantidade: itemEntrada.quantidade + Number(qtdEntrada),
      });
      toast({ title: 'Entrada registrada', description: `+${qtdEntrada} ${itemEntrada.unidadeMedida}` });
      setItemEntrada(null);
      setQtdEntrada('');
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const criarDistribuicao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDistribuicao({
        ...novaDist,
        quantidade: Number(novaDist.quantidade),
      });
      toast({ title: 'Sucesso!', description: 'Distribuição registrada e estoque baixado!' });
      setDistAberta(false);
      setNovaDist({ estoqueId: '', produtorId: '', quantidade: '', safra: '', observacoes: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const colunasEstoque = [
    {
      key: 'cultura',
      label: 'Cultura',
      render: (item: any) => (
        <span>
          {item.cultura}
          {item.variedade && <span className="text-muted-foreground"> ({item.variedade})</span>}
        </span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item: any) => <Badge variant="outline">{item.tipo === 'MUDA' ? 'Muda' : 'Semente'}</Badge>,
    },
    {
      key: 'quantidade',
      label: 'Em estoque',
      render: (item: any) => (
        <span className={item.quantidade <= item.estoqueMinimo ? 'text-red-600 font-semibold' : ''}>
          {item.quantidade.toLocaleString('pt-BR')} {item.unidadeMedida}
          {item.quantidade <= item.estoqueMinimo && (
            <Badge className="ml-2 bg-red-600">Baixo</Badge>
          )}
        </span>
      ),
    },
    {
      key: 'validade',
      label: 'Validade',
      render: (item: any) =>
        item.validade ? new Date(item.validade).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'lote',
      label: 'Lote',
      render: (item: any) => item.lote || '-',
    },
    {
      key: 'entrada',
      label: 'Entrada',
      render: (item: any) => (
        <Button size="sm" variant="outline" onClick={() => setItemEntrada(item)}>
          <Plus className="h-3 w-3 mr-1" /> Entrada
        </Button>
      ),
    },
  ];

  const colunasDistribuicao = [
    {
      key: 'dataDistribuicao',
      label: 'Data',
      render: (item: any) => new Date(item.dataDistribuicao).toLocaleDateString('pt-BR'),
    },
    {
      key: 'produtor',
      label: 'Produtor',
      render: (item: any) => item.produtor?.nome || '-',
    },
    {
      key: 'estoque',
      label: 'Item',
      render: (item: any) =>
        item.estoque ? `${item.estoque.cultura}${item.estoque.variedade ? ` (${item.estoque.variedade})` : ''}` : '-',
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      render: (item: any) =>
        `${item.quantidade.toLocaleString('pt-BR')} ${item.estoque?.unidadeMedida || ''}`,
    },
    {
      key: 'safra',
      label: 'Safra',
      render: (item: any) => item.safra || '-',
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/secretarias/agricultura')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="hidden sm:inline">Sementes e Mudas</span>
              <span className="sm:hidden">Sementes</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Controle de estoque e distribuição para produtores rurais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white">MS-03</Badge>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setDistAberta(true)}>
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Distribuição</span>
            <span className="sm:hidden">Distribuir</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Itens em Estoque"
          value={statsEstoque?.totalItens || 0}
          icon={Package}
          description="Sementes e mudas ativas"
          color="green"
          loading={!statsEstoque}
        />
        <MetricCard
          title="Estoque Baixo"
          value={statsEstoque?.estoqueBaixo || 0}
          icon={AlertTriangle}
          description="Abaixo do mínimo"
          color="orange"
          loading={!statsEstoque}
        />
        <MetricCard
          title="Próx. Vencimento"
          value={statsEstoque?.proximosVencimento || 0}
          icon={CalendarClock}
          description="Vencem em 30 dias"
          color="purple"
          loading={!statsEstoque}
        />
        <MetricCard
          title="Produtores Atendidos"
          value={statsDistribuicao?.produtoresAtendidos || 0}
          icon={Send}
          description={`${statsDistribuicao?.totalDistribuicoes || 0} distribuições em ${statsDistribuicao?.ano || ''}`}
          color="blue"
          loading={!statsDistribuicao}
        />
      </div>

      <Tabs defaultValue="estoque">
        <TabsList>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="distribuicoes">Distribuições</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setItemAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item de Estoque
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Estoque de Sementes e Mudas</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={estoque}
                columns={colunasEstoque}
                searchPlaceholder="Buscar por cultura, variedade, lote..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuições Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={distribuicoes}
                columns={colunasDistribuicao}
                searchPlaceholder="Buscar por produtor, cultura, safra..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog novo item */}
      <Dialog open={itemAberto} onOpenChange={setItemAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Item de Estoque</DialogTitle>
            <DialogDescription>Cadastre sementes ou mudas no estoque municipal</DialogDescription>
          </DialogHeader>
          <form onSubmit={criarItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cultura *</Label>
                <Input
                  value={novoItem.cultura}
                  onChange={(e) => setNovoItem({ ...novoItem, cultura: e.target.value })}
                  placeholder="Ex: Milho, Feijão, Alface"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Variedade</Label>
                <Input
                  value={novoItem.variedade}
                  onChange={(e) => setNovoItem({ ...novoItem, variedade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={novoItem.tipo}
                  onValueChange={(v) => setNovoItem({ ...novoItem, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMENTE">Semente</SelectItem>
                    <SelectItem value="MUDA">Muda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade de medida</Label>
                <Select
                  value={novoItem.unidadeMedida}
                  onValueChange={(v) => setNovoItem({ ...novoItem, unidadeMedida: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="saco">saco</SelectItem>
                    <SelectItem value="unidade">unidade</SelectItem>
                    <SelectItem value="bandeja">bandeja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade inicial</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque mínimo (alerta)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novoItem.estoqueMinimo}
                  onChange={(e) => setNovoItem({ ...novoItem, estoqueMinimo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lote</Label>
                <Input
                  value={novoItem.lote}
                  onChange={(e) => setNovoItem({ ...novoItem, lote: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={novoItem.validade}
                  onChange={(e) => setNovoItem({ ...novoItem, validade: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Origem</Label>
                <Input
                  value={novoItem.origem}
                  onChange={(e) => setNovoItem({ ...novoItem, origem: e.target.value })}
                  placeholder="Compra, doação, convênio..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setItemAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog entrada de estoque */}
      <Dialog open={!!itemEntrada} onOpenChange={(open) => !open && setItemEntrada(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Entrada — {itemEntrada?.cultura}
              {itemEntrada?.variedade ? ` (${itemEntrada.variedade})` : ''}
            </DialogTitle>
            <DialogDescription>
              Em estoque: {itemEntrada?.quantidade?.toLocaleString('pt-BR')}{' '}
              {itemEntrada?.unidadeMedida}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Quantidade a adicionar</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={qtdEntrada}
              onChange={(e) => setQtdEntrada(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setItemEntrada(null)}>
              Cancelar
            </Button>
            <Button onClick={registrarEntrada} disabled={loading || !qtdEntrada}>
              Registrar entrada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog nova distribuição */}
      <Dialog open={distAberta} onOpenChange={setDistAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Distribuição</DialogTitle>
            <DialogDescription>
              A quantidade é baixada do estoque automaticamente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={criarDistribuicao} className="space-y-4">
            <div className="space-y-2">
              <Label>Item do estoque *</Label>
              <Select
                value={novaDist.estoqueId}
                onValueChange={(v) => setNovaDist({ ...novaDist, estoqueId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {estoque.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.cultura}
                      {i.variedade ? ` (${i.variedade})` : ''} — {i.quantidade.toLocaleString('pt-BR')}{' '}
                      {i.unidadeMedida} disponíveis
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produtor *</Label>
              <Select
                value={novaDist.produtorId}
                onValueChange={(v) => setNovaDist({ ...novaDist, produtorId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produtor" />
                </SelectTrigger>
                <SelectContent>
                  {produtores.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} — {p.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={novaDist.quantidade}
                  onChange={(e) => setNovaDist({ ...novaDist, quantidade: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Safra</Label>
                <Input
                  value={novaDist.safra}
                  onChange={(e) => setNovaDist({ ...novaDist, safra: e.target.value })}
                  placeholder="Ex: 2026/2027"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={novaDist.observacoes}
                onChange={(e) => setNovaDist({ ...novaDist, observacoes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDistAberta(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !novaDist.estoqueId || !novaDist.produtorId}
              >
                {loading ? 'Registrando...' : 'Distribuir'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
