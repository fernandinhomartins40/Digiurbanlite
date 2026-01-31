'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Trash2, Building2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Profissional {
  id: string;
  nome: string;
  categoria: string;
  cpf: string;
  cns: string;
}

interface Vinculo {
  id: string;
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

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

export default function VinculosProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const profissionalId = params.id as string;

  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    unidadeId: '',
    cargaHoraria: '40',
    dataInicio: format(new Date(), 'yyyy-MM-dd'),
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, [profissionalId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar profissional
      const profRes = await fetch(`/api/apps/saude/cadastros/profissionais/${profissionalId}`, {
        credentials: 'include',
      });
      if (profRes.ok) {
        const data = await profRes.json();
        setProfissional(data);
      }

      // Carregar vínculos do profissional
      const vinculosRes = await fetch(
        `/api/apps/saude/cadastros/vinculos?profissionalId=${profissionalId}`,
        { credentials: 'include' }
      );
      if (vinculosRes.ok) {
        const data = await vinculosRes.json();
        setVinculos(data);
      }

      // Carregar unidades disponíveis
      const unidadesRes = await fetch('/api/apps/saude/cadastros/unidades', {
        credentials: 'include',
      });
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
    if (!formData.unidadeId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione uma unidade.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe vínculo ativo com esta unidade
    const vinculoExistente = vinculos.find(
      (v) => v.unidade.id === formData.unidadeId && v.ativo
    );

    if (vinculoExistente) {
      toast({
        title: 'Vínculo já existe',
        description: `Já existe um vínculo ativo com ${vinculoExistente.unidade.nome}`,
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
          profissionalId: profissionalId,
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

  const vinculosAtivos = vinculos.filter((v) => v.ativo);
  const vinculosInativos = vinculos.filter((v) => !v.ativo);
  const cargaHorariaTotal = vinculosAtivos.reduce((sum, v) => sum + v.cargaHoraria, 0);

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  if (!profissional) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Profissional não encontrado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/apps/saude/cadastros/profissionais')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Vínculos - {profissional.nome}
          </h1>
          <p className="text-gray-500 mt-1">
            {profissional.categoria} | CPF: {profissional.cpf}
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Vínculo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Vínculo</DialogTitle>
              <DialogDescription>
                Vincule {profissional.nome} a uma unidade de saúde
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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
                    {unidades.map((unidade) => {
                      const temVinculo = vinculosAtivos.some((v) => v.unidade.id === unidade.id);
                      return (
                        <SelectItem
                          key={unidade.id}
                          value={unidade.id}
                          disabled={temVinculo}
                        >
                          {unidade.nome} - {unidade.tipo}
                          {temVinculo && ' (já vinculado)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carga Horária (h/semana) *</Label>
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
                  placeholder="Informações adicionais"
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidades Vinculadas</p>
                <p className="text-2xl font-bold">{vinculosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Carga Horária Total</p>
                <p className="text-2xl font-bold">{cargaHorariaTotal}h/sem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Histórico Total</p>
                <p className="text-2xl font-bold">{vinculos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vínculos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Vínculos Ativos ({vinculosAtivos.length})</CardTitle>
          <CardDescription>Unidades onde o profissional está atualmente vinculado</CardDescription>
        </CardHeader>
        <CardContent>
          {vinculosAtivos.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum vínculo ativo. Clique em "Novo Vínculo" para adicionar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {vinculosAtivos.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{vinculo.unidade.nome}</h3>
                        <p className="text-sm text-gray-500">{vinculo.unidade.tipo}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {vinculo.cargaHoraria}h/semana
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Desde {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    {vinculo.observacoes && (
                      <p className="mt-2 text-sm text-gray-500 italic">{vinculo.observacoes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">Ativo</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVinculo(vinculo.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Vínculos */}
      {vinculosInativos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vínculos ({vinculosInativos.length})</CardTitle>
            <CardDescription>Vínculos encerrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vinculosInativos.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-700">{vinculo.unidade.nome}</h3>
                        <p className="text-sm text-gray-500">{vinculo.unidade.tipo}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div>
                        {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        {vinculo.dataFim &&
                          ` - ${format(new Date(vinculo.dataFim), 'dd/MM/yyyy', { locale: ptBR })}`}
                      </div>
                      <div>{vinculo.cargaHoraria}h/semana</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-400">
                    Inativo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
