'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search, Clock } from 'lucide-react';

export default function TurnosListagem() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/turnos?search=' + search, {
        credentials: 'include',
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar este turno?')) return;

    try {
      await fetch(`/api/apps/saude/cadastros/turnos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      loadItems();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const getPeriodoBadgeColor = (periodo: string) => {
    const colors: Record<string, string> = {
      Manhã: 'bg-yellow-100 text-yellow-800',
      Tarde: 'bg-orange-100 text-orange-800',
      Noite: 'bg-blue-100 text-blue-800',
      Integral: 'bg-green-100 text-green-800',
    };
    return colors[periodo] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Clock className="h-8 w-8" />
                Turnos de Trabalho
              </h1>
              <p className="text-gray-600">Gerenciar horários e turnos de atendimento</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/turnos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Turno
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou período..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadItems()}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadItems}>Buscar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4">Carregando...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum turno encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Horário Início</TableHead>
                    <TableHead>Horário Fim</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <Badge className={getPeriodoBadgeColor(item.periodo)}>{item.periodo}</Badge>
                      </TableCell>
                      <TableCell>{formatTime(item.horaInicio)}</TableCell>
                      <TableCell>{formatTime(item.horaFim)}</TableCell>
                      <TableCell>{item.cargaHoraria ? `${item.cargaHoraria}h` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/turnos/${item.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
