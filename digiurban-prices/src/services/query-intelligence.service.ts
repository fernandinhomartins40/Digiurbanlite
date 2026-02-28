import { normalizeText } from '../ingest/normalizer';

const SOURCE_WEIGHTS: Record<string, number> = {
  pncp: 1.0,
  comprasnet: 0.96,
  bps: 0.92,
  transparencia: 0.86,
  fnde: 0.8,
};

const QUERY_SYNONYMS: Record<string, string[]> = {
  computador: ['desktop', 'microcomputador', 'pc', 'workstation'],
  notebook: ['laptop', 'portatil', 'computador portatil'],
  impressora: ['multifuncional', 'copiadora'],
  sabao: ['detergente', 'sabonete'],
  limpeza: ['higienizacao', 'conservacao', 'sanitizacao'],
  papel: ['sulfite', 'resma', 'papel a4'],
};

const CPU_PATTERNS: Array<{ regex: RegExp; canonical: string }> = [
  { regex: /\b(core\s*i3|i3)\b/i, canonical: 'intel core i3' },
  { regex: /\b(core\s*i5|i5)\b/i, canonical: 'intel core i5' },
  { regex: /\b(core\s*i7|i7)\b/i, canonical: 'intel core i7' },
  { regex: /\b(core\s*i9|i9)\b/i, canonical: 'intel core i9' },
  { regex: /\bryzen\s*3\b/i, canonical: 'amd ryzen 3' },
  { regex: /\bryzen\s*5\b/i, canonical: 'amd ryzen 5' },
  { regex: /\bryzen\s*7\b/i, canonical: 'amd ryzen 7' },
];

export interface QueryIntelligence {
  original: string;
  normalized: string;
  tokens: string[];
  expandedTokens: string[];
  expandedQuery: string;
  technicalTerms: string[];
}

export interface EvidenceInput {
  source: string | null;
  confidenceScore: number | null;
  contractDate: string | null;
  hasSupplier: boolean;
  hasCatmat: boolean;
}

const INCIDENTAL_CONTEXT_HINTS = [
  'kit ',
  'conjunto ',
  'composto por',
  'acompanha ',
  'inclui ',
  'referente ',
  'acessorio ',
  'acessorios ',
];

export function buildQueryIntelligence(query: string): QueryIntelligence {
  const normalized = normalizeText(query);
  const tokens = tokenize(normalized);
  const expanded = new Set(tokens);

  for (const token of tokens) {
    if (QUERY_SYNONYMS[token]) {
      for (const synonym of QUERY_SYNONYMS[token]) {
        expanded.add(normalizeText(synonym));
      }
    }
  }

  const technicalTerms = extractTechnicalTerms(query, normalized);
  for (const term of technicalTerms) {
    expanded.add(normalizeText(term));
  }

  const expandedTokens = Array.from(expanded).filter(Boolean);
  return {
    original: query,
    normalized,
    tokens,
    expandedTokens,
    expandedQuery: expandedTokens.join(' '),
    technicalTerms,
  };
}

export function semanticSimilarityScore(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0 || !text) return 0;
  const itemTokens = new Set(tokenize(text));
  if (itemTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of queryTokens) {
    if (itemTokens.has(token)) overlap++;
  }

  const union = new Set([...queryTokens, ...Array.from(itemTokens)]).size;
  const base = union > 0 ? overlap / union : 0;

  // Boost extra para termos técnicos de hardware
  const hasCpuMatch = queryTokens.some((t) => /(^i[3579]$|ryzen|intel|core)/.test(t)) &&
    Array.from(itemTokens).some((t) => /(^i[3579]$|ryzen|intel|core)/.test(t));
  const hasMemoryMatch = queryTokens.some((t) => /\d+gb/.test(t)) &&
    Array.from(itemTokens).some((t) => /\d+gb/.test(t));
  const hasStorageMatch = queryTokens.some((t) => /(ssd|hdd|\d+tb|\d+gb)/.test(t)) &&
    Array.from(itemTokens).some((t) => /(ssd|hdd|\d+tb|\d+gb)/.test(t));

  let bonus = 0;
  if (hasCpuMatch) bonus += 0.12;
  if (hasMemoryMatch) bonus += 0.08;
  if (hasStorageMatch) bonus += 0.08;

  return clamp01(base + bonus);
}

export function lexicalIntentScore(query: QueryIntelligence, text: string): number {
  const normalizedText = normalizeText(text);
  if (!query.normalized || !normalizedText) return 0;

  const textTokens = tokenize(normalizedText);
  if (textTokens.length === 0) return 0;

  const originalMatches = query.tokens.filter((token) =>
    containsNormalizedTerm(normalizedText, textTokens, token),
  );
  const expandedMatches = query.expandedTokens.filter((term) =>
    containsNormalizedTerm(normalizedText, textTokens, term),
  );

  const originalCoverage = query.tokens.length > 0
    ? originalMatches.length / query.tokens.length
    : 0;
  const expandedSignal = expandedMatches.length > 0
    ? Math.min(1, 0.55 + ((expandedMatches.length - 1) * 0.12))
    : 0;
  const exactPhrase = containsNormalizedTerm(normalizedText, textTokens, query.normalized) ? 1 : 0;
  const startsWithQuery = normalizedText.startsWith(query.normalized) ? 1 : 0;
  const firstMatchIndex = findFirstMatchIndex(textTokens, query.tokens, query.expandedTokens);
  const earlySignal = firstMatchIndex === null
    ? 0
    : firstMatchIndex <= 2
      ? 1
      : firstMatchIndex <= 5
        ? 0.75
        : firstMatchIndex <= 9
          ? 0.45
          : 0.18;

  const densitySignal = query.tokens.length > 0
    ? Math.min(1, (originalMatches.length / textTokens.length) * 12)
    : 0;

  let score = (
    (Math.max(originalCoverage, expandedSignal * 0.85) * 0.46) +
    (exactPhrase * 0.22) +
    (startsWithQuery * 0.14) +
    (earlySignal * 0.13) +
    (densitySignal * 0.05)
  );

  const isIncidental = query.tokens.length <= 2 &&
    firstMatchIndex !== null &&
    firstMatchIndex > 8 &&
    textTokens.length >= 16 &&
    !startsWithQuery;

  if (isIncidental) {
    score -= 0.18;
  }

  if (isBundleLike(normalizedText) && query.tokens.length <= 2 && firstMatchIndex !== null && firstMatchIndex > 4) {
    score -= 0.12;
  }

  return clamp01(score);
}

export function shouldKeepSearchHit(
  query: QueryIntelligence,
  text: string,
  lexicalScore = lexicalIntentScore(query, text),
  semanticScore = semanticSimilarityScore(query.expandedTokens, text),
): boolean {
  const normalizedText = normalizeText(text);
  const textTokens = tokenize(normalizedText);
  if (textTokens.length === 0) return false;

  const firstMatchIndex = findFirstMatchIndex(textTokens, query.tokens, query.expandedTokens);
  const bundleLike = isBundleLike(normalizedText);

  const hasLexicalSignal = query.expandedTokens.some((term) =>
    containsNormalizedTerm(normalizedText, textTokens, term),
  );

  if (!hasLexicalSignal) {
    return false;
  }

  if (query.tokens.length === 1) {
    const longDescription = textTokens.length >= 14;
    if (bundleLike && firstMatchIndex !== null && firstMatchIndex > 4) {
      return false;
    }
    if (longDescription && lexicalScore < 0.5 && semanticScore < 0.22) {
      return false;
    }
    return lexicalScore >= 0.2 || semanticScore >= 0.14;
  }

  if (query.tokens.length === 2) {
    return lexicalScore >= 0.18 || semanticScore >= 0.16;
  }

  return lexicalScore >= 0.12 || semanticScore >= 0.12;
}

export function evidenceScore(input: EvidenceInput): number {
  const sourceWeight = SOURCE_WEIGHTS[input.source ?? ''] ?? 0.75;
  const confidence = input.confidenceScore ?? 0.5;
  const supplierBonus = input.hasSupplier ? 0.08 : 0;
  const catmatBonus = input.hasCatmat ? 0.08 : 0;

  let recencyWeight = 0.75;
  if (input.contractDate) {
    const dt = new Date(input.contractDate);
    if (!Number.isNaN(dt.getTime())) {
      const daysOld = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld <= 365) recencyWeight = 1.0;
      else if (daysOld <= 730) recencyWeight = 0.9;
      else if (daysOld <= 1825) recencyWeight = 0.82;
      else recencyWeight = 0.72;
    }
  }

  return clamp01(sourceWeight * 0.45 + confidence * 0.35 + recencyWeight * 0.2 + supplierBonus + catmatBonus);
}

function extractTechnicalTerms(original: string, normalized: string): string[] {
  const terms = new Set<string>();
  const raw = `${original} ${normalized}`;

  for (const pattern of CPU_PATTERNS) {
    if (pattern.regex.test(raw)) {
      terms.add(pattern.canonical);
    }
  }

  const ramMatches = raw.match(/\b(\d{1,3})\s*gb\b/gi) ?? [];
  for (const ram of ramMatches) {
    terms.add(ram.toLowerCase().replace(/\s+/g, ''));
  }

  const storageMatches = raw.match(/\b(\d{2,4})\s*(gb|tb)\s*(ssd|hdd)?\b/gi) ?? [];
  for (const storage of storageMatches) {
    terms.add(storage.toLowerCase().replace(/\s+/g, ''));
  }

  const generationMatches = raw.match(/\b(\d{1,2})\s*(a|ª)?\s*geracao\b/gi) ?? [];
  for (const generation of generationMatches) {
    terms.add(generation.toLowerCase().replace(/\s+/g, ''));
  }

  return Array.from(terms);
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function containsNormalizedTerm(normalizedText: string, textTokens: string[], term: string): boolean {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  if (!normalizedTerm.includes(' ')) {
    const stemmedTerm = stemToken(normalizedTerm);
    return textTokens.some((token) => stemToken(token) === stemmedTerm);
  }

  const escaped = escapeRegex(normalizedTerm);
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i').test(normalizedText);
}

function findFirstMatchIndex(textTokens: string[], originalTerms: string[], expandedTerms: string[]): number | null {
  let firstIndex: number | null = null;

  for (const term of [...originalTerms, ...expandedTerms]) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) continue;

    const index = normalizedTerm.includes(' ')
      ? findPhraseIndex(textTokens, tokenize(normalizedTerm))
      : textTokens.findIndex((token) => stemToken(token) === stemToken(normalizedTerm));

    if (index >= 0 && (firstIndex === null || index < firstIndex)) {
      firstIndex = index;
    }
  }

  return firstIndex;
}

function findPhraseIndex(textTokens: string[], phraseTokens: string[]): number {
  if (phraseTokens.length === 0 || phraseTokens.length > textTokens.length) return -1;

  for (let i = 0; i <= textTokens.length - phraseTokens.length; i += 1) {
    let matched = true;
    for (let j = 0; j < phraseTokens.length; j += 1) {
      if (stemToken(textTokens[i + j]) !== stemToken(phraseTokens[j])) {
        matched = false;
        break;
      }
    }
    if (matched) return i;
  }

  return -1;
}

function stemToken(token: string): string {
  if (token.length > 5 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function isBundleLike(normalizedText: string): boolean {
  return INCIDENTAL_CONTEXT_HINTS.some((hint) => normalizedText.includes(hint));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 1000) / 1000;
}
