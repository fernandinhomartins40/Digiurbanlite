'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, MapPin, Users, User, Search } from 'lucide-react';

interface Microarea {
  id: string;
  numero: string;
  descricao: string | null;
  ativo: boolean;
  equipe: {
    id: string;
    nome: string;
    ine: string;
    unidade: {
      id: string;
      nome: string;
    };
  };
  acs: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    citizens: number;
  };
}

interface Equipe {
  id: string;
  nome: string;
  ine: string;
}

export default function MicroareasListagem() {
  const router = useRouter();
  const [microareas, setMicroareas] = useState<Microarea[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVOS');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('TODAS');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadEquipes();
  }, []);

  useEffect(() => {
    loadMicroareas();
  }, [filtroStatus, filtroEquipe]);

  const loadEquipes = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/equipes?ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadMicroareas = async () => {
    try {
      setLoading(true);
      let url = '/api/apps/saude/cadastros/microareas';

      const params = new URLSearchParams();
      if (filtroStatus === 'ATIVOS') params.append('ativo', 'true');
      if (filtroStatus === 'INATIVOS') params.append('ativo', 'false');
      if (filtroEquipe && filtroEquipe !== 'TODAS') params.append('equipeId', filtroEquipe);

      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      setMicroareas(data);
    } catch (error) {
      console.error('Erro ao carregar microáreas:', error);
    } finally {
      setLoading(false);
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

      alert('Microárea desativada com sucesso!');
      loadMicroareas();
    } catch (error) {
      console.error('Erro ao desativar microárea:', error);
      alert('Erro ao desativar microárea');
    }
  };

  const microareasFiltradas = microareas.filter((m) =>
    m.numero.toLowerCase().includes(busca.toLowerCase()) ||
    (m.descricao?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    m.equipe.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (m.acs?.name.toLowerCase() || '').includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MapPin className="h-8 w-8 text-purple-600" />
                Microáreas
              </h1>
              <p className="text-gray-600">Territorialização e ACS responsáveis</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/microareas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Microárea
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVOS">Ativos</SelectItem>
                    <SelectItem value="INATIVOS">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Equipe ESF</label>
                <Select value={filtroEquipe} onValueChange={setFiltroEquipe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as equipes</SelectItem>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Número, descrição, equipe ou ACS..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{microareas.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {microareas.filter((m) => m.ativo).length}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Com ACS</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {microareas.filter((m) => m.acs !== null).length}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Famílias Cadastradas</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {microareas.reduce((acc, m) => acc + m._count.citizens, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Microáreas Cadastradas ({microareasFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Carregando microáreas...</p>
              </div>
            ) : microareasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma microárea encontrada</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/admin/apps/saude/cadastros/microareas/nova')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira microárea
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Equipe ESF</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>ACS Responsável</TableHead>
                      <TableHead className="text-center">Famílias</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {microareasFiltradas.map((microarea) => (
                      <TableRow key={microarea.id}>
                        <TableCell className="font-medium">
                          Microárea {microarea.numero}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {microarea.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{microarea.equipe.nome}</p>
                            <p className="text-sm text-gray-500">INE: {microarea.equipe.ine}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {microarea.equipe.unidade.nome}
                        </TableCell>
                        <TableCell>
                          {microarea.acs ? (
                            <div>
                              <p className="font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {microarea.acs.name}
                              </p>
                              <p className="text-sm text-gray-500">{microarea.acs.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sem ACS</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{microarea._count.citizens}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={microarea.ativo ? 'default' : 'secondary'}>
                            {microarea.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/apps/saude/cadastros/microareas/${microarea.id}`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(microarea.id, microarea.numero)}
                              disabled={!microarea.ativo}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* Info Card */}
        <Card className="mt-6 bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-purple-900 mb-2">
              ℹ️ Sobre Microáreas
            </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• <strong>Microárea</strong>: Subdivisão do território de uma equipe ESF</li>
              <li>• <strong>ACS</strong>: Agente Comunitário de Saúde responsável pelo território</li>
              <li>• Cada microárea deve ter aproximadamente 750 pessoas (150 famílias)</li>
              <li>• O ACS realiza visitas domiciliares mensais em seu território</li>
              <li>• A territorialização fortalece o vínculo com a comunidade</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
