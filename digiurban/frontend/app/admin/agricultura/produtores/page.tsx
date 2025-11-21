'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { MetricCard } from '@/components/agricultura/metric-card';
import { DataTable } from '@/components/agricultura/data-table';
import { useProdutores } from '@/lib/hooks/use-agricultura-api';
import { useToast } from '@/components/ui/use-toast';

export default function CadastroProdutoresPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    listProdutores,
    createProdutor,
    getStatistics,
    emitirCarteirinha,
    loading,
  } = useProdutores();

  const [produtores, setProdutores] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    citizenId: '',
    cpf: '',
    nome: '',
    celular: '',
    email: '',
    atividadePrincipal: '',
    dap: '',
    car: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [produtoresData, statsData] = await Promise.all([
        listProdutores(),
        getStatistics(),
      ]);
      setProdutores(produtoresData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProdutor(formData);
      toast({
        title: 'Sucesso!',
        description: 'Produtor cadastrado com sucesso!',
      });
      setIsDialogOpen(false);
      setFormData({
        citizenId: '',
        cpf: '',
        nome: '',
        celular: '',
        email: '',
        atividadePrincipal: '',
        dap: '',
        car: '',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEmitirCarteirinha = async (produtor: any) => {
    try {
      await emitirCarteirinha(produtor.id);
      toast({
        title: 'Sucesso!',
        description: 'Carteirinha emitida com sucesso!',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'cpf', label: 'CPF' },
    {
      key: 'celular',
      label: 'Celular',
      render: (item: any) => item.celular || '-',
    },
    {
      key: 'atividadePrincipal',
      label: 'Atividade',
      render: (item: any) => item.atividadePrincipal || '-',
    },
    {
      key: 'dap',
      label: 'DAP',
      render: (item: any) =>
        item.dap ? (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {item.dap}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'numeroCarteirinha',
      label: 'Carteirinha',
      render: (item: any) =>
        item.numeroCarteirinha ? (
          <Badge className="bg-blue-500">
            <CreditCard className="h-3 w-3 mr-1" />
            {item.numeroCarteirinha}
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEmitirCarteirinha(item)}
          >
            Emitir
          </Button>
        ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: any) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/secretarias/agricultura')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              Cadastro de Produtores Rurais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie o cadastro completo dos produtores rurais do município
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white">MS-01</Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produtor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Produtor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produtor rural
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="citizenId">ID do Cidadão *</Label>
                    <Input
                      id="citizenId"
                      value={formData.citizenId}
                      onChange={(e) =>
                        setFormData({ ...formData, citizenId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      type="tel"
                      value={formData.celular}
                      onChange={(e) =>
                        setFormData({ ...formData, celular: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="atividadePrincipal">Atividade Principal</Label>
                    <Input
                      id="atividadePrincipal"
                      value={formData.atividadePrincipal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          atividadePrincipal: e.target.value,
                        })
                      }
                      placeholder="Ex: Agricultura Familiar, Hortaliças, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dap">DAP</Label>
                    <Input
                      id="dap"
                      value={formData.dap}
                      onChange={(e) =>
                        setFormData({ ...formData, dap: e.target.value })
                      }
                      placeholder="Declaração de Aptidão ao PRONAF"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car">CAR</Label>
                    <Input
                      id="car"
                      value={formData.car}
                      onChange={(e) =>
                        setFormData({ ...formData, car: e.target.value })
                      }
                      placeholder="Cadastro Ambiental Rural"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Produtores"
          value={statistics?.total || 0}
          icon={Users}
          description="Cadastrados no sistema"
          color="green"
          loading={!statistics}
        />
        <MetricCard
          title="Produtores Ativos"
          value={statistics?.ativos || 0}
          icon={CheckCircle}
          description="Atualmente ativos"
          color="blue"
          loading={!statistics}
        />
        <MetricCard
          title="Com CAR"
          value={statistics?.comCAR || 0}
          icon={FileText}
          description="Cadastro Ambiental Rural"
          color="purple"
          loading={!statistics}
        />
        <MetricCard
          title="Com Pendências"
          value={statistics?.comPendencias || 0}
          icon={AlertCircle}
          description="Requer atenção"
          color="orange"
          loading={!statistics}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtores</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={produtores}
            columns={columns}
            searchPlaceholder="Buscar por nome, CPF, DAP..."
            onView={(item) => router.push(`/admin/agricultura/produtores/${item.id}`)}
            onEdit={(item) => router.push(`/admin/agricultura/produtores/${item.id}/editar`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
