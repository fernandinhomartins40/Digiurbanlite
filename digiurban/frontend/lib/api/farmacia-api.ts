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
  const res = await fetch(
    `${API_BASE}/estoque/${medicamentoId}?unidadeId=${unidadeId}`,
    { credentials: 'include' }
  );
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
