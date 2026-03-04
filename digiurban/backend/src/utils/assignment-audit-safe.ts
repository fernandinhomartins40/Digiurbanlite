import { AssignmentAudit, Prisma, PrismaClient } from '@prisma/client';

type AssignmentAuditCreateData = Prisma.AssignmentAuditCreateArgs['data'];
type AssignmentAuditFindManyArgs = Prisma.AssignmentAuditFindManyArgs;

function isMissingAssignmentAuditTableError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2021') {
    return false;
  }

  const metaTable = typeof error.meta?.table === 'string' ? error.meta.table.toLowerCase() : '';
  const message = error.message.toLowerCase();
  return metaTable.includes('assignment_audits') || message.includes('assignment_audits');
}

function logAssignmentAuditTableWarning(context: string, error: unknown) {
  const details = error instanceof Error ? error.message : String(error);
  console.warn(
    `[assignment-audit] tabela assignment_audits ausente (${context}). Operacao continuou sem auditoria. Detalhes: ${details}`
  );
}

export async function safeCreateAssignmentAudit(
  prisma: PrismaClient,
  data: AssignmentAuditCreateData,
  context: string
): Promise<void> {
  try {
    await prisma.assignmentAudit.create({ data });
  } catch (error) {
    if (isMissingAssignmentAuditTableError(error)) {
      logAssignmentAuditTableWarning(context, error);
      return;
    }

    throw error;
  }
}

export async function safeFindAssignmentAudits(
  prisma: PrismaClient,
  args: AssignmentAuditFindManyArgs,
  context: string
): Promise<AssignmentAudit[]> {
  try {
    return await prisma.assignmentAudit.findMany(args);
  } catch (error) {
    if (isMissingAssignmentAuditTableError(error)) {
      logAssignmentAuditTableWarning(context, error);
      return [];
    }

    throw error;
  }
}
