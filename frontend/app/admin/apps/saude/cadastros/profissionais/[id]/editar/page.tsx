'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { EspecialidadeSelector, UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

export default function EditarProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    categoria: '',
    registroProfissional: '',
    tipoRegistro: '',
    telefone: '',
    email: '',
    tempoMedioConsulta: '',
    aceitaAgendamento: true,
    status: 'Ativo',
    especialidadeIds: [] as number[],
    unidadeIds: [] as number[],
  });

  useEffect(() => {
    fetchProfissional();
  }, [id]);

  const fetchProfissional = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/profissionais/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nome: data.nome || '',
          cpf: data.cpf || '',
          rg: data.rg || '',
          categoria: data.categoria || '',
          registroProfissional: data.registroProfissional || '',
          tipoRegistro: data.tipoRegistro || '',
          telefone: data.telefone || '',
          email: data.email || '',
          tempoMedioConsulta: data.tempoMedioConsulta?.toString() || '',
          aceitaAgendamento: data.aceitaAgendamento ?? true,
          status: data.status || 'Ativo',
          especialidadeIds: data.especialidades?.map((e: any) => e.id) || [],
          unidadeIds: data.unidades?.map((u: any) => u.id) || [],
        });
      } else {
        toast.error('Erro ao carregar profissional');
        router.push('/admin/apps/saude/cadastros/profissionais');
      }
    } catch (error) {
      console.error('Erro ao carregar profissional:', error);
      toast.error('Erro ao carregar profissional');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.cpf || !formData.categoria || !formData.registroProfissional || !formData.tipoRegistro) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/apps/saude/cadastros/profissionais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tempoMedioConsulta: formData.tempoMedioConsulta ? parseInt(formData.tempoMedioConsulta) : null,
        }),
      });

      if (response.ok) {
        toast.success('Profissional atualizado com sucesso');
        router.push('/admin/apps/saude/cadastros/profissionais');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao atualizar profissional');
      }
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      toast.error('Erro ao atualizar profissional');
    } finally {
      setLoading(false);
    }
  };

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
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/apps/saude/cadastros/profissionais')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Profissional de Saúde</h1>
          <p className="text-gray-600">Atualizar informações do profissional</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome Completo *
                </label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do profissional"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CPF *
                  </label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    RG
                  </label>
                  <Input
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Medico">Médico</option>
                    <option value="Enfermeiro">Enfermeiro</option>
                    <option value="Dentista">Dentista</option>
                    <option value="Psicologo">Psicólogo</option>
                    <option value="Fisioterapeuta">Fisioterapeuta</option>
                    <option value="Nutricionista">Nutricionista</option>
                    <option value="Farmaceutico">Farmacêutico</option>
                    <option value="TecnicoEnfermagem">Técnico em Enfermagem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Registro *
                  </label>
                  <select
                    value={formData.tipoRegistro}
                    onChange={(e) => setFormData({ ...formData, tipoRegistro: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="CRM">CRM - Conselho Regional de Medicina</option>
                    <option value="COREN">COREN - Conselho Regional de Enfermagem</option>
                    <option value="CRO">CRO - Conselho Regional de Odontologia</option>
                    <option value="CRP">CRP - Conselho Regional de Psicologia</option>
                    <option value="CREFITO">CREFITO - Conselho Regional de Fisioterapia</option>
                    <option value="CRN">CRN - Conselho Regional de Nutrição</option>
                    <option value="CRF">CRF - Conselho Regional de Farmácia</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Número do Registro Profissional *
                </label>
                <Input
                  value={formData.registroProfissional}
                  onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
                  placeholder="Ex: CRM 12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Especialidades
                </label>
                <EspecialidadeSelector
                  value={formData.especialidadeIds}
                  onChange={(ids) => setFormData({ ...formData, especialidadeIds: ids })}
                  multiple
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Unidades de Saúde
                </label>
                <UnidadeSaudeSelector
                  value={formData.unidadeIds}
                  onChange={(ids) => setFormData({ ...formData, unidadeIds: ids })}
                  multiple
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tempo Médio de Consulta (minutos)
                  </label>
                  <Input
                    type="number"
                    value={formData.tempoMedioConsulta}
                    onChange={(e) => setFormData({ ...formData, tempoMedioConsulta: e.target.value })}
                    placeholder="30"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Ferias">Férias</option>
                    <option value="Licenca">Licença</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="aceitaAgendamento"
                  checked={formData.aceitaAgendamento}
                  onChange={(e) => setFormData({ ...formData, aceitaAgendamento: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="aceitaAgendamento" className="text-sm font-medium">
                  Aceita agendamento online
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/apps/saude/cadastros/profissionais')}
            >
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
