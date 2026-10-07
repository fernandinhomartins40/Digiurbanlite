/**
 * Onde o servidor trabalha — fonte única: a LOTAÇÃO no organograma
 * (EmployeeAssignment ativa). A secretaria do usuário (User.departmentId) e a
 * lista de secretarias (UserDepartment) são espelhos mantidos a partir dela
 * por `syncUserDepartmentsFromAssignments()` (assignment-sync.service).
 *
 * Antes eram três fontes que não conversavam: quem tinha vínculo em duas
 * secretarias só enxergava os protocolos de uma.
 */

import { SituacaoVinculo } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Situações em que a lotação vale para trabalhar (afastado/licença continua lotado) */
export const WORKING_ASSIGNMENT_STATUSES: SituacaoVinculo[] = [SituacaoVinculo.ATIVO, SituacaoVinculo.AFASTADO, SituacaoVinculo.LICENCA];

/** Secretarias em que o servidor trabalha: lotações ativas (+ a secretaria principal antiga, até migrar) */
export async function getUserDepartmentIds(userId: string): Promise<string[]> {
  const [assignments, user, links] = await Promise.all([
    prisma.employeeAssignment.findMany({
      where: { userId, situacao: { in: WORKING_ASSIGNMENT_STATUSES }, OR: [{ dataFim: null }, { dataFim: { gt: new Date() } }] },
      select: { departmentId: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } }),
    prisma.userDepartment.findMany({ where: { userId, isActive: true }, select: { departmentId: true } }),
  ]);
  return [
    ...new Set([
      ...assignments.map((item) => item.departmentId),
      ...links.map((item) => item.departmentId),
      ...(user?.departmentId ? [user.departmentId] : []),
    ]),
  ];
}

/** Unidades do organograma em que o servidor está lotado */
export async function getUserUnitIds(userId: string): Promise<string[]> {
  const assignments = await prisma.employeeAssignment.findMany({
    where: { userId, situacao: { in: WORKING_ASSIGNMENT_STATUSES }, organizationalUnitId: { not: null }, OR: [{ dataFim: null }, { dataFim: { gt: new Date() } }] },
    select: { organizationalUnitId: true },
  });
  return [...new Set(assignments.map((item) => item.organizationalUnitId!).filter(Boolean))];
}

// O espelho da lotação nos campos antigos é feito por
// syncUserDepartmentsFromAssignments() em assignment-sync.service.ts.
