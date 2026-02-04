'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Heart,
  Thermometer,
  Wind,
  User,
  Clock,
  Stethoscope,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { buscarContextoFila } from '@/lib/api/atendimento-api';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────
interface ContextoFila {
  fila: {
    id: string;
    citizenId: string;
    status: string;
    classificacaoRisco: string | null;
    motivoBusca: string;
    dataHoraChegada: string;
    tipoAtendimento: string;
    citizen: { id: string; name: string; cpf?: string; cns?: string; dataNascimento?: string; telefone?: string };
    profissional?: { id: string; name: string };
    unidade?: { id: string; nome: string };
    escutaInicial?: Record<string, any> | null;
    triagem?: Record<string, any> | null;
  };
  problemas: Array<{ id: string; codigo: string; descricao: string; gravidade?: string; status: string; dataInicio: string }>;
  consultasAnteriores: Array<Record<string, any>>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Classificação Manchester — cores e metadados
// ──────────────────────────────────────────────────────────────────────────────
const MANCHESTER_CLASSES = {
  VERMELHO: { cor: 'bg-red-600 text-white', corBorder: 'border-red-600', corBg: 'bg-red-50 border-red-300', label: 'VERMELHO — Emergência', tempo: '0 min', icon: '🔴' },
  LARANJA: { cor: 'bg-orange-500 text-white', corBorder: 'border-orange-500', corBg: 'bg-orange-50 border-orange-300', label: 'LARANJA — Muito Urgente', tempo: '10 min', icon: '🟠' },
  AMARELO: { cor: 'bg-yellow-500 text-white', corBorder: 'border-yellow-500', corBg: 'bg-yellow-50 border-yellow-300', label: 'AMARELO — Urgente', tempo: '60 min', icon: '🟡' },
  VERDE: { cor: 'bg-green-500 text-white', corBorder: 'border-green-500', corBg: 'bg-green-50 border-green-300', label: 'VERDE — Pouco Urgente', tempo: '120 min', icon: '🟢' },
  AZUL: { cor: 'bg-blue-500 text-white', corBorder: 'border-blue-500', corBg: 'bg-blue-50 border-blue-300', label: 'AZUL — Não Urgente', tempo: '240 min', icon: '🔵' },
} as const;

type ClassificacaoKey = keyof typeof MANCHESTER_CLASSES;

// ──────────────────────────────────────────────────────────────────────────────
// Conduta / Desfecho possíveis
// ──────────────────────────────────────────────────────────────────────────────
const CONDUTAS = [
  { value: 'ENCAMINHAR_MEDICO', label: 'Encaminhar para consulta médica' },
  { value: 'ENCAMINHAR_PROCEDIMENTO', label: 'Encaminhar para procedimento' },
  { value: 'RESOLVER_ACOLHIMENTO', label: 'Resolver no próprio acolhimento' },
  { value: 'ORIENTACAO', label: 'Apenas orientação' },
  { value: 'ENCAMINHAR_EXTERNO', label: 'Encaminhar para outra unidade' },
  { value: 'AGENDAR_CONSULTA', label: 'Agendar consulta futura' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Componente: Painel lateral do paciente
// ──────────────────────────────────────────────────────────────────────────────
function PainelPaciente({ contexto }: { contexto: ContextoFila }) {
  const { fila, problemas, consultasAnteriores } = contexto;
  const paciente = fila.citizen;

  const idade = paciente.dataNascimento
    ? Math.floor((Date.now() - new Date(paciente.dataNascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const classificacao = fila.classificacaoRisco as ClassificacaoKey | null;
  const manchesterInfo = classificacao ? MANCHESTER_CLASSES[classificacao] : null;

  return (
    <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Dados do paciente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-blue-600" />
            Dados do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="font-semibold text-gray-900 text-lg">{paciente.name}</div>
          {paciente.cpf && <div className="text-gray-600">CPF: {paciente.cpf}</div>}
          {paciente.cns && <div className="text-gray-600">CNS: {paciente.cns}</div>}
          {idade !== null && <div className="text-gray-600">Idade: {idade} anos</div>}
          {paciente.telefone && <div className="text-gray-600">Tel: {paciente.telefone}</div>}
        </CardContent>
      </Card>

      {/* Dados da entrada na fila */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-green-600" />
            Entrada na Fila
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Motivo: </span>
            <span className="text-gray-800">{fila.motivoBusca || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Chegada: </span>
            <span className="text-gray-800">
              {new Date(fila.dataHoraChegada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tipo: </span>
            <span className="text-gray-800">{fila.tipoAtendimento?.replace(/_/g, ' ')}</span>
          </div>
          {manchesterInfo && (
            <div className="mt-2">
              <Badge className={manchesterInfo.cor}>{manchesterInfo.icon} {manchesterInfo.label}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escuta inicial (se existir) */}
      {fila.escutaInicial && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-700">Escuta Inicial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-1">
            {fila.escutaInicial.motivoBusca && <div><span className="text-gray-500">Motivo: </span>{fila.escutaInicial.motivoBusca}</div>}
            {fila.escutaInicial.historiaBreve && <div><span className="text-gray-500">História: </span>{fila.escutaInicial.historiaBreve}</div>}
            {fila.escutaInicial.riscoEsperado && <div><span className="text-gray-500">Risco esperado: </span>{fila.escutaInicial.riscoEsperado}</div>}
          </CardContent>
        </Card>
      )}

      {/* Problemas ativos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Problemas Ativos ({problemas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {problemas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nenhum problema registrado</p>
          ) : (
            <div className="space-y-2">
              {problemas.map((p) => (
                <div key={p.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{p.codigo}</span>
                  <span className="text-gray-700 flex-1">{p.descricao}</span>
                  {p.gravidade && (
                    <Badge variant="outline" className="text-xs">{p.gravidade}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de consultas anteriores */}
      {consultasAnteriores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              Consultas Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {consultasAnteriores.map((c: any, i: number) => (
                <div key={c.id || i} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="text-gray-500">
                    {c.dataHora ? new Date(c.dataHora).toLocaleDateString('pt-BR') : c.atendimento?.dataAtendimento ? new Date(c.atendimento.dataAtendimento).toLocaleDateString('pt-BR') : '—'}
                  </div>
                  {c.motivoConsulta && <div className="text-gray-700">{c.motivoConsulta}</div>}
                  {c.diagnosticoPrincipal && <div className="text-blue-700 font-medium">Dx: {c.diagnosticoPrincipal}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal: Tela de Enfermagem
// ──────────────────────────────────────────────────────────────────────────────
export default function EnfermagemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filaId = searchParams.get('filaId') || '';

  // Estado
  const [contexto, setContexto] = useState<ContextoFila | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'avaliacaoenf' | 'classificacao' | 'conduta'>('avaliacaoenf');

  // Seções colapsíveis
  const [secoesFechadas, setSecoesFechadas] = useState<Record<string, boolean>>({});

  // ── Sinais vitais ──
  const [sinaisVitais, setSinaisVitais] = useState({
    pressaoArterial: '',
    frequenciaCardiaca: '',
    frequenciaRespiratoria: '',
    temperatura: '',
    saturacaoO2: '',
    dor: '',
  });

  // ── Antropometria ──
  const [antropometria, setAntropisometria] = useState({
    peso: '',
    altura: '',
    imc: '',
    perimetroCefalico: '',
    circunferenciaAbdominal: '',
  });

  // ── Glicemia ──
  const [glicemia, setGlicemia] = useState({
    valor: '',
    momento: '',
  });

  // ── Avaliação de enfermagem ──
  const [avaliacaoEnf, setAvaliacaoEnf] = useState({
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    alergiasConhecidas: '',
    medicamentosUso: '',
    comorbidades: '',
    observacoes: '',
  });

  // ── Classificação de risco ──
  const [classificacaoRisco, setClassificacaoRisco] = useState<ClassificacaoKey | ''>('');
  const [discriminador, setDiscriminador] = useState('');

  // ── Conduta ──
  const [conduta, setConduta] = useState('');
  const [orientacoesConducta, setOrientacoesConducta] = useState('');

  // ── Carregar contexto ──
  const carregarContexto = useCallback(async () => {
    if (!filaId) {
      setErro('ID da fila não fornecido. Retorne à lista de atendimentos.');
      setLoading(false);
      return;
    }
    try {
      const dados = await buscarContextoFila(filaId);
      setContexto(dados);

      // Pré-preencher com dados da triagem existente (se houver)
      if (dados.fila?.triagem) {
        const t = dados.fila.triagem;
        if (t.pressaoArterial) setSinaisVitais(prev => ({ ...prev, pressaoArterial: t.pressaoArterial }));
        if (t.frequenciaCardiaca) setSinaisVitais(prev => ({ ...prev, frequenciaCardiaca: String(t.frequenciaCardiaca) }));
        if (t.frequenciaRespiratoria) setSinaisVitais(prev => ({ ...prev, frequenciaRespiratoria: String(t.frequenciaRespiratoria) }));
        if (t.temperatura) setSinaisVitais(prev => ({ ...prev, temperatura: String(t.temperatura) }));
        if (t.saturacaoO2) setSinaisVitais(prev => ({ ...prev, saturacaoO2: String(t.saturacaoO2) }));
        if (t.dor) setSinaisVitais(prev => ({ ...prev, dor: String(t.dor) }));
        if (t.peso) setAntropisometria(prev => ({ ...prev, peso: String(t.peso) }));
        if (t.altura) setAntropisometria(prev => ({ ...prev, altura: String(t.altura) }));
        if (t.imc) setAntropisometria(prev => ({ ...prev, imc: String(t.imc) }));
        if (t.perimetroCefalico) setAntropisometria(prev => ({ ...prev, perimetroCefalico: String(t.perimetroCefalico) }));
        if (t.circunferenciaAbdominal) setAntropisometria(prev => ({ ...prev, circunferenciaAbdominal: String(t.circunferenciaAbdominal) }));
        if (t.glicemiaCapilar) setGlicemia(prev => ({ ...prev, valor: String(t.glicemiaCapilar) }));
        if (t.momentoGlicemia) setGlicemia(prev => ({ ...prev, momento: t.momentoGlicemia }));
        if (t.queixaPrincipal) setAvaliacaoEnf(prev => ({ ...prev, queixaPrincipal: t.queixaPrincipal }));
        if (t.historiaDoencaAtual) setAvaliacaoEnf(prev => ({ ...prev, historiaDoencaAtual: t.historiaDoencaAtual }));
        if (t.alergiasConhecidas) setAvaliacaoEnf(prev => ({ ...prev, alergiasConhecidas: t.alergiasConhecidas }));
        if (t.medicamentosUso) setAvaliacaoEnf(prev => ({ ...prev, medicamentosUso: t.medicamentosUso }));
        if (t.comorbidades) setAvaliacaoEnf(prev => ({ ...prev, comorbidades: t.comorbidades }));
        if (t.classificacaoRisco) setClassificacaoRisco(t.classificacaoRisco as ClassificacaoKey);
        if (t.discriminadorUtilizado) setDiscriminador(t.discriminadorUtilizado);
      }

      // Pré-preencher com dados da escuta inicial (se não tiver triagem)
      if (!dados.fila?.triagem && dados.fila?.escutaInicial) {
        const e = dados.fila.escutaInicial;
        if (e.motivoBusca) setAvaliacaoEnf(prev => ({ ...prev, queixaPrincipal: e.motivoBusca }));
        if (e.historiaBreve) setAvaliacaoEnf(prev => ({ ...prev, historiaDoencaAtual: e.historiaBreve }));
        if (e.pressaoArterial) setSinaisVitais(prev => ({ ...prev, pressaoArterial: e.pressaoArterial }));
        if (e.temperatura) setSinaisVitais(prev => ({ ...prev, temperatura: String(e.temperatura) }));
        if (e.frequenciaCardiaca) setSinaisVitais(prev => ({ ...prev, frequenciaCardiaca: String(e.frequenciaCardiaca) }));
      }
    } catch (err) {
      setErro('Erro ao carregar dados da fila');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filaId]);

  useEffect(() => {
    carregarContexto();
  }, [carregarContexto]);

  // ── Calcular IMC automaticamente ──
  useEffect(() => {
    const peso = parseFloat(antropometria.peso);
    const altura = parseFloat(antropometria.altura);
    if (peso > 0 && altura > 0) {
      const alturaM = altura > 3 ? altura / 100 : altura; // aceita cm ou m
      const imc = peso / (alturaM * alturaM);
      setAntropisometria(prev => ({ ...prev, imc: imc.toFixed(1) }));
    }
  }, [antropometria.peso, antropometria.altura]);

  // ── Toggle seção ──
  const toggleSecao = (secao: string) => {
    setSecoesFechadas(prev => ({ ...prev, [secao]: !prev[secao] }));
  };

  // ── Salvar triagem ──
  const handleSalvar = async () => {
    if (!filaId) return;
    if (!avaliacaoEnf.queixaPrincipal) {
      setErro('Queixa principal é obrigatória');
      return;
    }
    if (!classificacaoRisco) {
      setErro('Classificação de risco é obrigatória');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const payload: Record<string, any> = {
        filaAtendimentoId: filaId,
        enfermeiroId: 'profissional-default', // TODO: obter do contexto autenticado
        unidadeId: contexto?.fila?.unidade?.id || '',
        queixaPrincipal: avaliacaoEnf.queixaPrincipal,
        classificacaoRisco,
        observacoes: avaliacaoEnf.observacoes || undefined,
      };

      // Sinais vitais
      if (sinaisVitais.pressaoArterial) payload.pressaoArterial = sinaisVitais.pressaoArterial;
      if (sinaisVitais.frequenciaCardiaca) payload.frequenciaCardiaca = parseInt(sinaisVitais.frequenciaCardiaca);
      if (sinaisVitais.frequenciaRespiratoria) payload.frequenciaRespiratoria = parseInt(sinaisVitais.frequenciaRespiratoria);
      if (sinaisVitais.temperatura) payload.temperatura = parseFloat(sinaisVitais.temperatura);
      if (sinaisVitais.saturacaoO2) payload.saturacaoO2 = parseFloat(sinaisVitais.saturacaoO2);
      if (sinaisVitais.dor) payload.dor = parseInt(sinaisVitais.dor);

      // Antropometria
      if (antropometria.peso) payload.peso = parseFloat(antropometria.peso);
      if (antropometria.altura) payload.altura = parseFloat(antropometria.altura);
      if (antropometria.imc) payload.imc = parseFloat(antropometria.imc);
      if (antropometria.perimetroCefalico) payload.perimetroCefalico = parseFloat(antropometria.perimetroCefalico);
      if (antropometria.circunferenciaAbdominal) payload.circunferenciaAbdominal = parseFloat(antropometria.circunferenciaAbdominal);

      // Glicemia
      if (glicemia.valor) payload.glicemiaCapilar = parseFloat(glicemia.valor);
      if (glicemia.momento) payload.momentoGlicemia = glicemia.momento;

      // Outros campos da avaliação
      if (avaliacaoEnf.historiaDoencaAtual) payload.historiaDoencaAtual = avaliacaoEnf.historiaDoencaAtual;
      if (avaliacaoEnf.alergiasConhecidas) payload.alergiasConhecidas = avaliacaoEnf.alergiasConhecidas;
      if (avaliacaoEnf.medicamentosUso) payload.medicamentosUso = avaliacaoEnf.medicamentosUso;
      if (avaliacaoEnf.comorbidades) payload.comorbidades = avaliacaoEnf.comorbidades;

      // Discriminador de Manchester
      if (discriminador) payload.discriminadorUtilizado = discriminador;

      // Enviar para a API de triagem existente
      const res = await fetch('/api/saude/triagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const txt = await res.text();
        setErro(`Erro ao salvar: ${txt}`);
        return;
      }

      // Se houver conduta definida, atualizar status da fila
      if (conduta) {
        const statusMap: Record<string, string> = {
          ENCAMINHAR_MEDICO: 'AGUARDANDO_ATENDIMENTO',
          ENCAMINHAR_PROCEDIMENTO: 'EM_PROCEDIMENTO',
          RESOLVER_ACOLHIMENTO: 'RESOLVIDO_ACOLHIMENTO',
          ORIENTACAO: 'RESOLVIDO_ACOLHIMENTO',
          ENCAMINHAR_EXTERNO: 'ENCAMINHADO_EXTERNO',
          AGENDAR_CONSULTA: 'FINALIZADO',
        };

        const novoStatus = statusMap[conduta];
        if (novoStatus) {
          await fetch(`/api/saude/fila-atendimento/${filaId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus }),
            credentials: 'include',
          });
        }
      }

      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (err) {
      setErro('Erro ao salvar avaliação');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  // ── Finalizar e encaminhar ──
  const handleFinalizar = async () => {
    if (!conduta) {
      setErro('Selecione a conduta antes de finalizar');
      return;
    }
    // Salvar primeiro
    await handleSalvar();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Estados intermediários
  // ──────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando dados do paciente...</div>
      </div>
    );
  }

  if (erro && !contexto) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span>{erro}</span>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/apps/saude/atendimento')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar à Lista
        </Button>
      </div>
    );
  }

  if (!contexto) return null;

  const classificacaoInfo = classificacaoRisco ? MANCHESTER_CLASSES[classificacaoRisco] : null;

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Layout principal
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Painel lateral — paciente */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <PainelPaciente contexto={contexto} />
      </div>

      {/* Área central */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header fixo */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/apps/saude/atendimento')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Lista
            </Button>
            <div className="h-5 w-px bg-gray-300" />
            <h1 className="text-lg font-semibold text-gray-800">Avaliação de Enfermagem</h1>
            <Badge variant="outline" className="text-xs">PEC e-SUS</Badge>
          </div>
          <div className="flex items-center gap-2">
            {salvo && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" /> Salvo
              </span>
            )}
            {erro && (
              <span className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded">{erro}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleSalvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleFinalizar} disabled={salvando || !conduta}>
              Finalizar e Encaminhar
            </Button>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-1 shrink-0">
          {([
            { id: 'avaliacaoenf', label: 'Avaliação', icon: Stethoscope },
            { id: 'classificacao', label: 'Classificação de Risco', icon: AlertTriangle },
            { id: 'conduta', label: 'Conduta', icon: CheckCircle },
          ] as const).map((aba) => {
            const Icon = aba.icon;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === aba.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {aba.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ============================================================
              ABA: AVALIAÇÃO DE ENFERMAGEM
              ============================================================ */}
          {abaAtiva === 'avaliacaoenf' && (
            <>
              {/* Anamnese */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Anamnese
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Queixa Principal *</Label>
                    <Textarea
                      value={avaliacaoEnf.queixaPrincipal}
                      onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, queixaPrincipal: e.target.value }))}
                      placeholder="Descreva a queixa principal do paciente"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">História da Doença Atual</Label>
                    <Textarea
                      value={avaliacaoEnf.historiaDoencaAtual}
                      onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, historiaDoencaAtual: e.target.value }))}
                      placeholder="Evolução dos sintomas, tempo, intensidade..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Alergias Conhecidas</Label>
                      <Input
                        value={avaliacaoEnf.alergiasConhecidas}
                        onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, alergiasConhecidas: e.target.value }))}
                        placeholder="Ex: Penicilina, Dipirona"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Comorbidades</Label>
                      <Input
                        value={avaliacaoEnf.comorbidades}
                        onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, comorbidades: e.target.value }))}
                        placeholder="Ex: HAS, DM2, Asma"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Medicamentos em Uso</Label>
                    <Textarea
                      value={avaliacaoEnf.medicamentosUso}
                      onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, medicamentosUso: e.target.value }))}
                      placeholder="Liste medicamentos atuais com doses"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sinais Vitais */}
              <Card>
                <CardHeader className="pb-3">
                  <button onClick={() => toggleSecao('sinaisVitais')} className="w-full flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Sinais Vitais
                    </CardTitle>
                    {secoesFechadas.sinaisVitais ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                </CardHeader>
                {!secoesFechadas.sinaisVitais && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600 flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-400" /> PA (mmHg)
                        </Label>
                        <Input
                          value={sinaisVitais.pressaoArterial}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, pressaoArterial: e.target.value }))}
                          placeholder="120/80"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-400" /> FC (bpm)
                        </Label>
                        <Input
                          type="number"
                          value={sinaisVitais.frequenciaCardiaca}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, frequenciaCardiaca: e.target.value }))}
                          placeholder="72"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 flex items-center gap-1">
                          <Wind className="h-3 w-3 text-blue-400" /> FR (irpm)
                        </Label>
                        <Input
                          type="number"
                          value={sinaisVitais.frequenciaRespiratoria}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, frequenciaRespiratoria: e.target.value }))}
                          placeholder="18"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-orange-400" /> Temp (°C)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={sinaisVitais.temperatura}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, temperatura: e.target.value }))}
                          placeholder="36.5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">SatO2 (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={sinaisVitais.saturacaoO2}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, saturacaoO2: e.target.value }))}
                          placeholder="98"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Dor (0–10)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={sinaisVitais.dor}
                          onChange={(e) => setSinaisVitais(prev => ({ ...prev, dor: e.target.value }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Antropometria */}
              <Card>
                <CardHeader className="pb-3">
                  <button onClick={() => toggleSecao('antropometria')} className="w-full flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      Antropometria
                    </CardTitle>
                    {secoesFechadas.antropometria ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                </CardHeader>
                {!secoesFechadas.antropometria && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={antropometria.peso}
                          onChange={(e) => setAntropisometria(prev => ({ ...prev, peso: e.target.value }))}
                          placeholder="70.5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Altura (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={antropometria.altura}
                          onChange={(e) => setAntropisometria(prev => ({ ...prev, altura: e.target.value }))}
                          placeholder="175"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">IMC (kg/m²)</Label>
                        <Input
                          type="number"
                          value={antropometria.imc}
                          readOnly
                          className="mt-1 bg-gray-100"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Perímetro Cefálico (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={antropometria.perimetroCefalico}
                          onChange={(e) => setAntropisometria(prev => ({ ...prev, perimetroCefalico: e.target.value }))}
                          placeholder="—"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Circunferência Abdominal (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={antropometria.circunferenciaAbdominal}
                          onChange={(e) => setAntropisometria(prev => ({ ...prev, circunferenciaAbdominal: e.target.value }))}
                          placeholder="—"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Glicemia Capilar */}
              <Card>
                <CardHeader className="pb-3">
                  <button onClick={() => toggleSecao('glicemia')} className="w-full flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      Glicemia Capilar
                    </CardTitle>
                    {secoesFechadas.glicemia ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                </CardHeader>
                {!secoesFechadas.glicemia && (
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Glicemia (mg/dL)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={glicemia.valor}
                          onChange={(e) => setGlicemia(prev => ({ ...prev, valor: e.target.value }))}
                          placeholder="100"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Momento da Coleta</Label>
                        <Select value={glicemia.momento} onValueChange={(v) => setGlicemia(prev => ({ ...prev, momento: v }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EM_JEJUM">Em Jejum</SelectItem>
                            <SelectItem value="POS_PRANDIAL">Pós-Prandial</SelectItem>
                            <SelectItem value="ALEATORIO">Aleatório</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Indicador visual de glicemia */}
                    {glicemia.valor && (
                      <div className="mt-3">
                        {(() => {
                          const val = parseFloat(glicemia.valor);
                          if (val < 70) return <Badge className="bg-blue-500 text-white">Hipoglicemia (&lt;70)</Badge>;
                          if (val <= 99) return <Badge className="bg-green-500 text-white">Normal (70–99)</Badge>;
                          if (val <= 125) return <Badge className="bg-yellow-500 text-white">Pré-diabetes (100–125)</Badge>;
                          return <Badge className="bg-red-500 text-white">Diabetes (&gt;125)</Badge>;
                        })()}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Observações da Enfermagem */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={avaliacaoEnf.observacoes}
                    onChange={(e) => setAvaliacaoEnf(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais da enfermagem..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* ============================================================
              ABA: CLASSIFICAÇÃO DE RISCO (Manchester)
              ============================================================ */}
          {abaAtiva === 'classificacao' && (
            <>
              {/* Seletor visual Manchester */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Protocolo de Manchester
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Grid visual de cores */}
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.entries(MANCHESTER_CLASSES) as [ClassificacaoKey, typeof MANCHESTER_CLASSES[ClassificacaoKey]][]).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setClassificacaoRisco(key)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          classificacaoRisco === key
                            ? `${info.corBorder} ${info.corBg} shadow-md scale-105`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{info.icon}</div>
                        <div className={`text-xs font-bold ${classificacaoRisco === key ? 'text-gray-800' : 'text-gray-600'}`}>
                          {key}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{info.tempo}</div>
                      </button>
                    ))}
                  </div>

                  {/* Banner da classificação atual */}
                  {classificacaoInfo && (
                    <div className={`p-4 rounded-lg border-2 ${classificacaoInfo.corBg} text-center`}>
                      <div className="text-lg font-bold">{classificacaoInfo.icon} {classificacaoInfo.label}</div>
                      <div className="text-sm text-gray-600 mt-0.5">Atendimento em até {classificacaoInfo.tempo}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discriminador utilizado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Discriminador Utilizado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-sm text-gray-600">Discriminador que justificou a classificação</Label>
                    <Textarea
                      value={discriminador}
                      onChange={(e) => setDiscriminador(e.target.value)}
                      placeholder="Ex: Dor abdômen aguda, febre alta com convulsão, dispneia..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Referência rápida dos discriminadores */}
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Guia de Discriminadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold shrink-0">VERMELHO:</span>
                      <span className="text-gray-600">Obstrução de vias aéreas, respiração ausente, inconsciência, hemorragia incontrolável, dor tão intensa que não há escala</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold shrink-0">LARANJA:</span>
                      <span className="text-gray-600">Comportamento ameaçador, dor intensa, vomito persistente, desidratação, erupção generalizada</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold shrink-0">AMARELO:</span>
                      <span className="text-gray-600">Dor moderada, febre alta, vomito, diarréia, infecção urinária, gravidez com sangramento</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold shrink-0">VERDE:</span>
                      <span className="text-gray-600">Dor leve, náusea sem vomito, rash localizado, infecção leve</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold shrink-0">AZUL:</span>
                      <span className="text-gray-600">Problema crónico estável, revisão de medicamentos, consulta de rotina</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ============================================================
              ABA: CONDUTA
              ============================================================ */}
          {abaAtiva === 'conduta' && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Decisão de Conduta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Conduta *</Label>
                    <Select value={conduta} onValueChange={setConduta}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a conduta" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDUTAS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Orientações */}
                  <div>
                    <Label className="text-sm font-medium">Orientações para o Paciente</Label>
                    <Textarea
                      value={orientacoesConducta}
                      onChange={(e) => setOrientacoesConducta(e.target.value)}
                      placeholder="Descreva as orientações fornecidas ao paciente..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resumo da avaliação */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">Resumo da Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">Paciente:</span>
                    <span className="text-blue-900 font-semibold">{contexto.fila.citizen.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">Queixa:</span>
                    <span className="text-blue-900">{avaliacaoEnf.queixaPrincipal || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">Classificação:</span>
                    <span>
                      {classificacaoRisco ? (
                        <Badge className={MANCHESTER_CLASSES[classificacaoRisco].cor}>
                          {MANCHESTER_CLASSES[classificacaoRisco].icon} {classificacaoRisco}
                        </Badge>
                      ) : <span className="text-gray-400">—</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">Conduta:</span>
                    <span className="text-blue-900">
                      {conduta ? CONDUTAS.find(c => c.value === conduta)?.label || conduta : '—'}
                    </span>
                  </div>
                  {sinaisVitais.pressaoArterial && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">PA:</span>
                      <span className="text-blue-900">{sinaisVitais.pressaoArterial} mmHg</span>
                    </div>
                  )}
                  {sinaisVitais.frequenciaCardiaca && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">FC:</span>
                      <span className="text-blue-900">{sinaisVitais.frequenciaCardiaca} bpm</span>
                    </div>
                  )}
                  {sinaisVitais.temperatura && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Temp:</span>
                      <span className="text-blue-900">{sinaisVitais.temperatura} °C</span>
                    </div>
                  )}
                  {glicemia.valor && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Glicemia:</span>
                      <span className="text-blue-900">{glicemia.valor} mg/dL</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botão finalizar proeminente */}
              <div className="flex justify-end pt-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 text-base"
                  onClick={handleFinalizar}
                  disabled={salvando || !conduta || !classificacaoRisco || !avaliacaoEnf.queixaPrincipal}
                >
                  {salvando ? 'Salvando...' : 'Finalizar Avaliação e Encaminhar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
