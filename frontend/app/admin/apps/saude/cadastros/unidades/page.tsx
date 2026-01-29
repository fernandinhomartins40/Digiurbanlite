'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface UnidadeSaude {
  id: number;
  nome: string;
  tipo: string;
  cnes: string | null;
  endereco: string | null;
  telefone: string | null;
  status: string;
}

export default function UnidadesPage() {
  const router = useRouter();
  const [unidades, setUnidades] = useState<UnidadeSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/unidades', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUnidades(data);
      } else {
        toast.error('Erro ao carregar unidades');
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente desativar esta unidade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/unidades/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Unidade desativada com sucesso');
        fetchUnidades();
      } else {
        toast.error('Erro ao desativar unidade');
      }
    } catch (error) {
      console.error('Erro ao desativar unidade:', error);
      toast.error('Erro ao desativar unidade');
    }
  };

  const filteredUnidades = unidades.filter((unidade) => {
    const matchSearch = searchTerm === '' ||
      unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unidade.cnes && unidade.cnes.includes(searchTerm));

    const matchTipo = filterTipo === '' || unidade.tipo === filterTipo;
    const matchStatus = filterStatus === '' || unidade.status === filterStatus;

    return matchSearch && matchTipo && matchStatus;
  });

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'UBS': 'bg-blue-100 text-blue-800',
      'UPA': 'bg-red-100 text-red-800',
      'Hospital': 'bg-purple-100 text-purple-800',
      'Policlinica': 'bg-green-100 text-green-800',
      'CEO': 'bg-yellow-100 text-yellow-800',
      'CAPS': 'bg-pink-100 text-pink-800',
      'Laboratorio': 'bg-indigo-100 text-indigo-800',
      'Outros': 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Unidades de Saúde</h1>
            <p className="text-gray-600">Gerenciar unidades de saúde</p>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/apps/saude/cadastros/unidades/nova')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou CNES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Todos os tipos</option>
              <option value="UBS">UBS</option>
              <option value="UPA">UPA</option>
              <option value="Hospital">Hospital</option>
              <option value="Policlinica">Policlínica</option>
              <option value="CEO">CEO</option>
              <option value="CAPS">CAPS</option>
              <option value="Laboratorio">Laboratório</option>
              <option value="Outros">Outros</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades ({filteredUnidades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CNES</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma unidade encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnidades.map((unidade) => (
                    <TableRow key={unidade.id}>
                      <TableCell className="font-medium">{unidade.nome}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(unidade.tipo)}>
                          {unidade.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{unidade.cnes || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {unidade.endereco || '-'}
                      </TableCell>
                      <TableCell>{unidade.telefone || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            unidade.status === 'Ativo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {unidade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/unidades/${unidade.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/unidades/${unidade.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(unidade.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
