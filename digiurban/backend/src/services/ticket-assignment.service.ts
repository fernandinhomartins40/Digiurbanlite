import { SituacaoVinculo, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface TicketAssigneeOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  positionName?: string;
  organizationalUnitName?: string;
  isPrimaryAssignment: boolean;
  isTopHierarchy: boolean;
  isSecretaryLike: boolean;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  SUPER_ADMIN: 500,
  ADMIN: 400,
  MANAGER: 300,
  COORDINATOR: 200,
  USER: 100,
  GUEST: 0,
};

function normalizeLabel(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isSecretaryLikeLabel(value?: string | null) {
  const normalized = normalizeLabel(value);
  return normalized.includes('secretari') || normalized.includes('secretario');
}

export async function listDepartmentTicketAssignees(
  departmentId: string
): Promise<TicketAssigneeOption[]> {
  if (!departmentId) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { departmentId },
        {
          userDepartments: {
            some: {
              departmentId,
              isActive: true,
            },
          },
        },
        {
          assignments: {
            some: {
              departmentId,
              situacao: SituacaoVinculo.ATIVO,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      userDepartments: {
        where: {
          departmentId,
          isActive: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: {
          isPrimary: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignments: {
        where: {
          departmentId,
          situacao: SituacaoVinculo.ATIVO,
        },
        orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'asc' }],
        select: {
          isPrimary: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          position: {
            select: {
              nome: true,
            },
          },
          function: {
            select: {
              nome: true,
            },
          },
          organizationalUnit: {
            select: {
              nome: true,
              sigla: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const userIds = users.map((user) => user.id);

  const hierarchyLinks =
    userIds.length > 0
      ? await prisma.employeeHierarchy.findMany({
          where: {
            ativo: true,
            OR: [{ supervisorId: { in: userIds } }, { subordinadoId: { in: userIds } }],
          },
          select: {
            supervisorId: true,
            subordinadoId: true,
          },
        })
      : [];

  const departmentUserIds = new Set(userIds);
  const supervisorsInDepartment = new Set<string>();
  const subordinatesInDepartment = new Set<string>();

  for (const link of hierarchyLinks) {
    if (
      departmentUserIds.has(link.supervisorId) &&
      departmentUserIds.has(link.subordinadoId)
    ) {
      supervisorsInDepartment.add(link.supervisorId);
      subordinatesInDepartment.add(link.subordinadoId);
    }
  }

  return users
    .map((user) => {
      const primaryAssignment =
        user.assignments.find((assignment) => assignment.isPrimary) || user.assignments[0];
      const primaryDepartment =
        user.department ||
        user.userDepartments.find((department) => department.isPrimary)?.department ||
        user.userDepartments[0]?.department ||
        primaryAssignment?.department;
      const positionName = primaryAssignment?.position?.nome || primaryAssignment?.function?.nome;
      const isTopHierarchy =
        supervisorsInDepartment.has(user.id) && !subordinatesInDepartment.has(user.id);
      const isPrimaryAssignment =
        Boolean(primaryAssignment?.isPrimary) || Boolean(user.userDepartments.find((d) => d.isPrimary));
      const isSecretaryLike =
        isSecretaryLikeLabel(positionName) ||
        isSecretaryLikeLabel(primaryAssignment?.organizationalUnit?.nome);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: primaryDepartment?.id || user.departmentId || undefined,
        departmentName: primaryDepartment?.name || undefined,
        positionName: positionName || undefined,
        organizationalUnitName:
          primaryAssignment?.organizationalUnit?.sigla ||
          primaryAssignment?.organizationalUnit?.nome ||
          undefined,
        isPrimaryAssignment,
        isTopHierarchy,
        isSecretaryLike,
      } satisfies TicketAssigneeOption;
    })
    .sort((a, b) => {
      if (a.isSecretaryLike !== b.isSecretaryLike) {
        return a.isSecretaryLike ? -1 : 1;
      }

      if (a.isTopHierarchy !== b.isTopHierarchy) {
        return a.isTopHierarchy ? -1 : 1;
      }

      const roleDelta = (ROLE_PRIORITY[b.role] || 0) - (ROLE_PRIORITY[a.role] || 0);
      if (roleDelta !== 0) {
        return roleDelta;
      }

      if (a.isPrimaryAssignment !== b.isPrimaryAssignment) {
        return a.isPrimaryAssignment ? -1 : 1;
      }

      return a.name.localeCompare(b.name, 'pt-BR');
    });
}

export async function resolveDefaultDepartmentTicketAssignee(departmentId: string) {
  const candidates = await listDepartmentTicketAssignees(departmentId);
  return candidates[0] || null;
}
