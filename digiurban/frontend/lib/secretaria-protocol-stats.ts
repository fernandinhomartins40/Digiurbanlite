/**
 * Números reais de protocolos de uma secretaria, via GET /api/departments/:slug/stats.
 *
 * Os hooks de estatística das secretarias chamavam endpoints que não existem
 * (/secretarias/<slug>/stats, /protocolos?department=...), engoliam o erro e
 * mostravam zeros — inclusive "0 protocolos pendentes" com fila cheia.
 */

export interface SecretariaProtocolStats {
  total: number
  /** Em aberto (recebidos, em andamento, atualização e pendência) */
  pending: number
  inProgress: number
  completed: number
}

export const EMPTY_PROTOCOL_STATS: SecretariaProtocolStats = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
}

export async function fetchSecretariaProtocolStats(slug: string): Promise<SecretariaProtocolStats> {
  const response = await fetch(`/api/departments/${encodeURIComponent(slug)}/stats`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Não foi possível carregar os protocolos da secretaria (${response.status})`)
  }
  const data = await response.json()
  const p = data?.protocols || {}
  return {
    total: p.total ?? 0,
    pending: p.open ?? p.pending ?? 0,
    inProgress: p.inProgress ?? 0,
    completed: p.approved ?? p.completed ?? 0,
  }
}

/** Leitura de um endpoint JSON do backend com cookie de sessão */
export async function fetchJson<T = any>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error(`Falha ao carregar ${url} (${response.status})`)
  return response.json()
}
