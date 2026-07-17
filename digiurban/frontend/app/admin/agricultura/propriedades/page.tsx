'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, MapPin, Plus, Ruler, FileText, Home } from 'lucide-react';
import { MetricCard } from '@/components/agricultura/metric-card';
import { DataTable } from '@/components/agricultura/data-table';
import { usePropriedades, useProdutores } from '@/lib/hooks/use-agricultura-api';
import { useToast } from '@/components/ui/use-toast';

export default function PropriedadesRuraisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { listPropriedades, createPropriedade, getStatistics, loading } = usePropriedades();
  const { listProdutores } = useProdutores();

  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    produtorId: '',
    nome: '',
    endereco: '',
    bairro: '',
    areaHectares: '',
    car: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propriedadesData, statsData, produtoresData] = await Promise.all([
        listPropriedades(),
        getStatistics(),
        listProdutores(),
      ]);
      setPropriedades(propriedadesData);
      setStatistics(statsData);
      setProdutores(produtoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPropriedade({
        ...formData,
        areaHectares: formData.areaHectares ? Number(formData.areaHectares) : undefined,
      });
      toast({ title: 'Sucesso!', description: 'Propriedade cadastrada com sucesso!' });
      setIsDialogOpen(false);
      setFormData({ produtorId: '', nome: '', endereco: '', bairro: '', areaHectares: '', car: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'nome', label: 'Propriedade' },
    {
      key: 'produtor',
      label: 'Produtor',
      render: (item: any) => item.produtor?.nome || '-',
    },
    {
      key: 'bairro',
      label: 'Localidade',
      render: (item: any) => [item.endereco, item.bairro].filter(Boolean).join(' — ') || '-',
    },
    {
      key: 'areaHectares',
      label: 'Área (ha)',
      render: (item: any) =>
        item.areaHectares != null ? item.areaHectares.toLocaleString('pt-BR') : '-',
    },
    {
      key: 'car',
      label: 'CAR',
      render: (item: any) =>
        item.car ? (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {item.car}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: any) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
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
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="hidden sm:inline">Propriedades Rurais</span>
              <span className="sm:hidden">Propriedades</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Cadastro das propriedades rurais vinculadas aos produtores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white">MS-02</Badge>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Propriedade</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Propriedades"
          value={statistics?.total || 0}
          icon={Home}
          description="Cadastradas no sistema"
          color="green"
          loading={!statistics}
        />
        <MetricCard
          title="Propriedades Ativas"
          value={statistics?.ativas || 0}
          icon={MapPin}
          description="Atualmente ativas"
          color="blue"
          loading={!statistics}
        />
        <MetricCard
          title="Área Total (ha)"
          value={Math.round(statistics?.areaTotalHectares || 0)}
          icon={Ruler}
          description="Hectares cadastrados"
          color="purple"
          loading={!statistics}
        />
        <MetricCard
          title="Com CAR"
          value={statistics?.comCAR || 0}
          icon={FileText}
          description="Cadastro Ambiental Rural"
          color="orange"
          loading={!statistics}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Propriedades</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={propriedades}
            columns={columns}
            searchPlaceholder="Buscar por nome, produtor, localidade..."
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Propriedade Rural</DialogTitle>
            <DialogDescription>Vincule a propriedade a um produtor cadastrado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label>Produtor *</Label>
                <Select
                  value={formData.produtorId}
                  onValueChange={(v) => setFormData({ ...formData, produtorId: v })}
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
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="nome">Nome da Propriedade *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Sítio Boa Esperança"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço / Acesso</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Comunidade / Localidade</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaHectares">Área (hectares)</Label>
                <Input
                  id="areaHectares"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.areaHectares}
                  onChange={(e) => setFormData({ ...formData, areaHectares: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="car">CAR</Label>
                <Input
                  id="car"
                  value={formData.car}
                  onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                  placeholder="Cadastro Ambiental Rural"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.produtorId}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
