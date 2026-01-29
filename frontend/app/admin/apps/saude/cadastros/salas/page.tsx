'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

interface Sala {
  id: number;
  nome: string;
  numero: string;
  tipo: string;
  andar: string | null;
  capacidade: number | null;
  unidade: { id: number; nome: string };
}

export default function SalasPage() {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnidadeId, setFilterUnidadeId] = useState<number | null>(null);
  const [filterTipo, setFilterTipo] = useState('');

  useEffect(() => {
    if (filterUnidadeId) {
      fetchSalas();
    } else {
      setSalas([]);
      setLoading(false);
    }
  }, [filterUnidadeId]);

  const fetchSalas = async () => {
    try {
      const url = filterUnidadeId
        ? `/api/apps/saude/cadastros/salas?unidadeId=${filterUnidadeId}`
        : '/api/apps/saude/cadastros/salas';

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSalas(data);
      } else {
        toast.error('Erro ao carregar salas');
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      toast.error('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta sala?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/salas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Sala excluída com sucesso');
        fetchSalas();
      } else {
        toast.error('Erro ao excluir sala');
      }
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      toast.error('Erro ao excluir sala');
    }
  };

  const filteredSalas = salas.filter((sala) => {
    const matchSearch = searchTerm === '' ||
      sala.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.numero.includes(searchTerm);
    const matchTipo = filterTipo === '' || sala.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'Consultorio': 'bg-blue-100 text-blue-800',
      'Sala de Exames': 'bg-green-100 text-green-800',
      'Sala de Vacina': 'bg-purple-100 text-purple-800',
      'Sala de Curativo': 'bg-yellow-100 text-yellow-800',
      'Sala de Observacao': 'bg-orange-100 text-orange-800',
      'Sala Cirurgica': 'bg-red-100 text-red-800',
      'Outros': 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/apps/saude/cadastros')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Salas/Consultórios</h1>
            <p className="text-gray-600">Gerenciar salas e consultórios</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/admin/apps/saude/cadastros/salas/nova')}
          disabled={!filterUnidadeId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Sala
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Unidade de Saúde * (obrigatório)
              </label>
              <UnidadeSaudeSelector
                value={filterUnidadeId}
                onChange={(id) => setFilterUnidadeId(id)}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <Search className="absolute left-3 top-11 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={!filterUnidadeId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                disabled={!filterUnidadeId}
              >
                <option value="">Todos os tipos</option>
                <option value="Consultorio">Consultório</option>
                <option value="Sala de Exames">Sala de Exames</option>
                <option value="Sala de Vacina">Sala de Vacina</option>
                <option value="Sala de Curativo">Sala de Curativo</option>
                <option value="Sala de Observacao">Sala de Observação</option>
                <option value="Sala Cirurgica">Sala Cirúrgica</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salas ({filteredSalas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!filterUnidadeId ? (
            <p className="text-center text-gray-500 py-8">
              Selecione uma unidade de saúde para visualizar as salas
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Andar</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma sala encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalas.map((sala) => (
                      <TableRow key={sala.id}>
                        <TableCell className="font-medium">{sala.nome}</TableCell>
                        <TableCell>{sala.numero}</TableCell>
                        <TableCell>
                          <Badge className={getTipoBadgeColor(sala.tipo)}>
                            {sala.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{sala.andar || '-'}</TableCell>
                        <TableCell>{sala.capacidade || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/apps/saude/cadastros/salas/${sala.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sala.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
