'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VeiculosPage() {
  const { toast } = useToast();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    setVeiculos([
      {
        id: '1',
        modelo: 'Van Fiat Ducato',
        placa: 'ABC-1234',
        ano: 2022,
        capacidade: 15,
        acessibilidade: true,
        km: 45000,
        status: 'DISPONIVEL',
      },
      {
        id: '2',
        modelo: 'Carro Toyota Corolla',
        placa: 'XYZ-5678',
        ano: 2021,
        capacidade: 5,
        acessibilidade: false,
        km: 32000,
        status: 'EM_VIAGEM',
      },
    ]);
  };

  const handleSave = async (data: any) => {
    try {
      toast({
        title: 'Veículo salvo!',
        description: 'As informações do veículo foram atualizadas.',
      });
      setOpen(false);
      setEditando(null);
      loadVeiculos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o veículo',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      DISPONIVEL: { label: 'Disponível', color: 'bg-green-100 text-green-800' },
      EM_VIAGEM: { label: 'Em Viagem', color: 'bg-blue-100 text-blue-800' },
      MANUTENCAO: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
      INATIVO: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
    };
    const config = map[status] || map.DISPONIVEL;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Car className="h-8 w-8 text-blue-600" />
            Gestão de Veículos TFD
          </h1>
          <p className="text-muted-foreground">Gerencie a frota municipal de veículos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Novo'} Veículo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Modelo *</Label>
                <Input placeholder="Ex: Van Fiat Ducato" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Placa *</Label>
                  <Input placeholder="ABC-1234" />
                </div>
                <div>
                  <Label>Ano *</Label>
                  <Input type="number" placeholder="2024" />
                </div>
              </div>
              <div>
                <Label>Capacidade (passageiros) *</Label>
                <Input type="number" placeholder="15" />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{veiculos.length} Veículos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Acessibilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell className="font-medium">{veiculo.modelo}</TableCell>
                  <TableCell>{veiculo.placa}</TableCell>
                  <TableCell>{veiculo.ano}</TableCell>
                  <TableCell>{veiculo.capacidade}</TableCell>
                  <TableCell>{veiculo.km.toLocaleString()} km</TableCell>
                  <TableCell>
                    {veiculo.acessibilidade ? (
                      <Badge className="bg-green-100 text-green-800">Sim</Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(veiculo.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
