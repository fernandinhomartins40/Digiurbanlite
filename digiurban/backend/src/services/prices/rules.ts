/**
 * Regras puras da pesquisa de preços (IN SEGES/ME 65/2021 e Lei 14.133/2021,
 * art. 23). Sem banco e sem rede: tudo aqui é testado em
 * __tests__/unit/price-research-rules.test.ts.
 *
 * O sistema PROPÕE e o servidor DECIDE: cada preço chega com uma marca
 * (unidade diferente, antigo, fora da faixa, a confirmar) e o servidor pode
 * devolvê-lo ao cálculo ou tirá-lo, sempre com o motivo escrito.
 */

export type QuoteSource = 'COMPRAS' | 'ARP' | 'PNCP' | 'BPS' | 'FORNECEDOR' | 'NOTA_FISCAL' | 'OUTRO';
export type PriceMethod = 'MEDIANA' | 'MEDIA' | 'MENOR';
export type AutoFlag = 'UNIDADE_DIFERENTE' | 'ANTIGO' | 'FORA_DA_FAIXA' | 'CONFIRMAR';

/** Fonte → inciso do art. 23, § 1º e prazo máximo do preço (IN 65, art. 5º) */
export const SOURCE_INFO: Record<QuoteSource, { label: string; inciso: 'I' | 'II' | 'III' | 'IV' | 'V'; maxAgeDays: number; needsReview: boolean }> = {
  COMPRAS: { label: 'Compras.gov.br — pesquisa de preços', inciso: 'I', maxAgeDays: 365, needsReview: false },
  BPS: { label: 'Banco de Preços em Saúde', inciso: 'I', maxAgeDays: 365, needsReview: false },
  // a ata não informa a unidade: o servidor confirma
  ARP: { label: 'Ata de registro de preços', inciso: 'II', maxAgeDays: 365, needsReview: true },
  // achado pelo texto da descrição: o servidor confirma antes de entrar no cálculo
  PNCP: { label: 'PNCP — contratação similar', inciso: 'II', maxAgeDays: 365, needsReview: true },
  OUTRO: { label: 'Mídia especializada, tabela ou site', inciso: 'III', maxAgeDays: 365, needsReview: false },
  FORNECEDOR: { label: 'Cotação de fornecedor', inciso: 'IV', maxAgeDays: 180, needsReview: false },
  NOTA_FISCAL: { label: 'Nota fiscal', inciso: 'V', maxAgeDays: 365, needsReview: false },
};

export const INCISOS: Array<{ inciso: 'I' | 'II' | 'III' | 'IV' | 'V'; text: string }> = [
  { inciso: 'I', text: 'Painel de Preços / Compras.gov.br / banco de preços em saúde' },
  { inciso: 'II', text: 'Contratações similares de outros entes (até 1 ano)' },
  { inciso: 'III', text: 'Mídia especializada, tabelas de referência, sites (com data e hora de acesso)' },
  { inciso: 'IV', text: 'Pesquisa direta com no mínimo 3 fornecedores (cotações de até 6 meses)' },
  { inciso: 'V', text: 'Notas fiscais de compras pelo ente (até 1 ano)' },
];

export const METHOD_LABEL: Record<PriceMethod, string> = { MEDIANA: 'mediana', MEDIA: 'média', MENOR: 'menor preço' };

export const FLAG_REASON: Record<AutoFlag, string> = {
  UNIDADE_DIFERENTE: 'Unidade diferente da usada na comparação',
  ANTIGO: 'Preço mais antigo que o prazo da fonte (IN 65, art. 5º)',
  FORA_DA_FAIXA: 'Muito acima ou muito abaixo dos demais (possível preço inexequível ou excessivo)',
  CONFIRMAR: 'Confirme se é o mesmo item e a mesma unidade (achado pelo texto ou sem a quantidade por embalagem)',
};

// ─── texto ────────────────────────────────────────────────────────────────

export function normalizeText(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9,./x ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'por', 'com', 'sem', 'a', 'o', 'as', 'os', 'um', 'uma', 'ou', 'no', 'na', 'nos', 'nas',
  'tipo', 'cor', 'tamanho', 'material', 'aplicacao', 'caracteristica', 'adicional', 'caracteristicas', 'unidade', 'aquisicao', 'contratacao',
  'fornecimento', 'conforme', 'especificacao', 'especificacoes', 'item', 'itens', 'outros', 'outras', 'minimo', 'maximo', 'aproximadamente',
]);

/** Palavras que contam numa descrição (sem enchimento, com números como "a4" e "75g") */
export function keywords(value: string, limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of normalizeText(value).split(/[\s,./]+/)) {
    const word = raw.trim();
    if (!word || STOPWORDS.has(word)) continue;
    if (word.length < 3 && !/\d/.test(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}

/** Quanto da descrição pedida aparece na outra (0 a 1) */
export function matchScore(wanted: string, candidate: string): number {
  const words = keywords(wanted, 6);
  if (!words.length) return 0;
  const text = ` ${normalizeText(candidate).replace(/[,./]/g, ' ')} `;
  const hits = words.filter((word) => text.includes(` ${word} `) || (word.length >= 5 && text.includes(word.slice(0, word.length - 1)))).length;
  return hits / words.length;
}

export const PNCP_MATCH_MIN = 0.6;

// ─── unidades ─────────────────────────────────────────────────────────────

const UNIT_SYNONYMS: Array<[string, string[]]> = [
  ['UN', ['UN', 'UND', 'UNID', 'UNIDADE', 'UNIDADES', 'UNI', 'UNIT', 'PC', 'PECA', 'PECAS', 'PÇ']],
  ['PCT', ['PCT', 'PACOTE', 'PACOTES', 'PT']],
  ['CX', ['CX', 'CAIXA', 'CAIXAS']],
  ['EMB', ['EMB', 'EMBALAGEM']],
  ['FL', ['FL', 'FLS', 'FOLHA', 'FOLHAS']],
  ['RESMA', ['RESMA', 'RESMAS', 'RM']],
  ['KG', ['KG', 'QUILO', 'QUILOS', 'QUILOGRAMA', 'QUILOGRAMAS']],
  ['G', ['G', 'GR', 'GRAMA', 'GRAMAS']],
  ['L', ['L', 'LT', 'LTS', 'LITRO', 'LITROS']],
  ['ML', ['ML', 'MILILITRO', 'MILILITROS']],
  ['M', ['M', 'MT', 'MTS', 'METRO', 'METROS', 'METRO LINEAR']],
  ['M2', ['M2', 'M²', 'METRO QUADRADO', 'METROS QUADRADOS']],
  ['M3', ['M3', 'M³', 'METRO CUBICO', 'METROS CUBICOS']],
  ['FR', ['FR', 'FRASCO', 'FRASCOS']],
  ['GL', ['GL', 'GALAO', 'GALOES']],
  ['AMP', ['AMP', 'AMPOLA', 'AMPOLAS']],
  ['COMP', ['COMP', 'CP', 'COMPRIMIDO', 'COMPRIMIDOS']],
  ['CAPS', ['CAPS', 'CAPSULA', 'CAPSULAS']],
  ['ROLO', ['RL', 'ROLO', 'ROLOS']],
  ['TB', ['TB', 'TUBO', 'TUBOS']],
  ['CJ', ['CJ', 'CONJ', 'CONJUNTO', 'CONJUNTOS']],
  ['KIT', ['KIT', 'KITS']],
  ['PAR', ['PAR', 'PARES']],
  ['DZ', ['DZ', 'DUZIA', 'DUZIAS']],
  ['SC', ['SC', 'SACO', 'SACOS']],
  ['BD', ['BD', 'BALDE', 'BALDES']],
  ['H', ['H', 'HR', 'HORA', 'HORAS']],
  ['DIA', ['DIA', 'DIAS', 'DIARIA', 'DIARIAS']],
  ['MES', ['MES', 'MESES', 'MENSAL', 'MENSALIDADE']],
  ['SV', ['SV', 'SERV', 'SERVICO', 'SERVICOS']],
  ['KM', ['KM', 'QUILOMETRO', 'QUILOMETROS']],
];

const UNIT_INDEX = new Map<string, string>();
for (const [canonical, list] of UNIT_SYNONYMS) for (const name of list) UNIT_INDEX.set(name, canonical);

/** Nome padrão da unidade ("Unidade", "UND", "un." → "UN") */
export function normalizeUnit(value: string | null | undefined): string {
  const clean = String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  return UNIT_INDEX.get(clean) || UNIT_INDEX.get(clean.split(' ')[0]) || clean;
}

/** Unidades menores comparadas pela maior (1 G = 0,001 KG; 1 ML = 0,001 L) */
const CONVERSION: Record<string, { unit: string; factor: number }> = {
  G: { unit: 'KG', factor: 0.001 },
  ML: { unit: 'L', factor: 0.001 },
  RESMA: { unit: 'FL', factor: 500 },
  DZ: { unit: 'UN', factor: 12 },
};

export interface QuoteUnitInput {
  unitPrice: number;
  unitLabel?: string | null; // unidade de fornecimento (EMB, CX, UN...)
  capacity?: number | null; // quanto vem dentro (ex.: 500)
  measureUnit?: string | null; // do quê (ex.: FL)
}

/** Embalagens: sem dizer quanto vem dentro, não dá para comparar */
const CONTAINERS = new Set(['PCT', 'CX', 'EMB', 'FR', 'KIT', 'CJ', 'SC', 'BD', 'GL', 'TB', 'ROLO', 'AMP']);

/**
 * Preço por unidade de comparação. "EMB com 500 FL a R$ 25" → R$ 0,05 por FL.
 * Sem capacidade, compara pela própria unidade — menos quando ela é uma
 * embalagem (PCT, CX...): aí a unidade fica desconhecida (null) e o preço só
 * entra se o servidor confirmar, valendo como preço por unidade comprada.
 */
export function quoteBase(input: QuoteUnitInput): { baseUnit: string | null; basePrice: number | null } {
  const price = Number(input.unitPrice);
  const capacity = Number(input.capacity);
  const measure = normalizeUnit(input.measureUnit);
  if (capacity > 0 && measure) {
    const conv = CONVERSION[measure] || { unit: measure, factor: 1 };
    return { baseUnit: conv.unit, basePrice: price / (capacity * conv.factor) };
  }
  const supply = normalizeUnit(input.unitLabel);
  if (!supply || CONTAINERS.has(supply)) return { baseUnit: null, basePrice: null };
  const conv = CONVERSION[supply] || { unit: supply, factor: 1 };
  return { baseUnit: conv.unit, basePrice: price / conv.factor };
}

/** A unidade de comparação que mais aparece entre os preços */
export function dominantBaseUnit(quotes: Array<{ baseUnit?: string | null }>): string | null {
  const count = new Map<string, number>();
  for (const quote of quotes) if (quote.baseUnit) count.set(quote.baseUnit, (count.get(quote.baseUnit) || 0) + 1);
  let best: string | null = null;
  let max = 0;
  for (const [unit, total] of count) if (total > max) { best = unit; max = total; }
  return best;
}

/** Quantas unidades de comparação vêm na embalagem mais comum (sugestão para o item) */
export function dominantCapacity(quotes: Array<{ baseUnit?: string | null; capacity?: number | null; measureUnit?: string | null }>, baseUnit: string): number {
  const count = new Map<number, number>();
  for (const quote of quotes) {
    if (quote.baseUnit !== baseUnit) continue;
    const measure = normalizeUnit(quote.measureUnit);
    const conv = CONVERSION[measure] || { unit: measure, factor: 1 };
    const capacity = Number(quote.capacity) > 0 && measure ? Number(quote.capacity) * conv.factor : 1;
    count.set(capacity, (count.get(capacity) || 0) + 1);
  }
  let best = 1;
  let max = 0;
  for (const [capacity, total] of count) if (total > max) { best = capacity; max = total; }
  return best;
}

// ─── estatística ──────────────────────────────────────────────────────────

export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/** Faixa aceitável pelo método IQR (Q1 − k·IQR a Q3 + k·IQR); precisa de 4 preços */
export function iqrFence(values: number[], k = 1.5): { low: number; high: number } | null {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (sorted.length < 4) return null;
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  return { low: q1 - k * iqr, high: q3 + k * iqr };
}

export interface Stats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  /** coeficiente de variação (desvio padrão ÷ média), em % */
  cv: number;
}

export function stats(values: number[]): Stats | null {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const sd = Math.sqrt(sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length);
  return { count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1], mean, median: percentile(sorted, 50), cv: mean > 0 ? (sd / mean) * 100 : 0 };
}

export function pick(s: Stats, method: PriceMethod): number {
  return method === 'MEDIA' ? s.mean : method === 'MENOR' ? s.min : s.median;
}

// ─── IPCA ─────────────────────────────────────────────────────────────────

export interface MonthlyRate {
  month: string; // AAAA-MM
  rate: number; // % no mês
}

const monthOf = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** Fator de correção do mês seguinte ao da compra até o último IPCA publicado */
export function ipcaFactor(rates: MonthlyRate[], from: Date | null | undefined): number {
  if (!from || !rates.length) return 1;
  const start = monthOf(from);
  return rates.filter((rate) => rate.month > start).reduce((factor, rate) => factor * (1 + rate.rate / 100), 1);
}

// ─── marcas automáticas ───────────────────────────────────────────────────

export interface FlagInput {
  source: QuoteSource;
  date: Date | null;
  baseUnit: string | null;
  basePrice: number | null;
  manual?: boolean;
}

export interface FlagResult {
  included: boolean;
  autoFlag: AutoFlag | null;
  excludedReason: string | null;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Marca cada preço ao chegar: unidade diferente, antigo, a confirmar, e — entre
 * os que sobram — muito fora da faixa dos demais. Anexo do servidor nunca é
 * tirado sozinho (só avisa unidade diferente/antigo).
 */
export function flagQuotes<T extends FlagInput>(quotes: T[], itemBaseUnit: string | null, now = new Date()): Array<T & FlagResult> {
  const first = quotes.map((quote) => {
    const info = SOURCE_INFO[quote.source];
    let autoFlag: AutoFlag | null = null;
    if (itemBaseUnit && quote.baseUnit && quote.baseUnit !== itemBaseUnit) autoFlag = 'UNIDADE_DIFERENTE';
    else if (quote.date && now.getTime() - quote.date.getTime() > info.maxAgeDays * DAY) autoFlag = 'ANTIGO';
    else if ((info.needsReview || (itemBaseUnit && !quote.baseUnit)) && !quote.manual) autoFlag = 'CONFIRMAR';
    return { ...quote, autoFlag: autoFlag as AutoFlag | null };
  });
  const candidates = first.filter((quote) => !quote.autoFlag && !quote.manual && Number(quote.basePrice) > 0);
  const fence = iqrFence(candidates.map((quote) => Number(quote.basePrice)));
  return first.map((quote) => {
    let autoFlag = quote.autoFlag;
    if (!autoFlag && !quote.manual && fence && (Number(quote.basePrice) < fence.low || Number(quote.basePrice) > fence.high)) autoFlag = 'FORA_DA_FAIXA';
    const included = !autoFlag || (!!quote.manual && autoFlag !== 'UNIDADE_DIFERENTE');
    return { ...quote, autoFlag, included, excludedReason: autoFlag && !included ? FLAG_REASON[autoFlag] : null };
  });
}

// ─── resumo do item ───────────────────────────────────────────────────────

export interface SummaryQuote {
  source: QuoteSource;
  unitPrice: number;
  date: Date | null;
  baseUnit: string | null;
  basePrice: number | null;
  included: boolean;
}

export interface ItemSummary {
  baseUnit: string | null;
  count: number;
  stats: Stats | null;
  /** preço adotado por unidade de comparação (já corrigido, se for o caso) */
  basePrice: number | null;
  /** preço adotado por unidade comprada (basePrice × unitCapacity) */
  unitPrice: number | null;
  total: number | null;
  sources: QuoteSource[];
  warnings: string[];
}

export function summarizeItem(
  item: { baseUnit: string | null; unitCapacity: number; quantity: number; justification?: string | null },
  quotes: SummaryQuote[],
  method: PriceMethod,
  rates: MonthlyRate[] = [],
  now = new Date()
): ItemSummary {
  const capacity = Number(item.unitCapacity) > 0 ? Number(item.unitCapacity) : 1;
  // sem unidade conhecida (confirmado pelo servidor) = preço por unidade comprada
  const valueOf = (quote: SummaryQuote) => (quote.baseUnit ? Number(quote.basePrice) : Number(quote.unitPrice) / capacity);
  const used = quotes.filter((quote) => quote.included && valueOf(quote) > 0 && (!item.baseUnit || !quote.baseUnit || quote.baseUnit === item.baseUnit));
  const values = used.map((quote) => valueOf(quote) * ipcaFactor(rates, quote.date));
  const s = stats(values);
  const basePrice = s ? pick(s, method) : null;
  const unitPrice = basePrice !== null ? round2(basePrice * capacity) : null;
  const warnings: string[] = [];
  const hasJustification = !!String(item.justification || '').trim();
  if (used.length < 3 && !hasJustification) warnings.push(`Só ${used.length} preço(s) no cálculo: a IN 65 pede pelo menos 3 ou justificativa (art. 6º, § 5º).`);
  if (used.length && used.every((quote) => quote.source === 'FORNECEDOR') && !hasJustification)
    warnings.push('Só cotações de fornecedores: justifique por que não há preços públicos (IN 65, art. 5º, § 1º).');
  if (s && s.cv > 25) warnings.push(`Preços muito espalhados (variação de ${Math.round(s.cv)}%): confira se são o mesmo item.`);
  const old = used.filter((quote) => quote.date && now.getTime() - quote.date.getTime() > SOURCE_INFO[quote.source].maxAgeDays * DAY).length;
  if (old && !hasJustification) warnings.push(`${old} preço(s) fora do prazo da fonte: justifique ou retire.`);
  return {
    baseUnit: item.baseUnit,
    count: used.length,
    stats: s,
    basePrice,
    unitPrice,
    total: unitPrice !== null ? round2(unitPrice * (Number(item.quantity) > 0 ? Number(item.quantity) : 1)) : null,
    sources: [...new Set(used.map((quote) => quote.source))],
    warnings,
  };
}

export const round2 = (value: number) => Math.round(value * 100) / 100;

// ─── documento ────────────────────────────────────────────────────────────

const brl = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: value < 1 ? 4 : 2 })}`;

const dateBr = (date: Date | null | undefined) => (date ? date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 's/ data');

export interface DocItem {
  position: number;
  description: string;
  unit: string;
  quantity: number;
  baseUnit: string | null;
  unitCapacity: number;
  justification: string | null;
  summary: ItemSummary;
  quotes: Array<{
    source: QuoteSource;
    buyer: string | null;
    buyerCity: string | null;
    buyerUf: string | null;
    supplier: string | null;
    date: Date | null;
    unitPrice: number;
    basePrice: number | null;
    included: boolean;
    excludedReason: string | null;
    sourceUrl: string | null;
    accessedAt: Date;
  }>;
}

/** Textos que preenchem {{parametros}}, {{mapa}} e {{tratamento}} do modelo PESQUISA_PRECOS */
export function buildDocumentTexts(input: { method: PriceMethod; applyIpca: boolean; items: DocItem[]; generatedAt: Date }) {
  const used = new Set<string>();
  for (const item of input.items) for (const quote of item.quotes) if (quote.included) used.add(SOURCE_INFO[quote.source].inciso);
  const parametros = INCISOS.map((row) => `(${used.has(row.inciso) ? 'X' : ' '}) ${row.inciso} — ${row.text}`).join('\n');

  const mapa = input.items
    .map((item) => {
      const s = item.summary;
      const unitText = item.baseUnit && item.unitCapacity !== 1 ? `${item.unit} com ${item.unitCapacity} ${item.baseUnit}` : item.unit;
      const lines = [
        `Item ${item.position} — ${item.description}`,
        `Unidade: ${unitText} · Quantidade: ${item.quantity.toLocaleString('pt-BR')}`,
      ];
      const shown = item.quotes.filter((quote) => quote.included);
      shown.forEach((quote, index) => {
        const who = [quote.buyer || quote.supplier, quote.buyerCity && quote.buyerUf ? `${quote.buyerCity}/${quote.buyerUf}` : quote.buyerUf].filter(Boolean).join(' — ');
        lines.push(
          `  ${index + 1}. ${SOURCE_INFO[quote.source].label}${who ? ` · ${who}` : ''} · ${dateBr(quote.date)} · ${brl(quote.unitPrice)}${
            item.baseUnit && quote.basePrice !== null ? ` (${brl(quote.basePrice)}/${item.baseUnit})` : ''
          }${quote.sourceUrl ? ` · ${quote.sourceUrl}` : ''} · consultado em ${quote.accessedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
        );
      });
      if (s.stats) {
        lines.push(
          `  Menor ${brl(s.stats.min)} · Média ${brl(s.stats.mean)} · Mediana ${brl(s.stats.median)} · Maior ${brl(s.stats.max)}${item.baseUnit ? ` (por ${item.baseUnit})` : ''}`
        );
      }
      lines.push(`  Preço adotado: ${brl(s.unitPrice)} por ${item.unit} · Total do item: ${brl(s.total)}`);
      return lines.join('\n');
    })
    .join('\n\n');

  const descartes: string[] = [];
  for (const item of input.items) {
    for (const quote of item.quotes) {
      if (quote.included || !quote.excludedReason) continue;
      descartes.push(`  Item ${item.position}: ${SOURCE_INFO[quote.source].label}${quote.buyer ? ` (${quote.buyer})` : quote.supplier ? ` (${quote.supplier})` : ''}, ${brl(quote.unitPrice)} — ${quote.excludedReason}`);
    }
  }
  const justificativas = input.items.filter((item) => item.justification?.trim()).map((item) => `  Item ${item.position}: ${item.justification!.trim()}`);
  const tratamento = [
    `Critério adotado: ${METHOD_LABEL[input.method]} dos preços válidos de cada item (IN 65/2021, art. 6º).`,
    'Preços comparados na mesma unidade: embalagens convertidas para a unidade de comparação antes do cálculo.',
    input.applyIpca ? 'Preços corrigidos pelo IPCA (IBGE) do mês da compra até o último índice publicado (IN 65/2021, art. 5º, II).' : 'Preços sem correção monetária.',
    descartes.length ? `Preços desconsiderados e motivo:\n${descartes.join('\n')}` : 'Nenhum preço desconsiderado.',
    ...(justificativas.length ? [`Justificativas:\n${justificativas.join('\n')}`] : []),
    `Pesquisa gerada no sistema em ${input.generatedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
  ].join('\n');

  const total = round2(input.items.reduce((sum, item) => sum + (item.summary.total || 0), 0));
  return { parametros, mapa, tratamento, total };
}
