/**
 * Minimização de dados (LGPD art. 6º, III) antes de enviar texto a um provedor
 * de IA: CPF, CNPJ, e-mail, telefone, CEP e números de cartão viram marcadores
 * ([CPF_1], [TEL_1]...). A resposta do modelo é "desmascarada" localmente —
 * o dado real nunca sai do servidor, mas a extração de campos continua
 * funcionando (o modelo devolve o marcador e o sistema troca pelo valor).
 */

interface Rule {
  tag: string;
  re: RegExp;
}

const RULES: Rule[] = [
  { tag: 'EMAIL', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { tag: 'CNPJ', re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
  { tag: 'CPF', re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { tag: 'CARTAO', re: /\b(?:\d[ -]?){13,19}\b/g },
  { tag: 'TEL', re: /(?:\+?55\s?)?\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g },
  { tag: 'CEP', re: /\b\d{5}-\d{3}\b/g },
];

export interface Redaction {
  text: string;
  map: Record<string, string>;
}

export function redact(input: string, existing: Record<string, string> = {}): Redaction {
  const map = { ...existing };
  const reverse = new Map(Object.entries(map).map(([k, v]) => [v, k]));
  const counters: Record<string, number> = {};
  for (const key of Object.keys(map)) {
    const m = /^\[([A-Z]+)_(\d+)\]$/.exec(key);
    if (m) counters[m[1]] = Math.max(counters[m[1]] || 0, Number(m[2]));
  }
  let text = input;
  for (const { tag, re } of RULES) {
    text = text.replace(re, (match) => {
      const known = reverse.get(match);
      if (known) return known;
      counters[tag] = (counters[tag] || 0) + 1;
      const token = `[${tag}_${counters[tag]}]`;
      map[token] = match;
      reverse.set(match, token);
      return token;
    });
  }
  return { text, map };
}

export function restore(text: string, map: Record<string, string>): string {
  return text.replace(/\[[A-Z]+_\d+\]/g, (token) => map[token] ?? token);
}

/** Restaura marcadores em qualquer estrutura (JSON devolvido pelo modelo) */
export function restoreDeep<T>(value: T, map: Record<string, string>): T {
  if (!Object.keys(map).length) return value;
  if (typeof value === 'string') return restore(value, map) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, map)) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as any).map(([k, v]) => [k, restoreDeep(v, map)])) as T;
  }
  return value;
}
