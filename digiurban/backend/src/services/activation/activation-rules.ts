/**
 * Primeiros passos do município (M5) — regra pura: dos números que o banco já
 * tem, monta a lista de ativação. Sem tabela própria: "feito" é sempre
 * recalculado, então o passo some sozinho quando a prefeitura resolve.
 */

export interface ActivationFacts {
  hasLogo: boolean;
  /** alguma secretaria ativada/desativada/renomeada pela prefeitura */
  departmentsReviewed: boolean;
  /** servidores ativos do município (sem contar o super admin) */
  activeUsers: number;
  /** servidores diferentes com lotação ATIVA no organograma */
  usersWithAssignment: number;
  activeServices: number;
  /** serviços ativos criados ou editados pela prefeitura (fora do catálogo puro) */
  reviewedServices: number;
  botPublished: boolean;
  hasMailSender: boolean;
  /** papéis do processo interno ligados a uma unidade */
  linkedProcessRoles: number;
  protocols: number;
}

export interface ActivationStep {
  key: string;
  titulo: string;
  texto: string;
  feito: boolean;
  /** tela que resolve o passo; null = depende da equipe DigiUrban */
  link: string | null;
}

export interface ActivationResult {
  steps: ActivationStep[];
  feitos: number;
  total: number;
  percentual: number;
  completo: boolean;
}

export function buildActivationSteps(f: ActivationFacts): ActivationResult {
  const steps: ActivationStep[] = [
    {
      key: 'municipio',
      titulo: 'Brasão e dados do município',
      texto: f.hasLogo
        ? 'O brasão já aparece nos documentos e no portal.'
        : 'Envie o brasão e os dados da prefeitura para a equipe DigiUrban colocar no sistema.',
      feito: f.hasLogo,
      link: null,
    },
    {
      key: 'secretarias',
      titulo: 'Conferir as secretarias',
      texto: 'Desligue as secretarias que o município não tem e acerte os nomes.',
      feito: f.departmentsReviewed,
      link: '/admin/organograma/secretarias',
    },
    {
      key: 'servidores',
      titulo: 'Cadastrar os servidores',
      texto: 'Cadastre quem vai trabalhar no sistema além de você.',
      feito: f.activeUsers >= 2,
      link: '/admin/servidores/novo',
    },
    {
      key: 'lotacoes',
      titulo: 'Colocar cada servidor no seu lugar',
      texto: 'Diga em que secretaria e unidade cada servidor trabalha.',
      feito: f.usersWithAssignment >= 2,
      link: '/admin/organograma/lotacoes',
    },
    {
      key: 'servicos',
      titulo: 'Revisar os serviços',
      texto: 'Confira prazos e documentos dos serviços que o cidadão pode pedir.',
      feito: f.activeServices > 0 && f.reviewedServices > 0,
      link: '/admin/servicos',
    },
    {
      key: 'digibot',
      titulo: 'Publicar o assistente (DigiBot)',
      texto: 'Ajuste o nome e a mensagem de boas-vindas e publique.',
      feito: f.botPublished,
      link: '/admin/digibot',
    },
    {
      key: 'email',
      titulo: 'Remetente dos e-mails',
      texto: 'Escolha o nome que aparece nos e-mails que o cidadão recebe.',
      feito: f.hasMailSender,
      link: '/admin/email',
    },
    {
      key: 'processo-interno',
      titulo: 'Setores do processo interno',
      texto: 'Diga qual unidade cuida de compras, jurídico, finanças e as outras etapas.',
      feito: f.linkedProcessRoles > 0,
      link: '/admin/processos-internos/configurar',
    },
    {
      key: 'pedido-teste',
      titulo: 'Fazer um pedido de teste',
      texto: 'Abra um pedido no balcão para ver o caminho completo.',
      feito: f.protocols > 0,
      link: '/admin/balcao',
    },
  ];

  const feitos = steps.filter((s) => s.feito).length;
  const total = steps.length;
  return { steps, feitos, total, percentual: Math.round((feitos / total) * 100), completo: feitos === total };
}

/** Cartões do Início que a pessoa pode dispensar (guardados em preferências). */
export const DISMISSIBLE_CARDS = ['activation', 'welcome'] as const;
export type DismissibleCard = (typeof DISMISSIBLE_CARDS)[number];

/** Junta o cartão dispensado ao `dashboardLayout` sem apagar o que já existe nele. */
export function withDismissedCard(layout: unknown, card: DismissibleCard): Record<string, any> {
  const base = layout && typeof layout === 'object' && !Array.isArray(layout) ? (layout as Record<string, any>) : {};
  const current: string[] = Array.isArray(base.dismissedCards) ? base.dismissedCards.filter((c: unknown) => typeof c === 'string') : [];
  return { ...base, dismissedCards: current.includes(card) ? current : [...current, card] };
}
