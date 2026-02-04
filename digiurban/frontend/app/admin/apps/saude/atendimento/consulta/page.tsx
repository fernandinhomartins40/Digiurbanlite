'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  buscarContextoFila,
  buscarConsultaPorFila,
  criarConsultaMedica,
  finalizarConsulta,
  criarPrescricao,
  criarExame,
  criarEncaminhamento,
  criarAtestado,
  buscarMedicamentos,
  criarProblema,
} from '@/lib/api/atendimento-api';
import {
  User,
  Clock,
  AlertCircle,
  Stethoscope,
  ClipboardList,
  FileCheck,
  Pill,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Activity,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Cidadao {
  id: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
}

interface Problema {
  id: string;
  codigo: string;
  descricao: string;
  status: string;
  gravidade?: string;
  dataInicio: string;
}

interface ConsultaAnterior {
  id: string;
  motivoConsulta?: string;
  diagnosticoPrincipal?: string;
  condutaTerapeutica?: string;
  dataHora: string;
  atendimento?: { dataAtendimento: string };
}

interface Medicamento {
  id: string;
  nome: string;
  principioAtivo: string;
  apresentacao: string;
  concentracao?: string;
}

interface MedicamentoPrescrição {
  nome: string;
  principioAtivo: string;
  apresentacao: string;
  posologia: string;
  quantidade: string;
  duracao: string;
}

interface ItemPlano {
  id: string;
  tipo: string;
  dados: Record<string, any>;
  criadoEm: string;
}

// ─── Cores Manchester ───────────────────────────────────────────────────────
const CORES_MANCHESTER: Record<string, { bg: string; text: string; label: string }> = {
  VERMELHO: { bg: 'bg-red-100', text: 'text-red-800', label: 'Emergência' },
  LARANJA: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Muito Urgente' },
  AMARELO: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Urgente' },
  VERDE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pouco Urgente' },
  AZUL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Não Urgente' },
};

// ─── Componente: Painel Lateral (dados paciente + problemas + histórico) ─────
function PainelPaciente({
  cidadao,
  classificacao,
  problemas,
  consultasAnteriores,
  motivoBusca,
  horaChegada,
  onAdicionarProblema,
}: {
  cidadao: Cidadao;
  classificacao?: string;
  problemas: Problema[];
  consultasAnteriores: ConsultaAnterior[];
  motivoBusca?: string;
  horaChegada?: string;
  onAdicionarProblema: (p: { codigo: string; descricao: string; gravidade: string }) => void;
}) {
  const [novoProblema, setNovoProblema] = useState({ codigo: '', descricao: '', gravidade: 'LEVE' });
  const [adicionandoProblema, setAdicionandoProblema] = useState(false);

  const idade = cidadao.birthDate
    ? Math.floor((Date.now() - new Date(cidadao.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const corManchester = classificacao ? CORES_MANCHESTER[classificacao] : null;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto max-h-full pr-2">
      {/* Dados do Paciente */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-lg truncate">{cidadao.name}</div>
              <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                {cidadao.cpf && <div>CPF: {cidadao.cpf}</div>}
                {idade !== null && <div>Idade: {idade} anos</div>}
                {cidadao.phone && <div>Fone: {cidadao.phone}</div>}
              </div>
            </div>
          </div>

          {/* Classificação de risco */}
          {corManchester && (
            <div className={`mt-3 px-3 py-1.5 rounded-md ${corManchester.bg}`}>
              <span className={`text-sm font-semibold ${corManchester.text}`}>
                Classificação: {corManchester.label}
              </span>
            </div>
          )}

          {/* Motivo + hora chegada */}
          <div className="mt-3 pt-3 border-t space-y-1">
            {motivoBusca && (
              <div className="text-sm">
                <span className="text-gray-500">Motivo: </span>
                <span className="text-gray-800 font-medium">{motivoBusca}</span>
              </div>
            )}
            {horaChegada && (
              <div className="text-sm flex items-center gap-1 text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                Chegou: {new Date(horaChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Problemas Ativos */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Problemas Ativos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setAdicionandoProblema(!adicionandoProblema)}
            >
              {adicionandoProblema ? <ChevronUp className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {adicionandoProblema && (
            <div className="mb-3 p-2 bg-gray-50 rounded-md space-y-2 border">
              <Input
                placeholder="Código (ex: I10)"
                value={novoProblema.codigo}
                onChange={(e) => setNovoProblema({ ...novoProblema, codigo: e.target.value })}
                className="text-sm h-7"
              />
              <Input
                placeholder="Descrição"
                value={novoProblema.descricao}
                onChange={(e) => setNovoProblema({ ...novoProblema, descricao: e.target.value })}
                className="text-sm h-7"
              />
              <select
                value={novoProblema.gravidade}
                onChange={(e) => setNovoProblema({ ...novoProblema, gravidade: e.target.value })}
                className="w-full text-sm border rounded px-2 h-7 bg-white"
              >
                <option value="LEVE">Leve</option>
                <option value="MODERADO">Moderado</option>
                <option value="GRAVE">Grave</option>
              </select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-6 px-3 text-xs flex-1"
                  onClick={() => {
                    if (novoProblema.codigo && novoProblema.descricao) {
                      onAdicionarProblema(novoProblema);
                      setNovoProblema({ codigo: '', descricao: '', gravidade: 'LEVE' });
                      setAdicionandoProblema(false);
                    }
                  }}
                >
                  Adicionar
                </Button>
                <Button size="sm" variant="outline" className="h-6 px-3 text-xs" onClick={() => setAdicionandoProblema(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          {problemas.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhum problema registrado</p>
          ) : (
            <div className="space-y-1.5">
              {problemas.map((p) => {
                const corGrav = p.gravidade === 'GRAVE' ? 'bg-red-50 border-red-200' : p.gravidade === 'MODERADO' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
                return (
                  <div key={p.id} className={`px-2 py-1.5 rounded border text-sm ${corGrav}`}>
                    <span className="font-semibold text-gray-700">{p.codigo}</span>
                    <span className="text-gray-600 ml-1.5">{p.descricao}</span>
                    {p.gravidade && <Badge variant="outline" className="ml-1.5 text-xs">{p.gravidade}</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Consultas */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-purple-500" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {consultasAnteriores.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sem consultas anteriores</p>
          ) : (
            <div className="space-y-2">
              {consultasAnteriores.map((c) => (
                <div key={c.id} className="text-xs border rounded p-2 bg-gray-50">
                  <div className="text-gray-400 mb-0.5">
                    {new Date(c.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  {c.motivoConsulta && <div><span className="font-semibold text-gray-600">Motivo:</span> {c.motivoConsulta}</div>}
                  {c.diagnosticoPrincipal && <div><span className="font-semibold text-gray-600">Diag:</span> {c.diagnosticoPrincipal}</div>}
                  {c.condutaTerapeutica && <div className="text-gray-500 truncate">{c.condutaTerapeutica}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Componente: Seção colapsível do Plano ───────────────────────────────────
function SecaoPlano({ titulo, icone: Icone, cor, expanded, onToggle, children }: {
  titulo: string;
  icone: any;
  cor: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors`}
      >
        <span className={`flex items-center gap-2 font-semibold text-sm ${cor}`}>
          <Icone className="h-4 w-4" />
          {titulo}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && <div className="p-4 border-t">{children}</div>}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function ConsultaMedicaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filaId = searchParams.get('filaId');

  // ── Estado: dados do contexto ──
  const [cidadao, setCidadao] = useState<Cidadao | null>(null);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [consultasAnteriores, setConsultasAnteriores] = useState<ConsultaAnterior[]>([]);
  const [classificacao, setClassificacao] = useState<string | undefined>();
  const [motivoBusca, setMotivoBusca] = useState<string>();
  const [horaChegada, setHoraChegada] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [consultaId, setConsultaId] = useState<string | null>(null);

  // ── Estado: SOAP ──
  const [soap, setSoap] = useState({
    // S — Subjetivo
    motivoConsulta: '',
    historiaAtual: '',
    historiaPregressa: '',
    historiaFamiliar: '',
    historiaSocial: '',
    // O — Objetivo
    sinaisVitais: { pressaoArterial: '', frequenciaCardiaca: '', frequenciaRespiratoria: '', temperatura: '', saturacaoO2: '' },
    exameFisicoGeral: '',
    exameFisicoSistemas: { cardiovascular: '', respiratorio: '', abdomen: '', neurologico: '', musculoesqueletico: '', dermatologico: '' },
    antropometria: { peso: '', altura: '', imc: '' },
    // A — Avaliação
    hipoteseDiagnostica: '',
    diagnosticoPrincipal: '',
    diagnosticosSecund: '',
    // P — Plano
    condutaTerapeutica: '',
    orientacoes: '',
    retornoNecessario: false,
    prazoRetornoDias: '',
  });

  // ── Estado: ações inline do Plano ──
  const [planoSalvo, setPlanoSalvo] = useState(false);
  const [secoesPlano, setSecoesPlano] = useState({ prescricao: false, exame: false, encaminhamento: false, atestado: false });
  const [prescricoes, setPrescricoes] = useState<ItemPlano[]>([]);
  const [exames, setExames] = useState<ItemPlano[]>([]);
  const [encaminhamentos, setEncaminhamentos] = useState<ItemPlano[]>([]);
  const [atestados, setAtestados] = useState<ItemPlano[]>([]);

  // Forms inline
  const [formPrescricao, setFormPrescricao] = useState<MedicamentoPrescrição>({ nome: '', principioAtivo: '', apresentacao: '', posologia: '', quantidade: '', duracao: '' });
  const [buscaMed, setBuscaMed] = useState('');
  const [medResultados, setMedResultados] = useState<Medicamento[]>([]);
  const [formExame, setFormExame] = useState({ tipoExame: '', justificativa: '', prioridade: 'ROTINA' });
  const [formEnc, setFormEnc] = useState({ especialidade: '', motivo: '', prioridade: 'ROTINA' });
  const [formAtestado, setFormAtestado] = useState({ tipo: 'MEDICO', cid10: '', diasAfastamento: '1', dataInicio: new Date().toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0], observacoes: '' });

  // ── Carregar contexto da fila ──
  const loadContexto = useCallback(async () => {
    if (!filaId) return;
    try {
      setLoading(true);
      const ctx = await buscarContextoFila(filaId);
      setCidadao(ctx.fila.citizen);
      setProblemas(ctx.problemas || []);
      setConsultasAnteriores(ctx.consultasAnteriores || []);
      setClassificacao(ctx.fila.classificacaoRisco);
      setMotivoBusca(ctx.fila.motivoBusca);
      setHoraChegada(ctx.fila.dataHoraChegada);

      // Se já existe consulta criada, carregar dados
      const consulta = await buscarConsultaPorFila(filaId);
      if (consulta) {
        setConsultaId(consulta.id);
        setSoap({
          motivoConsulta: consulta.motivoConsulta || '',
          historiaAtual: consulta.historiaAtual || '',
          historiaPregressa: consulta.historiaPregressa || '',
          historiaFamiliar: consulta.historiaFamiliar || '',
          historiaSocial: consulta.historiaSocial || '',
          sinaisVitais: consulta.sinaisVitais || { pressaoArterial: '', frequenciaCardiaca: '', frequenciaRespiratoria: '', temperatura: '', saturacaoO2: '' },
          exameFisicoGeral: consulta.exameFisicoGeral || '',
          exameFisicoSistemas: consulta.exameFisicoSistemas || { cardiovascular: '', respiratorio: '', abdomen: '', neurologico: '', musculoesqueletico: '', dermatologico: '' },
          antropometria: consulta.antropometria || { peso: '', altura: '', imc: '' },
          hipoteseDiagnostica: consulta.hipoteseDiagnostica || '',
          diagnosticoPrincipal: consulta.diagnosticoPrincipal || '',
          diagnosticosSecund: Array.isArray(consulta.diagnosticosSecund) ? consulta.diagnosticosSecund.map((d: any) => d.descricao || d).join('\n') : '',
          condutaTerapeutica: consulta.condutaTerapeutica || '',
          orientacoes: consulta.orientacoes || '',
          retornoNecessario: consulta.retornoNecessario || false,
          prazoRetornoDias: consulta.prazoRetornoDias?.toString() || '',
        });
        // Carregar itens do plano
        if (consulta.prescricoes) setPrescricoes(consulta.prescricoes.map((p: any) => ({ id: p.id, tipo: 'prescricao', dados: p, criadoEm: p.dataHora })));
        if (consulta.examesSolicitados) setExames(consulta.examesSolicitados.map((e: any) => ({ id: e.id, tipo: 'exame', dados: e, criadoEm: e.dataHora })));
        if (consulta.encaminhamentos) setEncaminhamentos(consulta.encaminhamentos.map((e: any) => ({ id: e.id, tipo: 'encaminhamento', dados: e, criadoEm: e.dataHora })));
        if (consulta.atestados) setAtestados(consulta.atestados.map((a: any) => ({ id: a.id, tipo: 'atestado', dados: a, criadoEm: a.dataHora })));
      }
    } catch (err) {
      console.error('Erro ao carregar contexto:', err);
    } finally {
      setLoading(false);
    }
  }, [filaId]);

  useEffect(() => { loadContexto(); }, [loadContexto]);

  // ── Busca de medicamentos (debounce) ──
  useEffect(() => {
    if (buscaMed.length < 2) { setMedResultados([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await buscarMedicamentos(buscaMed);
        setMedResultados(res);
      } catch { setMedResultados([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaMed]);

  // ── IMC calculado ──
  useEffect(() => {
    const { peso, altura } = soap.antropometria;
    if (peso && altura) {
      const pesoNum = parseFloat(peso);
      const altNum = parseFloat(altura) / 100;
      if (altNum > 0) {
        setSoap(prev => ({ ...prev, antropometria: { ...prev.antropometria, imc: (pesoNum / (altNum * altNum)).toFixed(1) } }));
      }
    }
  }, [soap.antropometria.peso, soap.antropometria.altura]);

  // ── Salvar consulta (S.O.A.P) ──
  const handleSalvarConsulta = async () => {
    if (!filaId) return;
    try {
      const data = {
        filaAtendimentoId: filaId,
        medicoId: 'current-user', // será resolvido pelo backend via sessão
        motivoConsulta: soap.motivoConsulta,
        historiaAtual: soap.historiaAtual,
        historiaPregressa: soap.historiaPregressa,
        historiaFamiliar: soap.historiaFamiliar,
        historiaSocial: soap.historiaSocial,
        sinaisVitais: soap.sinaisVitais,
        exameFisicoGeral: soap.exameFisicoGeral,
        exameFisicoSistemas: soap.exameFisicoSistemas,
        antropometria: soap.antropometria,
        hipoteseDiagnostica: soap.hipoteseDiagnostica,
        diagnosticoPrincipal: soap.diagnosticoPrincipal,
        diagnosticosSecund: soap.diagnosticosSecund ? soap.diagnosticosSecund.split('\n').filter(Boolean).map((d: string) => ({ descricao: d.trim() })) : [],
        condutaTerapeutica: soap.condutaTerapeutica,
        orientacoes: soap.orientacoes,
        retornoNecessario: soap.retornoNecessario,
        prazoRetornoDias: soap.prazoRetornoDias ? parseInt(soap.prazoRetornoDias) : null,
      };
      const consulta = await criarConsultaMedica(data);
      setConsultaId(consulta.id);
      setPlanoSalvo(true);
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao salvar consulta');
    }
  };

  // ── Finalizar ──
  const handleFinalizar = async () => {
    if (!filaId) return;
    try {
      if (!consultaId) await handleSalvarConsulta();
      await finalizarConsulta(filaId);
      router.push('/admin/apps/saude/atendimento');
    } catch (err) {
      console.error('Erro ao finalizar:', err);
      alert('Erro ao finalizar consulta');
    }
  };

  // ── Adicionar prescrição ──
  const handleAdicionarPrescricao = async () => {
    if (!consultaId || !formPrescricao.nome) return;
    try {
      const validade = new Date();
      validade.setFullYear(validade.getFullYear() + 1);
      const res = await criarPrescricao(consultaId, {
        medicamentos: [formPrescricao],
        validade: validade.toISOString(),
      });
      setPrescricoes(prev => [...prev, { id: res.id, tipo: 'prescricao', dados: res, criadoEm: res.dataHora }]);
      setFormPrescricao({ nome: '', principioAtivo: '', apresentacao: '', posologia: '', quantidade: '', duracao: '' });
      setBuscaMed('');
    } catch (err) {
      console.error('Erro ao criar prescrição:', err);
      alert('Erro ao criar prescrição');
    }
  };

  // ── Adicionar exame ──
  const handleAdicionarExame = async () => {
    if (!consultaId || !formExame.tipoExame) return;
    try {
      const res = await criarExame(consultaId, formExame);
      setExames(prev => [...prev, { id: res.id, tipo: 'exame', dados: res, criadoEm: res.dataHora }]);
      setFormExame({ tipoExame: '', justificativa: '', prioridade: 'ROTINA' });
    } catch (err) {
      console.error('Erro ao criar exame:', err);
      alert('Erro ao criar exame');
    }
  };

  // ── Adicionar encaminhamento ──
  const handleAdicionarEnc = async () => {
    if (!consultaId || !formEnc.especialidade) return;
    try {
      const res = await criarEncaminhamento(consultaId, formEnc);
      setEncaminhamentos(prev => [...prev, { id: res.id, tipo: 'encaminhamento', dados: res, criadoEm: res.dataHora }]);
      setFormEnc({ especialidade: '', motivo: '', prioridade: 'ROTINA' });
    } catch (err) {
      console.error('Erro ao criar encaminhamento:', err);
      alert('Erro ao criar encaminhamento');
    }
  };

  // ── Adicionar atestado ──
  const handleAdicionarAtestado = async () => {
    if (!consultaId) return;
    try {
      const res = await criarAtestado(consultaId, formAtestado);
      setAtestados(prev => [...prev, { id: res.id, tipo: 'atestado', dados: res, criadoEm: res.dataHora }]);
      setFormAtestado({ tipo: 'MEDICO', cid10: '', diasAfastamento: '1', dataInicio: new Date().toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0], observacoes: '' });
    } catch (err) {
      console.error('Erro ao criar atestado:', err);
      alert('Erro ao criar atestado');
    }
  };

  // ── Adicionar problema ao cidadão ──
  const handleAdicionarProblema = async (p: { codigo: string; descricao: string; gravidade: string }) => {
    if (!cidadao) return;
    try {
      const res = await criarProblema(cidadao.id, { tipo: 'CID10', ...p });
      setProblemas(prev => [{ id: res.id, codigo: res.codigo, descricao: res.descricao, status: 'ATIVO', gravidade: res.gravidade, dataInicio: res.dataInicio }, ...prev]);
    } catch (err) {
      console.error('Erro ao criar problema:', err);
    }
  };

  // ── Loading ──
  if (loading || !cidadao) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando dados do atendimento...</div>
      </div>
    );
  }

  if (!filaId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600">ID da entrada na fila não informado.</p>
        <Button onClick={() => router.push('/admin/apps/saude/atendimento')}>Voltar à Lista</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── PAINEL ESQUERDO: Dados do Paciente ── */}
      <div className="w-80 flex-shrink-0 bg-white border-r overflow-y-auto p-3 flex flex-col gap-3">
        {/* Header mini */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => router.push('/admin/apps/saude/atendimento')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Lista
          </Button>
        </div>
        <PainelPaciente
          cidadao={cidadao}
          classificacao={classificacao}
          problemas={problemas}
          consultasAnteriores={consultasAnteriores}
          motivoBusca={motivoBusca}
          horaChegada={horaChegada}
          onAdicionarProblema={handleAdicionarProblema}
        />
      </div>

      {/* ── ÁREA CENTRAL: Atendimento SOAP ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header da consulta */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Consulta Médica</h1>
              <p className="text-xs text-gray-500">Registro pelo método SOAP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {consultaId && (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" /> Salvo
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSalvarConsulta}
              disabled={!!consultaId}
            >
              Salvar Rascunho
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleFinalizar}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Finalizar Consulta
            </Button>
          </div>
        </div>

        {/* Tabs SOAP */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="subjetivo">
            <TabsList className="grid w-full grid-cols-4 mb-4 sticky top-0 bg-white z-10 shadow-sm">
              <TabsTrigger value="subjetivo" className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" /> S — Subjetivo
              </TabsTrigger>
              <TabsTrigger value="objetivo" className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" /> O — Objetivo
              </TabsTrigger>
              <TabsTrigger value="avaliacao" className="flex items-center gap-1.5">
                <FileCheck className="h-4 w-4" /> A — Avaliação
              </TabsTrigger>
              <TabsTrigger value="plano" className="flex items-center gap-1.5">
                <Pill className="h-4 w-4" /> P — Plano
              </TabsTrigger>
            </TabsList>

            {/* ─── S — SUBJETIVO ─── */}
            <TabsContent value="subjetivo" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Queixa Principal</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.motivoConsulta}
                    onChange={(e) => setSoap(prev => ({ ...prev, motivoConsulta: e.target.value }))}
                    placeholder="Descreva a queixa principal do paciente..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Pode usar código CIAP2 + descrição (ex: K86 - Dor abdominal)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">História da Doença Atual</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.historiaAtual}
                    onChange={(e) => setSoap(prev => ({ ...prev, historiaAtual: e.target.value }))}
                    placeholder="Descreva a evolução da doença atual, início dos sintomas, agravantes, atenuantes..."
                    rows={5}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Antecedentes Pessoais</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea value={soap.historiaPregressa} onChange={(e) => setSoap(prev => ({ ...prev, historiaPregressa: e.target.value }))} placeholder="Cirurgias, internações, doenças prévias..." rows={3} className="resize-none" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Antecedentes Familiares</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea value={soap.historiaFamiliar} onChange={(e) => setSoap(prev => ({ ...prev, historiaFamiliar: e.target.value }))} placeholder="Histórico familiar relevante..." rows={3} className="resize-none" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">História Social</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea value={soap.historiaSocial} onChange={(e) => setSoap(prev => ({ ...prev, historiaSocial: e.target.value }))} placeholder="Ocupação, hábitos, condições sociais..." rows={3} className="resize-none" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── O — OBJETIVO ─── */}
            <TabsContent value="objetivo" className="space-y-4">
              {/* Sinais Vitais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" /> Sinais Vitais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { key: 'pressaoArterial', label: 'Pressão Arterial', unidade: 'mmHg', placeholder: '120/80' },
                      { key: 'frequenciaCardiaca', label: 'Frequência Cardíaca', unidade: 'bpm', placeholder: '72' },
                      { key: 'frequenciaRespiratoria', label: 'Frequência Respiratória', unidade: 'irpm', placeholder: '16' },
                      { key: 'temperatura', label: 'Temperatura', unidade: '°C', placeholder: '36.6' },
                      { key: 'saturacaoO2', label: 'Saturação O₂', unidade: '%', placeholder: '98' },
                    ].map(({ key, label, unidade, placeholder }) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{label}</Label>
                        <div className="relative mt-0.5">
                          <Input
                            value={(soap.sinaisVitais as any)[key] || ''}
                            onChange={(e) => setSoap(prev => ({ ...prev, sinaisVitais: { ...prev.sinaisVitais, [key]: e.target.value } }))}
                            placeholder={placeholder}
                            className="pr-10"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Antropometria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> Antropometria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'peso', label: 'Peso', unidade: 'kg', placeholder: '70' },
                      { key: 'altura', label: 'Altura', unidade: 'cm', placeholder: '175' },
                      { key: 'imc', label: 'IMC (calculado)', unidade: 'kg/m²', placeholder: '—' },
                    ].map(({ key, label, unidade, placeholder }) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{label}</Label>
                        <div className="relative mt-0.5">
                          <Input
                            value={(soap.antropometria as any)[key] || ''}
                            onChange={(e) => setSoap(prev => ({ ...prev, antropometria: { ...prev.antropometria, [key]: e.target.value } }))}
                            placeholder={placeholder}
                            disabled={key === 'imc'}
                            className={`pr-14 ${key === 'imc' ? 'bg-gray-50' : ''}`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exame Físico Geral */}
              <Card>
                <CardHeader><CardTitle className="text-base">Exame Físico Geral</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.exameFisicoGeral}
                    onChange={(e) => setSoap(prev => ({ ...prev, exameFisicoGeral: e.target.value }))}
                    placeholder="Estado geral, inspeção geral, aspecto geral do paciente..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* Exame Físico por Sistemas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-purple-500" /> Exame por Sistemas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'cardiovascular', label: 'Cardiovascular' },
                      { key: 'respiratorio', label: 'Respiratório' },
                      { key: 'abdomen', label: 'Abdômen' },
                      { key: 'neurologico', label: 'Neurológico' },
                      { key: 'musculoesqueletico', label: 'Musculoesquelético' },
                      { key: 'dermatologico', label: 'Dermatológico' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</Label>
                        <Textarea
                          value={(soap.exameFisicoSistemas as any)[key] || ''}
                          onChange={(e) => setSoap(prev => ({ ...prev, exameFisicoSistemas: { ...prev.exameFisicoSistemas, [key]: e.target.value } }))}
                          placeholder={`Achados do exame ${label.toLowerCase()}...`}
                          rows={2}
                          className="mt-0.5 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── A — AVALIAÇÃO ─── */}
            <TabsContent value="avaliacao" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Hipótese Diagnóstica</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.hipoteseDiagnostica}
                    onChange={(e) => setSoap(prev => ({ ...prev, hipoteseDiagnostica: e.target.value }))}
                    placeholder="Descreva o raciocínio clínico e as hipóteses consideradas..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Diagnóstico Principal</CardTitle></CardHeader>
                <CardContent>
                  <Input
                    value={soap.diagnosticoPrincipal}
                    onChange={(e) => setSoap(prev => ({ ...prev, diagnosticoPrincipal: e.target.value }))}
                    placeholder="Código CID-10 + descrição (ex: I10 - Hipertensão essencial)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Digite o código CID-10 seguido da descrição</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Diagnósticos Secundários</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.diagnosticosSecund}
                    onChange={(e) => setSoap(prev => ({ ...prev, diagnosticosSecund: e.target.value }))}
                    placeholder={"Um diagnóstico por linha\nEx: E11 - Diabetes tipo 2\nEx: Z87.1 - Antecedente pessoal de diabetes"}
                    rows={4}
                    className="resize-none font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── P — PLANO ─── */}
            <TabsContent value="plano" className="space-y-4">
              {/* Conduta e orientações */}
              <Card>
                <CardHeader><CardTitle className="text-base">Conduta Terapêutica</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={soap.condutaTerapeutica}
                    onChange={(e) => setSoap(prev => ({ ...prev, condutaTerapeutica: e.target.value }))}
                    placeholder="Tratamento proposto, procedimentos, orientações ao paciente..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Orientações ao Paciente</Label>
                      <Textarea
                        value={soap.orientacoes}
                        onChange={(e) => setSoap(prev => ({ ...prev, orientacoes: e.target.value }))}
                        placeholder="Orientações de alta, alimentação, exercícios..."
                        rows={3}
                        className="resize-none mt-1"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="retorno"
                          checked={soap.retornoNecessario}
                          onChange={(e) => setSoap(prev => ({ ...prev, retornoNecessario: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="retorno" className="text-sm">Retorno necessário</Label>
                      </div>
                      {soap.retornoNecessario && (
                        <div>
                          <Label className="text-xs text-gray-500">Prazo de retorno (dias)</Label>
                          <Input
                            type="number"
                            value={soap.prazoRetornoDias}
                            onChange={(e) => setSoap(prev => ({ ...prev, prazoRetornoDias: e.target.value }))}
                            placeholder="30"
                            className="mt-0.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Salvar antes de adicionar itens inline */}
              {!consultaId && (
                <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-blue-700 mb-2">Salve a consulta primeiro para poder adicionar prescrições, exames, encaminhamentos e atestados.</p>
                    <Button onClick={handleSalvarConsulta} className="bg-blue-600 hover:bg-blue-700">
                      Salvar Consulta
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* ── Seções inline do Plano (só após consulta salva) ── */}
              {consultaId && (
                <div className="space-y-3">

                  {/* PRESCRIÇÕES */}
                  <SecaoPlano
                    titulo={`Prescrições${prescricoes.length ? ` (${prescricoes.length})` : ''}`}
                    icone={Pill}
                    cor="text-green-700"
                    expanded={secoesPlano.prescricao}
                    onToggle={() => setSecoesPlano(prev => ({ ...prev, prescricao: !prev.prescricao }))}
                  >
                    {/* Busca de medicamento */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Buscar medicamento por nome ou princípio ativo..."
                          value={buscaMed}
                          onChange={(e) => setBuscaMed(e.target.value)}
                        />
                      </div>
                      {/* Resultados da busca */}
                      {medResultados.length > 0 && (
                        <div className="border rounded-md max-h-40 overflow-y-auto">
                          {medResultados.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0 text-sm"
                              onClick={() => {
                                setFormPrescricao({ nome: m.nome, principioAtivo: m.principioAtivo, apresentacao: m.apresentacao, posologia: '', quantidade: '', duracao: '' });
                                setBuscaMed('');
                                setMedResultados([]);
                              }}
                            >
                              <div className="font-medium text-gray-800">{m.nome}</div>
                              <div className="text-xs text-gray-500">{m.principioAtivo} — {m.apresentacao}{m.concentracao ? ` — ${m.concentracao}` : ''}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Formulário do medicamento selecionado */}
                      {formPrescricao.nome && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-800 text-sm">{formPrescricao.nome}</div>
                              <div className="text-xs text-gray-500">{formPrescricao.principioAtivo} — {formPrescricao.apresentacao}</div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400 hover:text-red-500" onClick={() => setFormPrescricao({ nome: '', principioAtivo: '', apresentacao: '', posologia: '', quantidade: '', duracao: '' })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Posologia</Label>
                              <Input value={formPrescricao.posologia} onChange={(e) => setFormPrescricao(prev => ({ ...prev, posologia: e.target.value }))} placeholder="Ex: 1 cp 2x/dia" className="text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Quantidade</Label>
                              <Input value={formPrescricao.quantidade} onChange={(e) => setFormPrescricao(prev => ({ ...prev, quantidade: e.target.value }))} placeholder="Ex: 30 cp" className="text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Duração</Label>
                              <Input value={formPrescricao.duracao} onChange={(e) => setFormPrescricao(prev => ({ ...prev, duracao: e.target.value }))} placeholder="Ex: 30 dias" className="text-sm" />
                            </div>
                          </div>
                          <Button size="sm" className="w-full" onClick={handleAdicionarPrescricao} disabled={!formPrescricao.posologia}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar à Prescrição
                          </Button>
                        </div>
                      )}
                      {/* Lista de prescrições adicionadas */}
                      {prescricoes.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          {prescricoes.map((p) => {
                            const meds = p.dados.medicamentos || [];
                            return (
                              <div key={p.id} className="text-xs bg-gray-50 border rounded px-3 py-2">
                                {meds.map((m: any, i: number) => (
                                  <div key={i}><span className="font-semibold">{m.nome}</span> — {m.posologia}, {m.quantidade}, {m.duracao}</div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </SecaoPlano>

                  {/* EXAMES */}
                  <SecaoPlano
                    titulo={`Exames Solicitados${exames.length ? ` (${exames.length})` : ''}`}
                    icone={FileText}
                    cor="text-blue-700"
                    expanded={secoesPlano.exame}
                    onToggle={() => setSecoesPlano(prev => ({ ...prev, exame: !prev.exame }))}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Tipo de Exame</Label>
                          <Input value={formExame.tipoExame} onChange={(e) => setFormExame(prev => ({ ...prev, tipoExame: e.target.value }))} placeholder="Ex: Hemograma completo, ECG..." />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Prioridade</Label>
                          <select value={formExame.prioridade} onChange={(e) => setFormExame(prev => ({ ...prev, prioridade: e.target.value }))} className="w-full border rounded px-2 h-10 text-sm bg-white mt-0.5">
                            <option value="ROTINA">Rotina</option>
                            <option value="URGENTE">Urgente</option>
                            <option value="EMERGENCIA">Emergência</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Justificativa</Label>
                        <Input value={formExame.justificativa} onChange={(e) => setFormExame(prev => ({ ...prev, justificativa: e.target.value }))} placeholder="Motivo da solicitação..." />
                      </div>
                      <Button size="sm" onClick={handleAdicionarExame} disabled={!formExame.tipoExame}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Exame
                      </Button>
                      {exames.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          {exames.map((e) => (
                            <div key={e.id} className="text-xs bg-gray-50 border rounded px-3 py-2 flex justify-between">
                              <span><span className="font-semibold">{e.dados.tipoExame}</span>{e.dados.justificativa ? ` — ${e.dados.justificativa}` : ''}</span>
                              <Badge variant="outline" className="text-xs">{e.dados.prioridade}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SecaoPlano>

                  {/* ENCAMINHAMENTOS */}
                  <SecaoPlano
                    titulo={`Encaminhamentos${encaminhamentos.length ? ` (${encaminhamentos.length})` : ''}`}
                    icone={ExternalLink}
                    cor="text-orange-700"
                    expanded={secoesPlano.encaminhamento}
                    onToggle={() => setSecoesPlano(prev => ({ ...prev, encaminhamento: !prev.encaminhamento }))}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Especialidade</Label>
                          <Input value={formEnc.especialidade} onChange={(e) => setFormEnc(prev => ({ ...prev, especialidade: e.target.value }))} placeholder="Ex: Cardiologia, Gastroenterologia..." />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Prioridade</Label>
                          <select value={formEnc.prioridade} onChange={(e) => setFormEnc(prev => ({ ...prev, prioridade: e.target.value }))} className="w-full border rounded px-2 h-10 text-sm bg-white mt-0.5">
                            <option value="ROTINA">Rotina</option>
                            <option value="PRIORIDADE">Prioridade</option>
                            <option value="URGENCIA">Urgência</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Motivo do Encaminhamento</Label>
                        <Input value={formEnc.motivo} onChange={(e) => setFormEnc(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Descreva o motivo..." />
                      </div>
                      <Button size="sm" onClick={handleAdicionarEnc} disabled={!formEnc.especialidade}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Encaminhamento
                      </Button>
                      {encaminhamentos.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          {encaminhamentos.map((e) => (
                            <div key={e.id} className="text-xs bg-gray-50 border rounded px-3 py-2 flex justify-between">
                              <span><span className="font-semibold">{e.dados.especialidade}</span> — {e.dados.motivo}</span>
                              <Badge variant="outline" className="text-xs">{e.dados.prioridade}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SecaoPlano>

                  {/* ATESTADOS */}
                  <SecaoPlano
                    titulo={`Atestados${atestados.length ? ` (${atestados.length})` : ''}`}
                    icone={FileCheck}
                    cor="text-purple-700"
                    expanded={secoesPlano.atestado}
                    onToggle={() => setSecoesPlano(prev => ({ ...prev, atestado: !prev.atestado }))}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">Tipo</Label>
                          <select value={formAtestado.tipo} onChange={(e) => setFormAtestado(prev => ({ ...prev, tipo: e.target.value }))} className="w-full border rounded px-2 h-10 text-sm bg-white mt-0.5">
                            <option value="MEDICO">Atestado Médico</option>
                            <option value="COMPARECIMENTO">Comparecimento</option>
                            <option value="ACOMPANHANTE">Acompanhante</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">CID-10</Label>
                          <Input value={formAtestado.cid10} onChange={(e) => setFormAtestado(prev => ({ ...prev, cid10: e.target.value }))} placeholder="Ex: I10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">Dias de Afastamento</Label>
                          <Input type="number" value={formAtestado.diasAfastamento} onChange={(e) => setFormAtestado(prev => ({ ...prev, diasAfastamento: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Data Início</Label>
                          <Input type="date" value={formAtestado.dataInicio} onChange={(e) => setFormAtestado(prev => ({ ...prev, dataInicio: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Data Fim</Label>
                          <Input type="date" value={formAtestado.dataFim} onChange={(e) => setFormAtestado(prev => ({ ...prev, dataFim: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Observações</Label>
                        <Input value={formAtestado.observacoes} onChange={(e) => setFormAtestado(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Observações adicionais..." />
                      </div>
                      <Button size="sm" onClick={handleAdicionarAtestado}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Atestado
                      </Button>
                      {atestados.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          {atestados.map((a) => (
                            <div key={a.id} className="text-xs bg-gray-50 border rounded px-3 py-2">
                              <span className="font-semibold">{a.dados.tipo === 'MEDICO' ? 'Atestado Médico' : a.dados.tipo === 'COMPARECIMENTO' ? 'Comparecimento' : 'Acompanhante'}</span>
                              {a.dados.cid10 && <span className="ml-2">— CID: {a.dados.cid10}</span>}
                              <span className="ml-2 text-gray-500">{a.dados.diasAfastamento} dias</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SecaoPlano>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
