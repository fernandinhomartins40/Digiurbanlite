'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DestinosPage() {
  const { toast } = useToast();
  const [destinos, setDestinos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    cidade: '',
    estado: '',
    hospital: '',
    distanciaKm: 0,
    tempoViagem: '',
    observacoes: '',
  });

  useEffect(() => {
    loadDestinos();
  }, []);

  const loadDestinos = async () => {
    try {
      const response = await fetch('/api/saude/tfd/destinos?apenasAtivos=false', {
        credentials: 'include',
      });
      const data = await response.json();
      setDestinos(data);
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os destinos',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      const method = editando ? 'PUT' : 'POST';
      const url = editando
        ? `/api/saude/tfd/destinos/${editando.id}`
        : '/api/saude/tfd/destinos';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Falha ao salvar destino');

      toast({
        title: 'Destino salvo!',
        description: 'As informações do destino foram atualizadas.',
      });
      setOpen(false);
      setEditando(null);
      setFormData({
        cidade: '',
        estado: '',
        hospital: '',
        distanciaKm: 0,
        tempoViagem: '',
        observacoes: '',
      });
      loadDestinos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o destino',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este destino?')) return;

    try {
      const response = await fetch(`/api/saude/tfd/destinos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Falha ao excluir destino');

      toast({
        title: 'Destino excluído!',
        description: 'O destino foi removido com sucesso.',
      });
      loadDestinos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o destino',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (destino: any) => {
    setEditando(destino);
    setFormData({
      cidade: destino.cidade,
      estado: destino.estado,
      hospital: destino.hospital || '',
      distanciaKm: destino.distanciaKm || 0,
      tempoViagem: destino.tempoViagem || '',
      observacoes: destino.observacoes || '',
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditando(null);
    setFormData({
      cidade: '',
      estado: '',
      hospital: '',
      distanciaKm: 0,
      tempoViagem: '',
      observacoes: '',
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-8 w-8 text-orange-600" />
            Gestão de Destinos TFD
          </h1>
          <p className="text-muted-foreground">
            Configure as cidades e hospitais de destino para encaminhamentos
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700" onClick={handleNew}>
              <Plus className="h-5 w-5 mr-2" />
              Novo Destino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Novo'} Destino</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade *</Label>
                  <Input
                    placeholder="Ex: Curitiba"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado *</Label>
                  <Input
                    placeholder="Ex: PR"
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div>
                <Label>Hospital / Instituição</Label>
                <Input
                  placeholder="Ex: Hospital das Clínicas"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Distância (km)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.distanciaKm}
                    onChange={(e) => setFormData({ ...formData, distanciaKm: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Tempo de Viagem</Label>
                  <Input
                    placeholder="Ex: 2h30min"
                    value={formData.tempoViagem}
                    onChange={(e) => setFormData({ ...formData, tempoViagem: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Informações adicionais sobre o destino"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={!formData.cidade || !formData.estado}
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{destinos.length} Destinos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Distância</TableHead>
                <TableHead>Tempo de Viagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinos.map((destino) => (
                <TableRow key={destino.id}>
                  <TableCell className="font-medium">
                    {destino.cidade} - {destino.estado}
                  </TableCell>
                  <TableCell>{destino.hospital || '-'}</TableCell>
                  <TableCell>{destino.distanciaKm ? `${destino.distanciaKm} km` : '-'}</TableCell>
                  <TableCell>{destino.tempoViagem || '-'}</TableCell>
                  <TableCell>
                    {destino.ativo ? (
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(destino)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(destino.id)}
                      >
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
