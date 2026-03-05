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
import { Stethoscope, Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EspecialidadesPage() {
  const { toast } = useToast();
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ordem: 0,
  });

  useEffect(() => {
    loadEspecialidades();
  }, []);

  const loadEspecialidades = async () => {
    try {
      const response = await fetch('/api/saude/tfd/especialidades?apenasAtivas=false', {
        credentials: 'include',
      });
      const data = await response.json();
      setEspecialidades(data);
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as especialidades',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      const method = editando ? 'PUT' : 'POST';
      const url = editando
        ? `/api/saude/tfd/especialidades/${editando.id}`
        : '/api/saude/tfd/especialidades';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Falha ao salvar especialidade');

      toast({
        title: 'Especialidade salva!',
        description: 'As informações da especialidade foram atualizadas.',
      });
      setOpen(false);
      setEditando(null);
      setFormData({ nome: '', descricao: '', ordem: 0 });
      loadEspecialidades();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a especialidade',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta especialidade?')) return;

    try {
      const response = await fetch(`/api/saude/tfd/especialidades/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Falha ao excluir especialidade');

      toast({
        title: 'Especialidade excluída!',
        description: 'A especialidade foi removida com sucesso.',
      });
      loadEspecialidades();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a especialidade',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (especialidade: any) => {
    setEditando(especialidade);
    setFormData({
      nome: especialidade.nome,
      descricao: especialidade.descricao || '',
      ordem: especialidade.ordem,
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditando(null);
    setFormData({ nome: '', descricao: '', ordem: 0 });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-purple-600" />
            Gestão de Especialidades Médicas
          </h1>
          <p className="text-muted-foreground">
            Configure as especialidades disponíveis para encaminhamentos TFD
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={handleNew}>
              <Plus className="h-5 w-5 mr-2" />
              Nova Especialidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nova'} Especialidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Cardiologia"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Informações adicionais sobre a especialidade"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!formData.nome}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{especialidades.length} Especialidades Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {especialidades.map((especialidade) => (
                <TableRow key={especialidade.id}>
                  <TableCell className="font-medium">{especialidade.ordem}</TableCell>
                  <TableCell className="font-medium">{especialidade.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {especialidade.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    {especialidade.ativo ? (
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(especialidade)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(especialidade.id)}
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
