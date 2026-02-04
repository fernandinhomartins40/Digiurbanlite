'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Link2,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  User,
  Users,
  Building2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================
// CONSTANTES E TIPOS
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

const TIPOS_VINCULO = [
  { value: 'LOTACAO', label: 'Lotação' },
  { value: 'CEDENCIA', label: 'Cedência' },
  { value: 'REQUISICAO', label: 'Requisição' },
  { value: 'REMOCAO', label: 'Remoção' },
  { value: 'DISPOSICAO', label: 'Disposição' },
];

const CATEGORIAS_COM_REGISTRO = ['MEDICO','ENFERMEIRO','DENTISTA','FARMACEUTICO','PSICOLOGO','FISIOTERAPEUTA','NUTRICIONISTA','ASSISTENTE_SOCIAL'];

interface ServidorDisponivel {
  id: string;
  name: string;
  email: string;
  departmentName?: string;
}

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnes?: string;
}

interface Equipe {
  id: string;
  nome: string;
  ine: string;
  tipo: string;
  unidade?: { nome: string };
}

interface ServidorVinculado {
  id: string;
  name: string;
  email: string;
  healthData: {
    categoria: string;
    registroProfissional: string | null;
    tipoRegistro: string | null;
    ufRegistro: string | null;
    cns: string | null;
    cbo: string | null;
    status: string;
  } | null;
  assignments: {
    id: string;
    situacao: string;
    tipo: string;
    isPrimary: boolean;
    cargaHoraria: number | null;
    dataInicio: string;
    dataFim: string | null;
    organizationalUnit: { nome: string; sigla: string } | null;
  }[];
  equipesParticipa: {
    id: string;
    ativo: boolean;
    team: { nome: string; sigla: string } | null;
  }[];
}

// Estado do wizard
interface WizardState {
  // Etapa 1 — Servidor
  userId: string;
  servidorSelecionado: ServidorDisponivel | null;
  // Etapa 2 — Dados profissionais
  categoria: string;
  registroProfissional: string;
  tipoRegistro: string;
  ufRegistro: string;
  cns: string;
  cbo: string;
  especialidades: string;
  // Etapa 3 — Vínculos com unidades
  unidadesPrincipais: { unidadeId: string; cargaHoraria: string; tipoVinculo: string; dataInicio: string }[];
  // Etapa 4 — Equipe ESF
  equipeSelecionadaId: string;
  // Etapa 5 — Atendimento
  aceitaAgendamento: boolean;
  tempoMedioConsulta: string;
  observacoes: string;
  documentoVinculo: string;
}

const WIZARD_INITIAL: WizardState = {
  userId: '',
  servidorSelecionado: null,
  categoria: '',
  registroProfissional: '',
  tipoRegistro: '',
  ufRegistro: '',
  cns: '',
  cbo: '',
  especialidades: '',
  unidadesPrincipais: [{ unidadeId: '', cargaHoraria: '40', tipoVinculo: 'LOTACAO', dataInicio: new Date().toISOString().split('T')[0] }],
  equipeSelecionadaId: '',
  aceitaAgendamento: true,
  tempoMedioConsulta: '30',
  observacoes: '',
  documentoVinculo: '',
};

// ============================================================
// HELPERS
// ============================================================

function getCategoriaLabel(cat: string) {
  return CATEGORIAS.find((c) => c.value === cat)?.label || cat;
}

function getCategoriaColor(cat: string): string {
  const map: Record<string, string> = {
    MEDICO: 'bg-blue-100 text-blue-800',
    ENFERMEIRO: 'bg-green-100 text-green-800',
    TECNICO_ENFERMAGEM: 'bg-teal-100 text-teal-800',
    ACS: 'bg-purple-100 text-purple-800',
    DENTISTA: 'bg-cyan-100 text-cyan-800',
    FARMACEUTICO: 'bg-orange-100 text-orange-800',
    PSICOLOGO: 'bg-pink-100 text-pink-800',
    ASSISTENTE_SOCIAL: 'bg-indigo-100 text-indigo-800',
    NUTRICIONISTA: 'bg-yellow-100 text-yellow-800',
    FISIOTERAPEUTA: 'bg-red-100 text-red-800',
  };
  return map[cat] || 'bg-gray-100 text-gray-800';
}

function getSituacaoBadge(situacao: string) {
  const map: Record<string, string> = {
    ATIVO: 'bg-green-100 text-green-800',
    INATIVO: 'bg-gray-100 text-gray-800',
    AFASTADO: 'bg-yellow-100 text-yellow-800',
    LICENCA: 'bg-orange-100 text-orange-800',
    SUSPENSO: 'bg-red-100 text-red-800',
  };
  return map[situacao] || 'bg-gray-100 text-gray-800';
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function VinculosUnificadoPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Dados da listagem ──
  const [servidoresVinculados, setServidoresVinculados] = useState<ServidorVinculado[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [buscaLista, setBuscaLista] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [filtroStatus, setFiltroStatus] = useState('ATIVOS');

  // ── Dados para o wizard ──
  const [servidoresDisponíveis, setServidoresDisponíveis] = useState<ServidorDisponivel[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);

  // ── Wizard ──
  const [wizardOpen, setWizardOpen] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(WIZARD_INITIAL);
  const [salvando, setSalvando] = useState(false);
  const [servidorJaVinculado, setServidorJaVinculado] = useState(false);

  // ── Encerrar vínculo ──
  const [dialogEncerrar, setDialogEncerrar] = useState<{ open: boolean; assignmentId: string; userId: string; motivo: string } | null>(null);

  // ── Carregar dados iniciais ──
  useEffect(() => {
    carregarLista();
  }, [filtroCategoria, filtroStatus]);

  const carregarLista = useCallback(async () => {
    setLoadingLista(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria !== 'TODAS') params.append('categoria', filtroCategoria);
      if (filtroStatus === 'ATIVOS') params.append('status', 'ATIVO');
      if (filtroStatus === 'INATIVOS') params.append('status', 'INATIVO');

      const res = await fetch(`/api/saude/servidores?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setServidoresVinculados(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erro ao carregar servidores:', e);
    } finally {
      setLoadingLista(false);
    }
  }, [filtroCategoria, filtroStatus]);

  // ── Carregar dados para o wizard quando abrir ──
  const abrirWizard = async () => {
    try {
      const [servidoresRes, unidadesRes, equipesRes] = await Promise.all([
        fetch('/api/apps/saude/cadastros/dados-saude?semDadosSaude=true', { credentials: 'include' }),
        fetch('/api/apps/saude/cadastros/unidades', { credentials: 'include' }),
        fetch('/api/apps/saude/cadastros/equipes', { credentials: 'include' }),
      ]);
      if (servidoresRes.ok) setServidoresDisponíveis(await servidoresRes.json());
      if (unidadesRes.ok) setUnidades(await unidadesRes.json());
      if (equipesRes.ok) setEquipes(await equipesRes.json());
    } catch (e) {
      console.error('Erro ao carregar dados do wizard:', e);
    }
    setWizard(WIZARD_INITIAL);
    setEtapa(1);
    setServidorJaVinculado(false);
    setWizardOpen(true);
  };

  // ── Verificar se servidor já possui dados de saúde ──
  const verificarServidor = async (userId: string) => {
    try {
      const res = await fetch(`/api/professional-data/health/${userId}`, { credentials: 'include' });
      if (res.ok) {
        setServidorJaVinculado(true);
      } else {
        setServidorJaVinculado(false);
      }
    } catch {
      setServidorJaVinculado(false);
    }
  };

  // ── Avançar / retroceder etapas ──
  const proximo = () => setEtapa((e) => Math.min(e + 1, 5));
  const anterior = () => setEtapa((e) => Math.max(e - 1, 1));

  // ── Submeter wizard ──
  const submeterWizard = async () => {
    setSalvando(true);
    try {
      // 1) Criar / garantir HealthProfessionalData
      if (!servidorJaVinculado) {
        const payloadSaude = {
          userId: wizard.userId,
          categoria: wizard.categoria,
          registroProfissional: wizard.registroProfissional || null,
          tipoRegistro: wizard.tipoRegistro || null,
          ufRegistro: wizard.ufRegistro || null,
          cns: wizard.cns || null,
          cbo: wizard.cbo || null,
          especialidades: wizard.especialidades ? wizard.especialidades.split(',').map((s) => s.trim()).filter(Boolean) : null,
          aceitaAgendamento: wizard.aceitaAgendamento,
          tempoMedioConsulta: parseInt(wizard.tempoMedioConsulta) || 30,
          observacoes: wizard.observacoes || null,
        };
        const resSaude = await fetch('/api/professional-data/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payloadSaude),
        });
        if (!resSaude.ok) {
          const err = await resSaude.json();
          throw new Error(err.error || 'Erro ao criar dados profissionais');
        }
      }

      // 2) Criar vínculos com unidades (Sistema Unificado V2.0)
      for (const u of wizard.unidadesPrincipais) {
        if (!u.unidadeId) continue;
        const resVinculo = await fetch(`/api/saude/servidores/${wizard.userId}/vincular-unidade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            unidadeId: u.unidadeId,
            dataInicio: u.dataInicio,
            cargaHoraria: parseInt(u.cargaHoraria) || 40,
            percentualDedicacao: Math.round((parseInt(u.cargaHoraria) || 40) / 40 * 100),
            observacoes: wizard.documentoVinculo ? `Doc: ${wizard.documentoVinculo}` : undefined,
          }),
        });
        if (!resVinculo.ok) {
          const err = await resVinculo.json();
          throw new Error(err.error || 'Erro ao criar vínculo com unidade');
        }
      }

      // 3) Vincular a equipe ESF (se selecionada)
      if (wizard.equipeSelecionadaId) {
        const resEquipe = await fetch(`/api/saude/servidores/${wizard.userId}/vincular-equipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            equipeId: wizard.equipeSelecionadaId,
            funcao: wizard.categoria === 'ACS' ? 'ACS' : 'MEMBRO',
            dataInicio: wizard.unidadesPrincipais[0]?.dataInicio || new Date().toISOString().split('T')[0],
            observacoes: wizard.observacoes || null,
          }),
        });
        if (!resEquipe.ok) {
          const err = await resEquipe.json();
          throw new Error(err.error || 'Erro ao vincular à equipe');
        }
      }

      toast({ title: 'Sucesso', description: 'Vinculação concluída com sucesso!' });
      setWizardOpen(false);
      carregarLista();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Erro inesperado', variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  // ── Encerrar vínculo ──
  const encerrarVinculo = async () => {
    if (!dialogEncerrar) return;
    try {
      const res = await fetch(`/api/saude/servidores/${dialogEncerrar.userId}/vinculos/${dialogEncerrar.assignmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ motivo: dialogEncerrar.motivo || 'Encerramento solicitado' }),
      });
      if (!res.ok) throw new Error('Erro ao encerrar vínculo');
      toast({ title: 'Sucesso', description: 'Vínculo encerrado com sucesso.' });
      setDialogEncerrar(null);
      carregarLista();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  // ── Filtrar lista ──
  const servidoresFiltrados = servidoresVinculados.filter((s) => {
    const matchBusca =
      s.name.toLowerCase().includes(buscaLista.toLowerCase()) ||
      s.email.toLowerCase().includes(buscaLista.toLowerCase()) ||
      (s.healthData?.registroProfissional || '').toLowerCase().includes(buscaLista.toLowerCase()) ||
      (s.healthData?.cns || '').toLowerCase().includes(buscaLista.toLowerCase());
    return matchBusca;
  });

  // ── Estatísticas ──
  const totalAtivos = servidoresVinculados.filter((s) => s.healthData?.status === 'ATIVO').length;
  const totalVinculos = servidoresVinculados.reduce((acc, s) => acc + (s.assignments?.filter((a) => a.situacao === 'ATIVO').length || 0), 0);
  const totalEquipes = servidoresVinculados.reduce((acc, s) => acc + (s.equipesParticipa?.filter((e) => e.ativo).length || 0), 0);

  // ============================================================
  // RENDER — ETAPAS DO WIZARD
  // ============================================================

  const renderEtapa1 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Selecione um servidor existente do Digiurban para vincular à saúde.</p>
      <div>
        <Label>Servidor *</Label>
        <Select
          value={wizard.userId}
          onValueChange={(val) => {
            const srv = servidoresDisponíveis.find((s) => s.id === val);
            setWizard((w) => ({ ...w, userId: val, servidorSelecionado: srv || null }));
            verificarServidor(val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o servidor" />
          </SelectTrigger>
          <SelectContent>
            {servidoresDisponíveis.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {wizard.servidorSelecionado && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-semibold text-sm">{wizard.servidorSelecionado.name}</p>
              <p className="text-xs text-gray-500">{wizard.servidorSelecionado.email}</p>
            </div>
          </div>
        </div>
      )}
      {servidorJaVinculado && wizard.userId && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">Este servidor já possui dados de saúde cadastrados. Os dados profissionais não serão sobrescritos — apenas os vínculos serão criados.</p>
        </div>
      )}
    </div>
  );

  const renderEtapa2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {servidorJaVinculado
          ? 'Este servidor já possui dados profissionais. Prossiga para criar os vínculos.'
          : 'Informe a categoria e os dados profissionais do servidor.'}
      </p>
      {servidorJaVinculado ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800 font-medium">Dados profissionais já cadastrados</p>
        </div>
      ) : (
        <>
          <div>
            <Label>Categoria Profissional *</Label>
            <Select value={wizard.categoria} onValueChange={(v) => setWizard((w) => ({ ...w, categoria: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {CATEGORIAS_COM_REGISTRO.includes(wizard.categoria) && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo Registro</Label>
                <Select value={wizard.tipoRegistro} onValueChange={(v) => setWizard((w) => ({ ...w, tipoRegistro: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ex: CRM" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_REGISTRO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número</Label>
                <Input placeholder="123456" value={wizard.registroProfissional} onChange={(e) => setWizard((w) => ({ ...w, registroProfissional: e.target.value }))} />
              </div>
              <div>
                <Label>UF</Label>
                <Select value={wizard.ufRegistro} onValueChange={(v) => setWizard((w) => ({ ...w, ufRegistro: v }))}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CNS (Cartão Nacional de Saúde)</Label>
              <Input placeholder="15 dígitos" maxLength={15} value={wizard.cns} onChange={(e) => setWizard((w) => ({ ...w, cns: e.target.value }))} />
            </div>
            <div>
              <Label>CBO</Label>
              <Input placeholder="Ex: 225125" value={wizard.cbo} onChange={(e) => setWizard((w) => ({ ...w, cbo: e.target.value }))} />
            </div>
          </div>
          {wizard.categoria === 'MEDICO' && (
            <div>
              <Label>Especialidades</Label>
              <Input placeholder="Clínica Geral, Cardiologia" value={wizard.especialidades} onChange={(e) => setWizard((w) => ({ ...w, especialidades: e.target.value }))} />
              <p className="text-xs text-gray-500 mt-1">Separadas por vírgula</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderEtapa3 = () => {
    const adicionarUnidade = () => setWizard((w) => ({
      ...w,
      unidadesPrincipais: [...w.unidadesPrincipais, { unidadeId: '', cargaHoraria: '40', tipoVinculo: 'LOTACAO', dataInicio: new Date().toISOString().split('T')[0] }],
    }));

    const removerUnidade = (idx: number) => setWizard((w) => ({
      ...w,
      unidadesPrincipais: w.unidadesPrincipais.filter((_, i) => i !== idx),
    }));

    const atualizarUnidade = (idx: number, campo: string, valor: string) => setWizard((w) => ({
      ...w,
      unidadesPrincipais: w.unidadesPrincipais.map((u, i) => (i === idx ? { ...u, [campo]: valor } : u)),
    }));

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Defina as unidades de saúde e os detalhes de cada vínculo. O primeiro vínculo será marcado como principal.</p>
        {wizard.unidadesPrincipais.map((u, idx) => (
          <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {idx === 0 ? 'Vínculo Principal' : `Vínculo Secundário ${idx}`}
              </span>
              {idx > 0 && (
                <button type="button" onClick={() => removerUnidade(idx)} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <Label>Unidade de Saúde *</Label>
              <Select value={u.unidadeId} onValueChange={(v) => atualizarUnidade(idx, 'unidadeId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {unidades.map((un) => <SelectItem key={un.id} value={un.id}>{un.nome} — {un.tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo de Vínculo</Label>
                <Select value={u.tipoVinculo} onValueChange={(v) => atualizarUnidade(idx, 'tipoVinculo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_VINCULO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Carga Horária (h/sem)</Label>
                <Input type="number" min="1" max="60" value={u.cargaHoraria} onChange={(e) => atualizarUnidade(idx, 'cargaHoraria', e.target.value)} />
              </div>
              <div>
                <Label>Data de Início</Label>
                <Input type="date" value={u.dataInicio} onChange={(e) => atualizarUnidade(idx, 'dataInicio', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={adicionarUnidade} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Vínculo Secundário
        </Button>
      </div>
    );
  };

  const renderEtapa4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Selecione a equipe ESF (opcional). Relevante especialmente para ACS e profissionais da atenção primária.</p>
      <div>
        <Label>Equipe ESF</Label>
        <Select value={wizard.equipeSelecionadaId} onValueChange={(v) => setWizard((w) => ({ ...w, equipeSelecionadaId: v }))}>
          <SelectTrigger><SelectValue placeholder="Nenhuma (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma</SelectItem>
            {equipes.map((eq) => (
              <SelectItem key={eq.id} value={eq.id}>
                {eq.nome} ({eq.tipo}) — {eq.unidade?.nome || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderEtapa5 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Configurações finais de atendimento e documento legal do vínculo.</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Aceita Agendamento</Label>
          <Select value={wizard.aceitaAgendamento ? 'true' : 'false'} onValueChange={(v) => setWizard((w) => ({ ...w, aceitaAgendamento: v === 'true' }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tempo Médio Consulta (min)</Label>
          <Input type="number" min="5" max="180" value={wizard.tempoMedioConsulta} onChange={(e) => setWizard((w) => ({ ...w, tempoMedioConsulta: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Documento Legal (Portaria / Decreto)</Label>
        <Input placeholder="Ex: Portaria nº 123/2026" value={wizard.documentoVinculo} onChange={(e) => setWizard((w) => ({ ...w, documentoVinculo: e.target.value }))} />
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea placeholder="Informações adicionais..." rows={3} value={wizard.observacoes} onChange={(e) => setWizard((w) => ({ ...w, observacoes: e.target.value }))} />
      </div>

      {/* Resumo */}
      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-2">
        <p className="font-semibold text-blue-900 text-sm">Resumo da Vinculação</p>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Servidor:</strong> {wizard.servidorSelecionado?.name}</p>
          {!servidorJaVinculado && <p><strong>Categoria:</strong> {getCategoriaLabel(wizard.categoria)}</p>}
          <p><strong>Unidades:</strong> {wizard.unidadesPrincipais.filter((u) => u.unidadeId).map((u) => {
            const un = unidades.find((x) => x.id === u.unidadeId);
            return `${un?.nome || '—'} (${u.cargaHoraria}h)`;
          }).join(', ') || '—'}</p>
          {wizard.equipeSelecionadaId && <p><strong>Equipe:</strong> {equipes.find((e) => e.id === wizard.equipeSelecionadaId)?.nome}</p>}
          {wizard.documentoVinculo && <p><strong>Documento:</strong> {wizard.documentoVinculo}</p>}
        </div>
      </div>
    </div>
  );

  const etapasRender: Record<number, () => React.ReactNode> = { 1: renderEtapa1, 2: renderEtapa2, 3: renderEtapa3, 4: renderEtapa4, 5: renderEtapa5 };
  const etapaTitulos = ['Servidor', 'Dados Profissionais', 'Vínculos Unidades', 'Equipe ESF', 'Confirmação'];

  const podeAvançar = () => {
    if (etapa === 1) return !!wizard.userId;
    if (etapa === 2) return servidorJaVinculado || !!wizard.categoria;
    if (etapa === 3) return wizard.unidadesPrincipais.some((u) => u.unidadeId);
    return true;
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Link2 className="h-8 w-8 text-blue-600" />
                Vínculos de Profissionais
              </h1>
              <p className="text-gray-600">Sistema unificado de vinculação — todas as etapas em um único lugar</p>
            </div>
          </div>
          <Button onClick={abrirWizard} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Nova Vinculação
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Profissionais', valor: servidoresVinculados.length, cor: 'text-blue-600', icon: <Stethoscope className="h-6 w-6 text-blue-200" /> },
            { label: 'Ativos', valor: totalAtivos, cor: 'text-green-600', icon: <CheckCircle className="h-6 w-6 text-green-200" /> },
            { label: 'Vínculos Ativos', valor: totalVinculos, cor: 'text-purple-600', icon: <Building2 className="h-6 w-6 text-purple-200" /> },
            { label: 'Equipes ESF', valor: totalEquipes, cor: 'text-orange-600', icon: <Users className="h-6 w-6 text-orange-200" /> },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
                  </div>
                  {item.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Label>Buscar</Label>
                <Search className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
                <Input placeholder="Nome, registro, CNS..." value={buscaLista} onChange={(e) => setBuscaLista(e.target.value)} className="pl-9" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVOS">Ativos</SelectItem>
                    <SelectItem value="INATIVOS">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de servidores vinculados */}
        <Card>
          <CardHeader>
            <CardTitle>Profissionais Vinculados ({servidoresFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLista ? (
              <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-3 text-gray-500">Carregando...</p>
              </div>
            ) : servidoresFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum profissional encontrado</p>
                <Button variant="outline" className="mt-3" onClick={abrirWizard}>
                  <Plus className="h-4 w-4 mr-2" /> Criar primeira vinculação
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Vínculos (Unidades)</TableHead>
                      <TableHead>Equipes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidoresFiltrados.map((s) => {
                      const vinculosAtivos = s.assignments?.filter((a) => a.situacao === 'ATIVO') || [];
                      const equipesAtivas = s.equipesParticipa?.filter((e) => e.ativo) || [];
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-gray-500">{s.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {s.healthData ? (
                              <Badge className={getCategoriaColor(s.healthData.categoria)}>
                                {getCategoriaLabel(s.healthData.categoria)}
                              </Badge>
                            ) : <span className="text-gray-400 italic text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            {s.healthData?.registroProfissional ? (
                              <div>
                                <p className="text-sm font-medium">{s.healthData.registroProfissional}</p>
                                <p className="text-xs text-gray-500">{s.healthData.tipoRegistro} — {s.healthData.ufRegistro}</p>
                              </div>
                            ) : <span className="text-gray-400 text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            {vinculosAtivos.length === 0 ? (
                              <span className="text-gray-400 text-sm">Sem vínculo</span>
                            ) : (
                              <div className="space-y-1">
                                {vinculosAtivos.map((v, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="text-sm">{v.organizationalUnit?.nome || '—'}</span>
                                    {v.cargaHoraria && <Badge variant="outline" className="text-xs">{v.cargaHoraria}h</Badge>}
                                    {v.isPrimary && <Badge className="text-xs bg-blue-100 text-blue-800">Principal</Badge>}
                                    <button
                                      type="button"
                                      onClick={() => setDialogEncerrar({ open: true, assignmentId: v.id, userId: s.id, motivo: '' })}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {equipesAtivas.length === 0 ? (
                              <span className="text-gray-400 text-sm">—</span>
                            ) : equipesAtivas.map((e, i) => (
                              <Badge key={i} variant="outline" className="text-xs mr-1">{e.team?.nome || '—'}</Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Badge className={getSituacaoBadge(s.healthData?.status || 'INATIVO')}>
                              {s.healthData?.status || 'Sem dados'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/apps/saude/cadastros/servidores-saude/${s.id}`)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          MODAL WIZARD — Nova Vinculação
          ============================================================ */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Vinculação de Profissional</DialogTitle>
            <DialogDescription>Preencha as etapas abaixo para completar a vinculação</DialogDescription>
          </DialogHeader>

          {/* Barra de progresso */}
          <div className="flex items-center gap-1 mb-6">
            {etapaTitulos.map((titulo, idx) => {
              const num = idx + 1;
              const done = num < etapa;
              const current = num === etapa;
              return (
                <div key={titulo} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0
                    ${done ? 'bg-green-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {done ? <Check className="h-4 w-4" /> : num}
                  </div>
                  <span className={`text-xs hidden sm:inline whitespace-nowrap ${current ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{titulo}</span>
                  {idx < etapaTitulos.length - 1 && <div className={`h-0.5 flex-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>

          {/* Conteúdo da etapa atual */}
          {etapasRender[etapa]?.()}

          {/* Rodapé */}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={etapa === 1 ? () => setWizardOpen(false) : anterior}>
              {etapa === 1 ? 'Cancelar' : <><ArrowLeft className="h-4 w-4 mr-1" /> Anterior</>}
            </Button>
            {etapa < 5 ? (
              <Button type="button" onClick={proximo} disabled={!podeAvançar()} className="bg-blue-600 hover:bg-blue-700">
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={submeterWizard} disabled={salvando} className="bg-green-600 hover:bg-green-700">
                {salvando ? 'Salvando...' : <><Check className="h-4 w-4 mr-1" /> Confirmar Vinculação</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          MODAL — Encerrar Vínculo
          ============================================================ */}
      <Dialog open={!!dialogEncerrar?.open} onOpenChange={() => setDialogEncerrar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar Vínculo</DialogTitle>
            <DialogDescription>Informe o motivo do encerramento (opcional).</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label>Motivo</Label>
            <Textarea
              rows={3}
              placeholder="Ex: fim de contrato, transferência..."
              value={dialogEncerrar?.motivo || ''}
              onChange={(e) => setDialogEncerrar((d) => d ? { ...d, motivo: e.target.value } : d)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEncerrar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={encerrarVinculo}>Encerrar Vínculo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
