/**
 * Entendimento de texto do DigiBot SEM IA (custo zero).
 *
 * O cidadão escreve "quero fazer a carteirinha do meu filho pra escola"; o
 * serviço se chama "Cartão do Estudante". Busca por "contém a frase inteira"
 * (a de antes) não acha. Aqui:
 *   - tira acentos e palavras de enchimento ("quero", "fazer", "do", "meu"...);
 *   - aceita variações e erros de digitação (carteirinha ≈ cartão, estudnte ≈ estudante);
 *   - usa sinônimos comuns de prefeitura (buraco → asfalto, lâmpada → iluminação)
 *     e as palavras que o município cadastrou para cada serviço.
 */

export function normalizeText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(
  (
    'a o as os um uma uns umas de do da dos das no na nos nas em para pra pro pros pras por pelo pela com sem ' +
    'e ou que qual quais como quando onde porque pq meu minha meus minhas seu sua seus suas nosso nossa ' +
    'eu voce vc ele ela nos me te se lhe isso isto esse essa este esta aquele aquela ai la aqui ' +
    'quero queria quer gostaria preciso precisava precisa posso pode poderia consigo vou ir ' +
    'fazer faco fiz pedir peco solicitar solicito tirar emitir obter conseguir ter tenho tem ' +
    'oi ola bom dia boa tarde noite por favor favor obrigado obrigada ajuda ajudar sobre ' +
    'filho filha mae pai esposa marido familia ja ainda mais muito pouco agora hoje'
  ).split(' ')
);

/** Sinônimos comuns em atendimento municipal: palavra do cidadão → palavras do serviço */
const GLOBAL_SYNONYMS: Record<string, string[]> = {
  carteirinha: ['cartao', 'carteira'],
  carteira: ['cartao'],
  passe: ['cartao', 'transporte'],
  onibus: ['transporte', 'passe'],
  escola: ['estudante', 'escolar', 'educacao'],
  escolar: ['estudante', 'escola'],
  aluno: ['estudante', 'escolar'],
  buraco: ['asfalto', 'pavimentacao', 'tapa', 'pavimento'],
  asfalto: ['pavimentacao', 'buraco'],
  rua: ['vias', 'pavimentacao', 'logradouro'],
  lampada: ['iluminacao', 'luz', 'poste'],
  poste: ['iluminacao', 'lampada'],
  luz: ['iluminacao'],
  lixo: ['coleta', 'residuos', 'limpeza'],
  entulho: ['residuos', 'coleta', 'cacamba'],
  mato: ['rocada', 'capina', 'limpeza', 'terreno'],
  terreno: ['lote', 'imovel'],
  arvore: ['poda', 'corte', 'arborizacao'],
  galho: ['poda', 'arvore'],
  cachorro: ['animal', 'zoonoses', 'castracao'],
  gato: ['animal', 'zoonoses', 'castracao'],
  bicho: ['animal', 'zoonoses'],
  dengue: ['zoonoses', 'vetores', 'foco'],
  remedio: ['medicamento', 'farmacia'],
  medico: ['consulta', 'saude', 'atendimento'],
  exame: ['saude', 'laboratorio'],
  vacina: ['imunizacao', 'saude'],
  iptu: ['imposto', 'tributo', 'imovel'],
  imposto: ['tributo', 'iptu', 'taxa'],
  boleto: ['guia', 'pagamento', 'segunda'],
  certidao: ['certidao', 'declaracao', 'documento'],
  alvara: ['licenca', 'funcionamento'],
  obra: ['construcao', 'alvara', 'licenca'],
  agua: ['saneamento', 'abastecimento', 'vazamento'],
  esgoto: ['saneamento', 'vazamento'],
  creche: ['educacao', 'infantil', 'vaga', 'matricula'],
  matricula: ['vaga', 'escola', 'educacao'],
  emprego: ['trabalho', 'vaga', 'cadastro'],
  cesta: ['basica', 'assistencia', 'social', 'beneficio'],
  bolsa: ['beneficio', 'auxilio', 'assistencia'],
  auxilio: ['beneficio', 'assistencia'],
  denuncia: ['fiscalizacao', 'reclamacao'],
  barulho: ['perturbacao', 'sossego', 'fiscalizacao'],
  som: ['perturbacao', 'barulho'],
};

/** Raiz simples: plural, diminutivo e aumentativo ("carteirinhas" → "carteir") */
export function stem(token: string): string {
  let t = token;
  if (t.length > 5) t = t.replace(/(inhas|inhos|inha|inho|zinha|zinho|oes|aes|ais|eis|ns|es|s)$/, '');
  return t.length > 6 ? t.slice(0, 6) : t;
}

export function tokens(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Quão bem duas palavras casam: 1 igual, 0.85 mesma raiz, 0.7 erro de digitação, 0 nada */
export function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length >= 3 && (a + 's' === b || b + 's' === a)) return 0.9;
  if (a.length >= 4 && b.length >= 4 && stem(a) === stem(b)) return 0.85;
  const longest = Math.max(a.length, b.length);
  if (longest >= 5) {
    const max = longest >= 8 ? 2 : 1;
    if (levenshtein(a, b, max) <= max) return 0.7;
  }
  // começo comum longo ("carteir" x "carteira")
  if (a.length >= 5 && b.length >= 5 && (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5)))) return 0.6;
  return 0;
}

const SYNONYM_KEYS = Object.keys(GLOBAL_SYNONYMS);

/** Sinônimos da palavra; aceita erro de digitação ("carterinha" ≈ "carteirinha") com peso menor */
function synonymsOf(t: string): { words: string[]; weight: number } {
  const exact = GLOBAL_SYNONYMS[t] || GLOBAL_SYNONYMS[stem(t)];
  if (exact) return { words: exact, weight: 0.75 };
  if (t.length >= 5) {
    const near = SYNONYM_KEYS.find((k) => k.length >= 5 && tokenSimilarity(t, k) >= 0.7);
    if (near) return { words: [near, ...GLOBAL_SYNONYMS[near]], weight: 0.6 };
  }
  return { words: [], weight: 0 };
}

/** Palavras do cidadão + sinônimos (peso menor para sinônimo) */
export function expandQuery(query: string): Array<{ token: string; weight: number; original: string }> {
  const out: Array<{ token: string; weight: number; original: string }> = [];
  for (const t of tokens(query)) {
    out.push({ token: t, weight: 1, original: t });
    const syn = synonymsOf(t);
    for (const s of syn.words) out.push({ token: s, weight: syn.weight, original: t });
  }
  return out;
}

export interface MatchDoc {
  /** campos com peso: nome do serviço vale mais que a descrição */
  fields: Array<{ text: string; weight: number }>;
  /** frases exatas cadastradas (ex.: palavras do cidadão para o serviço) */
  phrases?: string[];
}

/**
 * Nota de 0 a 1 de quanto o texto do cidadão combina com o documento.
 * Cada palavra do cidadão conta pelo melhor casamento encontrado.
 */
/** Melhor casamento de cada palavra do cidadão com o documento (0 a 1) + frase inteira */
export function tokenScores(query: string, doc: MatchDoc): { scores: Map<string, number>; phrase: boolean } {
  const expanded = expandQuery(query);
  const originals = Array.from(new Set(expanded.map((e) => e.original)));
  const docTokens: Array<{ token: string; weight: number }> = [];
  for (const f of doc.fields) for (const t of tokens(f.text)) docTokens.push({ token: t, weight: f.weight });
  const maxWeight = Math.max(1, ...doc.fields.map((f) => f.weight));
  const scores = new Map<string, number>();
  for (const original of originals) {
    let best = 0;
    for (const q of expanded.filter((e) => e.original === original)) {
      for (const d of docTokens) {
        const sim = tokenSimilarity(q.token, d.token);
        if (sim > 0) best = Math.max(best, sim * q.weight * (d.weight / maxWeight));
      }
    }
    scores.set(original, best);
  }
  const nq = ` ${normalizeText(query)} `;
  const phrase = (doc.phrases || []).some((p) => {
    const np = normalizeText(p);
    return np.length >= 3 && nq.includes(` ${np} `);
  });
  return { scores, phrase };
}

export function scoreMatch(query: string, doc: MatchDoc): number {
  const expanded = expandQuery(query);
  const originals = Array.from(new Set(expanded.map((e) => e.original)));
  if (!originals.length) return 0;

  const docTokens: Array<{ token: string; weight: number }> = [];
  for (const f of doc.fields) for (const t of tokens(f.text)) docTokens.push({ token: t, weight: f.weight });
  const maxWeight = Math.max(1, ...doc.fields.map((f) => f.weight));

  let total = 0;
  for (const original of originals) {
    let best = 0;
    for (const q of expanded.filter((e) => e.original === original)) {
      for (const d of docTokens) {
        const sim = tokenSimilarity(q.token, d.token);
        if (sim > 0) best = Math.max(best, sim * q.weight * (d.weight / maxWeight));
      }
    }
    total += best;
  }
  let score = total / originals.length;

  // frase cadastrada inteira dentro do pedido: sinal forte
  const nq = ` ${normalizeText(query)} `;
  for (const p of doc.phrases || []) {
    const np = normalizeText(p);
    if (np.length >= 3 && nq.includes(` ${np} `)) score = Math.max(score, 0.9);
  }
  return Math.min(1, score);
}
