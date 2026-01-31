'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ArrowLeft, Plus, Trash2, Star, Stethoscope, Calendar, AlertCircle } from 'lucide-react';
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

interface VinculoEspecialidade {
  id: string;
  especialidade: {
    id: string;
    nome: string;
    descricao: string | null;
  };
  isPrincipal: boolean;
  dataInicio: string;
  dataFim: string | null;
  ativo: boolean;
  observacoes: string | null;
}

interface Especialidade {
  id: string;
  nome: string;
  descricao: string | null;
}

export default function EspecialidadesProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const profissionalId = params.id as string;

  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [vinculosEspecialidades, setVinculosEspecialidades] = useState<VinculoEspecialidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    especialidadeId: '',
    isPrincipal: false,
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

      // Carregar vínculos de especialidades do profissional
      const vinculosRes = await fetch(
        `/api/apps/saude/cadastros/profissionais/${profissionalId}/especialidades`,
        { credentials: 'include' }
      );
      if (vinculosRes.ok) {
        const data = await vinculosRes.json();
        setVinculosEspecialidades(data);
      }

      // Carregar especialidades disponíveis
      const especialidadesRes = await fetch('/api/apps/saude/cadastros/especialidades', {
        credentials: 'include',
      });
      if (especialidadesRes.ok) {
        const data = await especialidadesRes.json();
        setEspecialidades(data);
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
    if (!formData.especialidadeId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione uma especialidade.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe vínculo ativo com esta especialidade
    const vinculoExistente = vinculosEspecialidades.find(
      (v) => v.especialidade.id === formData.especialidadeId && v.ativo
    );

    if (vinculoExistente) {
      toast({
        title: 'Especialidade já vinculada',
        description: `Esta especialidade já está vinculada ao profissional`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais/${profissionalId}/especialidades`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            especialidadeId: formData.especialidadeId,
            isPrincipal: formData.isPrincipal,
            dataInicio: new Date(formData.dataInicio).toISOString(),
            observacoes: formData.observacoes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar especialidade');
      }

      toast({
        title: 'Sucesso',
        description: 'Especialidade adicionada com sucesso!',
      });

      setModalOpen(false);
      setFormData({
        especialidadeId: '',
        isPrincipal: false,
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

  const handleTogglePrincipal = async (vinculoId: string, isPrincipal: boolean) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais/${profissionalId}/especialidades/${vinculoId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isPrincipal: !isPrincipal }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar especialidade principal');
      }

      toast({
        title: 'Sucesso',
        description: isPrincipal
          ? 'Especialidade desmarcada como principal'
          : 'Especialidade marcada como principal',
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
    if (!confirm('Tem certeza que deseja remover esta especialidade?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais/${profissionalId}/especialidades/${vinculoId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao remover especialidade');
      }

      toast({
        title: 'Sucesso',
        description: 'Especialidade removida com sucesso!',
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

  const especialidadesAtivas = vinculosEspecialidades.filter((v) => v.ativo);
  const especialidadesInativas = vinculosEspecialidades.filter((v) => !v.ativo);
  const especialidadePrincipal = especialidadesAtivas.find((v) => v.isPrincipal);

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
            Especialidades - {profissional.nome}
          </h1>
          <p className="text-gray-500 mt-1">
            {profissional.categoria} | CPF: {profissional.cpf}
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Especialidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Especialidade</DialogTitle>
              <DialogDescription>
                Adicione uma especialidade para {profissional.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Especialidade *</Label>
                <Select
                  value={formData.especialidadeId}
                  onValueChange={(value) => setFormData({ ...formData, especialidadeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => {
                      const temVinculo = especialidadesAtivas.some(
                        (v) => v.especialidade.id === esp.id
                      );
                      return (
                        <SelectItem key={esp.id} value={esp.id} disabled={temVinculo}>
                          {esp.nome}
                          {temVinculo && ' (já adicionada)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrincipal"
                  checked={formData.isPrincipal}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPrincipal: checked as boolean })
                  }
                />
                <Label htmlFor="isPrincipal" className="cursor-pointer">
                  Marcar como especialidade principal
                </Label>
              </div>

              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
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
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Especialidade Principal */}
      {especialidadePrincipal && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Especialidade Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-900">
                  {especialidadePrincipal.especialidade.nome}
                </h3>
                {especialidadePrincipal.especialidade.descricao && (
                  <p className="text-sm text-blue-700 mt-1">
                    {especialidadePrincipal.especialidade.descricao}
                  </p>
                )}
                <p className="text-sm text-blue-600 mt-2">
                  Desde{' '}
                  {format(new Date(especialidadePrincipal.dataInicio), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Especialidades Ativas</p>
                <p className="text-2xl font-bold">{especialidadesAtivas.length}</p>
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
                <p className="text-2xl font-bold">{vinculosEspecialidades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Especialidades Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Especialidades Ativas ({especialidadesAtivas.length})</CardTitle>
          <CardDescription>Especialidades atuais do profissional</CardDescription>
        </CardHeader>
        <CardContent>
          {especialidadesAtivas.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma especialidade cadastrada. Clique em "Adicionar Especialidade" para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {especialidadesAtivas.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{vinculo.especialidade.nome}</h3>
                          {vinculo.isPrincipal && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {vinculo.especialidade.descricao && (
                          <p className="text-sm text-gray-500">{vinculo.especialidade.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePrincipal(vinculo.id, vinculo.isPrincipal)}
                      className={vinculo.isPrincipal ? 'border-yellow-500' : ''}
                    >
                      {vinculo.isPrincipal ? (
                        <>
                          <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" />
                          Principal
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Marcar como Principal
                        </>
                      )}
                    </Button>
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

      {/* Histórico */}
      {especialidadesInativas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Especialidades ({especialidadesInativas.length})</CardTitle>
            <CardDescription>Especialidades anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {especialidadesInativas.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-700">
                          {vinculo.especialidade.nome}
                        </h3>
                        {vinculo.especialidade.descricao && (
                          <p className="text-sm text-gray-500">{vinculo.especialidade.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                      {vinculo.dataFim &&
                        ` - ${format(new Date(vinculo.dataFim), 'dd/MM/yyyy', { locale: ptBR })}`}
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
