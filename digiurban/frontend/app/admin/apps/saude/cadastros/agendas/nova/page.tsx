'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

interface Profissional {
  id: string;
  nome: string;
  categoria: string;
}

interface Sala {
  id: string;
  nome: string;
  tipo: string;
}

interface Especialidade {
  id: string;
  nome: string;
}

export default function NovaAgenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Consultas',
    dataInicio: '',
    dataFim: '',
    horaInicio: '08:00',
    horaFim: '17:00',
    vagasPorDia: '20',
    duracaoConsulta: '30',
    unidadeId: '',
    profissionalId: '',
    salaId: '',
    especialidadeId: '',
    isActive: true,
  });

  // Estados para listas
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  // Estados de carregamento
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);

  // Carregar unidades ao montar
  useEffect(() => {
    fetchUnidades();
    fetchEspecialidades();
  }, []);

  // Carregar profissionais quando unidade mudar
  useEffect(() => {
    if (formData.unidadeId) {
      fetchProfissionais(formData.unidadeId);
      fetchSalas(formData.unidadeId);
    } else {
      setProfissionais([]);
      setSalas([]);
      setFormData(prev => ({ ...prev, profissionalId: '', salaId: '' }));
    }
  }, [formData.unidadeId]);

  const fetchUnidades = async () => {
    try {
      setLoadingUnidades(true);
      const response = await fetch('/api/apps/saude/cadastros/unidades?isActive=true', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUnidades(data);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const fetchProfissionais = async (unidadeId: string) => {
    try {
      setLoadingProfissionais(true);
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais?unidadeId=${unidadeId}&isActive=true`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setProfissionais(data);
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    } finally {
      setLoadingProfissionais(false);
    }
  };

  const fetchSalas = async (unidadeId: string) => {
    try {
      setLoadingSalas(true);
      const response = await fetch(
        `/api/apps/saude/cadastros/salas?unidadeId=${unidadeId}&isActive=true`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setSalas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar salas:', error);
    } finally {
      setLoadingSalas(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      setLoadingEspecialidades(true);
      const response = await fetch('/api/apps/saude/cadastros/especialidades?isActive=true', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data);
      }
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.dataInicio) {
      setError('Nome e data de início são obrigatórios');
      return;
    }

    if (!formData.unidadeId) {
      setError('Selecione uma unidade de saúde');
      return;
    }

    if (!formData.profissionalId) {
      setError('Selecione um profissional');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Agenda criada com sucesso!');
        router.push('/admin/apps/saude/cadastros/agendas');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Falha ao criar agenda');
        if (errorData.detalhes) {
          setError(`${errorData.error}\n${errorData.detalhes}`);
        }
      }
    } catch (error) {
      console.error('Erro ao criar agenda:', error);
      setError('Erro ao criar agenda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Agenda Médica</h1>
            <p className="text-gray-600">Cadastrar nova agenda de atendimentos</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Unidade - PRIMEIRO SELECT */}
                <div className="col-span-2">
                  <Label htmlFor="unidade">Unidade de Saúde *</Label>
                  <Select
                    value={formData.unidadeId}
                    onValueChange={(value) => setFormData({ ...formData, unidadeId: value })}
                    disabled={loadingUnidades}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingUnidades ? 'Carregando...' : 'Selecione a unidade'} />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((unidade) => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome} ({unidade.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione a unidade primeiro para filtrar profissionais e salas
                  </p>
                </div>

                {/* Profissional - SEGUNDO SELECT (depende da unidade) */}
                <div className="col-span-2">
                  <Label htmlFor="profissional">Profissional *</Label>
                  <Select
                    value={formData.profissionalId}
                    onValueChange={(value) => setFormData({ ...formData, profissionalId: value })}
                    disabled={!formData.unidadeId || loadingProfissionais}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.unidadeId
                            ? 'Selecione uma unidade primeiro'
                            : loadingProfissionais
                            ? 'Carregando...'
                            : 'Selecione o profissional'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {profissionais.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome} - {prof.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profissionais.length === 0 && formData.unidadeId && !loadingProfissionais && (
                    <p className="text-sm text-amber-600 mt-1">
                      Nenhum profissional vinculado a esta unidade
                    </p>
                  )}
                </div>

                {/* Sala - TERCEIRO SELECT (depende da unidade) */}
                <div>
                  <Label htmlFor="sala">Sala/Consultório</Label>
                  <Select
                    value={formData.salaId}
                    onValueChange={(value) => setFormData({ ...formData, salaId: value })}
                    disabled={!formData.unidadeId || loadingSalas}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.unidadeId
                            ? 'Selecione uma unidade primeiro'
                            : loadingSalas
                            ? 'Carregando...'
                            : 'Selecione a sala (opcional)'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {salas.map((sala) => (
                        <SelectItem key={sala.id} value={sala.id}>
                          {sala.nome} - {sala.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Especialidade */}
                <div>
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Select
                    value={formData.especialidadeId}
                    onValueChange={(value) => setFormData({ ...formData, especialidadeId: value })}
                    disabled={loadingEspecialidades}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Agenda *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Consultas Pediatria - Dr. João"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Agenda *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultas">Consultas Médicas</SelectItem>
                      <SelectItem value="Procedimentos">Procedimentos</SelectItem>
                      <SelectItem value="Exames">Exames</SelectItem>
                      <SelectItem value="Vacinação">Vacinação</SelectItem>
                      <SelectItem value="Enfermagem">Enfermagem</SelectItem>
                      <SelectItem value="Odontologia">Odontologia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duracaoConsulta">Duração por Atendimento (minutos)</Label>
                  <Input
                    id="duracaoConsulta"
                    type="number"
                    value={formData.duracaoConsulta}
                    onChange={(e) => setFormData({ ...formData, duracaoConsulta: e.target.value })}
                    placeholder="30"
                  />
                </div>

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
                </div>

                <div>
                  <Label htmlFor="horaInicio">Horário de Início</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="horaFim">Horário de Término</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vagasPorDia">Vagas por Dia</Label>
                  <Input
                    id="vagasPorDia"
                    type="number"
                    value={formData.vagasPorDia}
                    onChange={(e) => setFormData({ ...formData, vagasPorDia: e.target.value })}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Agenda'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
