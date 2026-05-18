/**
 * ReservedKeywords
 * Palavras e frases reservadas do DigiBot com seus significados e ações.
 *
 * Regras de prioridade (maior → menor):
 *   1. CANCEL   — encerra o fluxo atual e volta ao menu
 *   2. HUMAN    — solicita atendimento humano
 *   3. MENU     — volta ao menu principal
 *   4. HELP     — abre central de ajuda
 *   5. BACK     — volta um passo (quando disponível)
 *   6. CONTINUE — retoma etapa atual
 *   7. CONFIRM  — confirma/aceita
 *   8. REJECT   — nega/recusa
 */

export type ReservedAction =
  | 'cancel'
  | 'human'
  | 'menu'
  | 'help'
  | 'back'
  | 'continue'
  | 'confirm'
  | 'reject';

interface KeywordGroup {
  action: ReservedAction;
  /** Aliases exatos (após normalização) */
  exact: string[];
  /** Substrings que disparam o match parcial */
  contains: string[];
}

const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    action: 'cancel',
    exact: [
      'cancelar', 'cancel', 'sair', 'exit', 'encerrar', 'encerrar atendimento',
      'encerrar conversa', 'fechar', 'fechar atendimento', 'desistir', 'parar',
      'pare', 'abandonar', 'quero sair', 'quero cancelar', 'nao quero mais',
      'não quero mais', 'deixa pra la', 'deixa para la', 'esquece', 'esqueça',
    ],
    contains: ['quero cancelar', 'quero sair', 'nao quero mais', 'não quero mais'],
  },
  {
    action: 'human',
    exact: [
      'humano', 'atendente', 'servidor', 'falar com humano', 'falar com atendente',
      'falar com servidor', 'quero falar com humano', 'quero falar com atendente',
      'quero falar com alguem', 'quero falar com uma pessoa', 'pessoa real',
      'suporte humano', 'preciso de humano', 'me passa para um humano',
      'transferir para atendente', 'transferir para humano', 'chamar atendente',
      'chamar humano', 'atendimento humano', 'falar com alguem', 'falar com pessoa',
      'preciso de atendente', 'preciso de ajuda humana',
    ],
    contains: ['falar com humano', 'falar com atendente', 'falar com alguem', 'atendente humano'],
  },
  {
    action: 'menu',
    exact: [
      'menu', 'menu principal', 'voltar ao menu', 'voltar menu', 'ir ao menu',
      'ir para menu', 'inicio', 'inicial', 'tela inicial', 'pagina inicial',
      'pagina principal', 'home', 'reiniciar', 'recomecar', 'comecar de novo',
      'novo atendimento', 'voltar ao inicio', 'volta ao menu',
    ],
    contains: ['voltar ao menu', 'voltar menu', 'comecar de novo'],
  },
  {
    action: 'help',
    exact: [
      'ajuda', 'help', 'socorro', 'preciso de ajuda', 'nao sei', 'não sei',
      'como funciona', 'nao entendi', 'não entendi', 'como usar', 'o que fazer',
      'duvida', 'tenho duvida', 'tenho uma duvida', 'pode ajudar',
      'me ajuda', 'me ajude', 'preciso de suporte',
    ],
    contains: ['preciso de ajuda', 'nao entendi', 'não entendi'],
  },
  {
    action: 'back',
    exact: [
      'voltar', 'voltar passo', 'passo anterior', 'anterior', 'retornar',
      'rever', 'rever resposta', 'volta', 'quero voltar',
    ],
    contains: ['quero voltar', 'voltar passo'],
  },
  {
    action: 'continue',
    exact: [
      'continuar', 'continue', 'seguir', 'prosseguir', 'manter',
      'manter atendimento', 'pode continuar', 'ok continuar',
    ],
    contains: ['manter atendimento', 'pode continuar'],
  },
  {
    action: 'confirm',
    exact: [
      'sim', 'confirmar', 'confirmo', 'ok', 'pode enviar', 'enviar',
      'correto', 'esta certo', 'está certo', 'esta correto', 'está correto',
      'pode prosseguir', 'tudo certo', 'concordo', 'aceito',
    ],
    contains: ['pode enviar', 'esta correto', 'está correto'],
  },
  {
    action: 'reject',
    exact: [
      'nao', 'não', 'errado', 'esta errado', 'está errado', 'incorreto',
      'nao quero', 'não quero', 'recusar', 'recuso', 'rejeitar',
    ],
    contains: ['esta errado', 'está errado', 'nao quero', 'não quero'],
  },
];

/** Remove acentos e converte para lowercase */
export function normalizeKeyword(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Detecta se uma mensagem é uma palavra/frase reservada.
 * Retorna a ação correspondente ou null se não for reservada.
 */
export function detectReservedAction(message: string): ReservedAction | null {
  const normalized = normalizeKeyword(message);
  if (!normalized) return null;

  for (const group of KEYWORD_GROUPS) {
    if (group.exact.includes(normalized)) return group.action;
    if (group.contains.some((pattern) => normalized.includes(pattern))) return group.action;
  }

  return null;
}

/**
 * Retorna true se a mensagem é exclusivamente uma palavra reservada
 * (sem conteúdo adicional relevante).
 */
export function isStrictReservedKeyword(message: string): boolean {
  return detectReservedAction(message) !== null;
}

/** Mensagens de resposta padrão para cada ação reservada */
export const RESERVED_RESPONSES: Record<ReservedAction, string> = {
  cancel:
    'Atendimento encerrado. Quando quiser, é só enviar uma mensagem e comecarei um novo atendimento.',
  human:
    'Certo! Vou sinalizar para um atendente humano continuar este atendimento. Aguarde um momento.',
  menu: 'Voltando ao menu principal...',
  help: 'Abrindo a central de ajuda...',
  back: 'Voltando para a etapa anterior...',
  continue: 'Continuando de onde paramos...',
  confirm: 'Confirmado!',
  reject: 'Ok, não confirmado.',
};
