'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Turno {
  id: number;
  nome: string;
  descricao: string | null;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
  cor: string | null;
}

export default function TurnosPage() {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/turnos', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTurnos(data);
      } else {
        toast.error('Erro ao carregar turnos');
      }
    } catch (error) {
      console.error('Erro ao carregar turnos:', error);
      toast.error('Erro ao carregar turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este turno?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/turnos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Turno excluído com sucesso');
        fetchTurnos();
      } else {
        toast.error('Erro ao excluir turno');
      }
    } catch (error) {
      console.error('Erro ao excluir turno:', error);
      toast.error('Erro ao excluir turno');
    }
  };

  const filteredTurnos = turnos.filter((turno) =>
    searchTerm === '' || turno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const diasSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
            <h1 className="text-3xl font-bold">Turnos de Trabalho</h1>
            <p className="text-gray-600">Gerenciar turnos de trabalho</p>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/apps/saude/cadastros/turnos/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Turno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Turnos ({filteredTurnos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Dias da Semana</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTurnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhum turno encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTurnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">{turno.nome}</TableCell>
                      <TableCell>{turno.horaInicio} - {turno.horaFim}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {turno.diasSemana.map((dia) => (
                            <span key={dia} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {diasSemanaAbrev[dia]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {turno.cor && (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: turno.cor }}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/turnos/${turno.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(turno.id)}
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
