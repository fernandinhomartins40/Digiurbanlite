'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UserPlus, Save, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServidorSaude {
  id: string;
  name: string;
  email: string;
  departmentName: string;
  dadosSaude: {
    id: string;
    categoria: string;
    registroProfissional: string | null;
    tipoRegistro: string | null;
    ufRegistro: string | null;
    cns: string | null;
    cbo: string | null;
    especialidades: any;
    ativo: boolean;
    aceitaAgendamento: boolean;
    tempoMedioConsulta: number;
    observacoes: string | null;
  } | null;
}

const CATEGORIAS = [
  { value: 'MEDICO', label: 'Médico' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro' },
  { value: 'TECNICO_ENFERMAGEM', label: 'Técnico de Enfermagem' },
  { value: 'ACS', label: 'Agente Comunitário de Saúde (ACS)' },
  { value: 'DENTISTA', label: 'Dentista' },
  { value: 'FARMACEUTICO', label: 'Farmacêutico' },
  { value: 'PSICOLOGO', label: 'Psicólogo' },
  { value: 'ASSISTENTE_SOCIAL', label: 'Assistente Social' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'FISIOTERAPEUTA', label: 'Fisioterapeuta' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIPOS_REGISTRO = [
  { value: 'CRM', label: 'CRM - Conselho Regional de Medicina' },
  { value: 'COREN', label: 'COREN - Conselho Regional de Enfermagem' },
  { value: 'CRO', label: 'CRO - Conselho Regional de Odontologia' },
  { value: 'CRF', label: 'CRF - Conselho Regional de Farmácia' },
  { value: 'CRP', label: 'CRP - Conselho Regional de Psicologia' },
  { value: 'CREFITO', label: 'CREFITO - Conselho Regional de Fisioterapia' },
  { value: 'CRN', label: 'CRN - Conselho Regional de Nutrição' },
  { value: 'CRESS', label: 'CRESS - Conselho Regional de Serviço Social' },
  { value: 'OUTRO', label: 'Outro' },
];

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function EditarServidorSaude() {
  const router = useRouter();
  const params = useParams();
  const servidorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servidor, setServidor] = useState<ServidorSaude | null>(null);
  const [formData, setFormData] = useState({
    categoria: '',
    registroProfissional: '',
    tipoRegistro: '',
    ufRegistro: '',
    cns: '',
    cbo: '',
    especialidades: '',
    ativo: true,
    aceitaAgendamento: true,
    tempoMedioConsulta: '30',
    observacoes: '',
  });

  useEffect(() => {
    loadServidor();
  }, [servidorId]);

  const loadServidor = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/dados-saude/${servidorId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setServidor(data);

      if (data.dadosSaude) {
        setFormData({
          categoria: data.dadosSaude.categoria,
          registroProfissional: data.dadosSaude.registroProfissional || '',
          tipoRegistro: data.dadosSaude.tipoRegistro || '',
          ufRegistro: data.dadosSaude.ufRegistro || '',
          cns: data.dadosSaude.cns || '',
          cbo: data.dadosSaude.cbo || '',
          especialidades: data.dadosSaude.especialidades ? JSON.stringify(data.dadosSaude.especialidades).slice(1, -1) : '',
          ativo: data.dadosSaude.ativo,
          aceitaAgendamento: data.dadosSaude.aceitaAgendamento,
          tempoMedioConsulta: String(data.dadosSaude.tempoMedioConsulta || 30),
          observacoes: data.dadosSaude.observacoes || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar servidor:', error);
      alert('Erro ao carregar servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoria) {
      alert('Categoria é obrigatória');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        categoria: formData.categoria,
        registroProfissional: formData.registroProfissional || null,
        tipoRegistro: formData.tipoRegistro || null,
        ufRegistro: formData.ufRegistro || null,
        cns: formData.cns || null,
        cbo: formData.cbo || null,
        especialidades: formData.especialidades ? JSON.parse(`[${formData.especialidades}]`) : null,
        ativo: formData.ativo,
        aceitaAgendamento: formData.aceitaAgendamento,
        tempoMedioConsulta: formData.tempoMedioConsulta ? parseInt(formData.tempoMedioConsulta) : 30,
        observacoes: formData.observacoes || null,
      };

      const response = await fetch(`/api/apps/saude/cadastros/dados-saude/${servidorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar dados de saúde');
        return;
      }

      alert('Dados de saúde atualizados com sucesso!');
      router.push('/admin/apps/saude/cadastros/servidores-saude');
    } catch (error) {
      console.error('Erro ao atualizar dados de saúde:', error);
      alert('Erro ao atualizar dados de saúde');
    } finally {
      setSaving(false);
    }
  };

  const categoriaRequerRegistro = ['MEDICO', 'ENFERMEIRO', 'DENTISTA', 'FARMACEUTICO', 'PSICOLOGO', 'FISIOTERAPEUTA', 'NUTRICIONISTA', 'ASSISTENTE_SOCIAL'].includes(formData.categoria);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando servidor...</p>
        </div>
      </div>
    );
  }

  if (!servidor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Servidor não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              Editar Dados de Saúde
            </h1>
            <p className="text-gray-600">Atualizar dados de saúde do servidor</p>
          </div>
          <Badge variant={formData.ativo ? 'default' : 'secondary'}>
            {formData.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Servidor Info */}
        <Card className="mb-6 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-lg">{servidor.name}</p>
                <p className="text-sm text-gray-600">{servidor.email}</p>
                <p className="text-xs text-gray-500">{servidor.departmentName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categoria */}
              <div>
                <Label htmlFor="categoria" className="required">
                  Categoria Profissional *
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Registro Profissional */}
              {categoriaRequerRegistro && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="tipoRegistro">Tipo de Registro</Label>
                      <Select
                        value={formData.tipoRegistro}
                        onValueChange={(value) => setFormData({ ...formData, tipoRegistro: value })}
                      >
                        <SelectTrigger id="tipoRegistro">
                          <SelectValue placeholder="Ex: CRM" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_REGISTRO.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-1">
                      <Label htmlFor="registroProfissional">Número</Label>
                      <Input
                        id="registroProfissional"
                        type="text"
                        placeholder="Ex: 123456"
                        value={formData.registroProfissional}
                        onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <Label htmlFor="ufRegistro">UF</Label>
                      <Select
                        value={formData.ufRegistro}
                        onValueChange={(value) => setFormData({ ...formData, ufRegistro: value })}
                      >
                        <SelectTrigger id="ufRegistro">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {UFS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* CNS */}
              <div>
                <Label htmlFor="cns">Cartão Nacional de Saúde (CNS)</Label>
                <Input
                  id="cns"
                  type="text"
                  placeholder="15 dígitos"
                  maxLength={15}
                  value={formData.cns}
                  onChange={(e) => setFormData({ ...formData, cns: e.target.value })}
                />
              </div>

              {/* CBO */}
              <div>
                <Label htmlFor="cbo">CBO - Classificação Brasileira de Ocupações</Label>
                <Input
                  id="cbo"
                  type="text"
                  placeholder="Ex: 225125"
                  value={formData.cbo}
                  onChange={(e) => setFormData({ ...formData, cbo: e.target.value })}
                />
              </div>

              {/* Especialidades */}
              {formData.categoria === 'MEDICO' && (
                <div>
                  <Label htmlFor="especialidades">Especialidades</Label>
                  <Input
                    id="especialidades"
                    type="text"
                    placeholder="Ex: &quot;Clínica Geral&quot;, &quot;Cardiologia&quot;"
                    value={formData.especialidades}
                    onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={formData.ativo ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, ativo: value === 'true' })}
                >
                  <SelectTrigger id="ativo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configurações de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aceita Agendamento */}
              <div>
                <Label htmlFor="aceitaAgendamento">Aceita Agendamento</Label>
                <Select
                  value={formData.aceitaAgendamento ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, aceitaAgendamento: value === 'true' })}
                >
                  <SelectTrigger id="aceitaAgendamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tempo Médio de Consulta */}
              <div>
                <Label htmlFor="tempoMedioConsulta">Tempo Médio de Consulta (minutos)</Label>
                <Input
                  id="tempoMedioConsulta"
                  type="number"
                  min="5"
                  max="180"
                  value={formData.tempoMedioConsulta}
                  onChange={(e) => setFormData({ ...formData, tempoMedioConsulta: e.target.value })}
                />
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
