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

interface VinculoInfo {
  temVinculo: boolean;
  cargaHoraria?: number;
  unidadeNome?: string;
}

interface EspecialidadeProfissional {
  id: string;
  nome: string;
  isPrincipal: boolean;
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
  const [especialidadesProfissional, setEspecialidadesProfissional] = useState<EspecialidadeProfissional[]>([]);

  // Estados de carregamento
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);

  // Estados de validação
  const [vinculoInfo, setVinculoInfo] = useState<VinculoInfo>({ temVinculo: false });

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

  // Validar vínculo e carregar especialidades quando profissional mudar
  useEffect(() => {
    if (formData.profissionalId && formData.unidadeId) {
      validateVinculo(formData.profissionalId, formData.unidadeId);
      fetchEspecialidadesProfissional(formData.profissionalId);
    } else {
      setVinculoInfo({ temVinculo: false });
      setEspecialidadesProfissional([]);
      setFormData(prev => ({ ...prev, especialidadeId: '' }));
    }
  }, [formData.profissionalId, formData.unidadeId]);

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

  const validateVinculo = async (profissionalId: string, unidadeId: string) => {
    try {
      const response = await fetch(
        `/api/employee-assignments?userId=${profissionalId}&situacao=ATIVO`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const assignments = await response.json();
        const vinculoAtivo = assignments.find((a: any) => a.organizationalUnit?.id === unidadeId);

        if (vinculoAtivo) {
          setVinculoInfo({
            temVinculo: true,
            cargaHoraria: vinculoAtivo.cargaHoraria,
            unidadeNome: vinculoAtivo.organizationalUnit?.nome || '',
          });
        } else {
          setVinculoInfo({ temVinculo: false });
          setError('ATENÇÃO: Profissional não possui vínculo ativo com esta unidade!');
        }
      }
    } catch (error) {
      console.error('Erro ao validar vínculo:', error);
    }
  };

  const fetchEspecialidadesProfissional = async (profissionalId: string) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais/${profissionalId}/especialidades`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        const especialidadesAtivas = data
          .filter((v: any) => v.ativo)
          .map((v: any) => ({
            id: v.especialidade.id,
            nome: v.especialidade.nome,
            isPrincipal: v.isPrincipal,
          }));

        setEspecialidadesProfissional(especialidadesAtivas);

        // Auto-selecionar especialidade principal se existir
        const principal = especialidadesAtivas.find((e: any) => e.isPrincipal);
        if (principal && !formData.especialidadeId) {
          setFormData(prev => ({ ...prev, especialidadeId: principal.id }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar especialidades do profissional:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
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

    // ✅ VALIDAÇÃO CRÍTICA: Verificar vínculo profissional-unidade
    if (!vinculoInfo.temVinculo) {
      setError(
        'ERRO: O profissional selecionado não possui vínculo ativo com a unidade. ' +
        'Acesse "Vínculos Profissional-Unidade" para criar o vínculo antes de criar a agenda.'
      );
      return;
    }

    // Validação de datas
    if (formData.dataFim && formData.dataInicio > formData.dataFim) {
      setError('Data de término não pode ser anterior à data de início');
      return;
    }

    // Validação de horários
    if (formData.horaFim && formData.horaInicio >= formData.horaFim) {
      setError('Horário de término deve ser posterior ao horário de início');
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
                    <SelectTrigger className={!vinculoInfo.temVinculo && formData.profissionalId ? 'border-red-500' : ''}>
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
                  {vinculoInfo.temVinculo && formData.profissionalId && (
                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Vínculo ativo confirmado - {vinculoInfo.cargaHoraria}h/semana
                    </div>
                  )}
                  {!vinculoInfo.temVinculo && formData.profissionalId && formData.unidadeId && (
                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      ✗ Profissional não possui vínculo ativo com esta unidade
                    </div>
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

                {/* Especialidade - FILTRADA POR PROFISSIONAL */}
                <div className="col-span-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Select
                    value={formData.especialidadeId}
                    onValueChange={(value) => setFormData({ ...formData, especialidadeId: value })}
                    disabled={!formData.profissionalId || especialidadesProfissional.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.profissionalId
                            ? 'Selecione um profissional primeiro'
                            : especialidadesProfissional.length === 0
                            ? 'Profissional sem especialidades cadastradas'
                            : 'Selecione a especialidade'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidadesProfissional.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.nome} {esp.isPrincipal && '⭐ (Principal)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {especialidadesProfissional.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mostrando apenas especialidades vinculadas ao profissional
                    </p>
                  )}
                  {formData.profissionalId && especialidadesProfissional.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Profissional não possui especialidades cadastradas
                    </p>
                  )}
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
                <Button
                  type="submit"
                  disabled={loading || (!!formData.profissionalId && !vinculoInfo.temVinculo)}
                  className={
                    !!formData.profissionalId && !vinculoInfo.temVinculo
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Agenda'}
                </Button>
              </div>

              {formData.profissionalId && !vinculoInfo.temVinculo && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Para criar uma agenda, o profissional deve estar vinculado à unidade.
                    <br />
                    <a
                      href="/admin/apps/saude/cadastros/vinculos"
                      className="underline font-semibold hover:text-red-800"
                      target="_blank"
                    >
                      Clique aqui para gerenciar vínculos
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
