/**
 * buildProtocolScopeWhere deve ter a MESMA semântica de canAccessProtocol:
 * todo protocolo que a listagem devolve precisa ser acessível no detalhe, e
 * vice-versa. Avaliamos o filtro Prisma em memória contra protocolos de exemplo.
 */
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import {
  buildProtocolScopeWhere,
  canAccessProtocol,
  ProtocolAccessActor,
  ProtocolAccessTarget
} from '../../src/services/protocol-access.service';

type Row = ProtocolAccessTarget & { id: string };

// Avaliador mínimo para os formatos gerados (igualdade, OR)
function matches(row: Row, cond: Record<string, any>): boolean {
  return Object.entries(cond).every(([key, value]) => {
    if (key === 'OR') return (value as any[]).some(c => matches(row, c));
    return (row as any)[key] === value;
  });
}

const rows: Row[] = [
  { id: 'p1', departmentId: 'saude', assignedUserId: 'u1', currentAssignedUserId: null },
  { id: 'p2', departmentId: 'saude', assignedUserId: null, currentAssignedUserId: 'u1' },
  { id: 'p3', departmentId: 'saude', assignedUserId: 'u2', currentAssignedUserId: null },
  { id: 'p4', departmentId: 'educacao', assignedUserId: null, currentAssignedUserId: null },
];

const actors: ProtocolAccessActor[] = [
  { id: 'u1', role: 'USER', departmentId: 'saude' },
  { id: 'u9', role: 'USER', departmentId: 'saude' },
  { id: 'c1', role: 'COORDINATOR', departmentId: 'saude' },
  { id: 'm1', role: 'MANAGER', departmentId: 'educacao' },
  { id: 'm2', role: 'MANAGER', departmentId: null },
  { id: 'a1', role: 'ADMIN', departmentId: null },
  { id: 's1', role: 'SUPER_ADMIN', departmentId: null },
  { id: 'x1', role: 'CITIZEN', departmentId: null },
];

describe('buildProtocolScopeWhere', () => {
  it.each(actors.map(a => [a.role, a.id, a] as const))(
    '%s (%s) lista exatamente o que pode acessar',
    (_role: string, _id: string, actor: ProtocolAccessActor) => {
      const scope = buildProtocolScopeWhere(actor);
      const listed = rows.filter(r => scope.every(c => matches(r, c))).map(r => r.id);
      const accessible = rows.filter(r => canAccessProtocol(actor, r)).map(r => r.id);
      expect(listed).toEqual(accessible);
    }
  );

  it('gestor sem departamento não vê nada', () => {
    const scope = buildProtocolScopeWhere({ id: 'm2', role: 'MANAGER', departmentId: null });
    expect(rows.filter(r => scope.every(c => matches(r, c)))).toHaveLength(0);
  });
});
