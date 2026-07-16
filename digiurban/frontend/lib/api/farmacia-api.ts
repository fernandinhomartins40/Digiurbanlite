/**
 * API Service - Farmácia
 */

const API_BASE = '/api/saude/farmacia';

// ============================================================================
// ESTOQUE
// ============================================================================

export async function listarEstoque(unidadeId?: string) {
  const url = unidadeId
    ? `${API_BASE}/estoque?unidadeId=${unidadeId}`
    : `${API_BASE}/estoque`;

  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function buscarMedicamento(medicamentoId: string, unidadeId: string) {
  const res = await fetch(`${API_BASE}/estoque/verificar-disponibilidade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      medicamentoId,
      unidadeId,
      quantidade: 1,
    }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function criarLote(data: {
  medicamentoId: string;
  unidadeId: string;
  numeroLote: string;
  dataValidade: Date;
  quantidade: number;
  valorUnitario?: number;
}) {
  const res = await fetch(`${API_BASE}/lote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarAlertas(unidadeId?: string) {
  const url = unidadeId
    ? `${API_BASE}/alertas?unidadeId=${unidadeId}`
    : `${API_BASE}/alertas`;

  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// DISPENSAÇÃO
// ============================================================================

export async function dispensarMedicamento(data: {
  prescricaoId: string;
  unidadeId: string;
  profissionalId: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/dispensacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarDispensacoes(filtros: {
  unidadeId?: string;
  citizenId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/dispensacao?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// TRANSFERÊNCIAS
// ============================================================================

export async function criarTransferencia(data: {
  medicamentoId: string;
  unidadeOrigemId: string;
  unidadeDestinoId: string;
  quantidade: number;
  solicitadoPor: string;
  motivo: string;
}) {
  const res = await fetch(`${API_BASE}/transferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmarTransferencia(id: string, data: {
  aprovadoPor: string;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/transferencia/${id}/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// FUNÇÕES ADICIONAIS
// ============================================================================

export async function registrarDispensacao(data: {
  prescricaoId?: string;
  citizenId: string;
  profissionalId: string;
  itens: Array<{
    estoqueId: string;
    quantidade: number;
  }>;
  observacoes?: string;
}) {
  const res = await fetch(`${API_BASE}/dispensacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function atualizarEstoque(estoqueId: string, data: any) {
  const res = await fetch(`${API_BASE}/estoque/${estoqueId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function obterEstatisticasDispensacao(filtros: {
  unidadeId?: string;
  dataInicio: string;
  dataFim: string;
}) {
  const params = new URLSearchParams(filtros as any);
  const res = await fetch(`${API_BASE}/dispensacao/estatisticas?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// LOTES
// ============================================================================

function buildQuery(filtros?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filtros || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listarLotes(filtros?: {
  medicamentoId?: string;
  unidadeId?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await fetch(`${API_BASE}/lote${buildQuery(filtros)}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarLotesProximosVencimento(dias = 90, unidadeId?: string) {
  const res = await fetch(
    `${API_BASE}/lote/proximos-vencimento${buildQuery({ dias, unidadeId })}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listarLotesVencidos(unidadeId?: string) {
  const res = await fetch(`${API_BASE}/lote/vencidos${buildQuery({ unidadeId })}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function darBaixaLote(loteId: string, quantidade: number, motivo?: string) {
  const res = await fetch(`${API_BASE}/lote/baixa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loteId, quantidade, motivo }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adicionarQuantidadeLote(loteId: string, quantidade: number, motivo?: string) {
  const res = await fetch(`${API_BASE}/lote/${loteId}/adicionar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantidade, motivo }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// TRANSFERÊNCIAS (listagem e ações)
// ============================================================================

export async function listarTransferencias(filtros?: {
  unidadeOrigemId?: string;
  unidadeDestinoId?: string;
  status?: string;
}) {
  const res = await fetch(`${API_BASE}/transferencia${buildQuery(filtros)}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function recusarTransferencia(id: string, motivo?: string) {
  const res = await fetch(`${API_BASE}/transferencia/${id}/recusar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelarTransferencia(id: string, motivo?: string) {
  const res = await fetch(`${API_BASE}/transferencia/${id}/cancelar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// ALERTAS (ações)
// ============================================================================

export async function marcarAlertaVisualizado(id: string) {
  const res = await fetch(`${API_BASE}/alerta/${id}/visualizar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resolverAlerta(id: string, observacoes?: string) {
  const res = await fetch(`${API_BASE}/alerta/${id}/resolver`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacoes }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function verificarAlertasAutomaticos(unidadeId?: string) {
  const res = await fetch(
    `${API_BASE}/alerta/verificar-automaticos${buildQuery({ unidadeId })}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// RELATÓRIOS / ESTATÍSTICAS
// ============================================================================

export async function obterEstatisticasEstoque(unidadeId?: string) {
  const res = await fetch(`${API_BASE}/estoque/estatisticas${buildQuery({ unidadeId })}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function gerarRelatorioAuditoria(filtros: {
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: string;
  citizenId?: string;
  medicamentoId?: string;
}) {
  const res = await fetch(`${API_BASE}/dispensacao/relatorio/auditoria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filtros),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// PRESCRIÇÕES PENDENTES (integração com consulta médica)
// ============================================================================

export async function listarPrescricoesPendentes(filtros?: {
  unidadeId?: string;
  cidadaoId?: string;
}) {
  const res = await fetch(
    `/api/saude/consulta-medica/prescricoes/pendentes${buildQuery({
      ...filtros,
      status: 'ATIVA',
    })}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function dispensarPrescricaoCompleta(prescricaoId: string, observacoes?: string) {
  const res = await fetch(`${API_BASE}/dispensacao/completa/${prescricaoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacoes }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// UNIDADES (apoio aos filtros)
// ============================================================================

export async function listarUnidadesSaude() {
  const res = await fetch('/api/apps/saude/cadastros/unidades', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data : data.unidades || data.data || [];
}
