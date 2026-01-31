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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowLeft, Users, MapPin, Stethoscope } from 'lucide-react';

interface Equipe {
  id: string;
  ine: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  unidade: {
    id: string;
    nome: string;
    tipo: string;
  };
  _count: {
    profissionais: number;
    microareas: number;
    citizens: number;
  };
}

export default function EquipesESFListagem() {
  const router = useRouter();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVOS');

  useEffect(() => {
    loadEquipes();
  }, [filtroStatus]);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      let url = '/api/apps/saude/cadastros/equipes';

      const params = new URLSearchParams();
      if (filtroStatus === 'ATIVOS') params.append('ativo', 'true');
      if (filtroStatus === 'INATIVOS') params.append('ativo', 'false');

      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente desativar a equipe "${nome}"?`)) return;

    try {
      const response = await fetch(`/api/apps/saude/cadastros/equipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao desativar equipe');
        return;
      }

      loadEquipes();
    } catch (error) {
      console.error('Erro ao desativar equipe:', error);
      alert('Erro ao desativar equipe');
    }
  };

  const getTipoEquipeBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      eSF: 'bg-green-100 text-green-800',
      eAP: 'bg-blue-100 text-blue-800',
      eAB: 'bg-purple-100 text-purple-800',
      NASF: 'bg-yellow-100 text-yellow-800',
      eCR: 'bg-orange-100 text-orange-800',
      eAD: 'bg-pink-100 text-pink-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getTipoEquipeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      eSF: 'Equipe Saúde da Família',
      eAP: 'Equipe Atenção Primária',
      eAB: 'Equipe Atenção Básica',
      NASF: 'Núcleo Apoio Saúde Família',
      eCR: 'Equipe Consultório de Rua',
      eAD: 'Equipe Atenção Domiciliar',
    };
    return labels[tipo] || tipo;
  };

  const equipesAtivas = equipes.filter((e) => e.ativo);
  const totalProfissionais = equipesAtivas.reduce((sum, e) => sum + e._count.profissionais, 0);
  const totalMicroareas = equipesAtivas.reduce((sum, e) => sum + e._count.microareas, 0);
  const totalCidadaos = equipesAtivas.reduce((sum, e) => sum + e._count.citizens, 0);

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
                <Users className="h-8 w-8 text-green-600" />
                Equipes ESF
              </h1>
              <p className="text-gray-600">
                Gerenciar Equipes de Saúde da Família e territorialização
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/equipes/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Equipes Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{equipesAtivas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalProfissionais}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Microáreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{totalMicroareas}</div>
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

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_ALL_">Todas</SelectItem>
                    <SelectItem value="ATIVOS">Ativas</SelectItem>
                    <SelectItem value="INATIVOS">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabela de Equipes */}
        <Card>
          <CardHeader>
            <CardTitle>Equipes Cadastradas ({equipes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : equipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma equipe cadastrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INE</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-center">Profissionais</TableHead>
                      <TableHead className="text-center">Microáreas</TableHead>
                      <TableHead className="text-center">Cidadãos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipes.map((equipe) => (
                      <TableRow key={equipe.id}>
                        <TableCell className="font-mono text-sm">{equipe.ine}</TableCell>
                        <TableCell className="font-semibold">{equipe.nome}</TableCell>
                        <TableCell>
                          <Badge className={getTipoEquipeBadgeColor(equipe.tipo)}>
                            {getTipoEquipeLabel(equipe.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{equipe.unidade.nome}</div>
                            <div className="text-xs text-gray-500">{equipe.unidade.tipo}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{equipe._count.profissionais}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{equipe._count.microareas}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{equipe._count.citizens}</Badge>
                        </TableCell>
                        <TableCell>
                          {equipe.ativo ? (
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
                              onClick={() =>
                                router.push(
                                  `/admin/apps/saude/cadastros/equipes/${equipe.id}/microareas`
                                )
                              }
                              title="Gerenciar Microáreas"
                            >
                              <MapPin className="h-4 w-4 text-purple-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                router.push(`/admin/apps/saude/cadastros/equipes/${equipe.id}`)
                              }
                              title="Editar"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            {equipe.ativo && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(equipe.id, equipe.nome)}
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
