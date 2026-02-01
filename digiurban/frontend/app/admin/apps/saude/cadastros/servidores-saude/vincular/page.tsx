'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, UserPlus, Save, AlertCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Servidor {
  id: string;
  name: string;
  email: string;
  departmentName: string;
  dadosSaude: any | null;
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

export default function VincularServidor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [servidorSelecionado, setServidorSelecionado] = useState<Servidor | null>(null);
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    categoria: '',
    registroProfissional: '',
    tipoRegistro: '',
    ufRegistro: '',
    cns: '',
    cbo: '',
    especialidades: '',
    aceitaAgendamento: true,
    tempoMedioConsulta: '30',
    observacoes: '',
  });

  useEffect(() => {
    loadServidores();
  }, []);

  const loadServidores = async () => {
    try {
      // Buscar servidores que NÃO têm DadosSaude ainda
      const response = await fetch('/api/apps/saude/cadastros/dados-saude?semDadosSaude=true', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Erro ao carregar servidores:', response.status);
        setServidores([]);
        return;
      }

      const data = await response.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
      setServidores([]);
    }
  };

  const handleServidorSelect = (userId: string) => {
    const servidor = servidores.find((s) => s.id === userId);
    setServidorSelecionado(servidor || null);
    setFormData({ ...formData, userId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.categoria) {
      alert('Servidor e Categoria são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: formData.userId,
        categoria: formData.categoria,
        registroProfissional: formData.registroProfissional || null,
        tipoRegistro: formData.tipoRegistro || null,
        ufRegistro: formData.ufRegistro || null,
        cns: formData.cns || null,
        cbo: formData.cbo || null,
        especialidades: formData.especialidades ? JSON.parse(`[${formData.especialidades}]`) : null,
        aceitaAgendamento: formData.aceitaAgendamento,
        tempoMedioConsulta: formData.tempoMedioConsulta ? parseInt(formData.tempoMedioConsulta) : 30,
        observacoes: formData.observacoes || null,
        ativo: true,
      };

      const response = await fetch('/api/apps/saude/cadastros/dados-saude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao vincular servidor');
        return;
      }

      alert('Servidor vinculado à saúde com sucesso!');
      router.push('/admin/apps/saude/cadastros/servidores-saude');
    } catch (error) {
      console.error('Erro ao vincular servidor:', error);
      alert('Erro ao vincular servidor');
    } finally {
      setLoading(false);
    }
  };

  const servidoresFiltrados = servidores.filter((s) =>
    s.name.toLowerCase().includes(busca.toLowerCase()) ||
    s.email.toLowerCase().includes(busca.toLowerCase())
  );

  const categoriaRequerRegistro = ['MEDICO', 'ENFERMEIRO', 'DENTISTA', 'FARMACEUTICO', 'PSICOLOGO', 'FISIOTERAPEUTA', 'NUTRICIONISTA', 'ASSISTENTE_SOCIAL'].includes(formData.categoria);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              Vincular Servidor à Saúde
            </h1>
            <p className="text-gray-600">Adicionar dados de saúde a um servidor existente</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Fluxo de Vinculação</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Selecione um servidor já cadastrado no Digiurban</li>
                  <li>2. Informe a categoria profissional e dados específicos de saúde</li>
                  <li>3. Após vincular, o servidor poderá ser associado a unidades e equipes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seleção do Servidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca de Servidor */}
              <div>
                <Label htmlFor="busca">Buscar Servidor</Label>
                <Input
                  id="busca"
                  type="text"
                  placeholder="Digite o nome ou e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              {/* Servidor */}
              <div>
                <Label htmlFor="userId" className="required">
                  Servidor *
                </Label>
                <Select
                  value={formData.userId}
                  onValueChange={handleServidorSelect}
                >
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Selecione o servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {servidoresFiltrados.map((servidor) => (
                      <SelectItem key={servidor.id} value={servidor.id}>
                        {servidor.name} - {servidor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {servidorSelecionado && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{servidorSelecionado.name}</p>
                        <p className="text-sm text-gray-600">{servidorSelecionado.email}</p>
                        <p className="text-xs text-gray-500">{servidorSelecionado.departmentName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {formData.userId && (
            <>
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
                    <p className="text-sm text-gray-500 mt-1">
                      Número do CNS do profissional (15 dígitos)
                    </p>
                  </div>

                  {/* CBO */}
                  <div>
                    <Label htmlFor="cbo">CBO - Classificação Brasileira de Ocupações</Label>
                    <Input
                      id="cbo"
                      type="text"
                      placeholder="Ex: 225125 (Médico Clínico)"
                      value={formData.cbo}
                      onChange={(e) => setFormData({ ...formData, cbo: e.target.value })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Código CBO da ocupação principal
                    </p>
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
                      <p className="text-sm text-gray-500 mt-1">
                        Lista de especialidades separadas por vírgula (entre aspas)
                      </p>
                    </div>
                  )}
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
                    <p className="text-sm text-gray-500 mt-1">
                      Usado para cálculo de agendas (padrão: 30 minutos)
                    </p>
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
            </>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.userId}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Vinculando...' : 'Vincular Servidor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
