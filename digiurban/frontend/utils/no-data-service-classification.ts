import { ServiceSubtype } from '@/lib/service-suggestions';

type InferNoDataSubtypeInput = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  requiresDocuments?: boolean | null;
  requiredDocuments?: string[] | null;
};

export const CURRENT_NO_DATA_SUBTYPES = [
  ServiceSubtype.CONSULTA_PUBLICA,
  ServiceSubtype.CONSULTA_AUTENTICADA,
  ServiceSubtype.EMISSAO_AUTOMATICA,
  ServiceSubtype.EMISSAO_ASSISTIDA,
  ServiceSubtype.SOLICITACAO_SIMPLES,
] as const;

export const NO_DATA_SUBTYPE_OPTIONS = [
  {
    value: ServiceSubtype.CONSULTA_PUBLICA,
    title: 'Consulta pública',
    description: 'Conteúdo ou consulta aberta, sem protocolo e sem análise interna.',
  },
  {
    value: ServiceSubtype.CONSULTA_AUTENTICADA,
    title: 'Consulta autenticada',
    description: 'Retorna informação individual do cidadão logado, sem workflow interno.',
  },
  {
    value: ServiceSubtype.EMISSAO_AUTOMATICA,
    title: 'Emissão automática',
    description: 'Documento ou comprovante emitido automaticamente pela base municipal.',
  },
  {
    value: ServiceSubtype.EMISSAO_ASSISTIDA,
    title: 'Emissão assistida',
    description: 'Documento emitido pela administração com validação ou assinatura interna.',
  },
  {
    value: ServiceSubtype.SOLICITACAO_SIMPLES,
    title: 'Solicitação simples',
    description: 'Pedido leve que só exige retorno de informação ou documento após tratativa curta.',
  },
] as const;

const PUBLIC_QUERY_KEYWORDS = [
  'agenda',
  'calendario',
  'guia',
  'mapa',
  'roteiro',
  'horario',
  'horarios',
  'itinerario',
  'itinerarios',
  'lista',
  'catalogo',
  'portal',
  'diario oficial',
  'legislacao',
  'concurso',
  'concursos',
  'dados abertos',
  'transparencia',
  'politica de privacidade',
  'status dos sistemas',
  'informacoes sobre',
  'rede de atendimento',
] as const;

const AUTHENTICATED_QUERY_KEYWORDS = [
  'historico',
  'boletim',
  'resultado',
  'resultados',
  'situacao',
  'processo',
  'protocolo',
  'solicitacoes',
  'manifestacoes',
  'debitos',
  'pagamentos',
  'multas',
  'pontos na cnh',
  'beneficios',
  'elegibilidade',
  'cadastro',
  'cadastros',
  'atendimento',
  'atendimentos',
] as const;

const DOCUMENT_EMISSION_KEYWORDS = [
  'certidao',
  'declaracao',
  'atestado',
  'comprovante',
  'segunda via',
  'emissao',
  'emitir',
  'alvara',
  'licenca',
  'carteira digital',
  'cartao sus',
  'cnd',
  'historico escolar',
] as const;

const SIMPLE_REQUEST_KEYWORDS = [
  'laudo',
  'vistoria',
  'apoio',
  'material promocional',
  'regularizacao',
  'conformidade',
  'area construida',
  'conclusao de obra',
  'habite-se',
  'habitese',
  'ocupacao',
  'pedido',
  'solicitacao',
] as const;

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function isCurrentNoDataSubtype(value?: string | null): value is (typeof CURRENT_NO_DATA_SUBTYPES)[number] {
  return CURRENT_NO_DATA_SUBTYPES.includes(value as (typeof CURRENT_NO_DATA_SUBTYPES)[number]);
}

export function inferNoDataServiceSubtype(input: InferNoDataSubtypeInput) {
  const text = normalizeText([input.name, input.category, input.description].filter(Boolean).join(' '));
  const hasDocuments = Boolean(input.requiresDocuments) || Boolean(input.requiredDocuments?.length);

  if (includesAnyKeyword(text, SIMPLE_REQUEST_KEYWORDS)) {
    return ServiceSubtype.SOLICITACAO_SIMPLES;
  }

  if (includesAnyKeyword(text, DOCUMENT_EMISSION_KEYWORDS)) {
    return hasDocuments ? ServiceSubtype.EMISSAO_ASSISTIDA : ServiceSubtype.EMISSAO_AUTOMATICA;
  }

  if (includesAnyKeyword(text, AUTHENTICATED_QUERY_KEYWORDS)) {
    return ServiceSubtype.CONSULTA_AUTENTICADA;
  }

  if (includesAnyKeyword(text, PUBLIC_QUERY_KEYWORDS)) {
    return ServiceSubtype.CONSULTA_PUBLICA;
  }

  return hasDocuments ? ServiceSubtype.EMISSAO_ASSISTIDA : ServiceSubtype.SOLICITACAO_SIMPLES;
}
