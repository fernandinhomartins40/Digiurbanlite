/**
 * API Service - TFD (Tratamento Fora do Domicilio)
 */

const API_BASE = '/api/saude/tfd';

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(params?: Record<string, QueryValue>) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function requestJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error || body?.message || JSON.stringify(body);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Falha na requisicao (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// SOLICITACOES
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
  return requestJson('/solicitacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarSolicitacoes(filtros?: {
  status?: string;
  citizenId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const statusMap: Record<string, string> = {
    AGUARDANDO_REGULACAO: 'AGUARDANDO_REGULACAO_MEDICA',
  };

  return requestJson(
    `/solicitacao${buildQuery({
      ...filtros,
      status: filtros?.status ? statusMap[filtros.status] || filtros.status : undefined,
    })}`
  );
}

export async function buscarSolicitacao(id: string) {
  return requestJson(`/solicitacao/${id}`);
}

export async function uploadDocumento(solicitacaoId: string, formData: FormData) {
  return requestJson(`/solicitacao/${solicitacaoId}/upload-documento`, {
    method: 'POST',
    body: formData,
  });
}

// ============================================================================
// REGULACAO E APROVACAO
// ============================================================================

export async function criarParecerRegulacao(data: {
  solicitacaoId: string;
  medicoReguladorId?: string;
  parecer?: string;
  status?: string;
  observacoes?: string;
  aprovado?: boolean;
  prioridade?: string;
}) {
  return requestJson('/parecer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacaoId: data.solicitacaoId,
      reguladorId: data.medicoReguladorId,
      aprovado:
        typeof data.aprovado === 'boolean'
          ? data.aprovado
          : data.status
          ? data.status.toUpperCase().includes('APROV')
          : true,
      prioridade: data.prioridade || 'MEDIA',
      justificativa: data.parecer,
      observacoes: data.observacoes,
    }),
  });
}

export async function listarFilaRegulacao(filtros?: {
  status?: string;
  prioridade?: string;
}) {
  return requestJson(
    `/regulacao/aguardando${buildQuery({
      especialidade: filtros?.status,
      urgente: filtros?.prioridade === 'EMERGENCIA' ? true : undefined,
    })}`
  );
}

export async function aprovarGestao(data: {
  solicitacaoId: string;
  gestorId?: string;
  valorAprovado?: number;
  observacoes?: string;
}) {
  return requestJson('/aprovacao-gestao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacaoId: data.solicitacaoId,
      aprovadoPorId: data.gestorId,
      aprovado: true,
      valorAprovado: data.valorAprovado,
      justificativa: data.observacoes,
      observacoes: data.observacoes,
    }),
  });
}

export async function criarAgendamentoExterno(data: {
  solicitacaoId: string;
  dataHoraConsulta: Date;
  especialidade: string;
  hospitalDestino: string;
  endereco?: string;
  telefoneContato?: string;
  usuarioAgendamento?: string;
}) {
  const dataHora = new Date(data.dataHoraConsulta);
  return requestJson('/agendamento-externo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacaoId: data.solicitacaoId,
      dataAgendamento: dataHora.toISOString(),
      horaAgendamento: dataHora.toTimeString().slice(0, 5),
      especialidade: data.especialidade,
      localAtendimento: data.hospitalDestino,
      enderecoCompleto: data.endereco,
      telefoneContato: data.telefoneContato,
      cidade: '',
      estado: '',
      observacoes: undefined,
    }),
  });
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
  const solicitacaoId = data.solicitacoesIds?.[0];
  return requestJson('/viagem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacaoId,
      veiculoId: data.veiculoId,
      motoristaId: data.motoristaId,
      dataIda: data.dataViagem,
      horaIda: data.horarioSaida,
      observacoes: data.observacoes,
    }),
  });
}

export async function listarViagens(filtros?: {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  return requestJson(`/viagem${buildQuery(filtros)}`);
}

export async function buscarViagem(id: string) {
  return requestJson(`/viagem/${id}`);
}

export async function adicionarPassageiro(data: {
  viagemId: string;
  solicitacaoId: string;
  citizenId?: string;
  acompanhante?: string;
  observacoes?: string;
}) {
  return requestJson('/passageiro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      viagemId: data.viagemId,
      solicitacaoId: data.solicitacaoId,
      acompanhanteId: data.acompanhante,
      observacoes: data.observacoes,
    }),
  });
}

export async function iniciarViagem(id: string) {
  return requestJson(`/viagem/${id}/iniciar`, {
    method: 'PUT',
  });
}

export async function finalizarViagem(id: string) {
  return requestJson(`/viagem/${id}/concluir`, {
    method: 'PUT',
  });
}

// ============================================================================
// PRESTACAO DE CONTAS
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
  return requestJson('/prestacao-contas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      viagemId: data.viagemId,
      kmInicial: 0,
      kmFinal: 0,
      combustivelGasto: data.combustivelLitros,
      valorCombustivel: data.combustivelValor,
      pedagios: data.pedagiosValor,
      alimentacao: data.alimentacaoValor,
      hospedagem: data.hospedagemValor,
      outrosGastos: data.outrosCustos,
      observacoes: data.observacoes,
    }),
  });
}

export async function uploadComprovante(viagemId: string, formData: FormData) {
  return requestJson(`/viagem/${viagemId}/upload-comprovante`, {
    method: 'POST',
    body: formData,
  });
}

// ============================================================================
// FUNCOES ADICIONAIS
// ============================================================================

export async function aprovarSolicitacao(
  solicitacaoId: string,
  data: {
    parecerMedico: string;
    recomendacoes?: string;
  }
) {
  return requestJson(`/solicitacao/${solicitacaoId}/aprovar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parecerMedico: data.parecerMedico,
      recomendacoes: data.recomendacoes,
    }),
  });
}

export async function negarSolicitacao(
  solicitacaoId: string,
  data: {
    motivoNegacao: string;
  }
) {
  return requestJson(`/solicitacao/${solicitacaoId}/negar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listarViagensPorStatus(status: string) {
  return requestJson(`/viagem${buildQuery({ status })}`);
}

export async function obterEstatisticas(_filtros?: {
  dataInicio: string;
  dataFim: string;
}) {
  return requestJson('/dashboard/stats');
}
