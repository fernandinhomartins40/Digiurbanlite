import { Prisma, SituacaoVinculo } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncUserDepartmentsFromAssignments } from './assignment-sync.service';

export const ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES: SituacaoVinculo[] = [
  SituacaoVinculo.ATIVO,
  SituacaoVinculo.AFASTADO,
  SituacaoVinculo.LICENCA,
];

export const ADMIN_MANAGED_ASSIGNMENT_DOCUMENT = 'ADMIN_ACCOUNT_SCOPE';

type DepartmentCarrier = {
  departmentId?: string | null;
  userDepartments?: Array<{
    departmentId: string;
    isPrimary?: boolean;
    isActive?: boolean;
  }>;
  assignments?: Array<{
    departmentId: string;
    isPrimary?: boolean;
    situacao?: SituacaoVinculo | string;
  }>;
};

export function extractDepartmentIdsFromOrganization(
  carrier: DepartmentCarrier | null | undefined
): string[] {
  if (!carrier) {
    return [];
  }

  const departmentIds = new Set<string>();

  for (const assignment of carrier.assignments ?? []) {
    if (
      assignment.departmentId &&
      ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES.includes(
        assignment.situacao as SituacaoVinculo
      )
    ) {
      departmentIds.add(assignment.departmentId);
    }
  }

  for (const department of carrier.userDepartments ?? []) {
    if (department.departmentId && department.isActive !== false) {
      departmentIds.add(department.departmentId);
    }
  }

  if (carrier.departmentId) {
    departmentIds.add(carrier.departmentId);
  }

  return Array.from(departmentIds);
}

export function extractPrimaryDepartmentIdFromOrganization(
  carrier: DepartmentCarrier | null | undefined
): string | null {
  if (!carrier) {
    return null;
  }

  const primaryAssignment = (carrier.assignments ?? []).find(
    (assignment) =>
      assignment.isPrimary &&
      assignment.departmentId &&
      ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES.includes(
        assignment.situacao as SituacaoVinculo
      )
  );

  if (primaryAssignment?.departmentId) {
    return primaryAssignment.departmentId;
  }

  const primaryDepartment = (carrier.userDepartments ?? []).find(
    (department) => department.isPrimary && department.isActive !== false && department.departmentId
  );

  return primaryDepartment?.departmentId || carrier.departmentId || null;
}

export function buildUserDepartmentScopeWhere(departmentIds: string[]): Prisma.UserWhereInput {
  if (departmentIds.length === 0) {
    return {};
  }

  return {
    OR: [
      { departmentId: { in: departmentIds } },
      {
        userDepartments: {
          some: {
            departmentId: { in: departmentIds },
            isActive: true,
          },
        },
      },
      {
        assignments: {
          some: {
            departmentId: { in: departmentIds },
            situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
          },
        },
      },
    ],
  };
}

export async function getAccessibleDepartmentIdsForUser(params: {
  userId: string;
  role: string;
  departmentId?: string | null;
}): Promise<string[]> {
  if (params.role === 'ADMIN' || params.role === 'SUPER_ADMIN') {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: { name: 'asc' },
    });

    return departments.map((department) => department.id);
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      departmentId: true,
      userDepartments: {
        where: { isActive: true },
        select: {
          departmentId: true,
          isPrimary: true,
          isActive: true,
        },
      },
      assignments: {
        where: {
          situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
        },
        select: {
          departmentId: true,
          isPrimary: true,
          situacao: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'desc' }],
      },
    },
  });

  const scopedDepartmentIds = extractDepartmentIdsFromOrganization(user);

  if (scopedDepartmentIds.length > 0) {
    return scopedDepartmentIds;
  }

  return params.departmentId ? [params.departmentId] : [];
}

function isManagedAdministrativeAssignment(assignment: {
  organizationalUnitId: string | null;
  positionId: string | null;
  functionId: string | null;
  documentoVinculo: string | null;
}): boolean {
  return (
    assignment.organizationalUnitId === null &&
    assignment.positionId === null &&
    assignment.functionId === null &&
    assignment.documentoVinculo === ADMIN_MANAGED_ASSIGNMENT_DOCUMENT
  );
}

export async function reconcileAdministrativeDepartmentAssignments(params: {
  userId: string;
  departmentIds: string[];
  primaryDepartmentId?: string | null;
  executorId?: string | null;
}): Promise<void> {
  const normalizedDepartmentIds = Array.from(
    new Set(params.departmentIds.filter(Boolean))
  );

  const assignments = await prisma.employeeAssignment.findMany({
    where: { userId: params.userId },
    select: {
      id: true,
      departmentId: true,
      isPrimary: true,
      situacao: true,
      organizationalUnitId: true,
      positionId: true,
      functionId: true,
      documentoVinculo: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'desc' }],
  });

  const managedAssignments = assignments.filter(isManagedAdministrativeAssignment);
  const activeNonManagedAssignments = assignments.filter(
    (assignment) =>
      !isManagedAdministrativeAssignment(assignment) &&
      ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES.includes(assignment.situacao)
  );

  const activeManagedAssignments = managedAssignments.filter((assignment) =>
    ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES.includes(assignment.situacao)
  );
  const activeNonManagedDepartmentIds = new Set(
    activeNonManagedAssignments.map((assignment) => assignment.departmentId)
  );

  const managedByDepartmentId = new Map<string, (typeof managedAssignments)[number]>();
  for (const assignment of managedAssignments) {
    if (!managedByDepartmentId.has(assignment.departmentId)) {
      managedByDepartmentId.set(assignment.departmentId, assignment);
    }
  }

  const departmentsToDeactivate = activeManagedAssignments
    .filter(
      (assignment) =>
        !normalizedDepartmentIds.includes(assignment.departmentId) ||
        activeNonManagedDepartmentIds.has(assignment.departmentId)
    )
    .map((assignment) => assignment.id);

  if (departmentsToDeactivate.length > 0) {
    await prisma.employeeAssignment.updateMany({
      where: { id: { in: departmentsToDeactivate } },
      data: {
        situacao: SituacaoVinculo.INATIVO,
        isPrimary: false,
        dataFim: new Date(),
      },
    });
  }

  for (const departmentId of normalizedDepartmentIds) {
    if (activeNonManagedDepartmentIds.has(departmentId)) {
      continue;
    }

    const existingAssignment = managedByDepartmentId.get(departmentId);

    if (existingAssignment) {
      await prisma.employeeAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          situacao: SituacaoVinculo.ATIVO,
          dataFim: null,
        },
      });
      continue;
    }

    await prisma.employeeAssignment.create({
      data: {
        userId: params.userId,
        departmentId,
        tipo: 'LOTACAO',
        situacao: SituacaoVinculo.ATIVO,
        isPrimary: false,
        dataInicio: new Date(),
        documentoVinculo: ADMIN_MANAGED_ASSIGNMENT_DOCUMENT,
        observacoes: 'Vinculo administrativo centralizado criado pela gestao de usuarios.',
        createdBy: params.executorId || undefined,
      },
    });
  }

  if (activeNonManagedAssignments.length === 0) {
    const primaryDepartmentId =
      params.primaryDepartmentId && normalizedDepartmentIds.includes(params.primaryDepartmentId)
        ? params.primaryDepartmentId
        : normalizedDepartmentIds[0] || null;

    await prisma.employeeAssignment.updateMany({
      where: {
        userId: params.userId,
        documentoVinculo: ADMIN_MANAGED_ASSIGNMENT_DOCUMENT,
        situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
      },
      data: {
        isPrimary: false,
      },
    });

    if (primaryDepartmentId) {
      await prisma.employeeAssignment.updateMany({
        where: {
          userId: params.userId,
          departmentId: primaryDepartmentId,
          documentoVinculo: ADMIN_MANAGED_ASSIGNMENT_DOCUMENT,
          situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
        },
        data: {
          isPrimary: true,
        },
      });
    }
  }

  await syncUserDepartmentsFromAssignments(params.userId);
}
