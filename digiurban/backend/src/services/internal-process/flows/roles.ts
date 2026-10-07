/**
 * Papéis das etapas ("quem faz cada etapa"). Em vez de configurar o setor de
 * cada etapa de cada fluxo (como no 1Doc), o município liga cada PAPEL a uma
 * unidade do organograma UMA vez, e todos os fluxos passam a se encaminhar
 * sozinhos. "Unidade que pediu" é sempre a unidade que abriu o processo.
 *
 * Regras puras (testáveis): lista de papéis e sugestão de unidade pelo nome.
 */

export type FlowRole =
  | 'DEMANDANTE'
  | 'COMPRAS'
  | 'LICITACAO'
  | 'JURIDICO'
  | 'FINANCAS'
  | 'CONTROLE_INTERNO'
  | 'AUTORIDADE'
  | 'CONTRATOS';

export interface FlowRoleInfo {
  key: FlowRole;
  name: string;
  hint: string;
  /** configurável no painel (a unidade que pediu é automática) */
  configurable: boolean;
  /** palavras do nome/sigla/competências da unidade que indicam o papel */
  keywords: string[];
}

export const FLOW_ROLES: Record<FlowRole, FlowRoleInfo> = {
  DEMANDANTE: {
    key: 'DEMANDANTE',
    name: 'Unidade que pediu',
    hint: 'Sempre a unidade que abriu o processo (DFD, estudo técnico, termo de referência).',
    configurable: false,
    keywords: [],
  },
  COMPRAS: {
    key: 'COMPRAS',
    name: 'Setor de compras',
    hint: 'Pesquisa de preços, aviso da dispensa, justificativas da contratação direta, intenção de registro de preços.',
    configurable: true,
    keywords: ['compra', 'suprimento', 'aquisic'],
  },
  LICITACAO: {
    key: 'LICITACAO',
    name: 'Agente de contratação / Pregoeiro',
    hint: 'Edital, divulgação, sessão, habilitação e recursos.',
    configurable: true,
    keywords: ['licitac', 'pregao', 'pregoeiro', 'agente de contratac', 'comissao de licitac', 'contratacoes'],
  },
  JURIDICO: {
    key: 'JURIDICO',
    name: 'Jurídico',
    hint: 'Parecer jurídico (art. 53 e art. 72, III).',
    configurable: true,
    keywords: ['juridic', 'procuradoria', 'procurador', 'assessoria juridica', 'advocacia'],
  },
  FINANCAS: {
    key: 'FINANCAS',
    name: 'Finanças / Orçamento',
    hint: 'Disponibilidade orçamentária (dotação e saldo).',
    configurable: true,
    keywords: ['financ', 'fazenda', 'orcament', 'contabil', 'tesour', 'planejamento e financ'],
  },
  CONTROLE_INTERNO: {
    key: 'CONTROLE_INTERNO',
    name: 'Controle interno',
    hint: 'Conferência do processo antes da homologação ou do pagamento (quando o município adota).',
    configurable: true,
    keywords: ['controle interno', 'controladoria', 'controlador'],
  },
  AUTORIDADE: {
    key: 'AUTORIDADE',
    name: 'Autoridade (Prefeito / Gabinete)',
    hint: 'Autoriza a abertura, a contratação direta e homologa.',
    configurable: true,
    keywords: ['gabinete', 'prefeito', 'chefia de gabinete'],
  },
  CONTRATOS: {
    key: 'CONTRATOS',
    name: 'Setor de contratos',
    hint: 'Contrato, ata de registro de preços, publicação no PNCP e portaria do fiscal.',
    configurable: true,
    keywords: ['contrato', 'convenio', 'gestao de contrat'],
  },
};

export const CONFIGURABLE_ROLES = Object.values(FLOW_ROLES).filter((role) => role.configurable).map((role) => role.key);

export function isFlowRole(value: unknown): value is FlowRole {
  return typeof value === 'string' && value in FLOW_ROLES;
}

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ');

export interface RoleUnitCandidate {
  id: string;
  nome: string;
  sigla?: string | null;
  competencias?: unknown;
  /** nível no organograma (unidade mais específica ganha no empate) */
  nivel?: number | null;
}

/**
 * Sugere a unidade de cada papel pelo nome, sigla e competências da unidade.
 * Sem IA. Nome conta mais que competência; no empate, a unidade mais
 * específica (nível maior) ganha — "Departamento de Compras" antes de
 * "Secretaria de Administração".
 */
export function suggestRoleUnits(units: RoleUnitCandidate[]): Partial<Record<FlowRole, string>> {
  const result: Partial<Record<FlowRole, string>> = {};
  for (const role of CONFIGURABLE_ROLES) {
    const keywords = FLOW_ROLES[role].keywords;
    let best: { id: string; score: number; nivel: number } | null = null;
    for (const unit of units) {
      const name = normalize(`${unit.nome} ${unit.sigla || ''}`);
      const competencias = Array.isArray(unit.competencias) ? normalize((unit.competencias as unknown[]).map(String).join(' ')) : '';
      let score = 0;
      for (const keyword of keywords) {
        if (name.includes(keyword)) score += 3;
        else if (competencias.includes(keyword)) score += 1;
      }
      if (score === 0) continue;
      const nivel = Number(unit.nivel || 0);
      if (!best || score > best.score || (score === best.score && nivel > best.nivel)) best = { id: unit.id, score, nivel };
    }
    if (best) result[role] = best.id;
  }
  return result;
}
