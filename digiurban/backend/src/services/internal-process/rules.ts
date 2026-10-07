/**
 * Regras do processo interno sem banco (testáveis): quem vê, quem age, o que
 * cada situação permite e a sugestão de unidade de destino.
 */

export type InternalProcessStatus = 'ABERTO' | 'EM_TRAMITE' | 'CONCLUIDO' | 'ARQUIVADO' | 'CANCELADO';

export const OPEN_STATUSES: InternalProcessStatus[] = ['ABERTO', 'EM_TRAMITE'];

export interface ProcessActor {
  id: string;
  role: string;
  unitIds: string[];
  departmentIds: string[];
}

export interface ProcessAccessTarget {
  confidential: boolean;
  createdById: string;
  originUnitId: string;
  currentUnitId: string;
  currentUserId: string | null;
  originDepartmentId: string | null;
  currentDepartmentId: string | null;
  /** unidades e pessoas por onde o processo já passou */
  involvedUnitIds?: string[];
  involvedUserIds?: string[];
}

const isAdmin = (role: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';
const isManager = (role: string) => role === 'MANAGER' || role === 'COORDINATOR';

/** Quem participa: criou, está com ele, ou a unidade dele está/esteve no caminho */
export function isParticipant(actor: ProcessActor, process: ProcessAccessTarget): boolean {
  if (process.createdById === actor.id || process.currentUserId === actor.id) return true;
  if ((process.involvedUserIds || []).includes(actor.id)) return true;
  const units = new Set([process.originUnitId, process.currentUnitId, ...(process.involvedUnitIds || [])]);
  return actor.unitIds.some((unitId) => units.has(unitId));
}

/**
 * Ver o processo: quem participa; gestores das secretarias por onde ele passa;
 * administrador. Sigiloso: só quem participa (nem o administrador).
 */
export function canViewProcess(actor: ProcessActor, process: ProcessAccessTarget): boolean {
  if (isParticipant(actor, process)) return true;
  if (process.confidential) return false;
  if (isAdmin(actor.role)) return true;
  if (isManager(actor.role)) {
    return [process.originDepartmentId, process.currentDepartmentId].some((id) => !!id && actor.departmentIds.includes(id));
  }
  return false;
}

/** Agir (encaminhar, despachar, concluir...): quem está com ele agora ou a unidade atual */
export function canActOnProcess(actor: ProcessActor, process: Pick<ProcessAccessTarget, 'currentUnitId' | 'currentUserId'>): boolean {
  if (process.currentUserId === actor.id) return true;
  return actor.unitIds.includes(process.currentUnitId);
}

export function isOpen(status: string): boolean {
  return OPEN_STATUSES.includes(status as InternalProcessStatus);
}

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ');

const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'para', 'a', 'o', 'em', 'no', 'na', 'com', 'por', 'um', 'uma', 'ao', 'as', 'os', 'que', 'sobre', 'pedido', 'solicitacao', 'memorando', 'oficio', 'processo']);

function words(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP.has(word))
    .map((word) => word.replace(/(oes|aes|ais|eis|s)$/, ''));
}

export interface UnitForSuggestion {
  id: string;
  nome: string;
  sigla?: string | null;
  departmentName?: string | null;
  competencias?: unknown;
  descricao?: string | null;
}

/**
 * Sugere unidades de destino pelo assunto/texto, comparando com o nome, a
 * secretaria, a descrição e as competências cadastradas no organograma.
 * Sem IA: rápido, de graça e explicável ("bate com: obras, pavimentação").
 */
export function suggestUnits(text: string, units: UnitForSuggestion[], limit = 3): Array<{ id: string; nome: string; score: number; matched: string[] }> {
  const query = new Set(words(text));
  if (query.size === 0) return [];
  const scored = units.map((unit) => {
    const competencias = Array.isArray(unit.competencias) ? (unit.competencias as unknown[]).map(String).join(' ') : '';
    const strong = new Set(words(`${unit.nome} ${unit.sigla || ''} ${competencias}`));
    const weak = new Set(words(`${unit.departmentName || ''} ${unit.descricao || ''}`));
    const matched: string[] = [];
    let score = 0;
    for (const word of query) {
      if (strong.has(word)) {
        score += 3;
        matched.push(word);
      } else if (weak.has(word)) {
        score += 1;
        matched.push(word);
      }
    }
    return { id: unit.id, nome: unit.nome, score, matched };
  });
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
