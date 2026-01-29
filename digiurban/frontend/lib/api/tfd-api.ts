/**
 * API Service - TFD (Tratamento Fora do Domicílio)
 */

const API_BASE = '/api/saude/tfd';

// ============================================================================
// SOLICITAÇÕES
// ============================================================================

export async function criarSolicitacao(data: {
  citizenId: string;
  acompanhanteId?: string;
  especialidade: string;
  procedimento: string;
  cid10?: string;
  justificativa: string;
  prioridade: string;
  cidadeDestino: string;
  estadoDestino: string;
}) {
  const res = await fetch(`${API_BASE}/solicitacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarSolicitacoes(filtros?: {
  status?: string;
  citizenId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/solicitacao?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function buscarSolicitacao(id: string) {
  const res = await fetch(`${API_BASE}/solicitacao/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDocumento(solicitacaoId: string, formData: FormData) {
  const res = await fetch(`${API_BASE}/solicitacao/${solicitacaoId}/upload-documento`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// REGULAÇÃO
// ============================================================================

export async function criarParecerRegulacao(data: {
  solicitacaoId: string;
  medicoReguladorId: string;
  parecer: string;
  status: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/regulacao/parecer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarFilaRegulacao(filtros?: {
  status?: string;
  prioridade?: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/regulacao/fila?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function aprovarGestao(data: {
  solicitacaoId: string;
  gestorId: string;
  valorAprovado?: number;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/regulacao/aprovacao-gestao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function criarAgendamentoExterno(data: {
  solicitacaoId: string;
  dataHoraConsulta: Date;
  especialidade: string;
  hospitalDestino: string;
  endereco?: string;
  telefoneContato?: string;
  usuarioAgendamento: string;
}) {
  const res = await fetch(`${API_BASE}/regulacao/agendamento-externo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// VIAGENS
// ============================================================================

export async function criarViagem(data: {
  solicitacoesIds: string[];
  tipo: string;
  dataViagem: Date;
  horarioSaida: string;
  veiculoId?: string;
  motoristaId?: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/viagem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarViagens(filtros?: {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/viagem?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function buscarViagem(id: string) {
  const res = await fetch(`${API_BASE}/viagem/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adicionarPassageiro(data: {
  viagemId: string;
  solicitacaoId: string;
  citizenId: string;
  acompanhante?: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/viagem/passageiro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function iniciarViagem(id: string) {
  const res = await fetch(`${API_BASE}/viagem/${id}/iniciar`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function finalizarViagem(id: string) {
  const res = await fetch(`${API_BASE}/viagem/${id}/finalizar`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// PRESTAÇÃO DE CONTAS
// ============================================================================

export async function criarPrestacaoContas(data: {
  viagemId: string;
  combustivelLitros: number;
  combustivelValor: number;
  pedagiosValor: number;
  alimentacaoValor: number;
  hospedagemValor?: number;
  outrosCustos?: number;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/prestacao-contas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadComprovante(viagemId: string, formData: FormData) {
  const res = await fetch(`${API_BASE}/viagem/${viagemId}/upload-comprovante`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// FUNÇÕES ADICIONAIS
// ============================================================================

export async function aprovarSolicitacao(solicitacaoId: string, data: {
  parecerMedico: string;
  recomendacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/solicitacao/${solicitacaoId}/aprovar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function negarSolicitacao(solicitacaoId: string, data: {
  motivoNegacao: string;
}) {
  const res = await fetch(`${API_BASE}/solicitacao/${solicitacaoId}/negar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarViagensPorStatus(status: string) {
  const res = await fetch(`${API_BASE}/viagem?status=${status}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function obterEstatisticas(filtros: {
  dataInicio: string;
  dataFim: string;
}) {
  const params = new URLSearchParams(filtros);
  const res = await fetch(`${API_BASE}/estatisticas?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
