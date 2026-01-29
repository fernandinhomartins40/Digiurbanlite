'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { ProfissionalSaudeSelector, UnidadeSaudeSelector, EspecialidadeSelector, SalaSelector, TurnoSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

export default function EditarAgendaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    profissionalId: null as number | null,
    unidadeId: null as number | null,
    especialidadeId: null as number | null,
    salaId: null as number | null,
    turnoId: null as number | null,
    diaSemana: '',
    horaInicio: '',
    horaFim: '',
    tempoPorConsulta: '',
    vagasDisponiveis: '',
    dataInicioVigencia: '',
    dataFimVigencia: '',
  });

  useEffect(() => {
    fetchAgenda();
  }, [id]);

  const fetchAgenda = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/agendas/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          profissionalId: data.profissionalId,
          unidadeId: data.unidadeId,
          especialidadeId: data.especialidadeId,
          salaId: data.salaId,
          turnoId: data.turnoId,
          diaSemana: data.diaSemana.toString(),
          horaInicio: data.horaInicio || '',
          horaFim: data.horaFim || '',
          tempoPorConsulta: data.tempoPorConsulta?.toString() || '',
          vagasDisponiveis: data.vagasDisponiveis?.toString() || '',
          dataInicioVigencia: data.dataInicioVigencia?.split('T')[0] || '',
          dataFimVigencia: data.dataFimVigencia?.split('T')[0] || '',
        });
      } else {
        toast.error('Erro ao carregar agenda');
        router.push('/admin/apps/saude/cadastros/agendas');
      }
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profissionalId || !formData.unidadeId || !formData.especialidadeId ||
        !formData.diaSemana || !formData.horaInicio || !formData.horaFim ||
        !formData.tempoPorConsulta || !formData.vagasDisponiveis) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/apps/saude/cadastros/agendas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          diaSemana: parseInt(formData.diaSemana),
          tempoPorConsulta: parseInt(formData.tempoPorConsulta),
          vagasDisponiveis: parseInt(formData.vagasDisponiveis),
          dataInicioVigencia: formData.dataInicioVigencia || null,
          dataFimVigencia: formData.dataFimVigencia || null,
        }),
      });

      if (response.ok) {
        toast.success('Agenda atualizada com sucesso');
        router.push('/admin/apps/saude/cadastros/agendas');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao atualizar agenda');
      }
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      toast.error('Erro ao atualizar agenda');
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (loadingData) {
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
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/apps/saude/cadastros/agendas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Agenda Médica</h1>
          <p className="text-gray-600">Atualizar informações da agenda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profissional e Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profissional *</label>
                  <ProfissionalSaudeSelector
                    value={formData.profissionalId}
                    onChange={(id) => setFormData({ ...formData, profissionalId: id })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unidade de Saúde *</label>
                  <UnidadeSaudeSelector
                    value={formData.unidadeId}
                    onChange={(id) => setFormData({ ...formData, unidadeId: id })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Especialidade *</label>
                  <EspecialidadeSelector
                    value={formData.especialidadeId}
                    onChange={(id) => setFormData({ ...formData, especialidadeId: id })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sala/Consultório</label>
                  <SalaSelector
                    unidadeId={formData.unidadeId}
                    value={formData.salaId}
                    onChange={(id) => setFormData({ ...formData, salaId: id })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Turno</label>
                <TurnoSelector
                  value={formData.turnoId}
                  onChange={(id) => setFormData({ ...formData, turnoId: id })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horários e Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dia da Semana *</label>
                <select
                  value={formData.diaSemana}
                  onChange={(e) => setFormData({ ...formData, diaSemana: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Selecione...</option>
                  {diasSemana.map((dia, index) => (
                    <option key={index} value={index}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hora Início *</label>
                  <Input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hora Fim *</label>
                  <Input
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tempo por Consulta (min) *</label>
                  <Input
                    type="number"
                    value={formData.tempoPorConsulta}
                    onChange={(e) => setFormData({ ...formData, tempoPorConsulta: e.target.value })}
                    placeholder="30"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vagas Disponíveis *</label>
                <Input
                  type="number"
                  value={formData.vagasDisponiveis}
                  onChange={(e) => setFormData({ ...formData, vagasDisponiveis: e.target.value })}
                  placeholder="10"
                  min="1"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Período de Vigência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Início Vigência</label>
                  <Input
                    type="date"
                    value={formData.dataInicioVigencia}
                    onChange={(e) => setFormData({ ...formData, dataInicioVigencia: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Fim Vigência</label>
                  <Input
                    type="date"
                    value={formData.dataFimVigencia}
                    onChange={(e) => setFormData({ ...formData, dataFimVigencia: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/apps/saude/cadastros/agendas')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
