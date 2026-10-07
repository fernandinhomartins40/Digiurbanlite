/**
 * Fluxos de contratação pública — Lei nº 14.133/2021 (Nova Lei de Licitações).
 *
 * Cada fluxo é uma sequência de etapas com: fundamento legal, o que fazer
 * (checklist), os documentos que precisam existir (e ser assinados) para
 * avançar, e prazo sugerido em dias úteis.
 *
 *  - LICITACAO: fases do art. 17 (preparatória → divulgação → propostas e
 *    lances → julgamento → habilitação → recursal → homologação) + contrato.
 *  - DISPENSA / INEXIGIBILIDADE: contratação direta, instruída com os
 *    documentos do art. 72.
 *
 * Valores de referência atualizados pelo Decreto nº 12.807/2025 (vigência
 * 1º/01/2026, IPCA-E). Atualizar todo ano em DISPENSA_LIMITS.
 */

import { FLOW_ROLES, FlowRole } from './roles';

export type FlowKey = 'LICITACAO' | 'REGISTRO_PRECOS' | 'DISPENSA' | 'INEXIGIBILIDADE' | 'ADESAO_ATA';

export interface FlowStage {
  key: string;
  name: string;
  /** artigo(s) da Lei 14.133/2021 */
  legal: string;
  description: string;
  checklist: string[];
  /** documentos (modelos) que precisam existir para avançar */
  requiredDocs: string[];
  /** documentos que precisam estar assinados para avançar */
  signedDocs?: string[];
  optionalDocs?: string[];
  /** prazo sugerido para a etapa (dias úteis) */
  days: number;
  /** quem conduz (texto para a tela) */
  owner: string;
  /** papel que conduz: ao chegar na etapa, o processo vai sozinho para a unidade desse papel */
  role: FlowRole;
  /** destino fixo desta etapa (fluxo editado pelo município): vale mais que o papel */
  unitId?: string | null;
  unitName?: string | null;
  /** pessoa que recebe (opcional; sem ela, a unidade toda vê) */
  userId?: string | null;
  userName?: string | null;
}

export interface FlowDefinition {
  /** FlowKey dos fluxos prontos; 'CUSTOM' nos fluxos próprios do município */
  key: string;
  /** fluxo pronto de onde o próprio foi copiado (define os dados da contratação) */
  baseKey?: FlowKey | null;
  name: string;
  prefix: string;
  description: string;
  stages: FlowStage[];
}

/** Limites de dispensa por valor (art. 75, I e II, e § 7º) — Decreto 12.807/2025 */
export const DISPENSA_LIMITS = {
  year: 2026,
  decree: 'Decreto nº 12.807/2025',
  obrasEngenharia: 130984.2, // art. 75, I
  outros: 65492.11, // art. 75, II
  manutencaoVeiculos: 10478.74, // art. 75, § 7º
};

export const MODALIDADES = ['Pregão', 'Concorrência', 'Concurso', 'Leilão', 'Diálogo competitivo'] as const;
export const CRITERIOS = ['Menor preço', 'Maior desconto', 'Melhor técnica ou conteúdo artístico', 'Técnica e preço', 'Maior lance', 'Maior retorno econômico'] as const;
export const HIPOTESES_DISPENSA = [
  'Art. 75, I — obras e serviços de engenharia de pequeno valor',
  'Art. 75, II — outras compras e serviços de pequeno valor',
  'Art. 75, III — licitação deserta ou fracassada (há menos de 1 ano)',
  'Art. 75, VIII — emergência ou calamidade pública',
  'Art. 75 — outra hipótese (indicar o inciso na justificativa)',
] as const;
export const HIPOTESES_INEXIGIBILIDADE = [
  'Art. 74, I — fornecedor exclusivo',
  'Art. 74, II — profissional do setor artístico consagrado',
  'Art. 74, III — serviço técnico especializado de natureza predominantemente intelectual (notória especialização)',
  'Art. 74, IV — credenciamento',
  'Art. 74, V — aquisição ou locação de imóvel com características únicas',
] as const;

const DEMANDA: FlowStage = {
  key: 'DEMANDA',
  name: 'Formalização da demanda',
  legal: 'Art. 12, VII e art. 18, caput',
  description: 'A unidade que precisa registra o que precisa, por quê, quanto e para quando, e confere se está no Plano de Contratações Anual.',
  checklist: [
    'Descrever a necessidade e o interesse público',
    'Informar quantidade estimada e prazo desejado',
    'Conferir se a contratação está prevista no Plano de Contratações Anual (PCA)',
    'Indicar o responsável da área que pede',
  ],
  requiredDocs: ['DFD'],
  signedDocs: ['DFD'],
  days: 3,
  owner: 'Unidade que precisa da contratação',
  role: 'DEMANDANTE',
};

const PESQUISA: FlowStage = {
  key: 'PESQUISA_PRECOS',
  name: 'Pesquisa de preços (valor estimado)',
  legal: 'Art. 23, § 1º',
  description: 'Estimar o valor com base em preços de mercado, usando os parâmetros do art. 23 (painel de preços, contratações similares, mídia especializada, no mínimo 3 fornecedores, notas fiscais).',
  checklist: [
    'Usar pelo menos um dos parâmetros do art. 23, § 1º (de preferência mais de um)',
    'Pesquisa direta: no mínimo 3 fornecedores, com cotações de até 6 meses',
    'Contratações similares e notas fiscais: até 1 ano',
    'Descartar preços inexequíveis ou excessivos, justificando',
    'Registrar a metodologia e o valor estimado final',
  ],
  requiredDocs: ['PESQUISA_PRECOS'],
  signedDocs: ['PESQUISA_PRECOS'],
  days: 5,
  owner: 'Setor de compras',
  role: 'COMPRAS',
};

const ORCAMENTO: FlowStage = {
  key: 'ORCAMENTO',
  name: 'Disponibilidade orçamentária',
  legal: 'Art. 18, caput e art. 72, IV',
  description: 'A área de orçamento/finanças confirma que há recurso e indica a dotação orçamentária.',
  checklist: ['Indicar a dotação orçamentária (programa de trabalho, elemento de despesa e fonte)', 'Confirmar o saldo disponível para o valor estimado'],
  requiredDocs: ['DISPONIBILIDADE_ORCAMENTARIA'],
  signedDocs: ['DISPONIBILIDADE_ORCAMENTARIA'],
  days: 3,
  owner: 'Secretaria de Finanças / Orçamento',
  role: 'FINANCAS',
};

const PARECER: FlowStage = {
  key: 'PARECER_JURIDICO',
  name: 'Parecer jurídico',
  legal: 'Art. 53 (licitação) / art. 72, III (contratação direta)',
  description: 'O órgão de assessoramento jurídico faz o controle prévio de legalidade, em linguagem simples, apreciando todos os elementos indispensáveis.',
  checklist: ['Encaminhar o processo completo ao jurídico', 'Atender ou justificar as recomendações do parecer'],
  requiredDocs: ['PARECER_JURIDICO'],
  signedDocs: ['PARECER_JURIDICO'],
  days: 5,
  owner: 'Procuradoria / Assessoria Jurídica',
  role: 'JURIDICO',
};

const CONTRATO: FlowStage = {
  key: 'CONTRATO',
  name: 'Contrato, publicação e fiscal',
  legal: 'Arts. 89 a 95 e art. 117',
  description: 'Formalizar o contrato (ou instrumento equivalente), publicar no PNCP e designar o gestor e o fiscal do contrato.',
  checklist: [
    'Assinar o contrato com as cláusulas obrigatórias do art. 92',
    'Divulgar no PNCP: até 20 dias úteis (licitação) ou 10 dias úteis (contratação direta) — art. 94',
    'Designar gestor e fiscal do contrato por portaria (art. 117)',
    'Emitir a nota de empenho',
  ],
  requiredDocs: ['CONTRATO', 'PORTARIA_FISCAL'],
  signedDocs: ['CONTRATO', 'PORTARIA_FISCAL'],
  days: 10,
  owner: 'Setor de contratos',
  role: 'CONTRATOS',
};

const LICITACAO_STAGES: FlowStage[] = [
  DEMANDA,
  {
    key: 'ESTUDO_TECNICO',
    name: 'Estudo técnico preliminar e riscos',
    legal: 'Art. 18, I e X; § 1º e § 2º',
    description: 'Mostrar o problema e a melhor solução, com viabilidade técnica e econômica. Conteúdo mínimo: necessidade, quantidades, estimativa de valor, justificativa do parcelamento e posicionamento conclusivo (§ 2º).',
    checklist: [
      'Descrever a necessidade (inciso I)',
      'Estimar as quantidades (inciso IV)',
      'Estimar o valor (inciso VI)',
      'Justificar o parcelamento ou não (inciso VIII)',
      'Concluir pela viabilidade da contratação (inciso XIII)',
      'Justificar os elementos do § 1º que não forem tratados',
      'Analisar os riscos que podem comprometer a contratação (art. 18, X)',
    ],
    requiredDocs: ['ETP'],
    signedDocs: ['ETP'],
    optionalDocs: ['MAPA_RISCOS'],
    days: 10,
    owner: 'Unidade que precisa + equipe de planejamento',
    role: 'DEMANDANTE',
  },
  {
    key: 'TERMO_REFERENCIA',
    name: 'Termo de referência / projeto básico',
    legal: 'Art. 6º, XXIII e XXV; art. 18, II e III',
    description: 'Definir o objeto, a forma de execução e de pagamento, os critérios de aceitação e o modelo de gestão do contrato.',
    checklist: [
      'Definição do objeto, quantitativos e prazo do contrato',
      'Fundamentação (referência ao ETP)',
      'Requisitos da contratação e modelo de execução',
      'Modelo de gestão do contrato e critérios de medição e pagamento',
      'Forma e critérios de seleção do fornecedor',
      'Adequação orçamentária',
    ],
    requiredDocs: ['TERMO_REFERENCIA'],
    signedDocs: ['TERMO_REFERENCIA'],
    days: 7,
    owner: 'Unidade que precisa',
    role: 'DEMANDANTE',
  },
  PESQUISA,
  ORCAMENTO,
  {
    key: 'EDITAL',
    name: 'Minutas do edital e do contrato',
    legal: 'Art. 18, V e VI; art. 25',
    description: 'Elaborar o edital (modalidade, critério de julgamento, regras de habilitação e da sessão) e a minuta do contrato.',
    checklist: [
      'Definir a modalidade e o critério de julgamento',
      'Regras de habilitação (jurídica, técnica, fiscal, social, trabalhista e econômico-financeira)',
      'Modo de disputa (aberto/fechado) e intervalo de lances',
      'Minuta do contrato anexa ao edital',
    ],
    requiredDocs: ['MINUTA_EDITAL', 'MINUTA_CONTRATO'],
    days: 5,
    owner: 'Agente de contratação / Setor de licitações',
    role: 'LICITACAO',
  },
  PARECER,
  {
    key: 'AUTORIZACAO',
    name: 'Autorização e agente de contratação',
    legal: 'Arts. 7º e 8º',
    description: 'A autoridade competente autoriza a abertura da licitação e designa o agente de contratação (ou pregoeiro) e a equipe de apoio, respeitando a segregação de funções.',
    checklist: [
      'Autorização da autoridade competente',
      'Agente de contratação/pregoeiro: servidor efetivo ou empregado público dos quadros permanentes (art. 8º)',
      'Segregação de funções: quem pede não julga, quem julga não fiscaliza (art. 7º, § 1º)',
    ],
    requiredDocs: ['AUTORIZACAO'],
    signedDocs: ['AUTORIZACAO'],
    optionalDocs: ['PORTARIA_AGENTE'],
    days: 3,
    owner: 'Autoridade competente (Prefeito/Secretário)',
    role: 'AUTORIDADE',
  },
  {
    key: 'DIVULGACAO',
    name: 'Divulgação do edital',
    legal: 'Arts. 54 e 55',
    description: 'Publicar o edital no PNCP e o extrato no diário oficial e em jornal de grande circulação, respeitando os prazos mínimos para propostas.',
    checklist: [
      'Edital e anexos no PNCP (art. 54, caput)',
      'Extrato no diário oficial do município e em jornal diário de grande circulação (art. 54, § 1º)',
      'Prazo mínimo — bens: 8 dias úteis (menor preço/maior desconto) ou 15 dias úteis (demais)',
      'Prazo mínimo — serviços comuns e obras/serviços comuns de engenharia: 10 dias úteis (menor preço/maior desconto)',
      'Responder pedidos de esclarecimento e impugnações (até 3 dias úteis antes da sessão — art. 164)',
    ],
    requiredDocs: ['AVISO_LICITACAO'],
    signedDocs: ['AVISO_LICITACAO'],
    days: 10,
    owner: 'Agente de contratação',
    role: 'LICITACAO',
  },
  {
    key: 'SESSAO',
    name: 'Propostas, lances e julgamento',
    legal: 'Art. 17, III e IV; arts. 33 a 36 e 59',
    description: 'Realizar a sessão, receber propostas e lances e julgar conforme o critério do edital, verificando a exequibilidade.',
    checklist: [
      'Sessão pública (preferencialmente eletrônica — art. 17, § 2º)',
      'Classificar e julgar pelo critério do edital',
      'Desclassificar propostas inexequíveis ou acima do orçamento (art. 59)',
      'Negociar com o primeiro colocado (art. 61)',
    ],
    requiredDocs: ['ATA_SESSAO'],
    signedDocs: ['ATA_SESSAO'],
    days: 3,
    owner: 'Agente de contratação / Pregoeiro',
    role: 'LICITACAO',
  },
  {
    key: 'HABILITACAO',
    name: 'Habilitação',
    legal: 'Arts. 62 a 70',
    description: 'Verificar os documentos de habilitação do vencedor (como regra, só do primeiro colocado, depois do julgamento — art. 63, II).',
    checklist: [
      'Habilitação jurídica',
      'Qualificação técnica',
      'Regularidade fiscal, social e trabalhista (certidões válidas)',
      'Qualificação econômico-financeira',
      'Registrar o resultado na ata ou em relatório',
    ],
    requiredDocs: [],
    optionalDocs: ['ATA_SESSAO'],
    days: 3,
    owner: 'Agente de contratação',
    role: 'LICITACAO',
  },
  {
    key: 'RECURSOS',
    name: 'Fase recursal',
    legal: 'Art. 165',
    description: 'Prazo de 3 dias úteis para recurso após a intimação ou a lavratura da ata, e mais 3 dias úteis para contrarrazões. A decisão é da autoridade, se o agente não reconsiderar.',
    checklist: [
      'Registrar a intenção de recorrer na sessão (se o edital pedir)',
      'Aguardar 3 dias úteis para razões e 3 dias úteis para contrarrazões',
      'Decidir os recursos (reconsideração em 3 dias úteis ou envio à autoridade)',
      'Sem recurso: registrar a ausência e seguir',
    ],
    requiredDocs: [],
    optionalDocs: ['DECISAO_RECURSO'],
    days: 6,
    owner: 'Agente de contratação / Autoridade',
    role: 'LICITACAO',
  },
  {
    key: 'HOMOLOGACAO',
    name: 'Adjudicação e homologação',
    legal: 'Art. 71',
    description: 'A autoridade superior pode sanear irregularidades, revogar (interesse público), anular (ilegalidade) ou adjudicar o objeto e homologar a licitação.',
    checklist: ['Conferir a regularidade de todo o processo', 'Adjudicar ao vencedor e homologar', 'Publicar o resultado'],
    requiredDocs: ['TERMO_HOMOLOGACAO'],
    signedDocs: ['TERMO_HOMOLOGACAO'],
    days: 3,
    owner: 'Autoridade competente',
    role: 'AUTORIDADE',
  },
  CONTRATO,
];

/** etapa da licitação comum (para reaproveitar no registro de preços) */
const lic = (key: string): FlowStage => LICITACAO_STAGES.find((stage) => stage.key === key)!;

export const FLOWS: Record<FlowKey, FlowDefinition> = {
  LICITACAO: {
    key: 'LICITACAO',
    name: 'Processo de licitação',
    prefix: 'LIC',
    description: 'Licitação pela Lei 14.133/2021: planejamento, edital, sessão, julgamento, habilitação, recursos, homologação e contrato.',
    stages: LICITACAO_STAGES,
  },
  REGISTRO_PRECOS: {
    key: 'REGISTRO_PRECOS',
    name: 'Pregão — registro de preços',
    prefix: 'SRP',
    description: 'Licitação pelo sistema de registro de preços (arts. 82 a 86): intenção de registro de preços com as secretarias participantes, edital com a minuta da ata e assinatura da ata. A dotação orçamentária é indicada só na hora de cada contratação.',
    stages: [
      DEMANDA,
      {
        key: 'INTENCAO_REGISTRO',
        name: 'Intenção de registro de preços (IRP)',
        legal: 'Art. 86',
        description: 'O órgão gerenciador divulga a intenção de registrar preços para que as outras secretarias (participantes) informem o que vão precisar, e consolida as quantidades. Dispensável quando só o gerenciador vai contratar, justificando (art. 86, § 1º).',
        checklist: [
          'Divulgar a intenção de registro de preços às secretarias e órgãos (prazo do regulamento do município)',
          'Receber de cada participante a sua estimativa de quantidades',
          'Consolidar as quantidades por item e por participante',
          'Justificar se a IRP não for feita (art. 86, § 1º)',
        ],
        requiredDocs: ['AVISO_IRP'],
        signedDocs: ['AVISO_IRP'],
        days: 8,
        owner: 'Setor de compras (órgão gerenciador)',
        role: 'COMPRAS',
      },
      {
        ...lic('ESTUDO_TECNICO'),
        checklist: [...lic('ESTUDO_TECNICO').checklist, 'Justificar a adoção do registro de preços (compras frequentes, entregas parceladas, vários órgãos ou quantidade incerta)'],
      },
      lic('TERMO_REFERENCIA'),
      lic('PESQUISA_PRECOS'),
      {
        ...lic('EDITAL'),
        name: 'Minutas do edital e da ata',
        legal: 'Art. 82',
        description: 'Edital do registro de preços com as quantidades máximas de cada participante, a possibilidade (ou não) de adesão, o prazo de validade da ata e a minuta da ata de registro de preços.',
        checklist: [
          'Quantidades máximas por item e por participante (art. 82, I e II)',
          'Possibilidade de adesão de não participantes e limites (art. 86, §§ 4º e 5º)',
          'Critério de julgamento (menor preço ou maior desconto) e modo de disputa',
          'Minuta da ata de registro de preços anexa ao edital',
          'Indicar que a dotação será informada só na contratação',
        ],
        requiredDocs: ['MINUTA_EDITAL', 'MINUTA_ATA'],
        optionalDocs: ['MINUTA_CONTRATO'],
      },
      lic('PARECER_JURIDICO'),
      lic('AUTORIZACAO'),
      lic('DIVULGACAO'),
      lic('SESSAO'),
      lic('HABILITACAO'),
      lic('RECURSOS'),
      lic('HOMOLOGACAO'),
      {
        key: 'ATA',
        name: 'Assinatura e publicação da ata',
        legal: 'Arts. 82 a 84 e art. 94',
        description: 'Convocar o vencedor para assinar a ata de registro de preços, publicar no PNCP e informar as secretarias participantes. A ata vale por 1 ano, prorrogável por igual período se o preço continuar vantajoso (art. 84).',
        checklist: [
          'Convocar o fornecedor para assinar a ata no prazo do edital',
          'Formar o cadastro de reserva com quem aceitar o mesmo preço (art. 82, VII)',
          'Publicar a ata no PNCP',
          'Avisar as secretarias participantes: cada contratação sai com a sua dotação e nota de empenho',
        ],
        requiredDocs: ['ATA_REGISTRO_PRECOS'],
        signedDocs: ['ATA_REGISTRO_PRECOS'],
        days: 5,
        owner: 'Setor de contratos',
        role: 'CONTRATOS',
      },
    ],
  },
  DISPENSA: {
    key: 'DISPENSA',
    name: 'Contratação direta — dispensa',
    prefix: 'DIS',
    description: 'Dispensa de licitação (art. 75), instruída com os documentos do art. 72.',
    stages: [
      DEMANDA,
      {
        key: 'TERMO_REFERENCIA',
        name: 'Termo de referência (e ETP, quando cabível)',
        legal: 'Art. 72, I',
        description: 'Definir o objeto e as condições. Para dispensa por valor, o ETP e a análise de riscos podem ser simplificados ou dispensados, justificando.',
        checklist: ['Termo de referência ou projeto básico', 'ETP e análise de riscos, se for o caso (ou justificar a dispensa deles)'],
        requiredDocs: ['TERMO_REFERENCIA'],
        signedDocs: ['TERMO_REFERENCIA'],
        optionalDocs: ['ETP', 'MAPA_RISCOS'],
        days: 5,
        owner: 'Unidade que precisa',
        role: 'DEMANDANTE',
      },
      PESQUISA,
      ORCAMENTO,
      {
        key: 'AVISO_DISPENSA',
        name: 'Aviso para propostas adicionais',
        legal: 'Art. 75, § 3º',
        description: 'Na dispensa por valor (art. 75, I e II), divulgar aviso em sítio eletrônico oficial por no mínimo 3 dias úteis, para receber propostas adicionais, e escolher a mais vantajosa.',
        checklist: [
          'Publicar o aviso com a especificação do objeto (mínimo 3 dias úteis)',
          'Receber e comparar as propostas adicionais',
          'Somar as despesas do mesmo objeto no exercício (art. 75, § 1º) para não fracionar',
        ],
        requiredDocs: ['AVISO_DISPENSA'],
        signedDocs: ['AVISO_DISPENSA'],
        days: 3,
        owner: 'Setor de compras',
        role: 'COMPRAS',
      },
      {
        key: 'JUSTIFICATIVA',
        name: 'Razão da escolha e justificativa de preço',
        legal: 'Art. 72, V, VI e VII',
        description: 'Justificar a hipótese de dispensa, por que este fornecedor e por que este preço, e conferir a habilitação mínima dele.',
        checklist: [
          'Indicar a hipótese legal (inciso do art. 75)',
          'Razão da escolha do contratado (art. 72, VI)',
          'Justificativa do preço (art. 72, VII)',
          'Habilitação e qualificação mínima do contratado (certidões) — art. 72, V',
        ],
        requiredDocs: ['JUSTIFICATIVA_CONTRATACAO_DIRETA'],
        signedDocs: ['JUSTIFICATIVA_CONTRATACAO_DIRETA'],
        days: 3,
        owner: 'Setor de compras',
        role: 'COMPRAS',
      },
      PARECER,
      {
        key: 'AUTORIZACAO',
        name: 'Autorização e publicação do ato',
        legal: 'Art. 72, VIII e parágrafo único',
        description: 'A autoridade competente autoriza a contratação direta; o ato (ou o extrato do contrato) é divulgado e mantido em sítio eletrônico oficial.',
        checklist: ['Autorização da autoridade competente', 'Divulgar o ato que autoriza a contratação direta em sítio eletrônico oficial'],
        requiredDocs: ['AUTORIZACAO'],
        signedDocs: ['AUTORIZACAO'],
        days: 3,
        owner: 'Autoridade competente',
        role: 'AUTORIDADE',
      },
      CONTRATO,
    ],
  },
  INEXIGIBILIDADE: {
    key: 'INEXIGIBILIDADE',
    name: 'Contratação direta — inexigibilidade',
    prefix: 'INX',
    description: 'Inexigibilidade de licitação (art. 74 — competição inviável), instruída com os documentos do art. 72.',
    stages: [
      DEMANDA,
      {
        key: 'TERMO_REFERENCIA',
        name: 'Termo de referência (e ETP, quando cabível)',
        legal: 'Art. 72, I',
        description: 'Definir o objeto e as condições e demonstrar por que a competição é inviável.',
        checklist: ['Termo de referência ou projeto básico', 'ETP e análise de riscos, se for o caso'],
        requiredDocs: ['TERMO_REFERENCIA'],
        signedDocs: ['TERMO_REFERENCIA'],
        optionalDocs: ['ETP', 'MAPA_RISCOS'],
        days: 5,
        owner: 'Unidade que precisa',
        role: 'DEMANDANTE',
      },
      {
        ...PESQUISA,
        name: 'Justificativa do valor',
        legal: 'Art. 23, § 4º',
        description: 'Na inexigibilidade, comprovar que o preço é compatível com o que o contratado cobra de outros (notas fiscais ou contratos de até 1 ano antes).',
        checklist: [
          'Notas fiscais ou contratos do mesmo objeto emitidos para outros contratantes (até 1 ano)',
          'Ou outro meio idôneo de comprovação do preço praticado',
        ],
      },
      ORCAMENTO,
      {
        key: 'JUSTIFICATIVA',
        name: 'Inviabilidade de competição e razão da escolha',
        legal: 'Art. 74 e art. 72, V, VI e VII',
        description: 'Comprovar a inviabilidade de competição (exclusividade, notória especialização, consagração...), a razão da escolha e o preço, e conferir a habilitação mínima.',
        checklist: [
          'Indicar a hipótese do art. 74 e anexar a comprovação (atestado de exclusividade, portfólio, notória especialização)',
          'Vedada a inexigibilidade para serviços de publicidade e divulgação (art. 74, III)',
          'Razão da escolha e justificativa de preço',
          'Habilitação e qualificação mínima do contratado',
        ],
        requiredDocs: ['JUSTIFICATIVA_CONTRATACAO_DIRETA'],
        signedDocs: ['JUSTIFICATIVA_CONTRATACAO_DIRETA'],
        days: 3,
        owner: 'Setor de compras',
        role: 'COMPRAS',
      },
      PARECER,
      {
        key: 'AUTORIZACAO',
        name: 'Autorização e publicação do ato',
        legal: 'Art. 72, VIII e parágrafo único',
        description: 'A autoridade competente autoriza a contratação direta; o ato é divulgado em sítio eletrônico oficial.',
        checklist: ['Autorização da autoridade competente', 'Divulgar o ato em sítio eletrônico oficial'],
        requiredDocs: ['AUTORIZACAO'],
        signedDocs: ['AUTORIZACAO'],
        days: 3,
        owner: 'Autoridade competente',
        role: 'AUTORIDADE',
      },
      CONTRATO,
    ],
  },
  ADESAO_ATA: {
    key: 'ADESAO_ATA',
    name: 'Adesão a ata de registro de preços',
    prefix: 'ADA',
    description: 'Contratar usando a ata de registro de preços de outro órgão (carona), com justificativa da vantagem, preços compatíveis com o mercado e aceite do gerenciador e do fornecedor (art. 86, § 2º).',
    stages: [
      DEMANDA,
      {
        key: 'JUSTIFICATIVA_ADESAO',
        name: 'Vantagem da adesão e preços',
        legal: 'Art. 86, § 2º, I e II',
        description: 'Mostrar por que aderir é vantajoso (inclusive risco de desabastecimento) e que os preços da ata estão compatíveis com os de mercado.',
        checklist: [
          'Conferir se a ata está vigente e se o objeto atende à necessidade',
          'Justificar a vantagem da adesão (art. 86, § 2º, I)',
          'Demonstrar que os valores registrados são compatíveis com o mercado (art. 86, § 2º, II, e art. 23)',
          'Conferir se a ata admite adesão (art. 86, § 3º, e edital da ata)',
        ],
        requiredDocs: ['JUSTIFICATIVA_ADESAO'],
        signedDocs: ['JUSTIFICATIVA_ADESAO'],
        optionalDocs: ['PESQUISA_PRECOS'],
        days: 5,
        owner: 'Setor de compras',
        role: 'COMPRAS',
      },
      {
        key: 'ACEITE_ADESAO',
        name: 'Aceite do gerenciador e do fornecedor',
        legal: 'Art. 86, § 2º, III, e §§ 4º e 5º',
        description: 'Pedir a autorização do órgão gerenciador da ata e o aceite do fornecedor, respeitando os limites de quantidade da adesão.',
        checklist: [
          'Enviar ofício ao órgão gerenciador pedindo a adesão',
          'Juntar a autorização do gerenciador e o aceite do fornecedor',
          'Até 50% das quantidades de cada item por órgão que adere (art. 86, § 4º)',
          'Somadas, as adesões não passam do dobro da quantidade registrada (art. 86, § 5º)',
        ],
        requiredDocs: ['OFICIO_ADESAO'],
        signedDocs: ['OFICIO_ADESAO'],
        days: 10,
        owner: 'Setor de compras',
        role: 'COMPRAS',
      },
      ORCAMENTO,
      PARECER,
      {
        key: 'AUTORIZACAO',
        name: 'Autorização da adesão',
        legal: 'Art. 86, § 2º',
        description: 'A autoridade competente autoriza a adesão e a contratação.',
        checklist: ['Autorização da autoridade competente', 'Divulgar o ato em sítio eletrônico oficial'],
        requiredDocs: ['AUTORIZACAO'],
        signedDocs: ['AUTORIZACAO'],
        days: 3,
        owner: 'Autoridade competente',
        role: 'AUTORIDADE',
      },
      CONTRATO,
    ],
  },
};

export function getFlow(key: string | null | undefined): FlowDefinition | null {
  return key && key in FLOWS ? FLOWS[key as FlowKey] : null;
}

/**
 * Fluxo de um processo: o próprio do município fica gravado no processo
 * (flowSnapshot) — mudar o fluxo depois não mexe nos processos em andamento.
 */
export function resolveFlow(process: { flowKey?: string | null; flowSnapshot?: unknown }): FlowDefinition | null {
  const snapshot = process.flowSnapshot as FlowDefinition | null | undefined;
  if (snapshot && Array.isArray(snapshot.stages) && snapshot.stages.length) return snapshot;
  return getFlow(process.flowKey);
}

/** Fluxo pronto que define os dados da contratação (o próprio usa o de origem) */
export function flowBaseKey(flow: Pick<FlowDefinition, 'key' | 'baseKey'> | null | undefined): FlowKey | null {
  if (!flow) return null;
  if (flow.key in FLOWS) return flow.key as FlowKey;
  return flow.baseKey && flow.baseKey in FLOWS ? flow.baseKey : null;
}

/** Que dados da contratação o fluxo pede: modalidade/critério, hipótese legal ou a ata */
export function fieldsKind(baseKey: string | null | undefined): 'licitacao' | 'direta' | 'adesao' | null {
  if (baseKey === 'LICITACAO' || baseKey === 'REGISTRO_PRECOS') return 'licitacao';
  if (baseKey === 'DISPENSA' || baseKey === 'INEXIGIBILIDADE') return 'direta';
  if (baseKey === 'ADESAO_ATA') return 'adesao';
  return null;
}

export function roleName(role: string): string {
  return (FLOW_ROLES as Record<string, { name: string }>)[role]?.name || role;
}

export function getStage(flow: FlowDefinition, stageKey: string | null | undefined): FlowStage | null {
  return flow.stages.find((stage) => stage.key === stageKey) || null;
}

export function nextStage(flow: FlowDefinition, stageKey: string | null | undefined): FlowStage | null {
  const index = flow.stages.findIndex((stage) => stage.key === stageKey);
  return index >= 0 && index < flow.stages.length - 1 ? flow.stages[index + 1] : null;
}

export function previousStage(flow: FlowDefinition, stageKey: string | null | undefined): FlowStage | null {
  const index = flow.stages.findIndex((stage) => stage.key === stageKey);
  return index > 0 ? flow.stages[index - 1] : null;
}

/**
 * Para qual unidade a etapa vai: "unidade que pediu" = a unidade de origem;
 * os outros papéis = a unidade ligada no painel; sem ninguém ligado, fica onde
 * está (null) e a tela avisa para configurar.
 */
export function stageUnitId(stage: Pick<FlowStage, 'role'>, originUnitId: string, roleUnits: Partial<Record<string, string>>): string | null {
  if (!stage.role || stage.role === 'DEMANDANTE') return originUnitId;
  return roleUnits[stage.role] || null;
}

export interface RoleRoute {
  unitId: string;
  unitName?: string | null;
  userId?: string | null;
  userName?: string | null;
}

/**
 * Destino completo da etapa (unidade + pessoa): 1) destino fixo da etapa,
 * 2) unidade que pediu, 3) papel configurado (unidade e, se houver, o
 * servidor responsável). null = ninguém definido.
 */
export function stageRoute(
  stage: Pick<FlowStage, 'role' | 'unitId' | 'unitName' | 'userId' | 'userName'>,
  origin: { id: string; name?: string | null },
  roleRoutes: Partial<Record<string, RoleRoute>>
): RoleRoute | null {
  if (stage.unitId) return { unitId: stage.unitId, unitName: stage.unitName || null, userId: stage.userId || null, userName: stage.userName || null };
  if (!stage.role || stage.role === 'DEMANDANTE') return { unitId: origin.id, unitName: origin.name || null, userId: null, userName: null };
  const route = roleRoutes[stage.role];
  return route ? { unitId: route.unitId, unitName: route.unitName || null, userId: route.userId || null, userName: route.userName || null } : null;
}

/** O que falta para avançar a etapa (regra pura, testável) */
export function missingForStage(
  stage: FlowStage,
  documents: Array<{ templateKey: string; signedAt?: Date | string | null }>
): string[] {
  const missing: string[] = [];
  for (const key of stage.requiredDocs) {
    const docs = documents.filter((doc) => doc.templateKey === key);
    if (docs.length === 0) missing.push(`documento: ${key}`);
    else if ((stage.signedDocs || []).includes(key) && !docs.some((doc) => doc.signedAt)) missing.push(`assinatura: ${key}`);
  }
  return missing;
}

/** Aviso de limite da dispensa por valor (art. 75, I e II) */
export function dispensaLimitWarning(fields: { hipotese?: string; valorEstimado?: number }): string | null {
  const value = Number(fields.valorEstimado || 0);
  if (!value || !fields.hipotese) return null;
  if (fields.hipotese.startsWith('Art. 75, I ') && value > DISPENSA_LIMITS.obrasEngenharia) {
    return `O valor passa do limite da dispensa para obras e engenharia (R$ ${DISPENSA_LIMITS.obrasEngenharia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — ${DISPENSA_LIMITS.decree}). Faça licitação.`;
  }
  if (fields.hipotese.startsWith('Art. 75, II ') && value > DISPENSA_LIMITS.outros) {
    return `O valor passa do limite da dispensa para compras e serviços (R$ ${DISPENSA_LIMITS.outros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — ${DISPENSA_LIMITS.decree}). Faça licitação.`;
  }
  return null;
}
