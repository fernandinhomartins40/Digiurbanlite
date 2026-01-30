'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Search, DoorOpen } from 'lucide-react';

export default function SalasListagem() {
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
      const response = await fetch('/api/apps/saude/cadastros/salas?search=' + search, {
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
    if (!confirm('Deseja realmente desativar esta sala?')) return;

    try {
      await fetch(`/api/apps/saude/cadastros/salas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      loadItems();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      Consultório: 'bg-blue-100 text-blue-800',
      Enfermagem: 'bg-green-100 text-green-800',
      Odontologia: 'bg-purple-100 text-purple-800',
      Vacinação: 'bg-yellow-100 text-yellow-800',
      Curativo: 'bg-orange-100 text-orange-800',
      Procedimentos: 'bg-pink-100 text-pink-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
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
                <DoorOpen className="h-8 w-8" />
                Salas e Consultórios
              </h1>
              <p className="text-gray-600">Gerenciar salas de atendimento e consultórios</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/salas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sala
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, número ou tipo..."
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
                <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sala encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>{item.numero || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(item.tipo)}>{item.tipo}</Badge>
                      </TableCell>
                      <TableCell>{item.unidadeNome || '-'}</TableCell>
                      <TableCell>{item.capacidade || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/apps/saude/cadastros/salas/${item.id}`)}
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
