/**
 * Inteligência dos apps sobre serviços novos (2026-10-09) — sem IA, regras puras.
 *
 * 1. `mapFormToApp`: acha no formulário do serviço o campo de cada dado que o
 *    app precisa — pela ligação feita no assistente (`x-app-field`), pelo nome
 *    interno ou pelo TÍTULO que a pessoa escreveu ("Nome da criança" → aluno).
 * 2. `withAppFields`: na hora do pedido, entrega os valores ao app no nome que
 *    ele lê; o que não foi reconhecido vai junto em "Outros dados" (nada se perde).
 * 3. `suggestAppActions`: pelo nome do serviço, diz para qual app ele parece ir.
 * 4. `checkAppFields`: o que o app vai receber, o que falta e os campos prontos
 *    para acrescentar ao formulário.
 *
 * Contratos em `config/app-field-contracts.ts`.
 */

import { APP_FIELD_CONTRACTS, AppActionContract, AppFieldRole, FieldKind, NOT_AN_APP_CASE, RoleFallback } from '../../config/app-field-contracts';
import { APP_CATALOG, findAppAction } from '../../config/app-catalog';

/** "Nome da Criança (opcional)" → "nome da crianca opcional" */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-./]+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A frase aparece no texto começando no início de uma palavra? ("observ" ⊂ "minhas observacoes") */
export function containsPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${text}`.includes(` ${phrase}`);
}

export interface FormProperty {
  id: string;
  title: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  appField?: string;
}

/** Campos do formulário do serviço (JSON Schema `properties` ou lista `fields`). */
export function formProperties(formSchema: any): FormProperty[] {
  if (!formSchema || typeof formSchema !== 'object') return [];
  const props: Record<string, any> = { ...(formSchema.properties || {}) };
  for (const field of Array.isArray(formSchema.fields) ? formSchema.fields : []) {
    if (field?.id && !props[field.id]) props[field.id] = { title: field.label, type: field.type };
  }
  return Object.entries(props)
    .filter(([id]) => id && !id.startsWith('citizen_') && id !== '_meta')
    .map(([id, prop]: [string, any]) => ({
      id,
      title: String(prop?.title || prop?.label || id),
      type: prop?.type,
      format: prop?.format,
      enum: Array.isArray(prop?.enum) ? prop.enum : undefined,
      appField: typeof prop?.['x-app-field'] === 'string' ? prop['x-app-field'] : undefined,
    }));
}

/** O tipo do campo combina com o tipo do dado que o app espera? */
function kindFits(kind: FieldKind, prop: FormProperty): boolean {
  const isBool = prop.type === 'boolean' || prop.type === 'checkbox';
  if (kind === 'boolean') return isBool;
  if (isBool) return false;
  if (kind === 'date') return !prop.enum && prop.type !== 'number';
  return true;
}

export interface RoleMatch {
  role: AppFieldRole;
  required: boolean;
  fallback?: RoleFallback;
  field?: { id: string; title: string; how: 'ligado' | 'nome' | 'titulo' };
  /** Sem campo no formulário, de onde o dado vem (ou nada) */
  source?: 'servico' | 'pessoa' | 'perfil';
}

/** Dados que sempre podem vir do perfil do cidadão, se o formulário não tiver */
const ALWAYS_FROM_PROFILE = new Set(['telefone', 'dataNascimento']);

/** O dado vem de outro lugar quando o formulário não tem o campo? */
function sourceWithoutField(key: string, fallback?: RoleFallback): RoleMatch['source'] {
  if (fallback === 'serviceName') return 'servico';
  if (fallback === 'citizenName') return 'pessoa';
  if (fallback === 'profile' || ALWAYS_FROM_PROFILE.has(key)) return 'perfil';
  return undefined;
}

/**
 * Liga cada papel do contrato a no máximo um campo do formulário (e cada campo
 * a no máximo um papel), do encaixe mais forte para o mais fraco.
 */
export function mapFormToApp(contract: AppActionContract | undefined, formSchema: any): RoleMatch[] {
  if (!contract) return [];
  const props = formProperties(formSchema);
  const candidates: Array<{ roleIndex: number; prop: FormProperty; score: number; how: 'ligado' | 'nome' | 'titulo' }> = [];

  contract.roles.forEach(({ role }, roleIndex) => {
    for (const prop of props) {
      if (prop.appField) {
        if (prop.appField === role.key) candidates.push({ roleIndex, prop, score: 10000, how: 'ligado' });
        continue; // campo ligado a outro papel não entra na adivinhação
      }
      if (!kindFits(role.kind, prop)) continue;
      if (prop.id === role.key) {
        candidates.push({ roleIndex, prop, score: 5000, how: 'nome' });
        continue;
      }
      const idText = normalizeText(prop.id);
      const titleText = normalizeText(prop.title);
      let best = 0;
      let how: 'nome' | 'titulo' = 'titulo';
      for (const synonym of role.synonyms) {
        // frases mais longas = encaixe mais específico
        const weight = 10 + synonym.length * 2 + synonym.split(' ').length * 5;
        if (containsPhrase(titleText, synonym) && weight > best) {
          best = weight;
          how = 'titulo';
        }
        if (containsPhrase(idText, synonym) && weight + 1 > best) {
          best = weight + 1;
          how = 'nome';
        }
      }
      if (best) candidates.push({ roleIndex, prop, score: best, how });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  const usedRoles = new Map<number, RoleMatch['field']>();
  const usedProps = new Set<string>();
  for (const candidate of candidates) {
    if (usedRoles.has(candidate.roleIndex) || usedProps.has(candidate.prop.id)) continue;
    usedRoles.set(candidate.roleIndex, { id: candidate.prop.id, title: candidate.prop.title, how: candidate.how });
    usedProps.add(candidate.prop.id);
  }

  return contract.roles.map(({ role, required, fallback }, index) => {
    const field = usedRoles.get(index);
    return { role, required: Boolean(required), fallback, field, source: field ? undefined : sourceWithoutField(role.key, fallback) };
  });
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);

function asText(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map(asText).join(', ');
  if (value && typeof value === 'object') return Object.values(value).map(asText).filter(Boolean).join(', ');
  return String(value ?? '').trim();
}

export interface AppFieldContext {
  serviceName?: string | null;
  citizen?: { name?: string | null; phone?: string | null; birthDate?: Date | string | null; address?: any } | null;
}

/** Endereço do perfil ({logradouro, numero, bairro...}) em uma linha */
function addressLine(address: any): { line?: string; bairro?: string } {
  if (!address) return {};
  if (typeof address === 'string') return { line: address.trim() || undefined };
  const rua = [address.logradouro || address.street, address.numero || address.number].filter(Boolean).join(', ');
  const line = [rua, address.complemento || address.complement].filter(Boolean).join(' - ');
  return { line: line || undefined, bairro: address.bairro || address.neighborhood || undefined };
}

/** Valor de um dado que não está no formulário (nome do serviço, quem pediu, perfil) */
function valueWithoutField(match: RoleMatch, ctx: AppFieldContext): unknown {
  if (match.source === 'servico') return ctx.serviceName || undefined;
  if (match.source === 'pessoa') return ctx.citizen?.name || undefined;
  if (match.source !== 'perfil' || !ctx.citizen) return undefined;
  const key = match.role.key;
  if (key === 'telefone') return ctx.citizen.phone || undefined;
  if (key === 'dataNascimento') {
    const date = ctx.citizen.birthDate ? new Date(ctx.citizen.birthDate) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;
  }
  const address = addressLine(ctx.citizen.address);
  if (key === 'bairro') return address.bairro;
  return address.line;
}

/**
 * Dados do pedido no formato que o app lê: cada valor reconhecido ganha também
 * o nome que o app entende (o original continua lá); o que falta no formulário
 * vem do nome do serviço ou do perfil, quando o contrato permite. Campos não
 * reconhecidos vão em `observacoes` como "Outros dados: Título: valor".
 */
export function withAppFields(action: string, formSchema: any, customData: any, ctx: AppFieldContext = {}): any {
  const data = customData && typeof customData === 'object' ? customData : {};
  const contract = APP_FIELD_CONTRACTS[action];
  if (!contract) return data;

  const out: Record<string, any> = { ...data };
  const matches = mapFormToApp(contract, formSchema);
  const used = new Set<string>();
  for (const match of matches) {
    if (!match.field) continue;
    used.add(match.field.id);
    const value = data[match.field.id];
    if (!isEmpty(value) && isEmpty(out[match.role.key])) out[match.role.key] = value;
  }
  // o que o formulário não trouxe: nome do serviço, quem pediu, perfil
  for (const match of matches) {
    if (!isEmpty(out[match.role.key])) continue;
    const value = valueWithoutField({ ...match, source: match.source || sourceWithoutField(match.role.key, match.fallback) }, ctx);
    if (!isEmpty(value)) out[match.role.key] = value;
  }
  // o próprio nome do papel já usado no formulário também conta como reconhecido
  for (const { role } of contract.roles) used.add(role.key);

  const titles = new Map(formProperties(formSchema).map((prop) => [prop.id, prop.title]));
  const extras = Object.entries(data)
    .filter(([id, value]) => id !== '_meta' && !id.startsWith('citizen_') && !used.has(id) && titles.has(id) && !isEmpty(value))
    .map(([id, value]) => `${titles.get(id)}: ${asText(value)}`)
    .filter((line) => line.length < 600);
  if (extras.length) {
    const outros = `Outros dados: ${extras.join('; ')}`;
    out.observacoes = isEmpty(out.observacoes) ? outros : `${asText(out.observacoes)} · ${outros}`;
  }
  return out;
}

export interface AppSuggestion {
  appAction: string;
  appName: string;
  actionLabel: string;
  /** Palavras do nome/descrição que levaram à sugestão */
  matched: string[];
  score: number;
  confident: boolean;
}

/**
 * Para qual app um serviço parece ir, pelo nome (peso 3) e descrição (peso 1).
 * Só apps da secretaria informada. Sem palavra no NOME, não sugere.
 */
export function suggestAppActions(input: { name?: string; description?: string; departmentCode?: string | null }): AppSuggestion[] {
  const name = normalizeText(input.name);
  const description = normalizeText(input.description);
  if (!name) return [];
  // documento, consulta ou reclamação: fica na fila do protocolo
  if (NOT_AN_APP_CASE.some((word) => containsPhrase(name, word))) return [];
  const dept = (input.departmentCode || '').toUpperCase().replace(/-/g, '_');

  const results: AppSuggestion[] = [];
  for (const app of APP_CATALOG) {
    if (dept && !app.departments.includes(dept)) continue;
    for (const action of app.actions) {
      const contract = APP_FIELD_CONTRACTS[action.code];
      if (!contract) continue;
      if (contract.notKeywords?.some((word) => containsPhrase(name, word))) continue;
      let score = 0;
      let nameHit = false;
      const matched: string[] = [];
      for (const keyword of contract.keywords) {
        const inName = containsPhrase(name, keyword);
        const inDescription = containsPhrase(description, keyword);
        if (!inName && !inDescription) continue;
        const specificity = keyword.split(' ').length;
        score += (inName ? 3 : 1) * specificity;
        nameHit = nameHit || inName;
        matched.push(keyword);
      }
      if (nameHit) results.push({ appAction: action.code, appName: app.name, actionLabel: action.label, matched, score, confident: false });
    }
  }
  results.sort((a, b) => b.score - a.score);
  if (results[0]) {
    const second = results.find((item) => findAppAction(item.appAction)?.app.code !== findAppAction(results[0].appAction)?.app.code);
    // seguro = venceu com folga (ou só existe um app possível)
    results[0].confident = !second || results[0].score >= second.score + 2;
  }
  return results.slice(0, 5);
}

export interface FieldCheck {
  appAction: string;
  roles: Array<{ key: string; label: string; required: boolean; field?: RoleMatch['field']; source?: RoleMatch['source'] }>;
  missingRequired: string[];
  /** Propriedades JSON Schema prontas para acrescentar ao formulário (os papéis sem campo) */
  fieldsToAdd: Record<string, any>;
}

function propertyForRole(role: AppFieldRole): Record<string, any> {
  const base: Record<string, any> = { title: role.label, 'x-app-field': role.key };
  if (role.kind === 'boolean') return { ...base, type: 'boolean' };
  if (role.kind === 'number') return { ...base, type: 'number' };
  if (role.kind === 'date') return { ...base, type: 'string', format: 'date' };
  if (role.kind === 'textarea') return { ...base, type: 'string', widget: 'textarea' };
  return { ...base, type: 'string' };
}

/** O que o app vai receber deste formulário e o que falta. */
export function checkAppFields(appAction: string, formSchema: any): FieldCheck | null {
  const contract = APP_FIELD_CONTRACTS[appAction];
  if (!contract) return null;
  const matches = mapFormToApp(contract, formSchema);
  const existingIds = new Set(formProperties(formSchema).map((prop) => prop.id));
  const fieldsToAdd: Record<string, any> = {};
  for (const match of matches) {
    // só sugere acrescentar o que não vem de outro lugar
    if (!match.field && !match.source && !existingIds.has(match.role.key)) fieldsToAdd[match.role.key] = propertyForRole(match.role);
  }
  return {
    appAction,
    roles: matches.map((match) => ({ key: match.role.key, label: match.role.label, required: match.required, field: match.field, source: match.source })),
    missingRequired: matches.filter((match) => match.required && !match.field && !match.source).map((match) => match.role.label),
    fieldsToAdd,
  };
}
