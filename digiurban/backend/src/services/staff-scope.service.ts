/**
 * Onde o servidor trabalha — fonte única: a LOTAÇÃO no organograma
 * (EmployeeAssignment ativa). A secretaria do usuário (User.departmentId) e a
 * lista de secretarias (UserDepartment) são espelhos mantidos a partir dela
 * por `syncUserDepartmentsFromAssignments()`.
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

/**
 * Espelha a lotação nos campos antigos (secretaria principal + lista de
 * secretarias) — o resto do sistema (acesso a protocolos, menus) continua
 * lendo deles. Chamar depois de criar/alterar/encerrar uma lotação.
 */
export async function syncUserDepartmentsFromAssignments(userId: string): Promise<void> {
  const assignments = await prisma.employeeAssignment.findMany({
    where: { userId, situacao: { in: WORKING_ASSIGNMENT_STATUSES }, OR: [{ dataFim: null }, { dataFim: { gt: new Date() } }] },
    orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'asc' }],
    select: { departmentId: true, isPrimary: true },
  });
  if (assignments.length === 0) return; // sem lotação no organograma: não apaga o que existe
  const departmentIds = [...new Set(assignments.map((item) => item.departmentId))];
  const primary = assignments.find((item) => item.isPrimary)?.departmentId || departmentIds[0];

  await prisma.user.update({ where: { id: userId }, data: { departmentId: primary } });
  const existing = await prisma.userDepartment.findMany({ where: { userId }, select: { id: true, departmentId: true, isActive: true, isPrimary: true } });
  for (const departmentId of departmentIds) {
    const link = existing.find((item) => item.departmentId === departmentId);
    if (!link) {
      await prisma.userDepartment.create({ data: { userId, departmentId, isPrimary: departmentId === primary, isActive: true } });
    } else if (!link.isActive || link.isPrimary !== (departmentId === primary)) {
      await prisma.userDepartment.update({ where: { id: link.id }, data: { isActive: true, isPrimary: departmentId === primary } });
    }
  }
  for (const link of existing) {
    if (!departmentIds.includes(link.departmentId) && link.isActive) {
      await prisma.userDepartment.update({ where: { id: link.id }, data: { isActive: false, isPrimary: false } });
    }
  }
}
