import { Prisma, SigiloLevel } from '@prisma/client';
import prisma from '../utils/prisma';
import { FlowAuthContext } from '../middleware/auth.middleware';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isAdminContext(auth: FlowAuthContext): boolean {
  if (auth.userType === 'service') return true;
  const role = (auth.userRole || '').toUpperCase();
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function buildInvolvementScope(auth: FlowAuthContext): Prisma.InternalProcessWhereInput {
  return {
    OR: [
      { createdById: auth.userId },
      { currentUserId: auth.userId },
      { dispatches: { some: { OR: [{ fromUserId: auth.userId }, { toUserId: auth.userId }] } } },
      { signatures: { some: { OR: [{ requestedById: auth.userId }, { signerId: auth.userId }] } } },
      { comments: { some: { userId: auth.userId, isDeleted: false } } },
    ],
  };
}

function buildDepartmentAndUnitScope(auth: FlowAuthContext): Prisma.InternalProcessWhereInput {
  const departmentIds = unique(auth.departmentIds || []);
  const organizationalUnitIds = unique(auth.organizationalUnitIds || []);

  const scopes: Prisma.InternalProcessWhereInput[] = [];
  if (departmentIds.length > 0) {
    scopes.push({ originDepartmentId: { in: departmentIds } });
    scopes.push({ currentDepartmentId: { in: departmentIds } });
    scopes.push({
      dispatches: {
        some: {
          OR: [
            { fromDepartmentId: { in: departmentIds } },
            { toDepartmentId: { in: departmentIds } },
          ],
        },
      },
    });
  }

  if (organizationalUnitIds.length > 0) {
    scopes.push({ originOrganizationalUnitId: { in: organizationalUnitIds } });
    scopes.push({ currentOrganizationalUnitId: { in: organizationalUnitIds } });
    scopes.push({
      dispatches: {
        some: {
          OR: [
            { fromOrganizationalUnitId: { in: organizationalUnitIds } },
            { toOrganizationalUnitId: { in: organizationalUnitIds } },
          ],
        },
      },
    });
  }

  if (scopes.length === 0) {
    return { id: '__NO_SCOPE__' };
  }

  return { OR: scopes };
}

function buildRestrictedScope(auth: FlowAuthContext): Prisma.InternalProcessWhereInput {
  return {
    OR: [buildInvolvementScope(auth), buildDepartmentAndUnitScope(auth)],
  };
}

function buildConfidentialScope(auth: FlowAuthContext): Prisma.InternalProcessWhereInput {
  return buildInvolvementScope(auth);
}

export function buildProcessVisibilityWhere(auth: FlowAuthContext): Prisma.InternalProcessWhereInput {
  if (isAdminContext(auth) || auth.canAccessConfidential) {
    return {};
  }

  return {
    OR: [
      { sigilo: SigiloLevel.PUBLICO },
      { AND: [{ sigilo: SigiloLevel.RESTRITO }, buildRestrictedScope(auth)] },
      { AND: [{ sigilo: SigiloLevel.CONFIDENCIAL }, buildConfidentialScope(auth)] },
    ],
  };
}

export async function assertProcessAccess(
  client: PrismaClientLike,
  processId: string,
  auth: FlowAuthContext,
): Promise<void> {
  const visibility = buildProcessVisibilityWhere(auth);
  const process = await client.internalProcess.findFirst({
    where: {
      id: processId,
      AND: [visibility],
    },
    select: { id: true },
  });

  if (!process) {
    throw new Error('Processo nao encontrado ou acesso negado');
  }
}

export function assertOrganizationalUnitScope(
  auth: FlowAuthContext,
  organizationalUnitId: string,
): void {
  if (!organizationalUnitId) {
    throw new Error('organizationalUnitId e obrigatorio');
  }

  if (isAdminContext(auth)) {
    return;
  }

  const hasAccess = (auth.organizationalUnitIds || []).includes(organizationalUnitId);
  if (!hasAccess) {
    throw new Error('Acesso negado para a unidade organizacional informada');
  }
}
