import {
  CentralCalendarEventStatus,
  CentralCalendarParticipantRole,
  CentralCalendarParticipantStatus,
  CentralCalendarSourceType,
  CentralCalendarType,
  CentralCalendarVisibilityScope,
  Prisma,
  SituacaoVinculo,
  UserRole,
  WorkflowStageSupportTargetType,
} from '@prisma/client';
import { prisma } from '../lib/prisma';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const CALENDAR_EVENT_INCLUDE = {
  calendar: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  ownerUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      organizationalUnit: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true,
        },
      },
    },
  },
  visibilityScopes: true,
  links: true,
} as const;

export type CentralCalendarEventWithRelations = Prisma.CentralCalendarEventGetPayload<{
  include: typeof CALENDAR_EVENT_INCLUDE;
}>;

interface UserContext {
  userId: string;
  role: UserRole;
  isAdmin: boolean;
  departmentIds: string[];
  organizationalUnitIds: string[];
}

export interface CalendarParticipantInput {
  targetType: WorkflowStageSupportTargetType;
  userId?: string;
  departmentId?: string;
  organizationalUnitId?: string;
  role?: CentralCalendarParticipantRole;
  status?: CentralCalendarParticipantStatus;
  isRequired?: boolean;
}

export interface CalendarVisibilityInput {
  scope: CentralCalendarVisibilityScope;
  userId?: string;
  departmentId?: string;
  organizationalUnitId?: string;
}

export interface CalendarLinkInput {
  linkType: string;
  linkedId: string;
  metadata?: Prisma.InputJsonValue | null;
}

export interface UpsertCalendarEventInput {
  eventId?: string;
  calendarId?: string;
  ownerUserId: string;
  title: string;
  description?: string;
  eventType?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  status?: CentralCalendarEventStatus;
  priority?: number;
  notes?: string;
  metadata?: Prisma.InputJsonValue | null;
  isPrivate?: boolean;
  sourceType?: CentralCalendarSourceType;
  sourceReferenceId?: string;
  protocolId?: string;
  protocolStageId?: string;
  serviceId?: string;
  departmentId?: string;
  organizationalUnitId?: string;
  participants?: CalendarParticipantInput[];
  visibility?: CalendarVisibilityInput[];
  links?: CalendarLinkInput[];
}

export interface ListEventsInput {
  userId: string;
  includeAll?: boolean;
  startAt?: Date;
  endAt?: Date;
  status?: CentralCalendarEventStatus[];
  sourceType?: CentralCalendarSourceType[];
  calendarId?: string;
}

const LEGACY_AGENDA_STATUS_MAP: Record<string, CentralCalendarEventStatus> = {
  AGENDADO: CentralCalendarEventStatus.SCHEDULED,
  CONFIRMADO: CentralCalendarEventStatus.CONFIRMED,
  REALIZADO: CentralCalendarEventStatus.COMPLETED,
  CANCELADO: CentralCalendarEventStatus.CANCELED,
};

function parseHourMinute(value: string | null | undefined, baseDate: Date): Date {
  const date = new Date(baseDate);
  const [hourRaw, minuteRaw] = (value || '08:00').split(':');
  const hour = Number.parseInt(hourRaw || '8', 10);
  const minute = Number.parseInt(minuteRaw || '0', 10);

  if (Number.isFinite(hour) && Number.isFinite(minute)) {
    date.setHours(hour, minute, 0, 0);
  }

  return date;
}

function nextWeekDay(baseDate: Date, weekday: number): Date {
  const date = new Date(baseDate);
  const normalizedWeekday = weekday >= 0 && weekday <= 6 ? weekday : 0;
  const daysToAdd = (normalizedWeekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

function stageStatusToEventStatus(stageStatus: string): CentralCalendarEventStatus {
  switch (stageStatus) {
    case 'IN_PROGRESS':
      return CentralCalendarEventStatus.IN_PROGRESS;
    case 'COMPLETED':
      return CentralCalendarEventStatus.COMPLETED;
    case 'SKIPPED':
      return CentralCalendarEventStatus.CANCELED;
    case 'FAILED':
      return CentralCalendarEventStatus.CANCELED;
    default:
      return CentralCalendarEventStatus.SCHEDULED;
  }
}

function normalizeNullableJson(
  value: Prisma.InputJsonValue | null | undefined
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.DbNull;
  }

  return value;
}

export class CentralCalendarService {
  private async getUserContext(userId: string): Promise<UserContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userDepartments: {
          where: { isActive: true },
          select: { departmentId: true },
        },
        assignments: {
          where: { situacao: SituacaoVinculo.ATIVO },
          select: {
            departmentId: true,
            organizationalUnitId: true,
          },
        },
        unidadesResponsavel: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new Error('Servidor não encontrado');
    }

    const departmentIds = new Set<string>();
    const organizationalUnitIds = new Set<string>();

    if (user.departmentId) {
      departmentIds.add(user.departmentId);
    }

    for (const dep of user.userDepartments) {
      if (dep.departmentId) {
        departmentIds.add(dep.departmentId);
      }
    }

    for (const assignment of user.assignments) {
      if (assignment.departmentId) {
        departmentIds.add(assignment.departmentId);
      }
      if (assignment.organizationalUnitId) {
        organizationalUnitIds.add(assignment.organizationalUnitId);
      }
    }

    for (const unit of user.unidadesResponsavel) {
      organizationalUnitIds.add(unit.id);
    }

    return {
      userId: user.id,
      role: user.role,
      isAdmin: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN,
      departmentIds: Array.from(departmentIds),
      organizationalUnitIds: Array.from(organizationalUnitIds),
    };
  }

  private buildVisibilityWhere(context: UserContext): Prisma.CentralCalendarEventWhereInput {
    const conditions: Prisma.CentralCalendarEventWhereInput[] = [
      { ownerUserId: context.userId },
      {
        participants: {
          some: {
            userId: context.userId,
          },
        },
      },
      {
        visibilityScopes: {
          some: {
            scope: CentralCalendarVisibilityScope.USER,
            userId: context.userId,
          },
        },
      },
      {
        visibilityScopes: {
          some: {
            scope: CentralCalendarVisibilityScope.CALENDAR_MEMBERS,
          },
        },
        calendar: {
          members: {
            some: {
              userId: context.userId,
            },
          },
        },
      },
      {
        calendar: {
          members: {
            some: {
              userId: context.userId,
            },
          },
        },
      },
    ];

    if (context.departmentIds.length > 0) {
      conditions.push({
        participants: {
          some: {
            departmentId: { in: context.departmentIds },
          },
        },
      });
      conditions.push({
        visibilityScopes: {
          some: {
            scope: CentralCalendarVisibilityScope.DEPARTMENT,
            departmentId: { in: context.departmentIds },
          },
        },
      });
    }

    if (context.organizationalUnitIds.length > 0) {
      conditions.push({
        participants: {
          some: {
            organizationalUnitId: { in: context.organizationalUnitIds },
          },
        },
      });
      conditions.push({
        visibilityScopes: {
          some: {
            scope: CentralCalendarVisibilityScope.ORGANIZATIONAL_UNIT,
            organizationalUnitId: { in: context.organizationalUnitIds },
          },
        },
      });
    }

    return { OR: conditions };
  }

  private dedupeParticipants(
    ownerUserId: string,
    participants?: CalendarParticipantInput[]
  ): CalendarParticipantInput[] {
    const result: CalendarParticipantInput[] = [
      {
        targetType: WorkflowStageSupportTargetType.USER,
        userId: ownerUserId,
        role: CentralCalendarParticipantRole.OWNER,
        status: CentralCalendarParticipantStatus.ACCEPTED,
        isRequired: true,
      },
    ];

    if (!Array.isArray(participants)) {
      return result;
    }

    const keys = new Set<string>([`USER:${ownerUserId}`]);
    for (const participant of participants) {
      if (participant.targetType === WorkflowStageSupportTargetType.USER && participant.userId) {
        const key = `USER:${participant.userId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          targetType: participant.targetType,
          userId: participant.userId,
          role: participant.role || CentralCalendarParticipantRole.ATTENDEE,
          status: participant.status || CentralCalendarParticipantStatus.PENDING,
          isRequired: Boolean(participant.isRequired),
        });
        continue;
      }

      if (
        participant.targetType === WorkflowStageSupportTargetType.DEPARTMENT &&
        participant.departmentId
      ) {
        const key = `DEPARTMENT:${participant.departmentId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          targetType: participant.targetType,
          departmentId: participant.departmentId,
          role: participant.role || CentralCalendarParticipantRole.ATTENDEE,
          status: participant.status || CentralCalendarParticipantStatus.PENDING,
          isRequired: Boolean(participant.isRequired),
        });
        continue;
      }

      if (
        participant.targetType === WorkflowStageSupportTargetType.ORGANIZATIONAL_UNIT &&
        participant.organizationalUnitId
      ) {
        const key = `ORGANIZATIONAL_UNIT:${participant.organizationalUnitId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          targetType: participant.targetType,
          organizationalUnitId: participant.organizationalUnitId,
          role: participant.role || CentralCalendarParticipantRole.ATTENDEE,
          status: participant.status || CentralCalendarParticipantStatus.PENDING,
          isRequired: Boolean(participant.isRequired),
        });
      }
    }

    return result;
  }

  private dedupeVisibility(
    isPrivate: boolean,
    participants: CalendarParticipantInput[],
    visibility?: CalendarVisibilityInput[]
  ): CalendarVisibilityInput[] {
    if (Array.isArray(visibility) && visibility.length > 0) {
      const keys = new Set<string>();
      const result: CalendarVisibilityInput[] = [];
      for (const scope of visibility) {
        let key: string = scope.scope;
        if (scope.scope === CentralCalendarVisibilityScope.USER && scope.userId) {
          key = `${scope.scope}:${scope.userId}`;
        } else if (
          scope.scope === CentralCalendarVisibilityScope.DEPARTMENT &&
          scope.departmentId
        ) {
          key = `${scope.scope}:${scope.departmentId}`;
        } else if (
          scope.scope === CentralCalendarVisibilityScope.ORGANIZATIONAL_UNIT &&
          scope.organizationalUnitId
        ) {
          key = `${scope.scope}:${scope.organizationalUnitId}`;
        } else if (scope.scope === CentralCalendarVisibilityScope.OWNER_ONLY) {
          key = scope.scope;
        } else if (scope.scope === CentralCalendarVisibilityScope.CALENDAR_MEMBERS) {
          key = scope.scope;
        } else {
          continue;
        }

        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push(scope);
      }

      if (result.length > 0) {
        return result;
      }
    }

    if (isPrivate) {
      return [{ scope: CentralCalendarVisibilityScope.OWNER_ONLY }];
    }

    const result: CalendarVisibilityInput[] = [
      { scope: CentralCalendarVisibilityScope.CALENDAR_MEMBERS },
    ];
    const keys = new Set<string>([CentralCalendarVisibilityScope.CALENDAR_MEMBERS]);

    for (const participant of participants) {
      if (participant.targetType === WorkflowStageSupportTargetType.USER && participant.userId) {
        const key = `${CentralCalendarVisibilityScope.USER}:${participant.userId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          scope: CentralCalendarVisibilityScope.USER,
          userId: participant.userId,
        });
      } else if (
        participant.targetType === WorkflowStageSupportTargetType.DEPARTMENT &&
        participant.departmentId
      ) {
        const key = `${CentralCalendarVisibilityScope.DEPARTMENT}:${participant.departmentId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          scope: CentralCalendarVisibilityScope.DEPARTMENT,
          departmentId: participant.departmentId,
        });
      } else if (
        participant.targetType === WorkflowStageSupportTargetType.ORGANIZATIONAL_UNIT &&
        participant.organizationalUnitId
      ) {
        const key = `${CentralCalendarVisibilityScope.ORGANIZATIONAL_UNIT}:${participant.organizationalUnitId}`;
        if (keys.has(key)) {
          continue;
        }
        keys.add(key);
        result.push({
          scope: CentralCalendarVisibilityScope.ORGANIZATIONAL_UNIT,
          organizationalUnitId: participant.organizationalUnitId,
        });
      }
    }

    return result;
  }

  private async ensureCalendar(
    tx: PrismaClientLike,
    data: {
      type: CentralCalendarType;
      ownerUserId?: string;
      departmentId?: string;
      organizationalUnitId?: string;
      serviceId?: string;
      name: string;
      description?: string;
    }
  ): Promise<string> {
    const existing = await tx.centralCalendar.findFirst({
      where: {
        type: data.type,
        ownerUserId: data.ownerUserId || null,
        departmentId: data.departmentId || null,
        organizationalUnitId: data.organizationalUnitId || null,
        serviceId: data.serviceId || null,
      },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    try {
      const calendar = await tx.centralCalendar.create({
        data: {
          type: data.type,
          name: data.name,
          description: data.description || null,
          ownerUserId: data.ownerUserId || null,
          departmentId: data.departmentId || null,
          organizationalUnitId: data.organizationalUnitId || null,
          serviceId: data.serviceId || null,
        },
      });
      return calendar.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fallback = await tx.centralCalendar.findFirst({
          where: {
            type: data.type,
            ownerUserId: data.ownerUserId || null,
            departmentId: data.departmentId || null,
            organizationalUnitId: data.organizationalUnitId || null,
            serviceId: data.serviceId || null,
          },
          select: { id: true },
        });

        if (fallback) {
          return fallback.id;
        }
      }

      throw error;
    }
  }

  async ensurePersonalCalendar(userId: string, tx: PrismaClientLike = prisma): Promise<string> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new Error('Servidor não encontrado para agenda pessoal');
    }

    return this.ensureCalendar(tx, {
      type: CentralCalendarType.PERSONAL,
      ownerUserId: user.id,
      name: `Agenda - ${user.name}`,
      description: 'Agenda pessoal do servidor',
    });
  }

  async ensureDepartmentCalendar(
    departmentId: string,
    tx: PrismaClientLike = prisma
  ): Promise<string> {
    const department = await tx.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true },
    });

    if (!department) {
      throw new Error('Departamento não encontrado para agenda central');
    }

    return this.ensureCalendar(tx, {
      type: CentralCalendarType.DEPARTMENT,
      departmentId: department.id,
      name: `Agenda - ${department.name}`,
      description: 'Agenda compartilhada do departamento',
    });
  }

  async ensureOrganizationalUnitCalendar(
    organizationalUnitId: string,
    tx: PrismaClientLike = prisma
  ): Promise<string> {
    const unit = await tx.organizationalUnit.findUnique({
      where: { id: organizationalUnitId },
      select: { id: true, nome: true, sigla: true },
    });

    if (!unit) {
      throw new Error('Unidade organizacional não encontrada para agenda central');
    }

    return this.ensureCalendar(tx, {
      type: CentralCalendarType.ORGANIZATIONAL_UNIT,
      organizationalUnitId: unit.id,
      name: `Agenda - ${unit.sigla || unit.nome}`,
      description: 'Agenda compartilhada da unidade organizacional',
    });
  }

  async ensureServiceCalendar(serviceId: string, tx: PrismaClientLike = prisma): Promise<string> {
    const service = await tx.serviceSimplified.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true },
    });

    if (!service) {
      throw new Error('Serviço não encontrado para agenda central');
    }

    return this.ensureCalendar(tx, {
      type: CentralCalendarType.SERVICE,
      serviceId: service.id,
      name: `Agenda - ${service.name}`,
      description: 'Agenda compartilhada do serviço',
    });
  }

  private async resolveCalendarId(
    tx: PrismaClientLike,
    input: UpsertCalendarEventInput
  ): Promise<string> {
    if (input.calendarId) {
      const calendar = await tx.centralCalendar.findUnique({
        where: { id: input.calendarId },
        select: { id: true },
      });

      if (!calendar) {
        throw new Error('Agenda selecionada não encontrada');
      }

      return calendar.id;
    }

    if (input.organizationalUnitId) {
      return this.ensureOrganizationalUnitCalendar(input.organizationalUnitId, tx);
    }

    if (input.departmentId) {
      return this.ensureDepartmentCalendar(input.departmentId, tx);
    }

    if (input.serviceId) {
      return this.ensureServiceCalendar(input.serviceId, tx);
    }

    return this.ensurePersonalCalendar(input.ownerUserId, tx);
  }

  async upsertEventBySource(input: UpsertCalendarEventInput): Promise<CentralCalendarEventWithRelations> {
    return prisma.$transaction(async (tx) => {
      const calendarId = await this.resolveCalendarId(tx, input);
      const participants = this.dedupeParticipants(input.ownerUserId, input.participants);
      const visibility = this.dedupeVisibility(
        input.isPrivate !== false,
        participants,
        input.visibility
      );
      const links = Array.isArray(input.links) ? input.links : [];

      const eventData: Prisma.CentralCalendarEventUncheckedCreateInput = {
        calendarId,
        ownerUserId: input.ownerUserId,
        title: input.title,
        description: input.description || null,
        eventType: input.eventType || null,
        location: input.location || null,
        startAt: input.startAt,
        endAt: input.endAt,
        allDay: Boolean(input.allDay),
        status: input.status || CentralCalendarEventStatus.SCHEDULED,
        priority: input.priority || 3,
        notes: input.notes || null,
        metadata: normalizeNullableJson(input.metadata),
        isPrivate: input.isPrivate !== false,
        sourceType: input.sourceType || CentralCalendarSourceType.MANUAL,
        sourceReferenceId: input.sourceReferenceId || null,
        protocolId: input.protocolId || null,
        protocolStageId: input.protocolStageId || null,
        serviceId: input.serviceId || null,
        departmentId: input.departmentId || null,
        organizationalUnitId: input.organizationalUnitId || null,
        completedAt:
          input.status === CentralCalendarEventStatus.COMPLETED ? new Date() : null,
        canceledAt:
          input.status === CentralCalendarEventStatus.CANCELED ? new Date() : null,
      };

      const existing = input.eventId
        ? await tx.centralCalendarEvent.findUnique({
            where: { id: input.eventId },
            select: { id: true },
          })
        : input.sourceType && input.sourceReferenceId
          ? await tx.centralCalendarEvent.findFirst({
              where: {
                sourceType: input.sourceType,
                sourceReferenceId: input.sourceReferenceId,
              },
              select: { id: true },
            })
          : null;

      if (input.eventId && !existing) {
        throw new Error('Evento da agenda centralizada não encontrado');
      }

      const event = existing
        ? await tx.centralCalendarEvent.update({
            where: { id: existing.id },
            data: eventData,
          })
        : await tx.centralCalendarEvent.create({
            data: eventData,
          });

      await tx.centralCalendarEventParticipant.deleteMany({
        where: { eventId: event.id },
      });
      await tx.centralCalendarEventVisibility.deleteMany({
        where: { eventId: event.id },
      });
      await tx.centralCalendarEventLink.deleteMany({
        where: { eventId: event.id },
      });

      if (participants.length > 0) {
        await tx.centralCalendarEventParticipant.createMany({
          data: participants.map((participant) => ({
            eventId: event.id,
            targetType: participant.targetType,
            userId: participant.userId || null,
            departmentId: participant.departmentId || null,
            organizationalUnitId: participant.organizationalUnitId || null,
            role: participant.role || CentralCalendarParticipantRole.ATTENDEE,
            status: participant.status || CentralCalendarParticipantStatus.PENDING,
            isRequired: Boolean(participant.isRequired),
          })),
        });
      }

      if (visibility.length > 0) {
        await tx.centralCalendarEventVisibility.createMany({
          data: visibility.map((scope) => ({
            eventId: event.id,
            scope: scope.scope,
            userId: scope.userId || null,
            departmentId: scope.departmentId || null,
            organizationalUnitId: scope.organizationalUnitId || null,
          })),
        });
      }

      if (links.length > 0) {
        await tx.centralCalendarEventLink.createMany({
          data: links.map((link) => ({
            eventId: event.id,
            linkType: link.linkType,
            linkedId: link.linkedId,
            metadata: normalizeNullableJson(link.metadata),
          })),
        });
      }

      const hydrated = await tx.centralCalendarEvent.findUnique({
        where: { id: event.id },
        include: CALENDAR_EVENT_INCLUDE,
      });

      if (!hydrated) {
        throw new Error('Falha ao carregar evento centralizado');
      }

      return hydrated;
    });
  }

  async listVisibleEvents(input: ListEventsInput): Promise<CentralCalendarEventWithRelations[]> {
    const context = await this.getUserContext(input.userId);
    const where: Prisma.CentralCalendarEventWhereInput = {};

    if (!input.includeAll || !context.isAdmin) {
      Object.assign(where, this.buildVisibilityWhere(context));
    }

    if (input.startAt || input.endAt) {
      where.startAt = {
        ...(input.startAt ? { gte: input.startAt } : {}),
        ...(input.endAt ? { lte: input.endAt } : {}),
      };
    }

    if (input.status && input.status.length > 0) {
      where.status = { in: input.status };
    }

    if (input.sourceType && input.sourceType.length > 0) {
      where.sourceType = { in: input.sourceType };
    }

    if (input.calendarId) {
      where.calendarId = input.calendarId;
    }

    return prisma.centralCalendarEvent.findMany({
      where,
      include: CALENDAR_EVENT_INCLUDE,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getVisibleEventById(
    userId: string,
    eventId: string,
    includeAll = false
  ): Promise<CentralCalendarEventWithRelations | null> {
    const context = await this.getUserContext(userId);
    const where: Prisma.CentralCalendarEventWhereInput = {
      id: eventId,
    };

    if (!includeAll || !context.isAdmin) {
      Object.assign(where, this.buildVisibilityWhere(context));
    }

    return prisma.centralCalendarEvent.findFirst({
      where,
      include: CALENDAR_EVENT_INCLUDE,
    });
  }

  private async assertCanManageEvent(userId: string, eventId: string): Promise<void> {
    const context = await this.getUserContext(userId);
    if (context.isAdmin) {
      return;
    }

    const event = await prisma.centralCalendarEvent.findUnique({
      where: { id: eventId },
      select: {
        ownerUserId: true,
        calendar: {
          select: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    if (event.ownerUserId === userId) {
      return;
    }

    const member = event.calendar.members[0];
    if (member && (member.role === 'OWNER' || member.role === 'EDITOR')) {
      return;
    }

    throw new Error('Usuário sem permissão para alterar este evento');
  }

  async createManualEvent(userId: string, input: Omit<UpsertCalendarEventInput, 'ownerUserId'>) {
    return this.upsertEventBySource({
      ...input,
      ownerUserId: userId,
      sourceType: input.sourceType || CentralCalendarSourceType.MANUAL,
    });
  }

  async updateManualEvent(
    userId: string,
    eventId: string,
    input: Partial<UpsertCalendarEventInput>
  ): Promise<CentralCalendarEventWithRelations> {
    await this.assertCanManageEvent(userId, eventId);

    const existing = await prisma.centralCalendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
        visibilityScopes: true,
        links: true,
      },
    });

    if (!existing) {
      throw new Error('Evento não encontrado');
    }

    const participantsFallback: CalendarParticipantInput[] = existing.participants.map(
      (participant) => ({
        targetType: participant.targetType,
        userId: participant.userId || undefined,
        departmentId: participant.departmentId || undefined,
        organizationalUnitId: participant.organizationalUnitId || undefined,
        role: participant.role,
        status: participant.status,
        isRequired: participant.isRequired,
      })
    );

    const visibilityFallback: CalendarVisibilityInput[] = existing.visibilityScopes.map(
      (scope) => ({
        scope: scope.scope,
        userId: scope.userId || undefined,
        departmentId: scope.departmentId || undefined,
        organizationalUnitId: scope.organizationalUnitId || undefined,
      })
    );

    const linksFallback: CalendarLinkInput[] = existing.links.map((link) => ({
      linkType: link.linkType,
      linkedId: link.linkedId,
      metadata: (link.metadata as Prisma.InputJsonValue | null) || null,
    }));

    return this.upsertEventBySource({
      eventId: existing.id,
      ownerUserId: existing.ownerUserId,
      title: input.title || existing.title,
      description:
        input.description !== undefined ? input.description : existing.description || undefined,
      eventType: input.eventType !== undefined ? input.eventType : existing.eventType || undefined,
      location: input.location !== undefined ? input.location : existing.location || undefined,
      startAt: input.startAt || existing.startAt,
      endAt: input.endAt || existing.endAt,
      allDay: input.allDay !== undefined ? input.allDay : existing.allDay,
      status: input.status || existing.status,
      priority: input.priority !== undefined ? input.priority : existing.priority,
      notes: input.notes !== undefined ? input.notes : existing.notes || undefined,
      metadata:
        input.metadata !== undefined
          ? input.metadata
          : (existing.metadata as Prisma.InputJsonValue | null),
      isPrivate: input.isPrivate !== undefined ? input.isPrivate : existing.isPrivate,
      sourceType: existing.sourceType,
      sourceReferenceId: existing.sourceReferenceId || undefined,
      protocolId: input.protocolId !== undefined ? input.protocolId : existing.protocolId || undefined,
      protocolStageId:
        input.protocolStageId !== undefined
          ? input.protocolStageId
          : existing.protocolStageId || undefined,
      serviceId: input.serviceId !== undefined ? input.serviceId : existing.serviceId || undefined,
      departmentId:
        input.departmentId !== undefined ? input.departmentId : existing.departmentId || undefined,
      organizationalUnitId:
        input.organizationalUnitId !== undefined
          ? input.organizationalUnitId
          : existing.organizationalUnitId || undefined,
      calendarId: input.calendarId || existing.calendarId,
      participants: input.participants !== undefined ? input.participants : participantsFallback,
      visibility: input.visibility !== undefined ? input.visibility : visibilityFallback,
      links: input.links !== undefined ? input.links : linksFallback,
    });
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    await this.assertCanManageEvent(userId, eventId);
    await prisma.centralCalendarEvent.delete({
      where: { id: eventId },
    });
  }

  async markEventCompleted(userId: string, eventId: string): Promise<CentralCalendarEventWithRelations> {
    await this.assertCanManageEvent(userId, eventId);
    return this.updateManualEvent(userId, eventId, {
      status: CentralCalendarEventStatus.COMPLETED,
    });
  }

  async removeSourceEvent(
    sourceType: CentralCalendarSourceType,
    sourceReferenceId: string
  ): Promise<void> {
    await prisma.centralCalendarEvent.deleteMany({
      where: {
        sourceType,
        sourceReferenceId,
      },
    });
  }

  async listMyCalendars(userId: string) {
    const context = await this.getUserContext(userId);
    return prisma.centralCalendar.findMany({
      where: context.isAdmin
        ? undefined
        : {
            OR: [
              { ownerUserId: userId },
              {
                members: {
                  some: { userId },
                },
              },
              ...(context.departmentIds.length > 0
                ? [{ departmentId: { in: context.departmentIds } }]
                : []),
              ...(context.organizationalUnitIds.length > 0
                ? [{ organizationalUnitId: { in: context.organizationalUnitIds } }]
                : []),
            ],
          },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async syncLegacyGabineteEventByLegacyId(legacyAgendaEventId: string) {
    const legacy = await prisma.agendaEvent.findUnique({
      where: { id: legacyAgendaEventId },
    });

    if (!legacy) {
      await this.removeSourceEvent(CentralCalendarSourceType.GABINETE, legacyAgendaEventId);
      return null;
    }

    const ownerExists = await prisma.user.findUnique({
      where: { id: legacy.createdById },
      select: { id: true },
    });

    if (!ownerExists) {
      return null;
    }

    return this.upsertEventBySource({
      ownerUserId: legacy.createdById,
      title: legacy.titulo,
      description: legacy.descricao || undefined,
      eventType: legacy.tipo || undefined,
      location: legacy.local || undefined,
      startAt: legacy.dataHoraInicio,
      endAt: legacy.dataHoraFim,
      status:
        LEGACY_AGENDA_STATUS_MAP[legacy.status] || CentralCalendarEventStatus.SCHEDULED,
      notes: legacy.observacoes || undefined,
      metadata: {
        legacyAgendaEventId: legacy.id,
        legacyParticipantes: legacy.participantes,
        legacyAnexos: legacy.anexos,
      },
      isPrivate: false,
      sourceType: CentralCalendarSourceType.GABINETE,
      sourceReferenceId: legacy.id,
      participants: [
        {
          targetType: WorkflowStageSupportTargetType.USER,
          userId: legacy.createdById,
          role: CentralCalendarParticipantRole.OWNER,
          status: CentralCalendarParticipantStatus.ACCEPTED,
          isRequired: true,
        },
      ],
      visibility: [
        { scope: CentralCalendarVisibilityScope.CALENDAR_MEMBERS },
        {
          scope: CentralCalendarVisibilityScope.USER,
          userId: legacy.createdById,
        },
      ],
      links: [{ linkType: 'AGENDA_EVENT', linkedId: legacy.id }],
    });
  }

  async syncHealthAgendaById(agendaId: string) {
    const agenda = await prisma.agendaMedica.findUnique({
      where: { id: agendaId },
    });

    if (!agenda) {
      await this.removeSourceEvent(CentralCalendarSourceType.HEALTH_SCHEDULE, agendaId);
      return null;
    }

    const owner = await prisma.user.findUnique({
      where: { id: agenda.profissionalId },
      select: { id: true, name: true },
    });

    if (!owner) {
      return null;
    }

    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id: agenda.unidadeId },
      select: {
        id: true,
        nome: true,
        organizationalUnitId: true,
      },
    });

    const startBase = agenda.dataInicio || nextWeekDay(new Date(), agenda.diaSemana);
    const endBase = agenda.dataFim || startBase;
    const startAt = parseHourMinute(agenda.horaInicio, startBase);
    let endAt = parseHourMinute(agenda.horaFim, endBase);
    if (endAt.getTime() <= startAt.getTime()) {
      endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    }

    let departmentId: string | undefined;
    if (unidade?.organizationalUnitId) {
      const org = await prisma.organizationalUnit.findUnique({
        where: { id: unidade.organizationalUnitId },
        select: { departmentId: true },
      });
      departmentId = org?.departmentId;
    }

    return this.upsertEventBySource({
      ownerUserId: owner.id,
      title: `Agenda médica - ${owner.name}`,
      description: `Agenda de atendimento da unidade ${unidade?.nome || agenda.unidadeId}`,
      eventType: 'AGENDA_MEDICA',
      startAt,
      endAt,
      status: agenda.isActive
        ? CentralCalendarEventStatus.SCHEDULED
        : CentralCalendarEventStatus.CANCELED,
      metadata: {
        agendaId: agenda.id,
        diaSemana: agenda.diaSemana,
        horaInicio: agenda.horaInicio,
        horaFim: agenda.horaFim,
        tempoPorConsulta: agenda.tempoPorConsulta,
        vagasDisponiveis: agenda.vagasDisponiveis,
        dataInicio: agenda.dataInicio,
        dataFim: agenda.dataFim,
        isRecurringWeekly: true,
      },
      isPrivate: false,
      sourceType: CentralCalendarSourceType.HEALTH_SCHEDULE,
      sourceReferenceId: agenda.id,
      organizationalUnitId: unidade?.organizationalUnitId || undefined,
      departmentId,
      participants: [
        {
          targetType: WorkflowStageSupportTargetType.USER,
          userId: owner.id,
          role: CentralCalendarParticipantRole.RESPONSIBLE,
          status: CentralCalendarParticipantStatus.ACCEPTED,
          isRequired: true,
        },
        ...(unidade?.organizationalUnitId
          ? [
              {
                targetType: WorkflowStageSupportTargetType.ORGANIZATIONAL_UNIT,
                organizationalUnitId: unidade.organizationalUnitId,
                role: CentralCalendarParticipantRole.OBSERVER,
                status: CentralCalendarParticipantStatus.PENDING,
                isRequired: false,
              } as CalendarParticipantInput,
            ]
          : []),
      ],
      links: [{ linkType: 'AGENDA_MEDICA', linkedId: agenda.id }],
    });
  }

  async syncTFDExternalScheduleById(
    agendamentoId: string,
    fallbackUserId?: string
  ) {
    const agendamento = await prisma.agendamentoExternoTFD.findUnique({
      where: { id: agendamentoId },
      include: {
        solicitacao: {
          select: {
            id: true,
            protocolId: true,
            especialidade: true,
            protocol: {
              select: {
                id: true,
                number: true,
                title: true,
                serviceId: true,
                departmentId: true,
                organizationalUnitId: true,
                currentAssignedUserId: true,
                assignedUserId: true,
              },
            },
          },
        },
      },
    });

    if (!agendamento) {
      await this.removeSourceEvent(CentralCalendarSourceType.TFD_EXTERNAL, agendamentoId);
      return null;
    }

    const ownerUserId =
      agendamento.usuarioAgendamento ||
      fallbackUserId ||
      agendamento.solicitacao.protocol.currentAssignedUserId ||
      agendamento.solicitacao.protocol.assignedUserId ||
      undefined;

    if (!ownerUserId) {
      return null;
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true, name: true },
    });

    if (!owner) {
      return null;
    }

    const startAt = agendamento.dataHoraConsulta;
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    const isCancelled =
      typeof agendamento.observacoes === 'string' &&
      agendamento.observacoes.toUpperCase().includes('CANCELADO');

    return this.upsertEventBySource({
      ownerUserId: owner.id,
      title: `TFD - ${agendamento.especialidade}`,
      description: `Consulta externa - ${agendamento.hospitalDestino}`,
      eventType: 'TFD_EXTERNO',
      location: agendamento.endereco || agendamento.hospitalDestino,
      startAt,
      endAt,
      status: isCancelled
        ? CentralCalendarEventStatus.CANCELED
        : agendamento.confirmado
          ? CentralCalendarEventStatus.CONFIRMED
          : CentralCalendarEventStatus.SCHEDULED,
      metadata: {
        agendamentoExternoId: agendamento.id,
        solicitacaoId: agendamento.solicitacaoId,
        telefoneContato: agendamento.telefoneContato,
        observacoes: agendamento.observacoes,
      },
      isPrivate: false,
      sourceType: CentralCalendarSourceType.TFD_EXTERNAL,
      sourceReferenceId: agendamento.id,
      protocolId: agendamento.solicitacao.protocolId,
      serviceId: agendamento.solicitacao.protocol.serviceId,
      departmentId: agendamento.solicitacao.protocol.departmentId,
      organizationalUnitId: agendamento.solicitacao.protocol.organizationalUnitId || undefined,
      participants: [
        {
          targetType: WorkflowStageSupportTargetType.USER,
          userId: owner.id,
          role: CentralCalendarParticipantRole.RESPONSIBLE,
          status: CentralCalendarParticipantStatus.ACCEPTED,
          isRequired: true,
        },
      ],
      links: [
        { linkType: 'AGENDAMENTO_TFD', linkedId: agendamento.id },
        { linkType: 'PROTOCOL', linkedId: agendamento.solicitacao.protocolId },
      ],
    });
  }

  async syncProtocolStageEventByStageId(stageId: string) {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            title: true,
            serviceId: true,
            departmentId: true,
            organizationalUnitId: true,
            createdById: true,
            assignedUserId: true,
            currentAssignedUserId: true,
          },
        },
      },
    });

    if (!stage) {
      await this.removeSourceEvent(CentralCalendarSourceType.PROTOCOL_STAGE, stageId);
      return null;
    }

    const metadata = (stage.metadata as Record<string, any> | null) || {};
    const supportAssignments = Array.isArray(metadata.stageSupportAssignments)
      ? metadata.stageSupportAssignments
      : [];

    const ownerUserId =
      stage.assignedTo ||
      stage.protocol.currentAssignedUserId ||
      stage.protocol.assignedUserId ||
      stage.protocol.createdById ||
      undefined;

    if (!ownerUserId) {
      return null;
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true, name: true },
    });

    if (!owner) {
      return null;
    }

    const participants: CalendarParticipantInput[] = [
      {
        targetType: WorkflowStageSupportTargetType.USER,
        userId: owner.id,
        role: CentralCalendarParticipantRole.RESPONSIBLE,
        status: CentralCalendarParticipantStatus.ACCEPTED,
        isRequired: true,
      },
    ];

    for (const assignment of supportAssignments) {
      if (!assignment || assignment.mode === 'REFERENCE_ONLY') {
        continue;
      }

      if (assignment.targetType === 'USER' && assignment.userId) {
        participants.push({
          targetType: WorkflowStageSupportTargetType.USER,
          userId: assignment.userId,
          role:
            assignment.mode === 'REQUIRED_EXECUTION'
              ? CentralCalendarParticipantRole.RESPONSIBLE
              : CentralCalendarParticipantRole.ATTENDEE,
          status: CentralCalendarParticipantStatus.PENDING,
          isRequired: assignment.mode === 'REQUIRED_EXECUTION',
        });
      } else if (assignment.targetType === 'DEPARTMENT' && assignment.departmentId) {
        participants.push({
          targetType: WorkflowStageSupportTargetType.DEPARTMENT,
          departmentId: assignment.departmentId,
          role:
            assignment.mode === 'REQUIRED_EXECUTION'
              ? CentralCalendarParticipantRole.RESPONSIBLE
              : CentralCalendarParticipantRole.ATTENDEE,
          status: CentralCalendarParticipantStatus.PENDING,
          isRequired: assignment.mode === 'REQUIRED_EXECUTION',
        });
      } else if (
        assignment.targetType === 'ORGANIZATIONAL_UNIT' &&
        assignment.organizationalUnitId
      ) {
        participants.push({
          targetType: WorkflowStageSupportTargetType.ORGANIZATIONAL_UNIT,
          organizationalUnitId: assignment.organizationalUnitId,
          role:
            assignment.mode === 'REQUIRED_EXECUTION'
              ? CentralCalendarParticipantRole.RESPONSIBLE
              : CentralCalendarParticipantRole.ATTENDEE,
          status: CentralCalendarParticipantStatus.PENDING,
          isRequired: assignment.mode === 'REQUIRED_EXECUTION',
        });
      }
    }

    const startAt = stage.startedAt || new Date();
    const endAt =
      stage.dueDate && stage.dueDate.getTime() > startAt.getTime()
        ? stage.dueDate
        : new Date(startAt.getTime() + 60 * 60 * 1000);

    const visibility: CalendarVisibilityInput[] = [];
    if (stage.protocol.departmentId) {
      visibility.push({
        scope: CentralCalendarVisibilityScope.DEPARTMENT,
        departmentId: stage.protocol.departmentId,
      });
    }
    if (stage.protocol.organizationalUnitId) {
      visibility.push({
        scope: CentralCalendarVisibilityScope.ORGANIZATIONAL_UNIT,
        organizationalUnitId: stage.protocol.organizationalUnitId,
      });
    }
    visibility.push({
      scope: CentralCalendarVisibilityScope.USER,
      userId: owner.id,
    });

    return this.upsertEventBySource({
      ownerUserId: owner.id,
      title: `[${stage.protocol.number}] ${stage.stageName}`,
      description: `Etapa ${stage.stageOrder} do protocolo ${stage.protocol.number}`,
      eventType: 'PROTOCOL_STAGE',
      startAt,
      endAt,
      status: stageStatusToEventStatus(stage.status),
      metadata: {
        protocolId: stage.protocol.id,
        protocolNumber: stage.protocol.number,
        protocolTitle: stage.protocol.title,
        stageId: stage.id,
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        stageStatus: stage.status,
        workflowStageId: metadata.stageId,
        stageSupportAssignments: supportAssignments,
      },
      isPrivate: false,
      sourceType: CentralCalendarSourceType.PROTOCOL_STAGE,
      sourceReferenceId: stage.id,
      protocolId: stage.protocol.id,
      protocolStageId: stage.id,
      serviceId: stage.protocol.serviceId,
      departmentId: stage.protocol.departmentId,
      organizationalUnitId: stage.protocol.organizationalUnitId || undefined,
      participants,
      visibility,
      links: [
        { linkType: 'PROTOCOL', linkedId: stage.protocol.id },
        { linkType: 'PROTOCOL_STAGE', linkedId: stage.id },
      ],
    });
  }
}

export const centralCalendarService = new CentralCalendarService();
