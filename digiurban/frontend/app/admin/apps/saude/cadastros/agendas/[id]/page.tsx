'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Agenda {
  id: string;
  profissionalId: string;
  unidadeId: string;
  especialidadeId: string | null;
  salaId: string | null;
  horaInicio: string;
  horaFim: string;
  tempoPorConsulta: number;
  vagasDisponiveis: number;
  dataInicio: string;
  dataFim: string | null;
  isActive: boolean;
}

interface Sala {
  id: string;
  nome: string;
}

interface Especialidade {
  id: string;
  nome: string;
}

export default function EditarAgenda() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  const [formData, setFormData] = useState({
    horaInicio: '08:00',
    horaFim: '17:00',
    tempoPorConsulta: '30',
    vagasDisponiveis: '20',
    dataInicio: '',
    dataFim: '',
    especialidadeId: '',
    salaId: '',
    isActive: true,
  });

  const [agendaInfo, setAgendaInfo] = useState<{
    profissionalNome?: string;
    unidadeNome?: string;
    unidadeId?: string;
  }>({});

  useEffect(() => {
    loadAgenda();
    loadEspecialidades();
  }, [id]);

  useEffect(() => {
    if (agendaInfo.unidadeId) {
      loadSalas(agendaInfo.unidadeId);
    }
  }, [agendaInfo.unidadeId]);

  const loadAgenda = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/apps/saude/cadastros/agendas/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Agenda não encontrada');
      }

      const data: Agenda = await response.json();

      // Buscar informações do profissional e unidade
      const [profResp, unidResp] = await Promise.all([
        fetch(`/api/apps/saude/cadastros/profissionais/${data.profissionalId}`, { credentials: 'include' }),
        fetch(`/api/apps/saude/cadastros/unidades/${data.unidadeId}`, { credentials: 'include' })
      ]);

      const profData = profResp.ok ? await profResp.json() : null;
      const unidData = unidResp.ok ? await unidResp.json() : null;

      setAgendaInfo({
        profissionalNome: profData?.name || 'Profissional',
        unidadeNome: unidData?.nome || 'Unidade',
        unidadeId: data.unidadeId,
      });

      setFormData({
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        tempoPorConsulta: String(data.tempoPorConsulta),
        vagasDisponiveis: String(data.vagasDisponiveis),
        dataInicio: data.dataInicio.split('T')[0],
        dataFim: data.dataFim ? data.dataFim.split('T')[0] : '',
        especialidadeId: data.especialidadeId || '',
        salaId: data.salaId || '',
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      alert('Erro ao carregar dados da agenda');
      router.push('/admin/apps/saude/cadastros/agendas');
    } finally {
      setLoadingData(false);
    }
  };

  const loadSalas = async (unidadeId: string) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/salas?unidadeId=${unidadeId}&isActive=true`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setSalas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const loadEspecialidades = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/especialidades?isActive=true', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dataInicio) {
      alert('Data de início é obrigatória');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/apps/saude/cadastros/agendas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horaInicio: formData.horaInicio,
          horaFim: formData.horaFim,
          tempoPorConsulta: parseInt(formData.tempoPorConsulta),
          vagasDisponiveis: parseInt(formData.vagasDisponiveis),
          dataInicio: formData.dataInicio,
          dataFim: formData.dataFim || null,
          especialidadeId: formData.especialidadeId || null,
          salaId: formData.salaId || null,
          isActive: formData.isActive,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Agenda atualizada com sucesso!');
        router.push('/admin/apps/saude/cadastros/agendas');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao atualizar agenda'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      alert('Erro ao atualizar agenda');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-teal-600" />
              Editar Agenda Médica
            </h1>
            <p className="text-gray-600">Atualizar configurações da agenda de atendimento</p>
          </div>
        </div>

        {/* Informações Fixas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações da Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Profissional:</strong> {agendaInfo.profissionalNome}</p>
                  <p><strong>Unidade:</strong> {agendaInfo.unidadeNome}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    O profissional e a unidade não podem ser alterados após a criação da agenda.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Formulário de Edição */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Datas */}
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dataFim">Data de Término</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe vazio para agenda contínua</p>
                </div>

                {/* Horários */}
                <div>
                  <Label htmlFor="horaInicio">Horário de Início *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="horaFim">Horário de Término *</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                    required
                  />
                </div>

                {/* Vagas e Duração */}
                <div>
                  <Label htmlFor="vagasDisponiveis">Vagas por Dia *</Label>
                  <Input
                    id="vagasDisponiveis"
                    type="number"
                    min="1"
                    value={formData.vagasDisponiveis}
                    onChange={(e) => setFormData({ ...formData, vagasDisponiveis: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tempoPorConsulta">Duração da Consulta (min) *</Label>
                  <Input
                    id="tempoPorConsulta"
                    type="number"
                    min="5"
                    value={formData.tempoPorConsulta}
                    onChange={(e) => setFormData({ ...formData, tempoPorConsulta: e.target.value })}
                    required
                  />
                </div>

                {/* Especialidade */}
                <div>
                  <Label htmlFor="especialidadeId">Especialidade</Label>
                  <Select
                    value={formData.especialidadeId}
                    onValueChange={(value) => setFormData({ ...formData, especialidadeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sala */}
                <div>
                  <Label htmlFor="salaId">Sala/Consultório</Label>
                  <Select
                    value={formData.salaId}
                    onValueChange={(value) => setFormData({ ...formData, salaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {salas.map((sala) => (
                        <SelectItem key={sala.id} value={sala.id}>
                          {sala.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativa</SelectItem>
                      <SelectItem value="false">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Desativar a agenda impedirá novos agendamentos
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
