'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, Plus, Trash2, AlertCircle, CheckCircle, Building2, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Vinculo {
  id: string;
  profissional: {
    id: string;
    nome: string;
    categoria: string;
  };
  unidade: {
    id: string;
    nome: string;
    tipo: string;
  };
  cargaHoraria: number;
  dataInicio: string;
  dataFim: string | null;
  ativo: boolean;
  observacoes: string | null;
}

interface Profissional {
  id: string;
  nome: string;
  categoria: string;
  cpf: string;
}

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

export default function VinculosProfissionalUnidadePage() {
  const { toast } = useToast();
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros
  const [filtroUnidade, setFiltroUnidade] = useState<string>('');
  const [filtroProfissional, setFiltroProfissional] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVOS');

  // Formulário de novo vínculo
  const [formData, setFormData] = useState({
    profissionalId: '',
    unidadeId: '',
    cargaHoraria: '40',
    dataInicio: format(new Date(), 'yyyy-MM-dd'),
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vinculosRes, profissionaisRes, unidadesRes] = await Promise.all([
        fetch('/api/apps/saude/cadastros/vinculos', { credentials: 'include' }),
        fetch('/api/apps/saude/cadastros/profissionais', { credentials: 'include' }),
        fetch('/api/apps/saude/cadastros/unidades', { credentials: 'include' }),
      ]);

      if (vinculosRes.ok) {
        const data = await vinculosRes.json();
        setVinculos(data);
      }

      if (profissionaisRes.ok) {
        const data = await profissionaisRes.json();
        setProfissionais(data);
      }

      if (unidadesRes.ok) {
        const data = await unidadesRes.json();
        setUnidades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVinculo = async () => {
    if (!formData.profissionalId || !formData.unidadeId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione profissional e unidade.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/apps/saude/cadastros/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: formData.profissionalId,
          unidadeId: formData.unidadeId,
          cargaHoraria: parseInt(formData.cargaHoraria),
          dataInicio: new Date(formData.dataInicio).toISOString(),
          observacoes: formData.observacoes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar vínculo');
      }

      toast({
        title: 'Sucesso',
        description: 'Vínculo criado com sucesso!',
      });

      setModalOpen(false);
      setFormData({
        profissionalId: '',
        unidadeId: '',
        cargaHoraria: '40',
        dataInicio: format(new Date(), 'yyyy-MM-dd'),
        observacoes: '',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVinculo = async (vinculoId: string) => {
    if (!confirm('Tem certeza que deseja encerrar este vínculo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/apps/saude/cadastros/vinculos/${vinculoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao encerrar vínculo');
      }

      toast({
        title: 'Sucesso',
        description: 'Vínculo encerrado com sucesso!',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Filtrar vínculos
  const vinculosFiltrados = vinculos.filter((v) => {
    const matchUnidade = !filtroUnidade || v.unidade.id === filtroUnidade;
    const matchProfissional = !filtroProfissional || v.profissional.id === filtroProfissional;
    const matchStatus =
      filtroStatus === 'TODOS' ||
      (filtroStatus === 'ATIVOS' && v.ativo) ||
      (filtroStatus === 'INATIVOS' && !v.ativo);

    return matchUnidade && matchProfissional && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Link2 className="h-8 w-8 text-blue-600" />
            Vínculos Profissional-Unidade
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie os vínculos entre profissionais e unidades de saúde
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Vínculo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Vínculo</DialogTitle>
              <DialogDescription>
                Vincule um profissional a uma unidade de saúde
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Profissional *</Label>
                <Select
                  value={formData.profissionalId}
                  onValueChange={(value) => setFormData({ ...formData, profissionalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome} - {prof.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unidade de Saúde *</Label>
                <Select
                  value={formData.unidadeId}
                  onValueChange={(value) => setFormData({ ...formData, unidadeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} - {unidade.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carga Horária (horas/semana) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.cargaHoraria}
                    onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Input
                  placeholder="Informações adicionais sobre o vínculo"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateVinculo} className="bg-blue-600 hover:bg-blue-700">
                Criar Vínculo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Unidade</Label>
              <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Profissional</Label>
              <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVOS">Ativos</SelectItem>
                  <SelectItem value="INATIVOS">Inativos</SelectItem>
                  <SelectItem value="TODOS">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vínculos Ativos</p>
                <p className="text-2xl font-bold">{vinculos.filter((v) => v.ativo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Profissionais Vinculados</p>
                <p className="text-2xl font-bold">
                  {new Set(vinculos.filter((v) => v.ativo).map((v) => v.profissional.id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidades com Vínculos</p>
                <p className="text-2xl font-bold">
                  {new Set(vinculos.filter((v) => v.ativo).map((v) => v.unidade.id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vínculos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vínculos Cadastrados ({vinculosFiltrados.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os vínculos entre profissionais e unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : vinculosFiltrados.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum vínculo encontrado com os filtros selecionados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculosFiltrados.map((vinculo) => (
                    <TableRow key={vinculo.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vinculo.profissional.nome}</p>
                          <p className="text-sm text-gray-500">{vinculo.profissional.categoria}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vinculo.unidade.nome}</p>
                          <p className="text-sm text-gray-500">{vinculo.unidade.tipo}</p>
                        </div>
                      </TableCell>
                      <TableCell>{vinculo.cargaHoraria}h/semana</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          {vinculo.dataFim && (
                            <div className="text-gray-500">
                              até {format(new Date(vinculo.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={vinculo.ativo ? 'default' : 'secondary'}
                          className={vinculo.ativo ? 'bg-green-600' : 'bg-gray-400'}
                        >
                          {vinculo.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {vinculo.observacoes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {vinculo.ativo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVinculo(vinculo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
  );
}
