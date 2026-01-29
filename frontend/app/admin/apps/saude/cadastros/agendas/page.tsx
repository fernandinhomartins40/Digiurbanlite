'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search, Calendar as CalendarIcon } from 'lucide-react';
import { ProfissionalSaudeSelector, UnidadeSaudeSelector, EspecialidadeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

interface Agenda {
  id: number;
  profissional: { id: number; nome: string };
  unidade: { id: number; nome: string };
  especialidade: { id: number; nome: string };
  sala: { id: number; nome: string } | null;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  vagasDisponiveis: number;
}

export default function AgendasPage() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProfissionalId, setFilterProfissionalId] = useState<number | null>(null);
  const [filterUnidadeId, setFilterUnidadeId] = useState<number | null>(null);
  const [filterEspecialidadeId, setFilterEspecialidadeId] = useState<number | null>(null);
  const [filterDiaSemana, setFilterDiaSemana] = useState('');

  useEffect(() => {
    fetchAgendas();
  }, [filterProfissionalId, filterUnidadeId, filterEspecialidadeId, filterDiaSemana]);

  const fetchAgendas = async () => {
    try {
      const params = new URLSearchParams();
      if (filterProfissionalId) params.append('profissionalId', filterProfissionalId.toString());
      if (filterUnidadeId) params.append('unidadeId', filterUnidadeId.toString());
      if (filterEspecialidadeId) params.append('especialidadeId', filterEspecialidadeId.toString());
      if (filterDiaSemana) params.append('diaSemana', filterDiaSemana);

      const url = `/api/apps/saude/cadastros/agendas${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAgendas(data);
      } else {
        toast.error('Erro ao carregar agendas');
      }
    } catch (error) {
      console.error('Erro ao carregar agendas:', error);
      toast.error('Erro ao carregar agendas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta agenda?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/agendas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Agenda excluída com sucesso');
        fetchAgendas();
      } else {
        toast.error('Erro ao excluir agenda');
      }
    } catch (error) {
      console.error('Erro ao excluir agenda:', error);
      toast.error('Erro ao excluir agenda');
    }
  };

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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
            <h1 className="text-3xl font-bold">Agendas Médicas</h1>
            <p className="text-gray-600">Gerenciar agendas de atendimento</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/apps/saude/cadastros/agendas/calendario')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Visualizar Calendário
          </Button>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/agendas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Agenda
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Profissional</label>
              <ProfissionalSaudeSelector
                value={filterProfissionalId}
                onChange={(id) => setFilterProfissionalId(id)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unidade</label>
              <UnidadeSaudeSelector
                value={filterUnidadeId}
                onChange={(id) => setFilterUnidadeId(id)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Especialidade</label>
              <EspecialidadeSelector
                value={filterEspecialidadeId}
                onChange={(id) => setFilterEspecialidadeId(id)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dia da Semana</label>
              <select
                value={filterDiaSemana}
                onChange={(e) => setFilterDiaSemana(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Todos os dias</option>
                {diasSemana.map((dia, index) => (
                  <option key={index} value={index.toString()}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendas ({agendas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma agenda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  agendas.map((agenda) => (
                    <TableRow key={agenda.id}>
                      <TableCell className="font-medium">{agenda.profissional.nome}</TableCell>
                      <TableCell>{agenda.unidade.nome}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">
                          {agenda.especialidade.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>{diasSemana[agenda.diaSemana]}</TableCell>
                      <TableCell>{agenda.horaInicio} - {agenda.horaFim}</TableCell>
                      <TableCell>{agenda.sala?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {agenda.vagasDisponiveis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/agendas/${agenda.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(agenda.id)}
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
