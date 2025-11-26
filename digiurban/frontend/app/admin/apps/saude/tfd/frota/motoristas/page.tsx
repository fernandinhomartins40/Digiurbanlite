'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MotoristasPage() {
  const { toast } = useToast();
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadMotoristas();
  }, []);

  const loadMotoristas = async () => {
    setMotoristas([
      {
        id: '1',
        nome: 'João Silva',
        cpf: '123.456.789-00',
        cnh: '12345678900',
        categoriaCNH: 'D',
        validadeCNH: '2026-12-31',
        telefone: '(11) 98765-4321',
        status: 'DISPONIVEL',
      },
      {
        id: '2',
        nome: 'Maria Santos',
        cpf: '987.654.321-00',
        cnh: '98765432100',
        categoriaCNH: 'D',
        validadeCNH: '2025-06-30',
        telefone: '(11) 91234-5678',
        status: 'EM_VIAGEM',
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      DISPONIVEL: { label: 'Disponível', color: 'bg-green-100 text-green-800' },
      EM_VIAGEM: { label: 'Em Viagem', color: 'bg-blue-100 text-blue-800' },
      FOLGA: { label: 'Folga', color: 'bg-yellow-100 text-yellow-800' },
      INATIVO: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
    };
    const config = map[status] || map.DISPONIVEL;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const isValidadeCNHProxima = (validade: string) => {
    const dias = Math.floor(
      (new Date(validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias <= 90 && dias >= 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            Gestão de Motoristas TFD
          </h1>
          <p className="text-muted-foreground">Gerencie os motoristas da frota municipal</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5 mr-2" />
              Novo Motorista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Motorista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input placeholder="Nome do motorista" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPF *</Label>
                  <Input placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>CNH *</Label>
                  <Input placeholder="00000000000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria CNH *</Label>
                  <Input placeholder="D" />
                </div>
                <div>
                  <Label>Validade CNH *</Label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input placeholder="(00) 00000-0000" />
              </div>
              <Button className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{motoristas.length} Motoristas Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Validade CNH</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motoristas.map((motorista) => (
                <TableRow key={motorista.id}>
                  <TableCell className="font-medium">{motorista.nome}</TableCell>
                  <TableCell>{motorista.cpf}</TableCell>
                  <TableCell>{motorista.cnh}</TableCell>
                  <TableCell>{motorista.categoriaCNH}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {new Date(motorista.validadeCNH).toLocaleDateString('pt-BR')}
                      {isValidadeCNHProxima(motorista.validadeCNH) && (
                        <Badge variant="destructive" className="text-xs">
                          Vence em breve
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{motorista.telefone}</TableCell>
                  <TableCell>{getStatusBadge(motorista.status)}</TableCell>
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
