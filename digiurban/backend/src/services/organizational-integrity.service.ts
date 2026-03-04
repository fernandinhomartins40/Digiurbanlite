import { prisma } from '../lib/prisma';
import { ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES } from './organizational-context.service';

export class OrganizationalIntegrityError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'OrganizationalIntegrityError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function assertDepartmentScopedEntities(params: {
  departmentId: string;
  organizationalUnitId?: string | null;
  positionId?: string | null;
  functionId?: string | null;
}) {
  const [department, organizationalUnit, position, func] = await Promise.all([
    prisma.department.findUnique({
      where: { id: params.departmentId },
      select: { id: true, name: true, code: true, isActive: true },
    }),
    params.organizationalUnitId
      ? prisma.organizationalUnit.findUnique({
          where: { id: params.organizationalUnitId },
          select: {
            id: true,
            nome: true,
            sigla: true,
            departmentId: true,
            isActive: true,
          },
        })
      : Promise.resolve(null),
    params.positionId
      ? prisma.position.findUnique({
          where: { id: params.positionId },
          select: {
            id: true,
            nome: true,
            departmentId: true,
            organizationalUnitId: true,
            isActive: true,
          },
        })
      : Promise.resolve(null),
    params.functionId
      ? prisma.function.findUnique({
          where: { id: params.functionId },
          select: {
            id: true,
            nome: true,
            departmentId: true,
            isActive: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!department || !department.isActive) {
    throw new OrganizationalIntegrityError(
      'DEPARTMENT_NOT_FOUND',
      'Departamento não encontrado ou inativo',
      404
    );
  }

  if (params.organizationalUnitId && !organizationalUnit) {
    throw new OrganizationalIntegrityError(
      'ORGANIZATIONAL_UNIT_NOT_FOUND',
      'Unidade organizacional não encontrada',
      404
    );
  }

  if (organizationalUnit) {
    if (!organizationalUnit.isActive) {
      throw new OrganizationalIntegrityError(
        'ORGANIZATIONAL_UNIT_INACTIVE',
        'Unidade organizacional inativa'
      );
    }

    if (organizationalUnit.departmentId !== params.departmentId) {
      throw new OrganizationalIntegrityError(
        'ORGANIZATIONAL_UNIT_SCOPE_MISMATCH',
        'A unidade organizacional deve pertencer ao mesmo departamento informado'
      );
    }
  }

  if (params.positionId && !position) {
    throw new OrganizationalIntegrityError('POSITION_NOT_FOUND', 'Cargo não encontrado', 404);
  }

  if (position) {
    if (!position.isActive) {
      throw new OrganizationalIntegrityError('POSITION_INACTIVE', 'Cargo inativo');
    }

    if (position.departmentId !== params.departmentId) {
      throw new OrganizationalIntegrityError(
        'POSITION_SCOPE_MISMATCH',
        'O cargo deve pertencer ao mesmo departamento informado'
      );
    }

    if (
      organizationalUnit &&
      position.organizationalUnitId &&
      position.organizationalUnitId !== organizationalUnit.id
    ) {
      throw new OrganizationalIntegrityError(
        'POSITION_UNIT_SCOPE_MISMATCH',
        'O cargo informado pertence a outra unidade organizacional'
      );
    }

    if (!organizationalUnit && position.organizationalUnitId) {
      throw new OrganizationalIntegrityError(
        'POSITION_REQUIRES_UNIT',
        'O cargo informado exige uma unidade organizacional compatível'
      );
    }
  }

  if (params.functionId && !func) {
    throw new OrganizationalIntegrityError('FUNCTION_NOT_FOUND', 'Função não encontrada', 404);
  }

  if (func) {
    if (!func.isActive) {
      throw new OrganizationalIntegrityError('FUNCTION_INACTIVE', 'Função inativa');
    }

    if (func.departmentId !== params.departmentId) {
      throw new OrganizationalIntegrityError(
        'FUNCTION_SCOPE_MISMATCH',
        'A função deve pertencer ao mesmo departamento informado'
      );
    }
  }

  return { department, organizationalUnit, position, function: func };
}

export async function assertUserAssignmentScope(params: {
  userId: string;
  departmentId: string;
  organizationalUnitId?: string | null;
  label?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      isActive: true,
      assignments: {
        where: {
          situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
        },
        select: {
          departmentId: true,
          organizationalUnitId: true,
        },
      },
    },
  });

  if (!user) {
    throw new OrganizationalIntegrityError(
      'USER_NOT_FOUND',
      `${params.label || 'Usuário'} não encontrado`,
      404
    );
  }

  const matchingDepartmentAssignment = user.assignments.find(
    (assignment) => assignment.departmentId === params.departmentId
  );

  if (!matchingDepartmentAssignment) {
    throw new OrganizationalIntegrityError(
      'USER_SCOPE_MISMATCH',
      `${params.label || 'Usuário'} precisa possuir vínculo ativo no departamento informado`
    );
  }

  if (
    params.organizationalUnitId &&
    !user.assignments.some(
      (assignment) =>
        assignment.departmentId === params.departmentId &&
        assignment.organizationalUnitId === params.organizationalUnitId
    )
  ) {
    throw new OrganizationalIntegrityError(
      'USER_UNIT_SCOPE_MISMATCH',
      `${params.label || 'Usuário'} precisa possuir vínculo ativo na unidade organizacional informada`
    );
  }

  return user;
}

export async function assertUsersShareActiveDepartmentScope(params: {
  subordinateId: string;
  supervisorId: string;
}) {
  const [subordinate, supervisor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.subordinateId },
      select: {
        id: true,
        name: true,
        assignments: {
          where: {
            situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
          },
          select: { departmentId: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: params.supervisorId },
      select: {
        id: true,
        name: true,
        assignments: {
          where: {
            situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES },
          },
          select: { departmentId: true },
        },
      },
    }),
  ]);

  if (!subordinate) {
    throw new OrganizationalIntegrityError('SUBORDINATE_NOT_FOUND', 'Subordinado não encontrado', 404);
  }

  if (!supervisor) {
    throw new OrganizationalIntegrityError('SUPERVISOR_NOT_FOUND', 'Supervisor não encontrado', 404);
  }

  const subordinateDepartments = new Set(subordinate.assignments.map((item) => item.departmentId));
  const sharedDepartment = supervisor.assignments.find((item) =>
    subordinateDepartments.has(item.departmentId)
  );

  if (!sharedDepartment) {
    throw new OrganizationalIntegrityError(
      'HIERARCHY_SCOPE_MISMATCH',
      'Supervisor e subordinado precisam compartilhar ao menos um departamento ativo'
    );
  }

  return {
    subordinate,
    supervisor,
    sharedDepartmentId: sharedDepartment.departmentId,
  };
}
