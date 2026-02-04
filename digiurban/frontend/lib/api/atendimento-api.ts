/**
 * API Service - Atendimento Médico
 */

const API_BASE = '/api/saude/atendimento';

// ============================================================================
// FILA DE ATENDIMENTO
// ============================================================================

export async function realizarCheckIn(data: {
  unidadeId: string;
  consultaId: string;
  prioridade?: number;
}) {
  const res = await fetch(`${API_BASE}/fila/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function obterFilaUnidade(unidadeId: string) {
  const res = await fetch(`/api/saude/fila-atendimento?unidadeId=${unidadeId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function chamarProximo(unidadeId: string, profissionalId: string) {
  const res = await fetch(`/api/saude/fila-atendimento/chamar-proximo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unidadeId, profissionalId }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// ATENDIMENTO
// ============================================================================

export async function iniciarAtendimento(data: {
  citizenId: string;
  unidadeId: string;
  profissionalId: string;
  tipoAtendimento: string;
  consultaId?: string;
}) {
  const res = await fetch(`${API_BASE}/atendimento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function buscarAtendimento(id: string) {
  const res = await fetch(`${API_BASE}/atendimento/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function finalizarAtendimento(id: string) {
  const res = await fetch(`${API_BASE}/atendimento/${id}/finalizar`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// TRIAGEM
// ============================================================================

export async function realizarTriagem(data: {
  atendimentoId: string;
  profissionalId: string;
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  temperatura?: number;
  saturacaoO2?: number;
  peso?: number;
  altura?: number;
  classificacaoRisco: string;
  queixaPrincipal: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/triagem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Alias para compatibilidade
export const criarTriagem = realizarTriagem;

// ============================================================================
// PRESCRIÇÃO
// ============================================================================

export async function criarPrescricao(data: {
  atendimentoId: string;
  profissionalId: string;
  observacoes?: string;
  itens: Array<{
    medicamentoId: string;
    quantidade: number;
    posologia: string;
    duracao?: string;
  }>;
}) {
  const res = await fetch(`${API_BASE}/prescricao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function gerarPrescricaoPDF(prescricaoId: string) {
  const res = await fetch(`${API_BASE}/prescricao/${prescricaoId}/pdf`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// ATESTADO
// ============================================================================

export async function criarAtestado(data: {
  atendimentoId: string;
  profissionalId: string;
  cid10: string;
  diasAfastamento: number;
  dataInicio: Date;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/atestado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function gerarAtestadoPDF(atestadoId: string) {
  const res = await fetch(`${API_BASE}/atestado/${atestadoId}/pdf`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// PRONTUÁRIO
// ============================================================================

export async function buscarProntuario(citizenId: string) {
  const res = await fetch(`${API_BASE}/prontuario/${citizenId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Alias para compatibilidade
export const obterProntuarioCidadao = buscarProntuario;

export async function obterTimelineProntuario(citizenId: string) {
  const res = await fetch(`${API_BASE}/prontuario/${citizenId}/timeline`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export async function obterEstatisticasAtendimento(filtros: {
  unidadeId?: string;
  dataInicio: string;
  dataFim: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/atendimento/estatisticas?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// CONSULTA MÉDICA
// ============================================================================

export async function criarConsultaMedica(data: {
  atendimentoId: string;
  medicoId: string;
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  historicoMedico?: string;
  exameFisico: string;
  hipoteseDiagnostica?: string;
  diagnosticos?: any;
  conduta: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/consulta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
