/**
 * Partes comuns dos apps gerais (2026-10-09): Agenda de Atendimentos, Cursos e
 * Capacitações, Feiras e Mercados e Cemitérios.
 *
 * Estes apps atendem VÁRIAS secretarias. Cada registro guarda a secretaria
 * dona (`departmentCode`) e quem trabalha vê só as das suas secretarias
 * (`scope`); ADMIN/SUPER_ADMIN veem todas (`scope` = null).
 */

import { prisma } from '../../lib/prisma';

export type AppScope = string[] | null;

const FULL_ACCESS = new Set(['ADMIN', 'SUPER_ADMIN']);

/** Secretarias que a pessoa enxerga dentro do app (null = todas). */
export async function scopeOf(user: any, appDepartments: string[]): Promise<AppScope> {
  if (FULL_ACCESS.has(String(user?.role))) return null;
  // import tardio: o middleware puxa a autenticação inteira (que deixa conexões abertas nos testes)
  const { getUserDepartmentCodes } = await import('../../middleware/department-access');
  const codes = await getUserDepartmentCodes(user);
  return codes.filter((code) => appDepartments.includes(code));
}

export function scopeWhere(scope?: AppScope) {
  return scope ? { departmentCode: { in: scope } } : {};
}

/** Secretaria escolhida numa criação manual: tem de ser uma de quem cria. */
export function pickDepartment(scope: AppScope, appDepartments: string[], wanted?: string | null): string {
  const allowed = scope || appDepartments;
  const code = String(wanted || allowed[0] || '').toUpperCase();
  if (!allowed.includes(code)) throw new Error('Escolha uma secretaria sua');
  return code;
}

export type Evento = { em: string; por?: string | null; texto: string };

export function comEvento(historico: unknown, texto: string, por?: string | null): Evento[] {
  return [...((historico as Evento[] | null) || []), { em: new Date().toISOString(), por: por || null, texto }];
}

/** "10/10/2026 às 14:00" no horário de Brasília (o servidor roda em UTC). */
export function dataHoraBrasilia(date: Date): string {
  const dia = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const hora = date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

export function dataBrasilia(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** Próximo número do ano: PREFIXO-2026-00001 (por município, a extension escopa). */
export async function proximoNumero(model: 'agendamentoAtendimento' | 'permissaoUsoEspaco' | 'pedidoCemiterio', prefixo: string) {
  const ano = new Date().getFullYear();
  const total = await (prisma as any)[model].count({ where: { numero: { startsWith: `${prefixo}-${ano}-` } } });
  return `${prefixo}-${ano}-${String(total + 1).padStart(5, '0')}`;
}

/** Serviço, secretaria e pessoa de um pedido. */
export async function origemDoPedido(protocolId: string) {
  const protocol = await prisma.protocolSimplified.findFirst({
    where: { id: protocolId },
    select: {
      number: true,
      address: true,
      citizenId: true,
      service: { select: { name: true } },
      department: { select: { code: true } },
      citizen: { select: { id: true, name: true, cpf: true, phone: true } },
    },
  });
  return {
    numero: protocol?.number || null,
    servico: protocol?.service?.name || 'Atendimento',
    departmentCode: String(protocol?.department?.code || '').toUpperCase(),
    endereco: protocol?.address || null,
    citizen: protocol?.citizen || null,
  };
}

/** Números dos pedidos para mostrar na lista. */
export async function numerosDosPedidos(protocolIds: Array<string | null | undefined>) {
  const ids = protocolIds.filter(Boolean) as string[];
  if (!ids.length) return new Map<string, string>();
  const protocolos = await prisma.protocolSimplified.findMany({ where: { id: { in: ids } }, select: { id: true, number: true } });
  return new Map(protocolos.map((p) => [p.id, p.number]));
}

/** Primeiro texto preenchido entre as chaves do formulário. */
export function campo(data: any, ...keys: string[]): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

export function dataOuNulo(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}
