'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Especialidade {
  id: number;
  nome: string;
  area: string;
  tempoMedioConsulta: number | null;
  cor: string | null;
}

export default function EspecialidadesPage() {
  const router = useRouter();
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/especialidades', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data);
      } else {
        toast.error('Erro ao carregar especialidades');
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
      toast.error('Erro ao carregar especialidades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta especialidade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/especialidades/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Especialidade excluída com sucesso');
        fetchEspecialidades();
      } else {
        toast.error('Erro ao excluir especialidade');
      }
    } catch (error) {
      console.error('Erro ao excluir especialidade:', error);
      toast.error('Erro ao excluir especialidade');
    }
  };

  const filteredEspecialidades = especialidades.filter((esp) => {
    const matchSearch = searchTerm === '' || esp.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = filterArea === '' || esp.area === filterArea;
    return matchSearch && matchArea;
  });

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
            <h1 className="text-3xl font-bold">Especialidades Médicas</h1>
            <p className="text-gray-600">Gerenciar especialidades médicas</p>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/apps/saude/cadastros/especialidades/nova')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Todas as áreas</option>
              <option value="Clinica Medica">Clínica Médica</option>
              <option value="Cirurgia">Cirurgia</option>
              <option value="Pediatria">Pediatria</option>
              <option value="Ginecologia e Obstetricia">Ginecologia e Obstetrícia</option>
              <option value="Ortopedia">Ortopedia</option>
              <option value="Cardiologia">Cardiologia</option>
              <option value="Odontologia">Odontologia</option>
              <option value="Psicologia">Psicologia</option>
              <option value="Fisioterapia">Fisioterapia</option>
              <option value="Nutricao">Nutrição</option>
              <option value="Outras">Outras</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Especialidades ({filteredEspecialidades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Tempo Médio</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEspecialidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhuma especialidade encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEspecialidades.map((especialidade) => (
                    <TableRow key={especialidade.id}>
                      <TableCell className="font-medium">{especialidade.nome}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">
                          {especialidade.area}
                        </Badge>
                      </TableCell>
                      <TableCell>{especialidade.tempoMedioConsulta ? `${especialidade.tempoMedioConsulta} min` : '-'}</TableCell>
                      <TableCell>
                        {especialidade.cor && (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: especialidade.cor }}
                            />
                            <span className="text-sm text-gray-600">{especialidade.cor}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/especialidades/${especialidade.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(especialidade.id)}
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
