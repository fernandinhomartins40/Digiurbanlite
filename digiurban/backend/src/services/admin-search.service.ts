/**
 * Busca do painel (Ctrl+K): cidadão por nome/CPF, pedido por número e
 * processo interno por número, cada um no escopo de quem procura.
 * - Cidadão: só com `citizens:read`; CPF sempre mascarado.
 * - Pedido: mesma regra de acesso dos protocolos (`buildProtocolScopeWhere`).
 * - Processo interno: mesma lista "todos" do módulo (`listProcesses`).
 * Uma fonte que falhar volta vazia; as outras seguem.
 */

import { prisma } from '../lib/prisma';
import { buildProtocolScopeWhere, ProtocolAccessActor } from './protocol-access.service';
import { buildActor, listProcesses } from './internal-process/internal-process.service';

import { SEARCH_MIN_CHARS, SEARCH_LIMIT, parseSearchQuery, maskCpf, canReadCitizens } from './admin-search-rules';
export { SEARCH_MIN_CHARS, SEARCH_LIMIT, parseSearchQuery, maskCpf, canReadCitizens } from './admin-search-rules';
export type { AdminSearchQuery } from './admin-search-rules';

export interface AdminSearchUser extends ProtocolAccessActor {
  name: string;
}

async function safe<T>(label: string, run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (error) {
    console.error(`[admin-search] ${label}`, error);
    return [];
  }
}

export async function adminSearch(user: AdminSearchUser, raw: unknown) {
  const query = parseSearchQuery(raw);
  if (!query) return { citizens: [], protocols: [], processes: [] };
  const { term, digits } = query;

  const [citizens, protocols, processes] = await Promise.all([
    canReadCitizens(user.role)
      ? safe('cidadãos', async () => {
          const or: any[] = [{ name: { contains: term, mode: 'insensitive' } }];
          if (digits.length >= SEARCH_MIN_CHARS) or.push({ cpf: { contains: digits } });
          const rows = await prisma.citizen.findMany({
            where: { OR: or },
            select: { id: true, name: true, cpf: true, isActive: true },
            orderBy: { name: 'asc' },
            take: SEARCH_LIMIT,
          });
          return rows.map((row) => ({ id: row.id, name: row.name, cpf: maskCpf(row.cpf), isActive: row.isActive }));
        })
      : Promise.resolve([]),
    safe('pedidos', () =>
      prisma.protocolSimplified.findMany({
        where: { AND: [{ number: { contains: term, mode: 'insensitive' } }, ...buildProtocolScopeWhere(user)] },
        select: { id: true, number: true, title: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: SEARCH_LIMIT,
      })
    ),
    safe('processos internos', async () => {
      const actor = await buildActor({ id: user.id, role: user.role, name: user.name });
      const { items } = await listProcesses(actor, { box: 'todos', search: term });
      return items.slice(0, SEARCH_LIMIT).map((item) => ({ id: item.id, number: item.number, subject: item.subject, status: item.status }));
    }),
  ]);

  return { citizens, protocols, processes };
}
