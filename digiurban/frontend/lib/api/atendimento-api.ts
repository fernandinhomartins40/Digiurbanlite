/**
 * API Service - Atendimento Saude
 */

const SAUDE_BASE = '/api/saude';
const CONSULTA_BASE = '/api/saude/consulta-medica';

async function requestJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

function normalizeClassificacaoRisco(classificacao: string | undefined) {
  switch (classificacao) {
    case 'VERMELHO':
      return 'EMERGENCIA';
    case 'LARANJA':
      return 'MUITO_URGENTE';
    case 'AMARELO':
      return 'URGENTE';
    case 'VERDE':
    case 'AZUL':
      return 'NORMAL';
    default:
      return classificacao || 'NORMAL';
  }
}

// ============================================================================
// FILA DE ATENDIMENTO
// ============================================================================

export async function realizarCheckIn(data: {
  unidadeId: string;
  consultaId?: string;
  prioridade?: number;
  citizenId?: string;
  tipoAtendimento?: string;
  motivoBusca?: string;
}) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function obterFilaUnidade(unidadeId: string) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento?unidadeId=${unidadeId}`);
}

export async function chamarProximo(unidadeId: string, profissionalId: string) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento/chamar-proximo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unidadeId, profissionalId }),
  });
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
  motivoBusca?: string;
}) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      citizenId: data.citizenId,
      unidadeId: data.unidadeId,
      profissionalId: data.profissionalId,
      tipoAtendimento: data.tipoAtendimento,
      motivoBusca: data.motivoBusca || 'Atendimento em fila',
      prioridade: data.consultaId ? 50 : 0,
    }),
  });
}

export async function buscarAtendimento(id: string) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento/${id}`);
}

export async function finalizarAtendimento(id: string) {
  return requestJson(`${SAUDE_BASE}/fila-atendimento/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'FINALIZADO' }),
  });
}

// ============================================================================
// TRIAGEM
// ============================================================================

export async function realizarTriagem(data: {
  atendimentoId?: string;
  filaAtendimentoId?: string;
  profissionalId: string;
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  frequenciaRespiratoria?: number;
  temperatura?: number;
  saturacaoO2?: number;
  peso?: number;
  altura?: number;
  classificacaoRisco: string;
  queixaPrincipal: string;
  observacoes?: string;
}) {
  const filaAtendimentoId = data.filaAtendimentoId || data.atendimentoId;
  if (!filaAtendimentoId) {
    throw new Error('filaAtendimentoId e obrigatorio para triagem');
  }

  return requestJson(`${SAUDE_BASE}/triagem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filaAtendimentoId,
      enfermeiroId: data.profissionalId,
      pressaoArterial: data.pressaoArterial,
      frequenciaCardiaca: data.frequenciaCardiaca,
      frequenciaRespiratoria: data.frequenciaRespiratoria,
      temperatura: data.temperatura,
      saturacaoO2: data.saturacaoO2,
      peso: data.peso,
      altura: data.altura,
      classificacaoRisco: normalizeClassificacaoRisco(data.classificacaoRisco),
      queixaPrincipal: data.queixaPrincipal,
      observacoes: data.observacoes,
    }),
  });
}

export const criarTriagem = realizarTriagem;

// ============================================================================
// PRONTUARIO
// ============================================================================

export async function buscarProntuario(citizenId: string) {
  return requestJson(`${CONSULTA_BASE}/prontuario/${citizenId}`);
}

export const obterProntuarioCidadao = buscarProntuario;

export async function obterTimelineProntuario(citizenId: string) {
  return requestJson(`${CONSULTA_BASE}/prontuario/${citizenId}/timeline`);
}

// ============================================================================
// ESTATISTICAS
// ============================================================================

export async function obterEstatisticasAtendimento(filtros: {
  unidadeId?: string;
  dataInicio: string;
  dataFim: string;
}) {
  const params = new URLSearchParams(filtros as Record<string, string>);
  return requestJson(`${SAUDE_BASE}/fila-atendimento/estatisticas?${params.toString()}`);
}

// ============================================================================
// CONSULTA MEDICA - PEC e-SUS
// ============================================================================

export async function buscarContextoFila(filaId: string) {
  try {
    return await requestJson(`${CONSULTA_BASE}/contexto-fila/${filaId}`);
  } catch (error) {
    const fila = await requestJson(`${SAUDE_BASE}/fila-atendimento/${filaId}`);

    return {
      fila: {
        ...fila,
        escutaInicial: fila.escutaInicial ?? null,
        triagem: fila.triagem ?? null,
      },
      problemas: [],
      consultasAnteriores: [],
      contextoParcial: true,
      contextoErroOriginal: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function buscarConsultaPorFila(filaId: string) {
  return requestJson(`${CONSULTA_BASE}/fila/${filaId}`);
}

export async function criarConsultaMedica(data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function finalizarConsulta(filaId: string) {
  return requestJson(`${CONSULTA_BASE}/finalizar/${filaId}`, {
    method: 'POST',
  });
}

export async function criarPrescricao(consultaId: string, data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/prescricao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarPrescricoes(consultaId: string) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/prescricoes`);
}

export async function criarExame(consultaId: string, data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/exame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarExames(consultaId: string) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/exames`);
}

export async function criarEncaminhamento(consultaId: string, data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/encaminhamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarEncaminhamentos(consultaId: string) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/encaminhamentos`);
}

export async function criarAtestado(consultaId: string, data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/atestado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarAtestados(consultaId: string) {
  return requestJson(`${CONSULTA_BASE}/${consultaId}/atestados`);
}

export async function buscarProblemasCidadao(citizenId: string) {
  return requestJson(`${CONSULTA_BASE}/problemas/${citizenId}`);
}

export async function criarProblema(citizenId: string, data: Record<string, any>) {
  return requestJson(`${CONSULTA_BASE}/problemas/${citizenId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function buscarMedicamentos(q: string) {
  return requestJson(`${CONSULTA_BASE}/medicamentos/busca?q=${encodeURIComponent(q)}`);
}
