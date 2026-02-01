'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Users, User } from 'lucide-react';

interface Microarea {
  id: string;
  numero: string;
  descricao: string | null;
  ativo: boolean;
  acs: {
    id: string;
    nome: string;
    email: string;
  } | null;
  _count: {
    citizens: number;
  };
}

interface Equipe {
  id: string;
  ine: string;
  nome: string;
  tipo: string;
  unidade: {
    id: string;
    nome: string;
  };
}

interface ACS {
  id: string;
  nome: string;
  email: string;
}

export default function MicroareasEquipePage() {
  const router = useRouter();
  const params = useParams();
  const equipeId = params.id as string;

  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [microareas, setMicroareas] = useState<Microarea[]>([]);
  const [acsDisponiveis, setAcsDisponiveis] = useState<ACS[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMicroarea, setEditingMicroarea] = useState<Microarea | null>(null);

  const [formData, setFormData] = useState({
    numero: '',
    descricao: '',
    acsId: '',
  });

  useEffect(() => {
    loadEquipe();
    loadMicroareas();
    loadACS();
  }, [equipeId]);

  const loadEquipe = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/equipes/${equipeId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipe(data);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    }
  };

  const loadMicroareas = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/apps/saude/cadastros/equipes/${equipeId}/microareas`,
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      setMicroareas(data);
    } catch (error) {
      console.error('Erro ao carregar microáreas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadACS = async () => {
    try {
      // Buscar profissionais com categoria ACS
      const response = await fetch(
        '/api/apps/saude/cadastros/profissionais?categoria=ACS',
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      setAcsDisponiveis(data);
    } catch (error) {
      console.error('Erro ao carregar ACS:', error);
    }
  };

  const handleOpenModal = (microarea?: Microarea) => {
    if (microarea) {
      setEditingMicroarea(microarea);
      setFormData({
        numero: microarea.numero,
        descricao: microarea.descricao || '',
        acsId: microarea.acs?.id || '',
      });
    } else {
      setEditingMicroarea(null);
      setFormData({
        numero: '',
        descricao: '',
        acsId: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero) {
      alert('Informe o número da microárea');
      return;
    }

    try {
      const url = editingMicroarea
        ? `/api/apps/saude/cadastros/microareas/${editingMicroarea.id}`
        : `/api/apps/saude/cadastros/equipes/${equipeId}/microareas`;

      const response = await fetch(url, {
        method: editingMicroarea ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          acsId: formData.acsId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar microárea');
        return;
      }

      setModalOpen(false);
      loadMicroareas();
    } catch (error) {
      console.error('Erro ao salvar microárea:', error);
      alert('Erro ao salvar microárea');
    }
  };

  const handleDelete = async (id: string, numero: string) => {
    if (!confirm(`Deseja realmente desativar a microárea ${numero}?`)) return;

    try {
      const response = await fetch(`/api/apps/saude/cadastros/microareas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao desativar microárea');
        return;
      }

      loadMicroareas();
    } catch (error) {
      console.error('Erro ao desativar microárea:', error);
      alert('Erro ao desativar microárea');
    }
  };

  const microareasAtivas = microareas.filter((m) => m.ativo);
  const totalCidadaos = microareasAtivas.reduce((sum, m) => sum + m._count.citizens, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              Microáreas
            </h1>
            {equipe && (
              <p className="text-gray-600">
                {equipe.nome} - {equipe.unidade.nome}
              </p>
            )}
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Microárea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMicroarea ? 'Editar Microárea' : 'Nova Microárea'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">
                    Número da Microárea <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ex: 01, 02, 03..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Ruas A, B e C"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acs">Agente Comunitário de Saúde (ACS) - Opcional</Label>
                  <Select
                    value={formData.acsId}
                    onValueChange={(value) => setFormData({ ...formData, acsId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Deixe vazio para sem ACS ou selecione um ACS" />
                    </SelectTrigger>
                    <SelectContent>
                      {acsDisponiveis.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">Nenhum ACS disponível</div>
                      ) : (
                        acsDisponiveis.map((acs) => (
                          <SelectItem key={acs.id} value={acs.id}>
                            {acs.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Microáreas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {microareasAtivas.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                ACS Designados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {microareasAtivas.filter((m) => m.acs).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cidadãos Vinculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{totalCidadaos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Microáreas */}
        <Card>
          <CardHeader>
            <CardTitle>Microáreas Cadastradas ({microareas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : microareas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma microárea cadastrada. Clique em "Nova Microárea" para começar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>ACS Responsável</TableHead>
                      <TableHead className="text-center">Cidadãos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {microareas.map((microarea) => (
                      <TableRow key={microarea.id}>
                        <TableCell className="font-semibold">{microarea.numero}</TableCell>
                        <TableCell className="text-gray-600">
                          {microarea.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          {microarea.acs ? (
                            <div>
                              <div className="font-medium">{microarea.acs.nome}</div>
                              <div className="text-xs text-gray-500">
                                {microarea.acs.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sem ACS</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {microarea._count.citizens}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {microarea.ativo ? (
                            <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenModal(microarea)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            {microarea.ativo && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDelete(microarea.id, microarea.numero)
                                }
                                title="Desativar"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
