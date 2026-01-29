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

interface ProfissionalSaude {
  id: number;
  nome: string;
  cpf: string;
  categoria: string;
  registroProfissional: string;
  status: string;
  especialidades: Array<{ id: number; nome: string }>;
}

export default function ProfissionaisPage() {
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<ProfissionalSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const fetchProfissionais = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/profissionais', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfissionais(data);
      } else {
        toast.error('Erro ao carregar profissionais');
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente desativar este profissional?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/profissionais/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Profissional desativado com sucesso');
        fetchProfissionais();
      } else {
        toast.error('Erro ao desativar profissional');
      }
    } catch (error) {
      console.error('Erro ao desativar profissional:', error);
      toast.error('Erro ao desativar profissional');
    }
  };

  const filteredProfissionais = profissionais.filter((profissional) => {
    const matchSearch = searchTerm === '' ||
      profissional.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profissional.cpf.includes(searchTerm) ||
      profissional.registroProfissional.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria = filterCategoria === '' || profissional.categoria === filterCategoria;
    const matchStatus = filterStatus === '' || profissional.status === filterStatus;

    return matchSearch && matchCategoria && matchStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'Ativo': 'bg-green-100 text-green-800',
      'Inativo': 'bg-red-100 text-red-800',
      'Ferias': 'bg-yellow-100 text-yellow-800',
      'Licenca': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold">Profissionais de Saúde</h1>
            <p className="text-gray-600">Gerenciar profissionais de saúde</p>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/apps/saude/cadastros/profissionais/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Profissional
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
                placeholder="Buscar por nome, CPF ou registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Todas as categorias</option>
              <option value="Medico">Médico</option>
              <option value="Enfermeiro">Enfermeiro</option>
              <option value="Dentista">Dentista</option>
              <option value="Psicologo">Psicólogo</option>
              <option value="Fisioterapeuta">Fisioterapeuta</option>
              <option value="Nutricionista">Nutricionista</option>
              <option value="Farmaceutico">Farmacêutico</option>
              <option value="TecnicoEnfermagem">Técnico em Enfermagem</option>
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
              <option value="Ferias">Férias</option>
              <option value="Licenca">Licença</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais ({filteredProfissionais.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfissionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum profissional encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfissionais.map((profissional) => (
                    <TableRow key={profissional.id}>
                      <TableCell className="font-medium">{profissional.nome}</TableCell>
                      <TableCell>{profissional.categoria}</TableCell>
                      <TableCell>{profissional.registroProfissional}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profissional.especialidades.map((esp) => (
                            <Badge key={esp.id} className="bg-purple-100 text-purple-800 text-xs">
                              {esp.nome}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(profissional.status)}>
                          {profissional.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/profissionais/${profissional.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/profissionais/${profissional.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(profissional.id)}
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
