/**
 * Preenche um modelo de e-mail: troca `{{nome}}` pelo valor. Sem banco nem fila
 * (dá para testar sozinho). No HTML o valor entra escapado — texto digitado
 * pela pessoa nunca vira código — e quebra de linha vira <br>.
 */

import { escapeMailHtml } from './layout';

export type MailVariables = Record<string, string | number | boolean | Date | null | undefined>;

function formatValue(value: MailVariables[string]): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export function fillTemplate(source: string, variables: MailVariables, html: boolean): string {
  return source.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const text = formatValue(variables[key]);
    return html ? escapeMailHtml(text).replace(/\r?\n/g, '<br>') : text;
  });
}
