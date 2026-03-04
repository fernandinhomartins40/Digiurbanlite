import { Department, Prisma, PrismaClient, TipoUnidadeOrganizacional } from '@prisma/client';

type DepartmentCreateInput = {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

type DepartmentUpdateInput = {
  name?: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

type DepartmentListOptions = {
  includeInactive?: boolean;
  departmentIds?: string[];
};

type DepartmentSyncOptions = {
  departmentId?: string;
  missingOnly?: boolean;
  actorId?: string | null;
};

type PrismaLike = PrismaClient | Prisma.TransactionClient;
type PrismaRootClient = PrismaClient;

function normalizeCode(code?: string | null): string | null {
  if (!code) return null;
  const normalized = code
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 40);

  return normalized || null;
}

function extractInitials(name: string): string {
  const initials = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

  return initials || 'SECRETARIA';
}

function buildDefaultRootDescription(department: Pick<Department, 'name' | 'description'>): string {
  return department.description?.trim() || `Estrutura organizacional da ${department.name}`;
}

async function resolveRootSigla(
  prisma: PrismaLike,
  department: Pick<Department, 'id' | 'name' | 'code'>,
  existingRootSigla?: string | null,
  existingRootId?: string
): Promise<string> {
  const usedUnits = await prisma.organizationalUnit.findMany({
    where: { departmentId: department.id },
    select: { id: true, sigla: true },
  });

  const usedSiglas = new Set(
    usedUnits
      .filter((unit) => unit.id !== existingRootId)
      .map((unit) => unit.sigla?.trim().toUpperCase())
      .filter((sigla): sigla is string => Boolean(sigla))
  );

  const baseCode = normalizeCode(department.code);
  const initials = extractInitials(department.name);
  const candidates = [
    normalizeCode(existingRootSigla),
    baseCode,
    baseCode ? `${baseCode}_SEC` : null,
    initials,
    `${initials}_SEC`,
    `SEC_${initials}`,
  ].filter((candidate, index, list): candidate is string => Boolean(candidate) && list.indexOf(candidate) === index);

  for (const candidate of candidates) {
    if (!usedSiglas.has(candidate)) {
      return candidate;
    }
  }

  let suffix = 1;
  while (true) {
    const candidate = `${baseCode || initials}_SEC_${suffix}`;
    if (!usedSiglas.has(candidate)) {
      return candidate;
    }
    suffix += 1;
  }
}

export async function findDepartmentRootOrganizationalUnit(
  prisma: PrismaLike,
  departmentId: string
) {
  return prisma.organizationalUnit.findFirst({
    where: {
      departmentId,
      tipo: TipoUnidadeOrganizacional.SECRETARIA,
      parentId: null,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function ensureDepartmentRootOrganizationalUnit(
  prisma: PrismaLike,
  departmentOrId: string | Department,
  actorId?: string | null
) {
  const department =
    typeof departmentOrId === 'string'
      ? await prisma.department.findUnique({ where: { id: departmentOrId } })
      : departmentOrId;

  if (!department) {
    throw new Error('Departamento não encontrado');
  }

  const existingRoot = await findDepartmentRootOrganizationalUnit(prisma, department.id);
  const sigla = await resolveRootSigla(
    prisma,
    department,
    existingRoot?.sigla,
    existingRoot?.id
  );

  const rootPayload = {
    nome: department.name,
    sigla,
    tipo: TipoUnidadeOrganizacional.SECRETARIA,
    nivel: 1,
    departmentId: department.id,
    parentId: null,
    descricao: existingRoot?.descricao || buildDefaultRootDescription(department),
    isActive: department.isActive,
  };

  if (existingRoot) {
    return prisma.organizationalUnit.update({
      where: { id: existingRoot.id },
      data: rootPayload,
    });
  }

  return prisma.organizationalUnit.create({
    data: {
      ...rootPayload,
      createdBy: actorId || undefined,
    },
  });
}

export async function syncDepartmentRootOrganizationalUnits(
  prisma: PrismaLike,
  options: DepartmentSyncOptions = {}
) {
  const { departmentId, missingOnly = false, actorId } = options;
  const departments = await prisma.department.findMany({
    where: {
      ...(departmentId ? { id: departmentId } : {}),
    },
    orderBy: { name: 'asc' },
  });

  const syncedDepartments: Array<{
    departmentId: string;
    departmentName: string;
    rootUnitId: string;
    rootUnitSigla: string | null;
    created: boolean;
  }> = [];

  for (const department of departments) {
    const existingRoot = await findDepartmentRootOrganizationalUnit(prisma, department.id);
    if (missingOnly && existingRoot) {
      continue;
    }

    const rootUnit = await ensureDepartmentRootOrganizationalUnit(prisma, department, actorId);
    syncedDepartments.push({
      departmentId: department.id,
      departmentName: department.name,
      rootUnitId: rootUnit.id,
      rootUnitSigla: rootUnit.sigla,
      created: !existingRoot,
    });
  }

  return syncedDepartments;
}

async function assertDepartmentCanBeDeactivated(prisma: PrismaLike, departmentId: string) {
  const [activeUsers, activeAssignments, activeServices, activeProtocols] = await Promise.all([
    prisma.user.count({
      where: {
        isActive: true,
        OR: [
          { departmentId },
          { userDepartments: { some: { departmentId, isActive: true } } },
        ],
      },
    }),
    prisma.employeeAssignment.count({
      where: {
        departmentId,
        situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] },
      },
    }),
    prisma.serviceSimplified.count({
      where: {
        departmentId,
        isActive: true,
      },
    }),
    prisma.protocolSimplified.count({
      where: {
        departmentId,
        status: { notIn: ['CONCLUIDO', 'CANCELADO'] },
      },
    }),
  ]);

  if (activeUsers > 0 || activeAssignments > 0 || activeServices > 0 || activeProtocols > 0) {
    throw new Error(
      'Não é possível desativar a secretaria enquanto existirem usuários, lotações, serviços ou protocolos ativos vinculados.'
    );
  }
}

export async function createDepartmentWithRootUnit(
  prisma: PrismaRootClient,
  input: DepartmentCreateInput,
  actorId?: string | null
) {
  const code = normalizeCode(input.code);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const department = await tx.department.create({
      data: {
        name: input.name.trim(),
        code,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      },
    });

    const rootUnit = await ensureDepartmentRootOrganizationalUnit(tx, department, actorId);

    return { department, rootUnit };
  });
}

export async function updateDepartmentWithRootUnit(
  prisma: PrismaRootClient,
  departmentId: string,
  input: DepartmentUpdateInput,
  actorId?: string | null
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const currentDepartment = await tx.department.findUnique({
      where: { id: departmentId },
    });

    if (!currentDepartment) {
      throw new Error('Departamento não encontrado');
    }

    const nextIsActive = input.isActive ?? currentDepartment.isActive;
    if (currentDepartment.isActive && !nextIsActive) {
      await assertDepartmentCanBeDeactivated(tx, departmentId);
    }

    const department = await tx.department.update({
      where: { id: departmentId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: normalizeCode(input.code) } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    const rootUnit = await ensureDepartmentRootOrganizationalUnit(tx, department, actorId);

    return { department, rootUnit };
  });
}

export async function listDepartmentsWithRootUnits(
  prisma: PrismaLike,
  options: DepartmentListOptions = {}
) {
  const { includeInactive = false, departmentIds } = options;
  const departments = await prisma.department.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(departmentIds?.length ? { id: { in: departmentIds } } : {}),
    },
    include: {
      _count: {
        select: {
          users: true,
          servicesSimplified: true,
          protocolsSimplified: true,
          organizationalUnits: true,
        },
      },
      organizationalUnits: {
        where: {
          tipo: TipoUnidadeOrganizacional.SECRETARIA,
          parentId: null,
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        select: {
          id: true,
          nome: true,
          sigla: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map((department) => {
    const rootUnit = department.organizationalUnits[0] || null;
    return {
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
      usersCount: department._count.users,
      servicesCount: department._count.servicesSimplified,
      protocolsCount: department._count.protocolsSimplified,
      unitsCount: department._count.organizationalUnits,
      rootUnitCount: department.organizationalUnits.length,
      rootOrganizationalUnit: rootUnit,
      rootUnitStatus: rootUnit ? 'SYNCED' : 'MISSING',
    };
  });
}
