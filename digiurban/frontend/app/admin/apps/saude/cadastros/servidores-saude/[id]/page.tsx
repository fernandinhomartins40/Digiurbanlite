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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, User, Link2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================
// CONSTANTES
// ============================================================

const CATEGORIAS = [
  { value: 'MEDICO', label: 'Médico' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro' },
  { value: 'TECNICO_ENFERMAGEM', label: 'Técnico de Enfermagem' },
  { value: 'ACS', label: 'Agente Comunitário de Saúde' },
  { value: 'DENTISTA', label: 'Dentista' },
  { value: 'FARMACEUTICO', label: 'Farmacêutico' },
  { value: 'PSICOLOGO', label: 'Psicólogo' },
  { value: 'ASSISTENTE_SOCIAL', label: 'Assistente Social' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'FISIOTERAPEUTA', label: 'Fisioterapeuta' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIPOS_REGISTRO = [
  { value: 'CRM', label: 'CRM' },
  { value: 'COREN', label: 'COREN' },
  { value: 'CRO', label: 'CRO' },
  { value: 'CRF', label: 'CRF' },
  { value: 'CRP', label: 'CRP' },
  { value: 'CREFITO', label: 'CREFITO' },
  { value: 'CRN', label: 'CRN' },
  { value: 'CRESS', label: 'CRESS' },
  { value: 'OUTRO', label: 'Outro' },
];

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CATEGORIAS_COM_REGISTRO = ['MEDICO','ENFERMEIRO','DENTISTA','FARMACEUTICO','PSICOLOGO','FISIOTERAPEUTA','NUTRICIONISTA','ASSISTENTE_SOCIAL'];

// ============================================================
// TIPOS
// ============================================================

interface VinculoUnidade {
  id: string;
  situacao: string;
  tipo: string;
  isPrimary: boolean;
  cargaHoraria: number | null;
  dataInicio: string;
  dataFim: string | null;
  organizationalUnit: { nome: string; sigla: string } | null;
}

interface VinculoEquipe {
  id: string;
  ativo: boolean;
  team: { nome: string; sigla: string } | null;
}

// ============================================================
// COMPONENTE
// ============================================================

export default function EditarServidorSaude() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const servidorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados do servidor
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [departamento, setDepartamento] = useState('');

  // Dados profissionais (HealthProfessionalData)
  const [formData, setFormData] = useState({
    categoria: '',
    registroProfissional: '',
    tipoRegistro: '',
    ufRegistro: '',
    cns: '',
    cbo: '',
    especialidades: '',
    status: 'ATIVO',
    aceitaAgendamento: true,
    tempoMedioConsulta: '30',
    observacoes: '',
  });

  // Vínculos existentes
  const [vinculosUnidades, setVinculosUnidades] = useState<VinculoUnidade[]>([]);
  const [vinculosEquipes, setVinculosEquipes] = useState<VinculoEquipe[]>([]);

  useEffect(() => {
    loadServidor();
  }, [servidorId]);

  const loadServidor = async () => {
    try {
      // Buscar dados completos via adapter V2.0
      const res = await fetch(`/api/saude/servidores/${servidorId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Servidor não encontrado');

      const data = await res.json();

      setNome(data.name || '');
      setEmail(data.email || '');
      setDepartamento(data.department?.name || '');

      if (data.healthData) {
        setFormData({
          categoria: data.healthData.categoria || '',
          registroProfissional: data.healthData.registroProfissional || '',
          tipoRegistro: data.healthData.tipoRegistro || '',
          ufRegistro: data.healthData.ufRegistro || '',
          cns: data.healthData.cns || '',
          cbo: data.healthData.cbo || '',
          especialidades: Array.isArray(data.healthData.especialidades)
            ? data.healthData.especialidades.join(', ')
            : '',
          status: data.healthData.status || 'ATIVO',
          aceitaAgendamento: data.healthData.aceitaAgendamento ?? true,
          tempoMedioConsulta: String(data.healthData.tempoMedioConsulta || 30),
          observacoes: data.healthData.observacoes || '',
        });
      }

      // Vínculos com unidades (EmployeeAssignment ativo)
      const unidadeVinculos = (data.assignments || []).filter((a: any) => a.situacao === 'ATIVO');
      setVinculosUnidades(unidadeVinculos);

      // Vínculos com equipes
      const equipesVinculos = (data.equipesParticipa || []).filter((e: any) => e.ativo);
      setVinculosEquipes(equipesVinculos);
    } catch (error) {
      console.error('Erro ao carregar servidor:', error);
      toast({ title: 'Erro', description: 'Servidor não encontrado ou sem dados de saúde.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria) {
      toast({ title: 'Atenção', description: 'Categoria é obrigatória.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        categoria: formData.categoria,
        registroProfissional: formData.registroProfissional || null,
        tipoRegistro: formData.tipoRegistro || null,
        ufRegistro: formData.ufRegistro || null,
        cns: formData.cns || null,
        cbo: formData.cbo || null,
        especialidades: formData.especialidades
          ? formData.especialidades.split(',').map((s: string) => s.trim()).filter(Boolean)
          : null,
        ativo: formData.status === 'ATIVO',
        aceitaAgendamento: formData.aceitaAgendamento,
        tempoMedioConsulta: parseInt(formData.tempoMedioConsulta) || 30,
        observacoes: formData.observacoes || null,
      };

      const res = await fetch(`/api/professional-data/health/${servidorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar');
      }

      toast({ title: 'Sucesso', description: 'Dados de saúde atualizados.' });
      router.push('/admin/apps/saude/cadastros/servidores-saude');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const encerrarVinculo = async (assignmentId: string) => {
    if (!confirm('Deseja encerrar este vínculo?')) return;
    try {
      const res = await fetch(`/api/saude/servidores/${servidorId}/vinculos/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ motivo: 'Encerrado pela página de edição' }),
      });
      if (!res.ok) throw new Error('Erro ao encerrar');
      toast({ title: 'Sucesso', description: 'Vínculo encerrado.' });
      loadServidor();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const removerEquipe = async (memberId: string) => {
    if (!confirm('Deseja remover da equipe?')) return;
    try {
      const res = await fetch(`/api/saude/servidores/${servidorId}/equipes/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao remover');
      toast({ title: 'Sucesso', description: 'Removido da equipe.' });
      loadServidor();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const categoriaRequerRegistro = CATEGORIAS_COM_REGISTRO.includes(formData.categoria);

  // ── Loading / Not Found ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

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
              <User className="h-8 w-8 text-blue-600" />
              Editar Dados de Saúde
            </h1>
            <p className="text-gray-600">Atualizar dados e vínculos do profissional</p>
          </div>
          <Badge className={formData.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {formData.status}
          </Badge>
        </div>

        {/* Info do servidor */}
        <Card className="mb-6 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold text-lg">{nome}</p>
                <p className="text-sm text-gray-600">{email}</p>
                {departamento && <p className="text-xs text-gray-500">{departamento}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vínculos atuais (somente leitura — gerenciados pelo wizard) */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                Vínculos Atuais
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/apps/saude/cadastros/vinculos')}>
                Adicionar via Wizard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unidades */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Unidades de Saúde</p>
              {vinculosUnidades.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum vínculo com unidade</p>
              ) : (
                <div className="space-y-2">
                  {vinculosUnidades.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{v.organizationalUnit?.nome || '—'}</span>
                        {v.cargaHoraria && <Badge variant="outline" className="text-xs">{v.cargaHoraria}h/sem</Badge>}
                        {v.isPrimary && <Badge className="text-xs bg-blue-100 text-blue-800">Principal</Badge>}
                        <Badge variant="outline" className="text-xs">{v.tipo}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => encerrarVinculo(v.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipes */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Equipes ESF</p>
              {vinculosEquipes.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Não pertence a nenhuma equipe</p>
              ) : (
                <div className="space-y-2">
                  {vinculosEquipes.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                      <span className="text-sm font-medium">{e.team?.nome || '—'}</span>
                      <button
                        type="button"
                        onClick={() => removerEquipe(e.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de dados profissionais */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Categoria Profissional *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData((f) => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {categoriaRequerRegistro && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de Registro</Label>
                    <Select value={formData.tipoRegistro} onValueChange={(v) => setFormData((f) => ({ ...f, tipoRegistro: v }))}>
                      <SelectTrigger><SelectValue placeholder="Ex: CRM" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_REGISTRO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input placeholder="123456" value={formData.registroProfissional} onChange={(e) => setFormData((f) => ({ ...f, registroProfissional: e.target.value }))} />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Select value={formData.ufRegistro} onValueChange={(v) => setFormData((f) => ({ ...f, ufRegistro: v }))}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CNS (Cartão Nacional de Saúde)</Label>
                  <Input placeholder="15 dígitos" maxLength={15} value={formData.cns} onChange={(e) => setFormData((f) => ({ ...f, cns: e.target.value }))} />
                </div>
                <div>
                  <Label>CBO</Label>
                  <Input placeholder="Ex: 225125" value={formData.cbo} onChange={(e) => setFormData((f) => ({ ...f, cbo: e.target.value }))} />
                </div>
              </div>

              {formData.categoria === 'MEDICO' && (
                <div>
                  <Label>Especialidades</Label>
                  <Input placeholder="Clínica Geral, Cardiologia" value={formData.especialidades} onChange={(e) => setFormData((f) => ({ ...f, especialidades: e.target.value }))} />
                  <p className="text-xs text-gray-500 mt-1">Separadas por vírgula</p>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configurações de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aceita Agendamento</Label>
                  <Select value={formData.aceitaAgendamento ? 'true' : 'false'} onValueChange={(v) => setFormData((f) => ({ ...f, aceitaAgendamento: v === 'true' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tempo Médio de Consulta (minutos)</Label>
                  <Input type="number" min="5" max="180" value={formData.tempoMedioConsulta} onChange={(e) => setFormData((f) => ({ ...f, tempoMedioConsulta: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea placeholder="Informações adicionais..." rows={3} value={formData.observacoes} onChange={(e) => setFormData((f) => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
