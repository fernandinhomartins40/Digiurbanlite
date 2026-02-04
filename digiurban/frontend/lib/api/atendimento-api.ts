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
// CONSULTA MÉDICA — PEC e-SUS
// ============================================================================

const CONSULTA_BASE = '/api/saude/consulta-medica';

// Contexto completo da fila (paciente + problemas + histórico)
export async function buscarContextoFila(filaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/contexto-fila/${filaId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Buscar consulta já existente para esta entrada na fila
export async function buscarConsultaPorFila(filaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/fila/${filaId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Criar consulta médica (SOAP)
export async function criarConsultaMedica(data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Finalizar consulta (atualiza status fila → FINALIZADO)
export async function finalizarConsulta(filaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/finalizar/${filaId}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Prescrições ──
export async function criarPrescricao(consultaId: string, data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/prescricao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarPrescricoes(consultaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/prescricoes`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Exames ──
export async function criarExame(consultaId: string, data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/exame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarExames(consultaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/exames`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Encaminhamentos ──
export async function criarEncaminhamento(consultaId: string, data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/encaminhamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarEncaminhamentos(consultaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/encaminhamentos`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Atestados ──
export async function criarAtestado(consultaId: string, data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/atestado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarAtestados(consultaId: string) {
  const res = await fetch(`${CONSULTA_BASE}/${consultaId}/atestados`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Problemas / Condições ──
export async function buscarProblemasCidadao(citizenId: string) {
  const res = await fetch(`${CONSULTA_BASE}/problemas/${citizenId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function criarProblema(citizenId: string, data: Record<string, any>) {
  const res = await fetch(`${CONSULTA_BASE}/problemas/${citizenId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Medicamentos (autocomplete) ──
export async function buscarMedicamentos(q: string) {
  const res = await fetch(`${CONSULTA_BASE}/medicamentos/busca?q=${encodeURIComponent(q)}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
