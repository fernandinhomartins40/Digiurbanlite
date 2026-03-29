import {
  PrismaClient,
  UserRole,
  TipoAtribuicaoProtocolo,
  SituacaoAtribuicao,
  SituacaoVinculo
} from '@prisma/client';
import { safeCreateAssignmentAudit } from '../utils/assignment-audit-safe';
import {
  listDepartmentTicketAssignees,
  type TicketAssigneeOption
} from './ticket-assignment.service';

const prisma = new PrismaClient();

/**
 * Serviço para gerenciar atribuições de protocolos
 * Integração completa com Sistema Unificado V2.0
 */

interface AssignProtocolParams {
  protocolId: string;
  assignedUserId: string;
  assignedById?: string;
  assignedByName?: string;
  motivo?: string;
  comment?: string;
  stageId?: string;
  notifyCitizen?: boolean;
  source?: 'MANUAL' | 'AUTO_STAGE';
}

interface DelegateProtocolParams {
  protocolId: string;
  delegadoParaUserId: string;
  delegadoPorUserId: string;
  delegadoPorName: string;
  motivoDelegacao: string;
  ativaAte: Date;
  comentario?: string;
}

interface ForwardProtocolParams {
  protocolId: string;
  forwardToUserId: string;
  forwardToDepartmentId?: string;
  forwardedById: string;
  forwardedByName: string;
  tipoEncaminhamento: 'ENCAMINHADO' | 'CONSULTA';
  motivo: string;
  prazoResposta?: Date;
  comentario?: string;
}

interface AssignTeamParams {
  protocolId: string;
  teamId: string;
  assignedById: string;
  assignedByName: string;
  comentario?: string;
}

interface StageSupportAssignmentSnapshot {
  id?: string;
  targetType: 'USER' | 'DEPARTMENT' | 'ORGANIZATIONAL_UNIT';
  mode?: 'REFERENCE_ONLY' | 'SUGGEST_ASSIGNMENT' | 'REQUIRED_EXECUTION';
  userId?: string;
  userName?: string;
  departmentId?: string;
  departmentName?: string;
  organizationalUnitId?: string;
  organizationalUnitName?: string;
}

interface AssignmentContext {
  protocolId?: string;
  stageId?: string;
  stageName?: string;
  departmentId?: string;
  stageSupportAssignments: StageSupportAssignmentSnapshot[];
}

interface WorkloadStatsOptions {
  protocolId?: string;
  stageId?: string;
}

interface WorkloadServerInternal {
  userId: string;
  name: string;
  email: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentIds: string[];
  organizationalUnitIds: string[];
  protocolosAtivos: number;
  protocolosPendentes: number;
  protocolosPrazoVencido: number;
  cargaPercentual: number;
  status: string;
  role: UserRole;
  isPrimaryAssignment: boolean;
  isTopHierarchy: boolean;
  isSecretaryLike: boolean;
  employeeAssignment: {
    organizationalUnit?: string;
    position?: string;
    cargaHoraria?: number;
  } | null;
  isStageRequired: boolean;
  isStageSuggested: boolean;
  stageAssignmentMode: 'REQUIRED_EXECUTION' | 'SUGGEST_ASSIGNMENT' | null;
  stageAssignmentLabel: string | null;
  stageAssignmentTargetType: 'USER' | 'DEPARTMENT' | 'ORGANIZATIONAL_UNIT' | null;
}

interface AutomaticStageAssignmentResult {
  matched: boolean;
  blocked: boolean;
  assignee?: {
    userId: string;
    name: string;
    mode: 'REQUIRED_EXECUTION' | 'SUGGEST_ASSIGNMENT';
    targetType: 'USER' | 'DEPARTMENT' | 'ORGANIZATIONAL_UNIT';
    reason: string;
  };
  blocker?: string;
}

/**
 * Buscar o vínculo funcional ativo (EmployeeAssignment) do servidor
 */
async function getActiveEmployeeAssignment(userId: string, departmentId?: string) {
  return await prisma.employeeAssignment.findFirst({
    where: {
      userId,
      situacao: 'ATIVO',
      ...(departmentId ? { departmentId } : {})
    },
    orderBy: [
      { isPrimary: 'desc' },
      { dataInicio: 'desc' }
    ],
    include: {
      organizationalUnit: true,
      position: true,
      function: true,
      department: true
    }
  });
}

/**
 * Verificar status do servidor de saúde
 */
async function checkServerHealthStatus(userId: string) {
  const healthData = await prisma.healthProfessionalData.findUnique({
    where: { userId }
  });

  return {
    exists: !!healthData,
    status: healthData?.status || 'ATIVO',
    dataInativacao: healthData?.dataInativacao,
    motivoInativacao: healthData?.motivoInativacao
  };
}

/**
 * Buscar substitutos disponíveis via hierarquia
 */
async function getAvailableSubstitutes(userId: string) {
  const hierarchy = await prisma.employeeHierarchy.findFirst({
    where: {
      subordinadoId: userId,
      tipo: 'HIERARQUICO',
      ativo: true
    },
    include: {
      supervisor: {
        include: {
          subordinados: {
            where: {
              ativo: true,
              subordinadoId: { not: userId }
            },
            include: {
              subordinado: {
                include: {
                  healthData: true,
                  protocolAssignments: {
                    where: {
                      situacao: 'ATIVA'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!hierarchy || !hierarchy.supervisor) return [];

  return hierarchy.supervisor.subordinados
    .filter((s: any) => {
      const health = s.subordinado.healthData;
      return !health || health.ativo === true;
    })
    .map((s: any) => ({
      userId: s.subordinadoId,
      name: s.subordinado.name,
      email: s.subordinado.email,
      cargaAtual: s.subordinado.protocolAssignments.length,
      status: s.subordinado.healthData?.ativo ? 'ATIVO' : 'INATIVO'
    }))
    .sort((a: any, b: any) => a.cargaAtual - b.cargaAtual); // Menos sobrecarregados primeiro
}

/**
 * Registrar no sistema de auditoria unificado
 */
async function registerAssignmentAudit(
  assignmentId: string | null,
  userId: string,
  userName: string,
  tipo: string,
  motivo: string,
  detalhes: any
) {
  await safeCreateAssignmentAudit(
    prisma,
    {
      assignmentId,
      tipo: tipo as any,
      userId,
      userName,
      motivo,
      detalhes
    },
    'protocol-assignment-service:register'
  );
}

function normalizeStageSupportAssignments(metadata: unknown): StageSupportAssignmentSnapshot[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return [];
  }

  const stageSupportAssignments = (metadata as Record<string, unknown>).stageSupportAssignments;
  if (!Array.isArray(stageSupportAssignments)) {
    return [];
  }

  return stageSupportAssignments
    .filter((assignment): assignment is Record<string, unknown> => Boolean(assignment) && typeof assignment === 'object')
    .map((assignment) => ({
      id: typeof assignment.id === 'string' ? assignment.id : undefined,
      targetType:
        assignment.targetType === 'USER' ||
        assignment.targetType === 'DEPARTMENT' ||
        assignment.targetType === 'ORGANIZATIONAL_UNIT'
          ? assignment.targetType
          : 'USER',
      mode:
        assignment.mode === 'REQUIRED_EXECUTION' ||
        assignment.mode === 'SUGGEST_ASSIGNMENT' ||
        assignment.mode === 'REFERENCE_ONLY'
          ? assignment.mode
          : 'REFERENCE_ONLY',
      userId: typeof assignment.userId === 'string' ? assignment.userId : undefined,
      userName: typeof assignment.userName === 'string' ? assignment.userName : undefined,
      departmentId: typeof assignment.departmentId === 'string' ? assignment.departmentId : undefined,
      departmentName: typeof assignment.departmentName === 'string' ? assignment.departmentName : undefined,
      organizationalUnitId:
        typeof assignment.organizationalUnitId === 'string'
          ? assignment.organizationalUnitId
          : undefined,
      organizationalUnitName:
        typeof assignment.organizationalUnitName === 'string'
          ? assignment.organizationalUnitName
          : undefined,
    }));
}

async function resolveAssignmentContext(
  protocolId?: string,
  stageId?: string
): Promise<AssignmentContext> {
  if (stageId) {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        protocolId: true,
        stageName: true,
        metadata: true,
        protocol: {
          select: {
            departmentId: true
          }
        }
      }
    });

    if (stage) {
      return {
        protocolId: stage.protocolId,
        stageId: stage.id,
        stageName: stage.stageName,
        departmentId: stage.protocol.departmentId,
        stageSupportAssignments: normalizeStageSupportAssignments(stage.metadata)
      };
    }
  }

  if (!protocolId) {
    return {
      stageSupportAssignments: []
    };
  }

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      departmentId: true,
      currentStage: {
        select: {
          id: true,
          stageName: true,
          metadata: true
        }
      }
    }
  });

  if (!protocol) {
    return {
      protocolId,
      stageSupportAssignments: []
    };
  }

  return {
    protocolId: protocol.id,
    departmentId: protocol.departmentId,
    stageId: protocol.currentStage?.id,
    stageName: protocol.currentStage?.stageName,
    stageSupportAssignments: normalizeStageSupportAssignments(protocol.currentStage?.metadata)
  };
}

function matchesStageAssignment(
  candidate: Pick<WorkloadServerInternal, 'userId' | 'departmentIds' | 'organizationalUnitIds'>,
  assignment: StageSupportAssignmentSnapshot
) {
  if (assignment.targetType === 'USER') {
    return Boolean(assignment.userId && candidate.userId === assignment.userId);
  }

  if (assignment.targetType === 'DEPARTMENT') {
    return Boolean(
      assignment.departmentId && candidate.departmentIds.includes(assignment.departmentId)
    );
  }

  return Boolean(
    assignment.organizationalUnitId &&
    candidate.organizationalUnitIds.includes(assignment.organizationalUnitId)
  );
}

function formatStageAssignmentLabel(assignment: StageSupportAssignmentSnapshot) {
  if (assignment.targetType === 'USER') {
    return assignment.userName || 'Servidor definido na etapa';
  }

  if (assignment.targetType === 'DEPARTMENT') {
    return assignment.departmentName || 'Departamento definido na etapa';
  }

  return assignment.organizationalUnitName || 'Setor definido na etapa';
}

function compareAssignableServers(a: WorkloadServerInternal, b: WorkloadServerInternal) {
  if (a.isStageRequired !== b.isStageRequired) {
    return a.isStageRequired ? -1 : 1;
  }

  if (a.isStageSuggested !== b.isStageSuggested) {
    return a.isStageSuggested ? -1 : 1;
  }

  if ((a.status === 'ATIVO') !== (b.status === 'ATIVO')) {
    return a.status === 'ATIVO' ? -1 : 1;
  }

  if (a.cargaPercentual !== b.cargaPercentual) {
    return a.cargaPercentual - b.cargaPercentual;
  }

  if (a.protocolosPrazoVencido !== b.protocolosPrazoVencido) {
    return a.protocolosPrazoVencido - b.protocolosPrazoVencido;
  }

  if (a.isSecretaryLike !== b.isSecretaryLike) {
    return a.isSecretaryLike ? -1 : 1;
  }

  if (a.isTopHierarchy !== b.isTopHierarchy) {
    return a.isTopHierarchy ? -1 : 1;
  }

  if (a.isPrimaryAssignment !== b.isPrimaryAssignment) {
    return a.isPrimaryAssignment ? -1 : 1;
  }

  return a.name.localeCompare(b.name, 'pt-BR');
}

async function getCandidateUsers(
  departmentId?: string,
  stageSupportAssignments: StageSupportAssignmentSnapshot[] = []
) {
  const candidateIds = new Set<string>();
  const ticketAssigneesByUserId = new Map<string, TicketAssigneeOption>();
  const departmentIds = new Set<string>();
  const organizationalUnitIds = new Set<string>();

  if (departmentId) {
    departmentIds.add(departmentId);
  }

  for (const assignment of stageSupportAssignments) {
    if (assignment.targetType === 'USER' && assignment.userId) {
      candidateIds.add(assignment.userId);
      continue;
    }

    if (assignment.targetType === 'DEPARTMENT' && assignment.departmentId) {
      departmentIds.add(assignment.departmentId);
      continue;
    }

    if (assignment.targetType === 'ORGANIZATIONAL_UNIT' && assignment.organizationalUnitId) {
      organizationalUnitIds.add(assignment.organizationalUnitId);
    }
  }

  for (const currentDepartmentId of departmentIds) {
    const assignees = await listDepartmentTicketAssignees(currentDepartmentId);
    for (const assignee of assignees) {
      candidateIds.add(assignee.id);
      if (!ticketAssigneesByUserId.has(assignee.id)) {
        ticketAssigneesByUserId.set(assignee.id, assignee);
      }
    }
  }

  if (organizationalUnitIds.size > 0) {
    const unitAssignments = await prisma.employeeAssignment.findMany({
      where: {
        situacao: 'ATIVO',
        organizationalUnitId: {
          in: Array.from(organizationalUnitIds)
        }
      },
      select: {
        userId: true
      }
    });

    for (const assignment of unitAssignments) {
      candidateIds.add(assignment.userId);
    }
  }

  const include: any = {
    department: true,
    userDepartments: {
      where: {
        isActive: true
      },
      include: {
        department: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    },
    healthData: true,
    protocolAssignments: {
      where: {
        situacao: 'ATIVA'
      },
      include: {
        protocol: {
          select: {
            status: true,
            dueDate: true
          }
        }
      }
    },
    assignments: {
      where: {
        situacao: 'ATIVO'
      },
      orderBy: [
        { isPrimary: 'desc' },
        { dataInicio: 'desc' }
      ],
      include: {
        department: true,
        organizationalUnit: true,
        position: true
      }
    }
  };
  const where: any = {
    isActive: true
  };

  const orFilters: any[] = [];
  const scopedDepartmentIds = Array.from(departmentIds);
  const scopedOrganizationalUnitIds = Array.from(organizationalUnitIds);

  if (candidateIds.size > 0) {
    orFilters.push({
      id: { in: Array.from(candidateIds) }
    });
  }

  if (scopedDepartmentIds.length > 0) {
    orFilters.push(
      {
        departmentId: { in: scopedDepartmentIds }
      },
      {
        userDepartments: {
          some: {
            departmentId: { in: scopedDepartmentIds },
            isActive: true
          }
        }
      },
      {
        assignments: {
          some: {
            departmentId: { in: scopedDepartmentIds },
            situacao: SituacaoVinculo.ATIVO
          }
        }
      }
    );
  }

  if (scopedOrganizationalUnitIds.length > 0) {
    orFilters.push({
      assignments: {
        some: {
          organizationalUnitId: { in: scopedOrganizationalUnitIds },
          situacao: SituacaoVinculo.ATIVO
        }
      }
    });
  }

  if (orFilters.length > 0) {
    where.OR = orFilters;
  }

  const users = await prisma.user.findMany({
    where,
    include,
  });

  return { users, ticketAssigneesByUserId };
}

function buildWorkloadServers(
  users: any[],
  ticketAssigneesByUserId: Map<string, TicketAssigneeOption>,
  stageSupportAssignments: StageSupportAssignmentSnapshot[]
) {
  return users.map((user: any) => {
    const protocolosAtivos = user.protocolAssignments.length;
    const protocolosPendentes = user.protocolAssignments.filter(
      (assignment: any) => assignment.protocol.status === 'PENDENCIA'
    ).length;
    const protocolosPrazoVencido = user.protocolAssignments.filter(
      (assignment: any) => assignment.protocol.dueDate && new Date(assignment.protocol.dueDate) < new Date()
    ).length;
    const cargaPercentual = Math.min(100, Math.round((protocolosAtivos / 20) * 100));

    const ticketAssignee = ticketAssigneesByUserId.get(user.id);
    const primaryAssignment = user.assignments.find((assignment: any) => assignment.isPrimary) || user.assignments[0];
    const primaryUserDepartment =
      user.userDepartments.find((department: any) => department.isPrimary) || user.userDepartments[0];
    const resolvedDepartment =
      ticketAssignee?.departmentId
        ? {
            id: ticketAssignee.departmentId,
            name: ticketAssignee.departmentName || ''
          }
        : primaryAssignment?.department ||
          primaryUserDepartment?.department ||
          user.department ||
          null;

    const departmentIds = new Set<string>();
    const organizationalUnitIds = new Set<string>();

    if (user.departmentId) {
      departmentIds.add(user.departmentId);
    }

    for (const userDepartment of user.userDepartments as any[]) {
      departmentIds.add(userDepartment.departmentId);
    }

    for (const assignment of user.assignments as any[]) {
      if (assignment.departmentId) {
        departmentIds.add(assignment.departmentId);
      }
      if (assignment.organizationalUnitId) {
        organizationalUnitIds.add(assignment.organizationalUnitId);
      }
    }

    const candidateBase = {
      userId: user.id,
      departmentIds: Array.from(departmentIds),
      organizationalUnitIds: Array.from(organizationalUnitIds)
    };
    const requiredMatches = stageSupportAssignments.filter(
      (assignment) =>
        assignment.mode === 'REQUIRED_EXECUTION' &&
        matchesStageAssignment(candidateBase, assignment)
    );
    const suggestedMatches = stageSupportAssignments.filter(
      (assignment) =>
        assignment.mode === 'SUGGEST_ASSIGNMENT' &&
        matchesStageAssignment(candidateBase, assignment)
    );
    const preferredStageMatch = requiredMatches[0] || suggestedMatches[0];

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      departmentId: resolvedDepartment?.id || null,
      departmentName: resolvedDepartment?.name || null,
      departmentIds: candidateBase.departmentIds,
      organizationalUnitIds: candidateBase.organizationalUnitIds,
      protocolosAtivos,
      protocolosPendentes,
      protocolosPrazoVencido,
      cargaPercentual,
      status: user.healthData?.status || 'ATIVO',
      role: user.role,
      isPrimaryAssignment:
        ticketAssignee?.isPrimaryAssignment ||
        Boolean(primaryAssignment?.isPrimary) ||
        Boolean(user.userDepartments.find((department: any) => department.isPrimary)),
      isTopHierarchy: ticketAssignee?.isTopHierarchy || false,
      isSecretaryLike: ticketAssignee?.isSecretaryLike || false,
      employeeAssignment: {
        organizationalUnit:
          ticketAssignee?.organizationalUnitName ||
          primaryAssignment?.organizationalUnit?.sigla ||
          primaryAssignment?.organizationalUnit?.nome,
        position:
          ticketAssignee?.positionName ||
          primaryAssignment?.position?.nome,
        cargaHoraria: primaryAssignment?.cargaHoraria
      },
      isStageRequired: requiredMatches.length > 0,
      isStageSuggested: suggestedMatches.length > 0,
      stageAssignmentMode: requiredMatches.length > 0
        ? 'REQUIRED_EXECUTION'
        : suggestedMatches.length > 0
          ? 'SUGGEST_ASSIGNMENT'
          : null,
      stageAssignmentLabel: preferredStageMatch ? formatStageAssignmentLabel(preferredStageMatch) : null,
      stageAssignmentTargetType: preferredStageMatch?.targetType || null,
    } satisfies WorkloadServerInternal;
  });
}

/**
 * Atribuir protocolo a um servidor (Principal)
 * REFATORADO: Integração com Sistema Unificado V2.0
 */
export async function assignProtocolToServer(params: AssignProtocolParams) {
  const {
    protocolId,
    assignedUserId,
    assignedById,
    assignedByName,
    motivo,
    comment,
    stageId,
    notifyCitizen = true,
    source = 'MANUAL'
  } = params;

  // 1. Buscar protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      department: true,
      citizen: true,
      service: true
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // 2. Buscar servidor
  const assignedUser = await prisma.user.findUnique({
    where: { id: assignedUserId },
    include: {
      healthData: true
    }
  });

  if (!assignedUser || !assignedUser.isActive) {
    throw new Error('Servidor não encontrado ou inativo');
  }

  // 3. Verificar status do servidor (apenas se for profissional de saúde)
  const healthStatus = await checkServerHealthStatus(assignedUserId);

  if (healthStatus.exists && healthStatus.status !== 'ATIVO') {
    const substitutos = await getAvailableSubstitutes(assignedUserId);
    throw {
      code: `SERVIDOR_${healthStatus.status}`,
      message: `${assignedUser.name} está ${healthStatus.status.toLowerCase()}${
        healthStatus.motivoInativacao ? `. Motivo: ${healthStatus.motivoInativacao}` : ''
      }`,
      suggestedDelegates: substitutos
    };
  }

  // 4. Buscar vínculo funcional ativo
  const employeeAssignment =
    await getActiveEmployeeAssignment(assignedUserId, protocol.departmentId) ||
    await getActiveEmployeeAssignment(assignedUserId);

  const targetStageId = stageId || protocol.currentStageId || undefined;
  const normalizedAssignedByName =
    assignedByName || (source === 'AUTO_STAGE' ? 'Sistema' : 'Servidor');
  const normalizedComment =
    comment ||
    (source === 'AUTO_STAGE'
      ? `Atribuição automática pela configuração da etapa para ${assignedUser.name}`
      : `Protocolo atribuído para ${assignedUser.name}`);
  const currentPrincipalAssignment = await prisma.protocolServerAssignment.findFirst({
    where: {
      protocolId,
      situacao: 'ATIVA',
      tipo: 'PRINCIPAL'
    },
    orderBy: {
      dataInicio: 'desc'
    }
  });

  const updateProtocolState = async () => {
    const updatedProtocol = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        assignedUserId,
        currentAssignedUserId: assignedUserId,
        organizationalUnitId: employeeAssignment?.organizationalUnitId,
        status: 'PROGRESSO'
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        currentAssignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organizationalUnit: true,
        citizen: true,
        service: true,
        department: true
      }
    });

    if (targetStageId) {
      await prisma.protocolStage.updateMany({
        where: {
          id: targetStageId,
          protocolId
        },
        data: {
          assignedTo: assignedUserId
        }
      });
    }

    return updatedProtocol;
  };

  if (currentPrincipalAssignment?.userId === assignedUserId) {
    const updatedProtocol = await updateProtocolState();
    return {
      protocol: updatedProtocol,
      assignment: currentPrincipalAssignment,
      employeeAssignment
    };
  }

  // 5. Marcar atribuições anteriores como SUBSTITUIDA
  await prisma.protocolServerAssignment.updateMany({
    where: {
      protocolId,
      situacao: 'ATIVA',
      tipo: 'PRINCIPAL'
    },
    data: {
      situacao: 'SUBSTITUIDA',
      dataFim: new Date()
    }
  });

  // 6. Criar nova atribuição
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: assignedUserId,
      tipo: 'PRINCIPAL',
      situacao: 'ATIVA',
      assignedById,
      assignedByName: normalizedAssignedByName,
      motivo: motivo || normalizedComment || 'Atribuição principal',
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      comentario: comment,
      dataInicio: new Date()
    }
  });

  const updatedProtocol = await updateProtocolState();

  // 8. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'ATRIBUIDO',
      comment: normalizedComment,
      userId: assignedById,
      metadata: {
        assignmentId: assignment.id,
        tipo: 'PRINCIPAL',
        organizationalUnit: employeeAssignment?.organizationalUnit?.nome,
        position: employeeAssignment?.position?.nome,
        source,
        stageId: targetStageId
      }
    }
  });

  // 9. Registrar em AssignmentAudit (Sistema Unificado)
  if (employeeAssignment) {
    await registerAssignmentAudit(
      employeeAssignment.id,
      assignedUserId,
      assignedUser.name,
      'DESIGNACAO',
      'Atribuição de protocolo',
      {
        protocolId,
        protocolNumber: protocol.number,
        protocolTitle: protocol.title,
        assignedBy: normalizedAssignedByName,
        comment
      }
    );
  }

  // 10. Criar notificação para cidadão
  if (notifyCitizen) {
    await prisma.notification.create({
      data: {
        citizenId: protocol.citizenId,
        title: 'Protocolo em Andamento',
        message: `Seu protocolo ${protocol.number} foi atribuído para ${assignedUser.name} e está sendo processado`,
        type: 'INFO',
        protocolId: protocol.id
      }
    });
  }

  return {
    protocol: updatedProtocol,
    assignment,
    employeeAssignment
  };
}

/**
 * Delegar protocolo temporariamente (férias, afastamento)
 */
export async function delegateProtocol(params: DelegateProtocolParams) {
  const {
    protocolId,
    delegadoParaUserId,
    delegadoPorUserId,
    delegadoPorName,
    motivoDelegacao,
    ativaAte,
    comentario
  } = params;

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { departmentId: true }
  });

  if (!protocol) {
    throw new Error('Protocolo nao encontrado');
  }

  // 1. Validar servidor delegado
  const delegado = await prisma.user.findUnique({
    where: { id: delegadoParaUserId },
    include: { healthData: true }
  });

  if (!delegado || !delegado.isActive) {
    throw new Error('Servidor delegado não encontrado ou inativo');
  }

  const healthStatus = await checkServerHealthStatus(delegadoParaUserId);
  if (healthStatus.exists && healthStatus.status !== 'ATIVO') {
    throw new Error(`Servidor delegado está ${healthStatus.status}`);
  }

  // 2. Buscar vínculo funcional
  const employeeAssignment =
    await getActiveEmployeeAssignment(delegadoParaUserId, protocol.departmentId) ||
    await getActiveEmployeeAssignment(delegadoParaUserId);

  // 3. Criar atribuição de delegação
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: delegadoParaUserId,
      tipo: 'DELEGADO',
      situacao: 'ATIVA',
      assignedById: delegadoPorUserId,
      assignedByName: delegadoPorName,
      isDelegacao: true,
      delegadoPor: delegadoPorUserId,
      ativaAte,
      motivoDelegacao,
      comentario,
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      dataInicio: new Date()
    }
  });

  // 4. Atualizar protocolo
  await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      currentAssignedUserId: delegadoParaUserId
    }
  });

  // 5. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'DELEGADO',
      comment: `Delegado para ${delegado.name} até ${ativaAte.toLocaleDateString()}. Motivo: ${motivoDelegacao}`,
      userId: delegadoPorUserId,
      metadata: {
        assignmentId: assignment.id,
        tipo: 'DELEGADO',
        ativaAte,
        motivoDelegacao
      }
    }
  });

  return assignment;
}

/**
 * Encaminhar protocolo para outro departamento ou servidor
 */
export async function forwardProtocol(params: ForwardProtocolParams) {
  const {
    protocolId,
    forwardToUserId,
    forwardToDepartmentId,
    forwardedById,
    forwardedByName,
    tipoEncaminhamento,
    motivo,
    prazoResposta,
    comentario
  } = params;

  // 1. Buscar protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: { department: true }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // 2. Buscar servidor destino
  const forwardToUser = await prisma.user.findUnique({
    where: { id: forwardToUserId },
    include: { department: true }
  });

  if (!forwardToUser || !forwardToUser.isActive) {
    throw new Error('Servidor destino não encontrado ou inativo');
  }

  // 3. Verificar se é interdepartamental
  const destinationDepartmentId = forwardToDepartmentId || protocol.departmentId;
  const isInterdepartamental = destinationDepartmentId !== protocol.departmentId;

  // 4. Buscar vínculo funcional
  const employeeAssignment =
    await getActiveEmployeeAssignment(forwardToUserId, destinationDepartmentId) ||
    await getActiveEmployeeAssignment(forwardToUserId);
  const destinationDepartment =
    employeeAssignment?.department ||
    await prisma.department.findUnique({
      where: { id: destinationDepartmentId },
      select: { id: true, name: true }
    });

  // 5. Se ENCAMINHADO, marcar atribuição anterior como SUBSTITUIDA
  if (tipoEncaminhamento === 'ENCAMINHADO') {
    await prisma.protocolServerAssignment.updateMany({
      where: {
        protocolId,
        situacao: 'ATIVA',
        tipo: 'PRINCIPAL'
      },
      data: {
        situacao: 'SUBSTITUIDA',
        dataFim: new Date()
      }
    });
  }

  // 6. Criar nova atribuição
  const assignment = await prisma.protocolServerAssignment.create({
    data: {
      protocolId,
      userId: forwardToUserId,
      tipo: tipoEncaminhamento as TipoAtribuicaoProtocolo,
      situacao: 'ATIVA',
      assignedById: forwardedById,
      assignedByName: forwardedByName,
      motivo,
      prazoResposta,
      comentario,
      isInterdepartamental: isInterdepartamental || false,
      departmentOrigemId: protocol.departmentId,
      departmentOrigemName: protocol.department.name,
      departmentDestinoId: destinationDepartmentId,
      departmentDestinoName: destinationDepartment?.name,
      employeeAssignmentId: employeeAssignment?.id,
      organizationalUnitId: employeeAssignment?.organizationalUnitId,
      dataInicio: new Date()
    }
  });

  // 7. Se ENCAMINHADO, atualizar protocolo
  if (tipoEncaminhamento === 'ENCAMINHADO') {
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        currentAssignedUserId: forwardToUserId,
        departmentId: destinationDepartmentId
      }
    });
  }

  // 8. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: tipoEncaminhamento === 'ENCAMINHADO' ? 'ENCAMINHADO' : 'CONSULTA_SOLICITADA',
      comment: `${tipoEncaminhamento === 'ENCAMINHADO' ? 'Encaminhado' : 'Solicitada consulta'} para ${forwardToUser.name}. ${motivo}`,
      userId: forwardedById,
      metadata: {
        assignmentId: assignment.id,
        tipo: tipoEncaminhamento,
        isInterdepartamental,
        prazoResposta
      }
    }
  });

  return assignment;
}

/**
 * Atribuir protocolo para equipe completa
 */
export async function assignProtocolToTeam(params: AssignTeamParams) {
  const { protocolId, teamId, assignedById, assignedByName, comentario } = params;

  // 1. Buscar equipe
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      membros: {
        where: { ativo: true },
        include: {
          user: {
            include: {
              healthData: true
            }
          }
        }
      },
      coordenador: true
    }
  });

  if (!team || !team.ativo) {
    throw new Error('Equipe não encontrada ou inativa');
  }

  if (team.membros.length === 0) {
    throw new Error('Equipe não possui membros ativos');
  }

  // 2. Atualizar protocolo
  await prisma.protocolSimplified.update({
    where: { id: protocolId },
    data: {
      teamId,
      currentAssignedUserId: team.coordenadorId || team.membros[0].userId
    }
  });

  // 3. Criar atribuições para cada membro
  const assignments = [];

  for (const membro of team.membros) {
    const employeeAssignment = await getActiveEmployeeAssignment(membro.userId);

    const tipo = membro.userId === team.coordenadorId ? 'PRINCIPAL' : 'APOIO';

    const assignment = await prisma.protocolServerAssignment.create({
      data: {
        protocolId,
        userId: membro.userId,
        tipo: tipo as TipoAtribuicaoProtocolo,
        situacao: 'ATIVA',
        assignedById,
        assignedByName,
        motivo: `Atribuição em equipe: ${team.nome}`,
        comentario,
        employeeAssignmentId: employeeAssignment?.id,
        organizationalUnitId: employeeAssignment?.organizationalUnitId,
        dataInicio: new Date()
      }
    });

    assignments.push(assignment);
  }

  // 4. Registrar histórico
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      action: 'ATRIBUIDO_EQUIPE',
      comment: `Protocolo atribuído para equipe ${team.nome} (${team.membros.length} membros)`,
      userId: assignedById,
      metadata: {
        teamId,
        teamNome: team.nome,
        membrosCount: team.membros.length,
        coordenadorId: team.coordenadorId
      }
    }
  });

  return {
    team,
    assignments
  };
}

/**
 * Listar histórico de atribuições de um protocolo
 */
export async function getProtocolAssignments(protocolId: string) {
  const assignments = await prisma.protocolServerAssignment.findMany({
    where: { protocolId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      assignedBy: {
        select: {
          id: true,
          name: true
        }
      },
      employeeAssignment: {
        include: {
          organizationalUnit: true,
          position: true
        }
      },
      organizationalUnit: true
    },
    orderBy: {
      dataInicio: 'desc'
    }
  });

  // Criar timeline
  const timeline = assignments.map(a => ({
    data: a.dataInicio,
    evento: getEventoDescricao(a),
    por: a.assignedByName || 'Sistema',
    tipo: a.tipo,
    situacao: a.situacao
  }));

  return {
    assignments,
    timeline
  };
}

function getEventoDescricao(assignment: any): string {
  const userName = assignment.user.name;

  switch (assignment.tipo) {
    case 'PRINCIPAL':
      return `Atribuído para ${userName}`;
    case 'DELEGADO':
      return `Delegado para ${userName} (${assignment.motivoDelegacao || 'temporário'})`;
    case 'ENCAMINHADO':
      return `Encaminhado para ${userName}`;
    case 'CONSULTA':
      return `Solicitada consulta de ${userName}`;
    case 'APOIO':
      return `${userName} adicionado como apoio`;
    default:
      return `Atribuído para ${userName}`;
  }
}

/**
 * Obter métricas de carga de trabalho dos servidores
 */
async function getWorkloadStatsLegacy(departmentId?: string) {
  const where: any = {
    isActive: true
  };

  if (departmentId) {
    where.OR = [
      { departmentId },
      {
        userDepartments: {
          some: {
            departmentId,
            isActive: true
          }
        }
      },
      {
        assignments: {
          some: {
            departmentId,
            situacao: 'ATIVO'
          }
        }
      }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      department: true,
      userDepartments: {
        where: {
          isActive: true,
          ...(departmentId ? { departmentId } : {})
        },
        include: {
          department: true
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' }
        ]
      },
      healthData: true,
      protocolAssignments: {
        where: {
          situacao: 'ATIVA'
        },
        include: {
          protocol: {
            select: {
              status: true,
              dueDate: true
            }
          }
        }
      },
      assignments: {
        where: {
          situacao: 'ATIVO',
          ...(departmentId ? { departmentId } : {})
        },
        orderBy: [
          { isPrimary: 'desc' },
          { dataInicio: 'desc' }
        ],
        include: {
          department: true,
          organizationalUnit: true,
          position: true
        }
      }
    }
  });

  const servidores = users.map(user => {
    const protocolosAtivos = user.protocolAssignments.length;
    const protocolosPendentes = user.protocolAssignments.filter(
      a => a.protocol.status === 'PENDENCIA'
    ).length;
    const protocolosPrazoVencido = user.protocolAssignments.filter(
      a => a.protocol.dueDate && new Date(a.protocol.dueDate) < new Date()
    ).length;

    // Cálculo de carga percentual (baseado em 20 protocolos = 100%)
    const cargaPercentual = Math.min(100, Math.round((protocolosAtivos / 20) * 100));

    const primaryAssignment = user.assignments.find(a => a.isPrimary) || user.assignments[0];
    const primaryUserDepartment = user.userDepartments.find(ud => ud.isPrimary) || user.userDepartments[0];
    const resolvedDepartment =
      primaryAssignment?.department ||
      primaryUserDepartment?.department ||
      user.department ||
      null;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      departmentId: resolvedDepartment?.id || null,
      departmentName: resolvedDepartment?.name || null,
      protocolosAtivos,
      protocolosPendentes,
      protocolosPrazoVencido,
      cargaPercentual,
      status: user.healthData?.status || 'ATIVO',
      employeeAssignment: primaryAssignment ? {
        organizationalUnit: primaryAssignment.organizationalUnit?.nome,
        position: primaryAssignment.position?.nome,
        cargaHoraria: primaryAssignment.cargaHoraria
      } : null
    };
  });

  const totalProtocolos = servidores.reduce((sum, s) => sum + s.protocolosAtivos, 0);
  const mediaProtocolosPorServidor = servidores.length > 0
    ? Math.round(totalProtocolos / servidores.length)
    : 0;

  const servidorSobrecarregado = servidores
    .filter(s => s.cargaPercentual >= 75)
    .sort((a, b) => b.cargaPercentual - a.cargaPercentual)[0];

  const servidorDisponivel = servidores
    .filter(s => s.status === 'ATIVO' && s.cargaPercentual < 50)
    .sort((a, b) => a.cargaPercentual - b.cargaPercentual)[0];

  return {
    servidores: servidores.sort((a, b) => a.cargaPercentual - b.cargaPercentual),
    resumo: {
      totalProtocolos,
      totalServidores: servidores.length,
      mediaProtocolosPorServidor,
      servidorSobrecarregado: servidorSobrecarregado ? `${servidorSobrecarregado.name} (${servidorSobrecarregado.cargaPercentual}%)` : null,
      servidorDisponivel: servidorDisponivel ? `${servidorDisponivel.name} (${servidorDisponivel.cargaPercentual}%)` : null
    }
  };
}

/**
 * Sugerir melhor servidor para atribuição (IA simples)
 */
async function suggestAssigneeLegacy(protocolId: string, departmentId: string) {
  const workloadStats = await getWorkloadStats(departmentId);

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      service: true
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Calcular score para cada servidor
  const sugestoes = workloadStats.servidores
    .filter(s => s.status === 'ATIVO')
    .map(servidor => {
      let score = 0;

      // Fator 1: Baixa carga de trabalho (40%)
      score += (100 - servidor.cargaPercentual) * 0.4;

      // Fator 2: Sem protocolos vencidos (30%)
      if (servidor.protocolosPrazoVencido === 0) {
        score += 30;
      }

      // Fator 3: Mesma unidade organizacional (20%)
      // TODO: Implementar quando houver unidade no protocolo

      // Fator 4: Experiência (10%)
      // Baseado no número de protocolos concluídos (pode ser melhorado)
      const experienciaScore = Math.min(10, servidor.protocolosAtivos * 0.5);
      score += experienciaScore;

      const razoes = [];
      if (servidor.cargaPercentual < 30) {
        razoes.push(`Baixa carga de trabalho (${servidor.cargaPercentual}%)`);
      }
      if (servidor.protocolosPrazoVencido === 0) {
        razoes.push('Nenhum protocolo com prazo vencido');
      }
      if (servidor.status === 'ATIVO') {
        razoes.push('Status: ATIVO');
      }
      if (servidor.employeeAssignment) {
        razoes.push(`Lotação: ${servidor.employeeAssignment.organizationalUnit || 'N/A'}`);
      }

      return {
        userId: servidor.userId,
        name: servidor.name,
        email: servidor.email,
        score: Math.round(score),
        razoes,
        protocolosAtivos: servidor.protocolosAtivos,
        cargaPercentual: servidor.cargaPercentual,
        employeeAssignment: servidor.employeeAssignment
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 sugestões

  return {
    sugestoes
  };
}

/**
 * Job para reverter delegações expiradas
 */
export async function getWorkloadStats(
  departmentId?: string,
  options: WorkloadStatsOptions = {}
) {
  const context = await resolveAssignmentContext(options.protocolId, options.stageId);
  const effectiveDepartmentId = departmentId || context.departmentId;
  const stageSupportAssignments = context.stageSupportAssignments.filter(
    (assignment) => assignment.mode !== 'REFERENCE_ONLY'
  );

  const { users, ticketAssigneesByUserId } = await getCandidateUsers(
    effectiveDepartmentId,
    stageSupportAssignments
  );

  const servidores = buildWorkloadServers(users, ticketAssigneesByUserId, stageSupportAssignments)
    .sort(compareAssignableServers)
    .map((servidor) => ({
      userId: servidor.userId,
      name: servidor.name,
      email: servidor.email,
      departmentId: servidor.departmentId,
      departmentName: servidor.departmentName,
      protocolosAtivos: servidor.protocolosAtivos,
      protocolosPendentes: servidor.protocolosPendentes,
      protocolosPrazoVencido: servidor.protocolosPrazoVencido,
      cargaPercentual: servidor.cargaPercentual,
      status: servidor.status,
      employeeAssignment: servidor.employeeAssignment,
      isStageRequired: servidor.isStageRequired,
      isStageSuggested: servidor.isStageSuggested,
      stageAssignmentMode: servidor.stageAssignmentMode,
      stageAssignmentLabel: servidor.stageAssignmentLabel,
      stageAssignmentTargetType: servidor.stageAssignmentTargetType
    }));

  const totalProtocolos = servidores.reduce((sum, servidor) => sum + servidor.protocolosAtivos, 0);
  const mediaProtocolosPorServidor = servidores.length > 0
    ? Math.round(totalProtocolos / servidores.length)
    : 0;

  const servidorSobrecarregado = [...servidores]
    .filter((servidor) => servidor.cargaPercentual >= 75)
    .sort((a, b) => b.cargaPercentual - a.cargaPercentual)[0];

  const servidorDisponivel = [...servidores]
    .filter((servidor) => servidor.status === 'ATIVO' && servidor.cargaPercentual < 50)
    .sort((a, b) => a.cargaPercentual - b.cargaPercentual)[0];

  return {
    servidores,
    resumo: {
      totalProtocolos,
      totalServidores: servidores.length,
      mediaProtocolosPorServidor,
      servidorSobrecarregado: servidorSobrecarregado
        ? `${servidorSobrecarregado.name} (${servidorSobrecarregado.cargaPercentual}%)`
        : null,
      servidorDisponivel: servidorDisponivel
        ? `${servidorDisponivel.name} (${servidorDisponivel.cargaPercentual}%)`
        : null,
      stageContext: context.stageId
        ? {
            stageId: context.stageId,
            stageName: context.stageName,
            hasRequiredStageRule: stageSupportAssignments.some(
              (assignment) => assignment.mode === 'REQUIRED_EXECUTION'
            ),
            hasSuggestedStageRule: stageSupportAssignments.some(
              (assignment) => assignment.mode === 'SUGGEST_ASSIGNMENT'
            )
          }
        : null
    }
  };
}

export async function suggestAssignee(
  protocolId: string,
  departmentId?: string,
  stageId?: string
) {
  const workloadStats = await getWorkloadStats(departmentId, { protocolId, stageId });

  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      service: true
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  const sugestoes = workloadStats.servidores
    .filter((servidor) => servidor.status === 'ATIVO')
    .map((servidor) => {
      let score = 0;

      if (servidor.isStageRequired) {
        score += 80;
      } else if (servidor.isStageSuggested) {
        score += 45;
      }

      score += (100 - servidor.cargaPercentual) * 0.4;

      if (servidor.protocolosPrazoVencido === 0) {
        score += 30;
      }

      const experienciaScore = Math.min(10, servidor.protocolosAtivos * 0.5);
      score += experienciaScore;

      const razoes: string[] = [];

      if (servidor.isStageRequired && servidor.stageAssignmentLabel) {
        razoes.push(`Responsável obrigatório da etapa: ${servidor.stageAssignmentLabel}`);
      } else if (servidor.isStageSuggested && servidor.stageAssignmentLabel) {
        razoes.push(`Sugestão da etapa: ${servidor.stageAssignmentLabel}`);
      }

      if (servidor.cargaPercentual < 30) {
        razoes.push(`Baixa carga de trabalho (${servidor.cargaPercentual}%)`);
      }

      if (servidor.protocolosPrazoVencido === 0) {
        razoes.push('Nenhum protocolo com prazo vencido');
      }

      if (servidor.employeeAssignment?.organizationalUnit) {
        razoes.push(`Lotação: ${servidor.employeeAssignment.organizationalUnit}`);
      }

      return {
        userId: servidor.userId,
        name: servidor.name,
        email: servidor.email,
        score: Math.round(score),
        razoes,
        protocolosAtivos: servidor.protocolosAtivos,
        cargaPercentual: servidor.cargaPercentual,
        employeeAssignment: servidor.employeeAssignment,
        isStageRequired: servidor.isStageRequired,
        isStageSuggested: servidor.isStageSuggested,
        stageAssignmentLabel: servidor.stageAssignmentLabel
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    sugestoes
  };
}

export async function resolveStageAutomaticAssignment(
  protocolId: string,
  stageId: string
): Promise<AutomaticStageAssignmentResult> {
  const context = await resolveAssignmentContext(protocolId, stageId);
  const stageSupportAssignments = context.stageSupportAssignments.filter(
    (assignment) => assignment.mode !== 'REFERENCE_ONLY'
  );

  if (stageSupportAssignments.length === 0) {
    return {
      matched: false,
      blocked: false
    };
  }

  const workloadStats = await getWorkloadStats(context.departmentId, { protocolId, stageId });
  const activeCandidates = workloadStats.servidores.filter((servidor) => servidor.status === 'ATIVO');
  const requiredCandidates = activeCandidates.filter((servidor) => servidor.isStageRequired);

  if (requiredCandidates.length > 0) {
    const assignee = requiredCandidates[0];
    return {
      matched: true,
      blocked: false,
      assignee: {
        userId: assignee.userId,
        name: assignee.name,
        mode: 'REQUIRED_EXECUTION',
        targetType: assignee.stageAssignmentTargetType || 'USER',
        reason: `Atribuição automática da etapa "${context.stageName || 'Atual'}": ${assignee.stageAssignmentLabel || assignee.name}`
      }
    };
  }

  const suggestedCandidates = activeCandidates.filter((servidor) => servidor.isStageSuggested);
  if (suggestedCandidates.length > 0) {
    const assignee = suggestedCandidates[0];
    return {
      matched: true,
      blocked: false,
      assignee: {
        userId: assignee.userId,
        name: assignee.name,
        mode: 'SUGGEST_ASSIGNMENT',
        targetType: assignee.stageAssignmentTargetType || 'USER',
        reason: `Atribuição automática sugerida para a etapa "${context.stageName || 'Atual'}": ${assignee.stageAssignmentLabel || assignee.name}`
      }
    };
  }

  if (stageSupportAssignments.some((assignment) => assignment.mode === 'REQUIRED_EXECUTION')) {
    return {
      matched: false,
      blocked: true,
      blocker: `Nenhum servidor ativo atende à regra obrigatória da etapa "${context.stageName || 'Atual'}".`
    };
  }

  return {
    matched: false,
    blocked: false
  };
}

export async function autoAssignProtocolToStageResponsible(params: {
  protocolId: string;
  stageId: string;
  assignedById?: string;
  assignedByName?: string;
  notifyCitizen?: boolean;
}) {
  const resolution = await resolveStageAutomaticAssignment(params.protocolId, params.stageId);

  if (!resolution.matched || !resolution.assignee) {
    return {
      ...resolution,
      applied: false
    };
  }

  const result = await assignProtocolToServer({
    protocolId: params.protocolId,
    assignedUserId: resolution.assignee.userId,
    assignedById: params.assignedById,
    assignedByName: params.assignedByName || 'Sistema',
    comment: resolution.assignee.reason,
    motivo: resolution.assignee.reason,
    stageId: params.stageId,
    notifyCitizen: params.notifyCitizen ?? false,
    source: 'AUTO_STAGE'
  });

  return {
    ...resolution,
    applied: true,
    protocol: result.protocol,
    assignment: result.assignment
  };
}

export async function revertExpiredDelegations() {
  const now = new Date();

  // Buscar delegações expiradas
  const expiredDelegations = await prisma.protocolServerAssignment.findMany({
    where: {
      isDelegacao: true,
      situacao: 'ATIVA',
      ativaAte: {
        lt: now
      }
    },
    include: {
      protocol: true,
      user: true
    }
  });

  const results = [];

  for (const delegation of expiredDelegations) {
    try {
      // Marcar delegação como concluída
      await prisma.protocolServerAssignment.update({
        where: { id: delegation.id },
        data: {
          situacao: 'CONCLUIDA',
          dataFim: now
        }
      });

      // Buscar atribuição original (PRINCIPAL mais recente que não seja delegação)
      const originalAssignment = await prisma.protocolServerAssignment.findFirst({
        where: {
          protocolId: delegation.protocolId,
          tipo: 'PRINCIPAL',
          isDelegacao: false
        },
        orderBy: {
          dataInicio: 'desc'
        },
        include: {
          user: true
        }
      });

      if (originalAssignment) {
        // Reativar atribuição original
        await prisma.protocolServerAssignment.update({
          where: { id: originalAssignment.id },
          data: {
            situacao: 'ATIVA',
            dataFim: null
          }
        });

        // Atualizar protocolo
        await prisma.protocolSimplified.update({
          where: { id: delegation.protocolId },
          data: {
            currentAssignedUserId: originalAssignment.userId
          }
        });

        // Registrar histórico
        await prisma.protocolHistorySimplified.create({
          data: {
            protocolId: delegation.protocolId,
            action: 'DELEGACAO_REVERTIDA',
            comment: `Delegação expirada. Protocolo retornou para ${originalAssignment.user?.name || 'servidor original'}`,
            metadata: {
              delegationId: delegation.id,
              originalAssignmentId: originalAssignment.id
            }
          }
        });

        results.push({
          success: true,
          protocolId: delegation.protocolId,
          message: `Delegação revertida com sucesso`
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        protocolId: delegation.protocolId,
        error: error.message
      });
    }
  }

  return {
    processedCount: expiredDelegations.length,
    results
  };
}

export default {
  assignProtocolToServer,
  delegateProtocol,
  forwardProtocol,
  assignProtocolToTeam,
  getProtocolAssignments,
  getWorkloadStats,
  suggestAssignee,
  resolveStageAutomaticAssignment,
  autoAssignProtocolToStageResponsible,
  revertExpiredDelegations
};
