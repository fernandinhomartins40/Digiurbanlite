/**
 * Situações de vida (Plano de Produto M3): o cidadão escolhe o que está
 * acontecendo ("Tive um filho") em vez de saber o nome do serviço.
 *
 * Cada situação aponta para serviços do catálogo por `catalogKey` (ver
 * `catalogKeyOf` em catalog/services) e por palavras do nome — assim também
 * pega serviço criado pelo município (ex.: "Sepultamento" no cemitério).
 * Teste: __tests__/unit/life-situations.test.ts (toda catalogKey existe).
 */

import { normalizeText } from '../services/digibot/text-match';

export interface LifeSituation {
  slug: string;
  title: string;
  description: string;
  catalogKeys: string[];
  /** palavras (ou expressões) inteiras procuradas no nome do serviço, sem acento */
  keywords: string[];
}

export const LIFE_SITUATIONS: LifeSituation[] = [
  {
    slug: 'tive-um-filho',
    title: 'Tive um filho',
    description: 'Vacinas, creche, cartão SUS, benefícios e documentos do bebê.',
    catalogKeys: [
      'CAMPANHAS_VACINACAO', 'CARTAO_SUS', 'PROGRAMA_SAUDE_FAMILIA', 'INSCRICAO_CRECHE',
      'PROGRAMA_PRIMEIRA_INFANCIA', 'BENEFICIO_EVENTUAL', 'CADASTRO_UNICO', 'DOCUMENTACAO_CIVIL',
    ],
    keywords: ['natalidade', 'gestante', 'pre natal', 'bebe'],
  },
  {
    slug: 'filho-na-escola',
    title: 'Meu filho vai para a escola',
    description: 'Matrícula, creche, transporte, uniforme e material escolar.',
    catalogKeys: [
      'MATRICULA_ESCOLAR', 'INSCRICAO_CRECHE', 'TRANSFERENCIA_ESCOLAR', 'TRANSPORTE_ESCOLAR',
      'TRANSPORTE_ESCOLAR_GRATUITO', 'UNIFORME_ESCOLAR', 'MATERIAL_ESCOLAR', 'MERENDA_ESPECIAL',
      'AEE', 'CARTAO_ESTUDANTE',
    ],
    keywords: ['matricula'],
  },
  {
    slug: 'saude',
    title: 'Preciso de atendimento de saúde',
    description: 'Consultas, exames, remédios, vacinas e transporte de pacientes.',
    catalogKeys: [
      'AGENDAMENTO_CONSULTA', 'AGENDAMENTO_ODONTOLOGIA', 'SOLICITACAO_EXAMES', 'CONTROLE_MEDICAMENTOS',
      'MEDICAMENTOS_ALTO_CUSTO', 'CAMPANHAS_VACINACAO', 'AGENDAMENTO_CAPS', 'TRANSPORTE_PACIENTES',
      'ATENDIMENTO_DOMICILIAR', 'SOLICITACAO_FISIOTERAPIA', 'CARTAO_SUS',
    ],
    keywords: ['consulta medica', 'exame', 'medicamento'],
  },
  {
    slug: 'sem-trabalho',
    title: 'Estou sem trabalho',
    description: 'Vagas de emprego, cursos de qualificação e apoio da assistência social.',
    catalogKeys: [
      'CADASTRO_BALCAO_EMPREGOS', 'INSCRICAO_QUALIFICACAO', 'CURSOS_QUALIFICACAO', 'GERACAO_RENDA',
      'CADASTRO_UNICO', 'CESTA_BASICA', 'SOLICITACAO_BENEFICIO', 'ATENDIMENTO_CRAS', 'TARIFA_SOCIAL_ENERGIA',
    ],
    keywords: ['emprego', 'qualificacao'],
  },
  {
    slug: 'abrir-negocio',
    title: 'Vou abrir um negócio',
    description: 'MEI, alvará de funcionamento, orientação e crédito para começar.',
    catalogKeys: [
      'CADASTRO_MEI', 'ALVARA_FUNCIONAMENTO', 'ALVARA_FUNCIONAMENTO_PLANEJAMENTO', 'AGENDAMENTO_SALA_EMPREENDEDOR',
      'SOLICITACAO_MICROCREDITO', 'SOLICITACAO_CONSULTORIA', 'INSCRICAO_INCUBADORA', 'ATUALIZACAO_CADASTRAL_EMPRESA',
    ],
    keywords: ['alvara de funcionamento', 'empreendedor', 'mei'],
  },
  {
    slug: 'construir-reformar',
    title: 'Vou construir ou reformar',
    description: 'Projeto, alvará de obra, reforma, habite-se e materiais.',
    catalogKeys: [
      'ALVARA_CONSTRUCAO', 'LICENCA_OBRA', 'ALVARA_REFORMA', 'APROVACAO_PROJETO', 'APROVACAO_PROJETO_ARQUITETONICO',
      'AUTORIZACAO_CONSTRUCAO', 'REGULARIZACAO_OBRA', 'APROVACAO_MURO', 'APROVACAO_CALCADA', 'AUTORIZACAO_DEMOLICAO',
      'OBRAS_PUBLICAS:HABITE_SE', 'MELHORIA_HABITACIONAL', 'MATERIAL_CONSTRUCAO',
    ],
    keywords: ['alvara de construcao', 'alvara de obra', 'habite se'],
  },
  {
    slug: 'problema-na-rua',
    title: 'Problema na minha rua',
    description: 'Buraco, poste apagado, lixo, mato alto, bueiro entupido e árvore.',
    catalogKeys: [
      'SOLICITACAO_REPARO_VIA', 'ILUMINACAO_PUBLICA', 'LIMPEZA_URBANA', 'CAPINA_ROCAGEM', 'DESOBSTRUCAO_BUEIRO',
      'LIMPEZA_BOCA_LOBO', 'CONSERTO_CALCAMENTO', 'PODA_CANTEIRO', 'REMOCAO_ANIMAL', 'LIMPEZA_TERRENO_ABANDONADO',
      'REGISTRO_PROBLEMA_FOTO', 'SINALIZACAO_TRANSITO', 'DENUNCIA_VEICULO_ABANDONADO',
    ],
    keywords: ['buraco', 'iluminacao publica', 'tapa buraco'],
  },
  {
    slug: 'perdi-um-familiar',
    title: 'Perdi um familiar',
    description: 'Auxílio funeral, cemitério e apoio da assistência social.',
    catalogKeys: ['BENEFICIO_EVENTUAL', 'ATENDIMENTO_CRAS', 'ACOMPANHAMENTO_SOCIAL'],
    keywords: ['cemiterio', 'sepultamento', 'jazigo', 'funeral', 'obito', 'exumacao'],
  },
  {
    slug: 'produtor-rural',
    title: 'Sou produtor rural',
    description: 'Cadastro, máquinas, sementes, assistência técnica e feira do produtor.',
    catalogKeys: [
      'CADASTRO_PRODUTOR', 'CADASTRO_PROPRIEDADE_RURAL', 'SOLICITACAO_MAQUINAS', 'ASSISTENCIA_TECNICA',
      'DISTRIBUICAO_SEMENTES', 'DISTRIBUICAO_MUDAS', 'ANALISE_SOLO', 'FEIRA_PRODUTOR', 'DAP_DIGITAL', 'SEGURO_SAFRA',
    ],
    keywords: ['produtor rural', 'mecanizacao'],
  },
  {
    slug: 'cheguei-na-cidade',
    title: 'Cheguei na cidade',
    description: 'Cartão SUS, matrícula, cadastro de contribuinte, transporte e coleta de lixo.',
    catalogKeys: [
      'CARTAO_SUS', 'PROGRAMA_SAUDE_FAMILIA', 'MATRICULA_ESCOLAR', 'CADASTRO_UNICO', 'CADASTRO_CONTRIBUINTE',
      'ATUALIZACAO_CADASTRAL_IMOVEL', 'CARTAO_TRANSPORTE', 'SERVICOS_PUBLICOS:CALENDARIO_DE_COLETA_REGULAR',
    ],
    keywords: [],
  },
];

type ServiceLike = { id: string; name: string; catalogKey?: string | null };

/** Serviços do município que atendem a situação: os do catálogo primeiro, na ordem da lista */
export function servicesForSituation<T extends ServiceLike>(situation: LifeSituation, services: T[]): T[] {
  const rank = (s: T) => {
    const i = s.catalogKey ? situation.catalogKeys.indexOf(s.catalogKey) : -1;
    if (i >= 0) return i;
    const name = ` ${normalizeText(s.name)} `;
    return situation.keywords.some((k) => name.includes(` ${normalizeText(k)} `)) ? situation.catalogKeys.length : -1;
  };
  return services
    .map((s) => ({ s, r: rank(s) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.s);
}

/** Só as situações com pelo menos um serviço ativo, com os ids dos serviços */
export function situationsForServices<T extends ServiceLike>(services: T[]) {
  return LIFE_SITUATIONS.map((situation) => ({
    slug: situation.slug,
    title: situation.title,
    description: situation.description,
    serviceIds: servicesForSituation(situation, services).map((s) => s.id),
  })).filter((s) => s.serviceIds.length > 0);
}
