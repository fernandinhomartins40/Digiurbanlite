/**
 * Regras da leitura automática de documentos (sem IA, sem banco — testáveis).
 *
 * O motor (ultrazend-doc-engine) só devolve as linhas de texto e os códigos
 * (QR/barras). Aqui o backend descobre que documento parece ser, confere nome,
 * CPF e data de nascimento com o cadastro e valida a faixa MRZ da nova
 * identidade (CIN). NUNCA decide sozinho: o resultado é um aviso para o servidor.
 */

export type DocKind =
  | 'CIN'
  | 'RG'
  | 'CNH'
  | 'CPF'
  | 'CERTIDAO'
  | 'COMPROVANTE_RESIDENCIA'
  | 'TITULO_ELEITOR'
  | 'CTPS'
  | 'SUS'
  | 'DESCONHECIDO';

export type MatchResult = 'MATCH' | 'PARTIAL' | 'NO_MATCH' | 'NOT_FOUND';

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  CIN: 'Carteira de Identidade Nacional',
  RG: 'RG (identidade)',
  CNH: 'CNH',
  CPF: 'CPF',
  CERTIDAO: 'Certidão',
  COMPROVANTE_RESIDENCIA: 'Comprovante de residência',
  TITULO_ELEITOR: 'Título de eleitor',
  CTPS: 'Carteira de trabalho',
  SUS: 'Cartão do SUS',
  DESCONHECIDO: 'Não identificado',
};

export interface EngineLine {
  text: string;
  score: number;
}

export interface EngineCode {
  format: string;
  text: string;
}

export interface ExpectedPerson {
  name?: string | null;
  cpf?: string | null;
  birthDate?: Date | string | null;
}

/** Maiúsculas, sem acento, espaços simples */
export function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------- tipo do documento

const KIND_KEYWORDS: Array<[DocKind, RegExp[]]> = [
  ['CIN', [/CARTEIRA DE IDENTIDADE NACIONAL/, /\bI[DO<]BRA/]],
  ['CNH', [/CARTEIRA NACIONAL DE HABILITACAO/, /\bDETRAN\b/, /PERMISSAO PARA DIRIGIR/, /\bHABILITACAO\b/, /\bCAT\.? HAB/, /DRIVER LICENSE/]],
  ['RG', [/CARTEIRA DE IDENTIDADE/, /REGISTRO GERAL/, /SECRETARIA DA SEGURANCA PUBLICA|SECRETARIA DE SEGURANCA PUBLICA/, /INSTITUTO DE IDENTIFICACAO/, /LEI N.? 7\.?116/]],
  ['CPF', [/CADASTRO DE PESSOAS FISICAS/, /CADASTRO DE PESSOA FISICA/, /COMPROVANTE DE INSCRICAO NO CPF/, /SITUACAO CADASTRAL/]],
  ['CERTIDAO', [/CERTIDAO DE (NASCIMENTO|CASAMENTO|OBITO)/, /REGISTRO CIVIL DAS PESSOAS NATURAIS/, /OFICIAL DE REGISTRO CIVIL/, /MATRICULA/]],
  ['COMPROVANTE_RESIDENCIA', [/\bFATURA\b/, /CONTA DE (ENERGIA|LUZ|AGUA)/, /\bVENCIMENTO\b/, /CONSUMO/, /\bKWH\b/, /SANEAMENTO/, /UNIDADE CONSUMIDORA/, /CODIGO DO CLIENTE|COD\.? CLIENTE/, /\bCEP\b/]],
  ['TITULO_ELEITOR', [/TITULO ELEITORAL|TITULO DE ELEITOR/, /JUSTICA ELEITORAL/, /\bZONA\b.*\bSECAO\b|\bSECAO\b.*\bZONA\b/]],
  ['CTPS', [/CARTEIRA DE TRABALHO/, /PREVIDENCIA SOCIAL/]],
  ['SUS', [/CARTAO NACIONAL DE SAUDE/, /SISTEMA UNICO DE SAUDE/, /\bCNS\b/]],
];

/** Que documento a foto parece ser (pela contagem de palavras-chave) */
export function detectKind(text: string): DocKind {
  const normalized = normalizeText(text);
  let best: DocKind = 'DESCONHECIDO';
  let bestScore = 0;
  for (const [kind, patterns] of KIND_KEYWORDS) {
    const score = patterns.reduce((total, pattern) => total + (pattern.test(normalized) ? 1 : 0), 0);
    // CIN vence RG quando aparece o nome novo ou a faixa MRZ brasileira
    const weighted = kind === 'CIN' ? score * 2 : score;
    if (weighted > bestScore) {
      best = kind;
      bestScore = weighted;
    }
  }
  // comprovante precisa de mais de um sinal (CEP sozinho aparece em qualquer documento)
  if (best === 'COMPROVANTE_RESIDENCIA' && bestScore < 2) return 'DESCONHECIDO';
  return best;
}

/** Que documento foi pedido, pelo nome/código do tipo ("rg_frente", "Comprovante de Residência"...) */
export function expectedKindOf(documentType: string | null | undefined): DocKind | null {
  const t = normalizeText(String(documentType || '').replace(/[_-]+/g, ' '));
  if (!t) return null;
  if (/\bCIN\b|IDENTIDADE NACIONAL/.test(t)) return 'CIN';
  if (/\bCNH\b|HABILITACAO/.test(t)) return 'CNH';
  if (/\bRG\b|IDENTIDADE|REGISTRO GERAL/.test(t)) return 'RG';
  if (/\bCPF\b/.test(t)) return 'CPF';
  if (/CERTIDAO|NASCIMENTO|CASAMENTO|OBITO/.test(t)) return 'CERTIDAO';
  if (/RESIDENCIA|ENDERECO|COMPROVANTE DE MORADIA|CONTA DE (LUZ|AGUA|ENERGIA)/.test(t)) return 'COMPROVANTE_RESIDENCIA';
  if (/TITULO|ELEITOR/.test(t)) return 'TITULO_ELEITOR';
  if (/CTPS|CARTEIRA DE TRABALHO/.test(t)) return 'CTPS';
  if (/\bSUS\b|CARTAO NACIONAL DE SAUDE|\bCNS\b/.test(t)) return 'SUS';
  return null;
}

/** A foto serve para o documento pedido? (a CIN substitui o RG; RG, CIN e CNH trazem o CPF) */
export function kindMatches(expected: DocKind | null, detected: DocKind): boolean | null {
  if (!expected || detected === 'DESCONHECIDO') return null;
  if (expected === detected) return true;
  if (expected === 'RG' && detected === 'CIN') return true;
  if (expected === 'CIN' && detected === 'RG') return true;
  if (expected === 'CPF' && (detected === 'RG' || detected === 'CIN' || detected === 'CNH')) return true;
  return false;
}

// ----------------------------------------------------------------- CPF

export function isValidCpf(value: string): boolean {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

/** CPFs válidos encontrados no texto (tolera os enganos comuns da leitura: O→0, I/l→1, espaços) */
export function findCpfs(text: string): string[] {
  const fixed = String(text || '').replace(/(?<=\d)[Oo](?=\d)|(?<=\d)[Oo]|[Oo](?=\d)/g, '0').replace(/(?<=\d)[Il|](?=\d)/g, '1');
  const found = new Set<string>();
  const pattern = /(?<!\d)(\d{3})\s?[.,]?\s?(\d{3})\s?[.,]?\s?(\d{3})\s?[-–.]?\s?(\d{2})(?!\d)/g;
  for (const match of fixed.matchAll(pattern)) {
    const cpf = match.slice(1, 5).join('');
    if (isValidCpf(cpf)) found.add(cpf);
  }
  return [...found];
}

export function compareCpf(expected: string | null | undefined, found: string[]): MatchResult {
  const target = String(expected || '').replace(/\D/g, '');
  if (!found.length || target.length !== 11) return 'NOT_FOUND';
  return found.includes(target) ? 'MATCH' : 'NO_MATCH';
}

// ----------------------------------------------------------------- nome

const NAME_LINKS = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS', 'E', 'D']);

function nameTokens(value: string): string[] {
  return normalizeText(value)
    .replace(/[^A-Z ]/g, ' ')
    .split(' ')
    .filter((token) => token.length > 1 && !NAME_LINKS.has(token));
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Nome do cadastro aparece no documento? Confere palavra por palavra (ignora
 * "da", "de"...), aceitando um erro de leitura por palavra longa.
 */
export function compareName(expected: string | null | undefined, text: string): MatchResult {
  const wanted = nameTokens(String(expected || ''));
  // na faixa MRZ o nome vem como SOUZA<<MARIA<DA<SILVA (e o O às vezes sai como 0)
  const docTokens = new Set(nameTokens(normalizeText(text).replace(/</g, ' ').replace(/(?<=[A-Z])0|0(?=[A-Z])/g, 'O')));
  if (!wanted.length) return 'NOT_FOUND';
  if (docTokens.size < 3) return 'NOT_FOUND';
  const present = wanted.filter(
    (token) => docTokens.has(token) || (token.length >= 5 && [...docTokens].some((doc) => editDistanceAtMostOne(token, doc)))
  );
  if (present.length === wanted.length) return 'MATCH';
  const firstOk = present.includes(wanted[0]);
  if (firstOk && present.length / wanted.length >= 0.5) return 'PARTIAL';
  return 'NO_MATCH';
}

// ----------------------------------------------------------------- data de nascimento

function toYmd(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function findDates(text: string): string[] {
  const found = new Set<string>();
  for (const match of String(text || '').matchAll(/(?<!\d)(\d{2})\s?[/.-]\s?(\d{2})\s?[/.-]\s?(\d{4})(?!\d)/g)) {
    const ymd = toYmd(Number(match[1]), Number(match[2]), Number(match[3]));
    if (ymd) found.add(ymd);
  }
  return [...found];
}

export function ymdOf(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** Documento tem muitas datas (emissão, validade): só dá para dizer "confere" ou "não achei" */
export function compareBirthDate(expected: Date | string | null | undefined, dates: string[]): MatchResult {
  const target = ymdOf(expected);
  if (!target) return 'NOT_FOUND';
  return dates.includes(target) ? 'MATCH' : 'NOT_FOUND';
}

// ----------------------------------------------------------------- faixa MRZ (CIN, padrão TD1: 3 linhas de 30)

export interface MrzResult {
  valid: boolean;
  documentNumber: string;
  birthDate: string | null;
  expiryDate: string | null;
  names: string;
  failedChecks: string[];
}

const MRZ_WEIGHTS = [7, 3, 1];

export function mrzCheckDigit(value: string): number {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    let n = 0;
    if (char >= '0' && char <= '9') n = char.charCodeAt(0) - 48;
    else if (char >= 'A' && char <= 'Z') n = char.charCodeAt(0) - 55;
    sum += n * MRZ_WEIGHTS[i % 3];
  }
  return sum % 10;
}

function cleanMrzLine(text: string): string {
  return normalizeText(text).replace(/\s+/g, '').replace(/[«‹(\[{]/g, '<').replace(/[^A-Z0-9<]/g, '');
}

/** campos numéricos da MRZ: a leitura troca O por 0 e I por 1 */
function digitsOnly(value: string) {
  return value.replace(/O/g, '0').replace(/[IL]/g, '1');
}

function mrzDate(yymmdd: string, future: boolean): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const currentYY = new Date().getUTCFullYear() % 100;
  const century = future ? 2000 : yy > currentYY ? 1900 : 2000;
  return toYmd(Number(yymmdd.slice(4, 6)), Number(yymmdd.slice(2, 4)), century + yy);
}

/** Acha as 3 linhas da faixa MRZ (pelo conteúdo, não pela ordem) e confere os dígitos de controle */
export function parseMrzTd1(lines: string[]): MrzResult | null {
  const candidates = lines.map(cleanMrzLine).filter((line) => line.length >= 28 && line.length <= 32 && line.includes('<'));
  const line1 = candidates.find((line) => /^[ACI][A-Z<][A-Z<]{3}/.test(line) && !/^\d/.test(line));
  const line2 = candidates.find((line) => /^[\dO]{6}/.test(line) && line !== line1);
  const line3 = candidates.find((line) => line !== line1 && line !== line2 && /^[A-Z][A-Z0]*<</.test(line));
  if (!line1 || !line2) return null;

  const l1 = line1.padEnd(30, '<').slice(0, 30);
  const l2 = digitsOnly(line2.slice(0, 7)) + line2.slice(7, 8) + digitsOnly(line2.slice(8, 15)) + line2.slice(15).padEnd(15, '<');
  const l2s = l2.slice(0, 30);

  const docNumber = l1.slice(5, 14);
  const docCheck = digitsOnly(l1.slice(14, 15));
  const birth = l2s.slice(0, 6);
  const birthCheck = l2s.slice(6, 7);
  const expiry = l2s.slice(8, 14);
  const expiryCheck = l2s.slice(14, 15);
  const composite = l2s.slice(29, 30);
  const compositeData = l1.slice(5, 30) + l2s.slice(0, 7) + l2s.slice(8, 15) + l2s.slice(18, 29);

  const failed: string[] = [];
  if (String(mrzCheckDigit(docNumber)) !== docCheck) failed.push('número do documento');
  if (String(mrzCheckDigit(birth)) !== birthCheck) failed.push('data de nascimento');
  if (String(mrzCheckDigit(expiry)) !== expiryCheck) failed.push('validade');
  if (/\d/.test(composite) && String(mrzCheckDigit(compositeData)) !== composite) failed.push('controle geral');

  return {
    valid: failed.length === 0,
    documentNumber: docNumber.replace(/</g, ''),
    birthDate: mrzDate(birth, false),
    expiryDate: mrzDate(expiry, true),
    names: line3 ? line3.replace(/0/g, 'O').replace(/<+/g, ' ').trim() : '',
    failedChecks: failed,
  };
}

// ----------------------------------------------------------------- resultado

export interface ReadingAnalysis {
  detectedKind: DocKind;
  expectedKind: DocKind | null;
  kindMatches: boolean | null;
  nameMatch: MatchResult;
  cpfMatch: MatchResult;
  birthDateMatch: MatchResult;
  mrzValid: boolean | null;
  qrFound: boolean;
  qrGovUrl: string | null;
  textQuality: number;
  lineCount: number;
}

function govUrl(codes: EngineCode[]): string | null {
  for (const code of codes) {
    try {
      const url = new URL(code.text.trim());
      if (url.protocol === 'https:' && /(^|\.)gov\.br$/i.test(url.hostname)) return url.toString().slice(0, 500);
    } catch {
      // não é endereço
    }
  }
  return null;
}

export function analyzeReading(
  lines: EngineLine[],
  codes: EngineCode[],
  documentType: string | null | undefined,
  person: ExpectedPerson
): ReadingAnalysis {
  const texts = lines.map((line) => line.text);
  const fullText = texts.join('\n');
  const mrz = parseMrzTd1(texts);
  const detected = detectKind(fullText);
  const expected = expectedKindOf(documentType);
  const dates = findDates(fullText);
  if (mrz?.valid && mrz.birthDate) dates.push(mrz.birthDate);

  let birthDateMatch = compareBirthDate(person.birthDate, dates);
  let nameMatch = compareName(person.name, fullText);
  // nome achado só pela faixa MRZ conta igual
  if (nameMatch !== 'MATCH' && mrz?.names) {
    const byMrz = compareName(person.name, mrz.names);
    if (byMrz === 'MATCH') nameMatch = 'MATCH';
  }
  if (birthDateMatch !== 'MATCH' && mrz?.valid && mrz.birthDate && ymdOf(person.birthDate) === mrz.birthDate) {
    birthDateMatch = 'MATCH';
  }

  const scores = lines.map((line) => line.score).filter((score) => Number.isFinite(score));
  return {
    detectedKind: detected,
    expectedKind: expected,
    kindMatches: kindMatches(expected, detected),
    nameMatch,
    cpfMatch: compareCpf(person.cpf, findCpfs(fullText)),
    birthDateMatch,
    mrzValid: mrz ? mrz.valid : null,
    qrFound: codes.some((code) => /QR/i.test(code.format)),
    qrGovUrl: govUrl(codes),
    textQuality: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
    lineCount: lines.length,
  };
}
