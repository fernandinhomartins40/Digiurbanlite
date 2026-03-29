import crypto from 'crypto';
import {
  FaceEnrollmentStatus,
  FaceEventType,
  FaceMatchStatus,
  FaceRecognitionIdentityStatus,
  GuardianNotificationStatus,
  Prisma,
  SituacaoMatricula,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncCitizenPersonIdentity } from './person-identity.service';
import notificationService from './notification.service';
import { NotificationChannel, NotificationType } from '../types/notification.types';
import faceDescriptorService, { cosineSimilarity } from './face-platform/face-descriptor.service';
import faceStorageService from './face-platform/face-storage.service';

const FACE_ENCRYPTION_KEY =
  process.env.FACE_PLATFORM_ENCRYPTION_KEY ||
  process.env.ENCRYPTION_MASTER_KEY ||
  'CHANGE_THIS_FACE_PLATFORM_KEY';

interface CreateDeviceInput {
  code: string;
  name: string;
  unidadeEducacaoId?: string | null;
  type?: 'CAMERA' | 'GATEWAY' | 'NVR';
  protocol?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  locationDescription?: string | null;
  streamUrl?: string | null;
  username?: string | null;
  password?: string | null;
  metadata?: Prisma.InputJsonValue;
}

interface CreateZoneInput {
  deviceId: string;
  unidadeEducacaoId?: string | null;
  name: string;
  gateName?: string | null;
  direction?: 'ENTRY' | 'EXIT' | 'BOTH';
  dedupeWindowSecs?: number;
  metadata?: Prisma.InputJsonValue;
}

interface UpsertSchoolConfigurationInput {
  unidadeEducacaoId: string;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  preferredChannel?: string;
  dedupeWindowSecs?: number;
  entryMessageTemplate?: string | null;
  exitMessageTemplate?: string | null;
  activeHoursStart?: string | null;
  activeHoursEnd?: string | null;
  isActive?: boolean;
  metadata?: Prisma.InputJsonValue;
}

interface CreateEnrollmentInput {
  citizenId: string;
  sourceType?: string;
  sourceLabel?: string | null;
  imageBase64?: string | null;
  embedding?: number[] | null;
  qualityScore?: number | null;
  livenessScore?: number | null;
  metadata?: Prisma.InputJsonValue;
  approvedById?: string | null;
  modelName?: string;
  modelVersion?: string | null;
}

interface IngestRecognitionInput {
  deviceId: string;
  zoneId?: string | null;
  unidadeEducacaoId?: string | null;
  studentCitizenId?: string | null;
  identityId?: string | null;
  eventType?: 'DETECTION' | 'ENTRY' | 'EXIT' | 'UNMATCHED' | 'REVIEW';
  confidence?: number | null;
  imageBase64?: string | null;
  embedding?: number[] | null;
  boundingBox?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  provider?: string | null;
  modelName?: string | null;
  modelVersion?: string | null;
  recognizedAt?: string | Date | null;
}

function encryptSecret(value?: string | null) {
  if (!value) {
    return null;
  }

  const key = crypto.createHash('sha256').update(FACE_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeEmbedding(vector: number[]) {
  return faceDescriptorService.normalizeDescriptor(vector.map((value) => Number(value) || 0));
}

function buildEventTimestamp(recognizedAt?: string | Date | null) {
  if (!recognizedAt) {
    return new Date();
  }

  return recognizedAt instanceof Date ? recognizedAt : new Date(recognizedAt);
}

function renderTemplate(template: string | null | undefined, variables: Record<string, string>) {
  if (!template) {
    return null;
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => variables[key] || '');
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export class FacePlatformService {
  public async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalIdentities,
      totalDevices,
      totalZones,
      totalSchools,
      eventsToday,
      matchedToday,
      pendingReviews,
      notificationsPending,
      recentEvents,
    ] = await Promise.all([
      prisma.faceRecognitionIdentity.count(),
      prisma.faceDevice.count({ where: { isActive: true } }),
      prisma.faceZone.count({ where: { isActive: true } }),
      prisma.unidadeEducacao.count({ where: { isActive: true } }),
      prisma.faceRecognitionEvent.count({ where: { recognizedAt: { gte: today } } }),
      prisma.faceRecognitionEvent.count({
        where: {
          recognizedAt: { gte: today },
          matchStatus: FaceMatchStatus.MATCHED,
        },
      }),
      prisma.faceRecognitionEvent.count({
        where: {
          matchStatus: FaceMatchStatus.REVIEW_REQUIRED,
        },
      }),
      prisma.faceRecognitionEvent.count({
        where: {
          notificationStatus: GuardianNotificationStatus.PENDING,
        },
      }),
      prisma.faceRecognitionEvent.findMany({
        take: 10,
        orderBy: { recognizedAt: 'desc' },
        include: {
          device: true,
          zone: true,
          unidadeEducacao: true,
          studentCitizen: {
            select: { id: true, name: true },
          },
          guardianCitizen: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      totals: {
        totalIdentities,
        totalDevices,
        totalZones,
        totalSchools,
        eventsToday,
        matchedToday,
        pendingReviews,
        notificationsPending,
      },
      recentEvents: recentEvents.map((event) => this.serializeEvent(event)),
    };
  }

  public async listSchools() {
    const schools = await prisma.unidadeEducacao.findMany({
      where: { isActive: true },
      include: {
        schoolSecurityConfiguration: true,
        _count: {
          select: {
            faceDevices: true,
            faceZones: true,
            faceEvents: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return schools.map((school) => ({
      id: school.id,
      nome: school.nome,
      tipo: school.tipo,
      telefone: school.telefone,
      email: school.email,
      hasConfiguration: Boolean(school.schoolSecurityConfiguration),
      configuracao: school.schoolSecurityConfiguration,
      totais: school._count,
    }));
  }

  public async listSchoolStudents(unidadeEducacaoId: string) {
    const matriculas = await prisma.matricula.findMany({
      where: {
        unidadeEducacaoId,
        situacao: SituacaoMatricula.ATIVA,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const studentIds = unique(matriculas.map((item) => item.alunoId));
    const guardianIds = unique(matriculas.map((item) => item.responsavelId));

    const [students, guardians, identities, school] = await Promise.all([
      prisma.citizen.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, cpf: true, phone: true, personId: true },
      }),
      prisma.citizen.findMany({
        where: { id: { in: guardianIds } },
        select: { id: true, name: true, phone: true, email: true },
      }),
      prisma.faceRecognitionIdentity.findMany({
        where: {
          citizenId: { in: studentIds },
        },
        include: {
          enrollments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          embeddings: {
            where: { isActive: true },
          },
        },
      }),
      prisma.unidadeEducacao.findUnique({
        where: { id: unidadeEducacaoId },
        select: { id: true, nome: true, tipo: true },
      }),
    ]);

    const studentMap = new Map(students.map((student) => [student.id, student]));
    const guardianMap = new Map(guardians.map((guardian) => [guardian.id, guardian]));
    const identityMap = new Map(identities.map((identity) => [identity.citizenId, identity]));

    return {
      school,
      students: matriculas
        .map((matricula) => {
          const student = studentMap.get(matricula.alunoId);
          const guardian = guardianMap.get(matricula.responsavelId);
          const identity = identityMap.get(matricula.alunoId);

          if (!student) {
            return null;
          }

          return {
            matriculaId: matricula.id,
            numeroMatricula: matricula.numeroMatricula,
            aluno: student,
            responsavel: guardian || null,
            faceIdentity: identity
              ? {
                  id: identity.id,
                  status: identity.status,
                  totalEmbeddings: identity.embeddings.length,
                  latestEnrollment: identity.enrollments[0] || null,
                }
              : null,
          };
        })
        .filter(Boolean),
    };
  }

  public async listDevices() {
    const devices = await prisma.faceDevice.findMany({
      include: {
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
        zones: true,
      },
      orderBy: { name: 'asc' },
    });

    return devices.map((device) => this.serializeDevice(device));
  }

  public async createDevice(input: CreateDeviceInput) {
    const device = await prisma.faceDevice.create({
      data: {
        code: input.code.trim(),
        name: input.name.trim(),
        unidadeEducacaoId: input.unidadeEducacaoId || null,
        type: input.type || 'CAMERA',
        protocol: input.protocol || 'RTSP',
        manufacturer: input.manufacturer || null,
        model: input.model || null,
        locationDescription: input.locationDescription || null,
        streamUrlEncrypted: encryptSecret(input.streamUrl),
        usernameEncrypted: encryptSecret(input.username),
        passwordEncrypted: encryptSecret(input.password),
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
        isActive: true,
      },
      include: {
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
        zones: true,
      },
    });

    return this.serializeDevice(device);
  }

  public async updateDevice(id: string, input: Partial<CreateDeviceInput>) {
    const data: Prisma.FaceDeviceUpdateInput = {
      ...(input.code ? { code: input.code.trim() } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.unidadeEducacaoId !== undefined ? { unidadeEducacaoId: input.unidadeEducacaoId || null } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.protocol !== undefined ? { protocol: input.protocol || null } : {}),
      ...(input.manufacturer !== undefined ? { manufacturer: input.manufacturer || null } : {}),
      ...(input.model !== undefined ? { model: input.model || null } : {}),
      ...(input.locationDescription !== undefined
        ? { locationDescription: input.locationDescription || null }
        : {}),
      ...(input.streamUrl !== undefined ? { streamUrlEncrypted: encryptSecret(input.streamUrl) } : {}),
      ...(input.username !== undefined ? { usernameEncrypted: encryptSecret(input.username) } : {}),
      ...(input.password !== undefined ? { passwordEncrypted: encryptSecret(input.password) } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
    };

    const device = await prisma.faceDevice.update({
      where: { id },
      data,
      include: {
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
        zones: true,
      },
    });

    return this.serializeDevice(device);
  }

  public async listZones() {
    const zones = await prisma.faceZone.findMany({
      include: {
        device: true,
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
      },
      orderBy: [{ unidadeEducacao: { nome: 'asc' } }, { name: 'asc' }],
    });

    return zones.map((zone) => ({
      ...zone,
      device: this.serializeDevice(zone.device),
    }));
  }

  public async createZone(input: CreateZoneInput) {
    const zone = await prisma.faceZone.create({
      data: {
        deviceId: input.deviceId,
        unidadeEducacaoId: input.unidadeEducacaoId || null,
        name: input.name.trim(),
        gateName: input.gateName || null,
        direction: input.direction || 'BOTH',
        dedupeWindowSecs: input.dedupeWindowSecs || 180,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
      },
      include: {
        device: true,
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });

    return {
      ...zone,
      device: this.serializeDevice(zone.device),
    };
  }

  public async listConfigurations() {
    return prisma.schoolSecurityConfiguration.findMany({
      include: {
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
      },
      orderBy: {
        unidadeEducacao: { nome: 'asc' },
      },
    });
  }

  public async upsertSchoolConfiguration(input: UpsertSchoolConfigurationInput) {
    return prisma.schoolSecurityConfiguration.upsert({
      where: { unidadeEducacaoId: input.unidadeEducacaoId },
      update: {
        notifyOnEntry: input.notifyOnEntry ?? true,
        notifyOnExit: input.notifyOnExit ?? true,
        preferredChannel: input.preferredChannel || 'whatsapp',
        dedupeWindowSecs: input.dedupeWindowSecs || 180,
        entryMessageTemplate: input.entryMessageTemplate || null,
        exitMessageTemplate: input.exitMessageTemplate || null,
        activeHoursStart: input.activeHoursStart || null,
        activeHoursEnd: input.activeHoursEnd || null,
        isActive: input.isActive ?? true,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
      },
      create: {
        unidadeEducacaoId: input.unidadeEducacaoId,
        notifyOnEntry: input.notifyOnEntry ?? true,
        notifyOnExit: input.notifyOnExit ?? true,
        preferredChannel: input.preferredChannel || 'whatsapp',
        dedupeWindowSecs: input.dedupeWindowSecs || 180,
        entryMessageTemplate: input.entryMessageTemplate || null,
        exitMessageTemplate: input.exitMessageTemplate || null,
        activeHoursStart: input.activeHoursStart || null,
        activeHoursEnd: input.activeHoursEnd || null,
        isActive: input.isActive ?? true,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
      },
      include: {
        unidadeEducacao: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });
  }

  public async listIdentities() {
    const identities = await prisma.faceRecognitionIdentity.findMany({
      include: {
        person: true,
        citizen: {
          select: { id: true, name: true, cpf: true, phone: true, personId: true },
        },
        enrollments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        embeddings: {
          where: { isActive: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return identities.map((identity) => ({
      id: identity.id,
      status: identity.status,
      label: identity.label,
      person: identity.person,
      citizen: identity.citizen,
      totalEmbeddings: identity.embeddings.length,
      latestEnrollment: identity.enrollments[0] || null,
      enrollments: identity.enrollments,
    }));
  }

  public async createEnrollment(input: CreateEnrollmentInput) {
    const identity = await this.ensureIdentityForCitizen(input.citizenId);
    let imagePath: string | null = null;
    let vector: number[] | null = input.embedding?.length ? normalizeEmbedding(input.embedding) : null;

    if (input.imageBase64) {
      imagePath = await faceStorageService.persistBase64Image('enrollments', input.imageBase64);
      vector = await faceDescriptorService.createDescriptorFromBase64(input.imageBase64);
    }

    const status = input.approvedById ? FaceEnrollmentStatus.APPROVED : FaceEnrollmentStatus.PENDING;

    const enrollment = await prisma.faceEnrollment.create({
      data: {
        identityId: identity.id,
        sourceType: input.sourceType || 'MANUAL_ADMIN',
        sourceLabel: input.sourceLabel || null,
        imagePath,
        qualityScore: input.qualityScore ?? null,
        livenessScore: input.livenessScore ?? null,
        status,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
        approvedById: input.approvedById || null,
        approvedAt: input.approvedById ? new Date() : null,
      },
    });

    if (vector?.length) {
      await prisma.faceEmbedding.create({
        data: {
          identityId: identity.id,
          enrollmentId: enrollment.id,
          modelName: input.modelName || (input.imageBase64 ? 'simple-image-descriptor' : 'external-vector'),
          modelVersion: input.modelVersion || null,
          vector,
          qualityScore: input.qualityScore ?? null,
          isActive: true,
        },
      });
    }

    await prisma.faceRecognitionIdentity.update({
      where: { id: identity.id },
      data: {
        status: status === FaceEnrollmentStatus.APPROVED
          ? FaceRecognitionIdentityStatus.ACTIVE
          : FaceRecognitionIdentityStatus.REVIEW,
      },
    });

    return prisma.faceRecognitionIdentity.findUnique({
      where: { id: identity.id },
      include: {
        person: true,
        citizen: {
          select: { id: true, name: true, cpf: true, phone: true },
        },
        enrollments: {
          orderBy: { createdAt: 'desc' },
        },
        embeddings: {
          where: { isActive: true },
        },
      },
    });
  }

  public async listEvents(params: {
    unidadeEducacaoId?: string;
    zoneId?: string;
    matchStatus?: FaceMatchStatus;
    limit?: number;
  } = {}) {
    const events = await prisma.faceRecognitionEvent.findMany({
      where: {
        ...(params.unidadeEducacaoId ? { unidadeEducacaoId: params.unidadeEducacaoId } : {}),
        ...(params.zoneId ? { zoneId: params.zoneId } : {}),
        ...(params.matchStatus ? { matchStatus: params.matchStatus } : {}),
      },
      take: params.limit || 100,
      orderBy: { recognizedAt: 'desc' },
      include: {
        device: true,
        zone: true,
        unidadeEducacao: true,
        identity: {
          include: {
            citizen: {
              select: { id: true, name: true, cpf: true },
            },
            person: {
              select: { id: true, name: true, cpf: true },
            },
          },
        },
        studentCitizen: {
          select: { id: true, name: true, cpf: true, phone: true },
        },
        guardianCitizen: {
          select: { id: true, name: true, phone: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return events.map((event) => this.serializeEvent(event));
  }

  public async ingestRecognition(input: IngestRecognitionInput) {
    const [device, zone] = await Promise.all([
      prisma.faceDevice.findUnique({
        where: { id: input.deviceId },
        include: { unidadeEducacao: true },
      }),
      input.zoneId
        ? prisma.faceZone.findUnique({
            where: { id: input.zoneId },
            include: { unidadeEducacao: true },
          })
        : Promise.resolve(null),
    ]);

    if (!device) {
      throw new Error('Dispositivo facial não encontrado');
    }

    let previewPath: string | null = null;
    let vector = input.embedding?.length ? normalizeEmbedding(input.embedding) : null;

    if (input.imageBase64) {
      previewPath = await faceStorageService.persistBase64Image('events', input.imageBase64);
      vector = await faceDescriptorService.createDescriptorFromBase64(input.imageBase64);
    }

    const recognizedAt = buildEventTimestamp(input.recognizedAt);
    let identity = null as any;
    let confidence = input.confidence ?? null;
    let matchStatus: FaceMatchStatus = FaceMatchStatus.UNMATCHED;
    let reviewReason: string | null = null;
    let studentCitizenId = input.studentCitizenId || null;

    if (input.identityId) {
      identity = await prisma.faceRecognitionIdentity.findUnique({
        where: { id: input.identityId },
        include: {
          citizen: true,
          person: true,
        },
      });
      studentCitizenId = studentCitizenId || identity?.citizenId || null;
      matchStatus = identity ? FaceMatchStatus.MATCHED : FaceMatchStatus.UNMATCHED;
    } else if (studentCitizenId) {
      identity = await this.ensureIdentityForCitizen(studentCitizenId);
      matchStatus = FaceMatchStatus.MATCHED;
      confidence = confidence ?? 1;
    } else if (vector?.length) {
      const bestMatch = await this.findBestMatch(vector);
      identity = bestMatch.identity;
      confidence = confidence ?? bestMatch.score;
      matchStatus = bestMatch.matchStatus;
      reviewReason = bestMatch.reviewReason;
      studentCitizenId = bestMatch.identity?.citizenId || null;
    }

    const schoolContext = await this.resolveSchoolContext(
      studentCitizenId,
      input.unidadeEducacaoId || zone?.unidadeEducacaoId || device.unidadeEducacaoId || null
    );
    const eventType = this.resolveEventType(input.eventType, zone?.direction || null, matchStatus);
    const dedupeWindowSecs =
      zone?.dedupeWindowSecs ||
      schoolContext.configuration?.dedupeWindowSecs ||
      180;
    const dedupeKey =
      studentCitizenId && eventType !== FaceEventType.UNMATCHED
        ? `${studentCitizenId}:${zone?.id || device.id}:${eventType}`
        : null;

    if (dedupeKey) {
      const duplicateSince = new Date(recognizedAt.getTime() - dedupeWindowSecs * 1000);
      const existingEvent = await prisma.faceRecognitionEvent.findFirst({
        where: {
          dedupeKey,
          recognizedAt: { gte: duplicateSince },
        },
        orderBy: { recognizedAt: 'desc' },
        include: {
          device: true,
          zone: true,
          unidadeEducacao: true,
          studentCitizen: {
            select: { id: true, name: true, cpf: true, phone: true },
          },
          guardianCitizen: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      });

      if (existingEvent) {
        return {
          duplicate: true,
          event: this.serializeEvent(existingEvent),
        };
      }
    }

    const notificationStatus =
      schoolContext.guardianCitizenId && matchStatus === FaceMatchStatus.MATCHED &&
      (eventType === FaceEventType.ENTRY || eventType === FaceEventType.EXIT)
        ? GuardianNotificationStatus.PENDING
        : GuardianNotificationStatus.NOT_REQUIRED;

    const createdEvent = await prisma.faceRecognitionEvent.create({
      data: {
        identityId: identity?.id || null,
        deviceId: device.id,
        zoneId: zone?.id || null,
        unidadeEducacaoId: schoolContext.unidadeEducacaoId,
        studentCitizenId,
        guardianCitizenId: schoolContext.guardianCitizenId,
        type: eventType,
        matchStatus,
        confidence,
        provider: input.provider || (input.imageBase64 ? 'simple-image' : 'external-vector'),
        modelName: input.modelName || (input.imageBase64 ? 'simple-image-descriptor' : null),
        modelVersion: input.modelVersion || null,
        previewPath,
        boundingBox: (input.boundingBox || null) as Prisma.InputJsonValue | undefined,
        metadata: {
          ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
          storagePreviewPath: previewPath,
        } as Prisma.InputJsonValue,
        dedupeKey,
        reviewReason,
        notificationStatus,
        recognizedAt,
      },
      include: {
        device: true,
        zone: true,
        unidadeEducacao: true,
        identity: {
          include: {
            citizen: {
              select: { id: true, name: true, cpf: true },
            },
            person: {
              select: { id: true, name: true, cpf: true },
            },
          },
        },
        studentCitizen: {
          select: { id: true, name: true, cpf: true, phone: true },
        },
        guardianCitizen: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    if (createdEvent.notificationStatus === GuardianNotificationStatus.PENDING) {
      await this.notifyGuardianForEvent(createdEvent.id);
    }

    return {
      duplicate: false,
      event: this.serializeEvent(createdEvent),
    };
  }

  public async reviewEvent(eventId: string, reviewedById: string, decision: 'approve' | 'reject') {
    const event = await prisma.faceRecognitionEvent.findUnique({
      where: { id: eventId },
      include: {
        device: true,
        zone: true,
        unidadeEducacao: true,
        studentCitizen: true,
        guardianCitizen: true,
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const nextMatchStatus =
      decision === 'approve' ? FaceMatchStatus.MATCHED : FaceMatchStatus.UNMATCHED;
    const nextType =
      decision === 'approve' && event.type === FaceEventType.REVIEW
        ? FaceEventType.DETECTION
        : event.type;

    const updated = await prisma.faceRecognitionEvent.update({
      where: { id: eventId },
      data: {
        matchStatus: nextMatchStatus,
        type: nextType,
        reviewedById,
        reviewedAt: new Date(),
        reviewReason: decision === 'approve' ? null : 'Revisão manual rejeitou a identificação',
        notificationStatus:
          decision === 'approve' && event.guardianCitizenId
            ? GuardianNotificationStatus.PENDING
            : GuardianNotificationStatus.NOT_REQUIRED,
      },
      include: {
        device: true,
        zone: true,
        unidadeEducacao: true,
        studentCitizen: {
          select: { id: true, name: true, cpf: true, phone: true },
        },
        guardianCitizen: {
          select: { id: true, name: true, phone: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (updated.notificationStatus === GuardianNotificationStatus.PENDING) {
      await this.notifyGuardianForEvent(updated.id);
    }

    return this.serializeEvent(updated);
  }

  private async findBestMatch(vector: number[]) {
    const embeddings = await prisma.faceEmbedding.findMany({
      where: { isActive: true },
      include: {
        identity: {
          include: {
            citizen: {
              select: { id: true, name: true, cpf: true },
            },
            person: {
              select: { id: true, name: true, cpf: true },
            },
          },
        },
      },
    });

    let bestMatch: {
      identity: any | null;
      score: number;
      matchStatus: FaceMatchStatus;
      reviewReason: string | null;
    } = {
      identity: null,
      score: 0,
      matchStatus: FaceMatchStatus.UNMATCHED,
      reviewReason: null,
    };

    for (const embedding of embeddings) {
      const score = cosineSimilarity(vector, embedding.vector);

      if (score > bestMatch.score) {
        bestMatch = {
          identity: embedding.identity,
          score,
          matchStatus:
            score >= Number(process.env.FACE_AUTO_MATCH_THRESHOLD || 0.92)
              ? FaceMatchStatus.MATCHED
              : score >= Number(process.env.FACE_REVIEW_MATCH_THRESHOLD || 0.82)
                ? FaceMatchStatus.REVIEW_REQUIRED
                : FaceMatchStatus.UNMATCHED,
          reviewReason:
            score >= Number(process.env.FACE_AUTO_MATCH_THRESHOLD || 0.92)
              ? null
              : score >= Number(process.env.FACE_REVIEW_MATCH_THRESHOLD || 0.82)
                ? 'Confiança intermediária exige revisão manual'
                : 'Nenhum embedding acima do limiar mínimo',
        };
      }
    }

    return bestMatch;
  }

  private resolveEventType(
    explicitType: IngestRecognitionInput['eventType'],
    zoneDirection: 'ENTRY' | 'EXIT' | 'BOTH' | null,
    matchStatus: FaceMatchStatus
  ) {
    if (explicitType) {
      return explicitType as FaceEventType;
    }

    if (matchStatus === FaceMatchStatus.REVIEW_REQUIRED) {
      return FaceEventType.REVIEW;
    }

    if (matchStatus === FaceMatchStatus.UNMATCHED) {
      return FaceEventType.UNMATCHED;
    }

    if (zoneDirection === 'ENTRY') {
      return FaceEventType.ENTRY;
    }

    if (zoneDirection === 'EXIT') {
      return FaceEventType.EXIT;
    }

    return FaceEventType.DETECTION;
  }

  private async resolveSchoolContext(studentCitizenId: string | null, unidadeEducacaoId: string | null) {
    const matricula = studentCitizenId
      ? await prisma.matricula.findFirst({
          where: {
            alunoId: studentCitizenId,
            situacao: SituacaoMatricula.ATIVA,
            ...(unidadeEducacaoId ? { unidadeEducacaoId } : {}),
          },
          orderBy: { updatedAt: 'desc' },
        })
      : null;

    const finalSchoolId = unidadeEducacaoId || matricula?.unidadeEducacaoId || null;

    const configuration = finalSchoolId
      ? await prisma.schoolSecurityConfiguration.findUnique({
          where: { unidadeEducacaoId: finalSchoolId },
        })
      : null;

    return {
      unidadeEducacaoId: finalSchoolId,
      guardianCitizenId: matricula?.responsavelId || null,
      configuration,
    };
  }

  private async notifyGuardianForEvent(eventId: string) {
    const event = await prisma.faceRecognitionEvent.findUnique({
      where: { id: eventId },
      include: {
        zone: true,
        device: true,
        unidadeEducacao: true,
        studentCitizen: true,
        guardianCitizen: true,
      },
    });

    if (!event || !event.guardianCitizenId || !event.guardianCitizen || !event.studentCitizen) {
      if (event) {
        await prisma.faceRecognitionEvent.update({
          where: { id: event.id },
          data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED },
        });
      }
      return;
    }

    if (event.type !== FaceEventType.ENTRY && event.type !== FaceEventType.EXIT) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED },
      });
      return;
    }

    const configuration = event.unidadeEducacaoId
      ? await prisma.schoolSecurityConfiguration.findUnique({
          where: { unidadeEducacaoId: event.unidadeEducacaoId },
        })
      : null;

    if (configuration?.isActive === false) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED },
      });
      return;
    }

    if (event.type === FaceEventType.ENTRY && configuration && !configuration.notifyOnEntry) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED },
      });
      return;
    }

    if (event.type === FaceEventType.EXIT && configuration && !configuration.notifyOnExit) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED },
      });
      return;
    }

    const variables = {
      aluno: event.studentCitizen.name,
      escola: event.unidadeEducacao?.nome || 'Unidade escolar',
      local: event.zone?.gateName || event.zone?.name || event.device.name,
      horario: formatDateTime(event.recognizedAt),
    };

    const title =
      event.type === FaceEventType.ENTRY
        ? 'Aluno identificado na entrada'
        : 'Aluno identificado na saída';

    const fallbackMessage =
      event.type === FaceEventType.ENTRY
        ? `${variables.aluno} entrou em ${variables.escola} às ${variables.horario}. Local: ${variables.local}.`
        : `${variables.aluno} saiu de ${variables.escola} às ${variables.horario}. Local: ${variables.local}.`;

    const template =
      event.type === FaceEventType.ENTRY
        ? configuration?.entryMessageTemplate
        : configuration?.exitMessageTemplate;

    const message = renderTemplate(template, variables) || fallbackMessage;
    const preferredChannel = (configuration?.preferredChannel || 'whatsapp') as NotificationChannel;
    const channels = Array.from(
      new Set<NotificationChannel>([preferredChannel, 'web'])
    ).filter((channel) => ['web', 'push', 'email', 'sms', 'whatsapp'].includes(channel));

    try {
      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: event.guardianCitizenId,
        type:
          event.type === FaceEventType.ENTRY
            ? NotificationType.STUDENT_ENTRY
            : NotificationType.STUDENT_EXIT,
        title,
        message,
        channels,
        priority: 'high',
        data: {
          eventId: event.id,
          studentCitizenId: event.studentCitizenId,
          guardianCitizenId: event.guardianCitizenId,
          schoolId: event.unidadeEducacaoId,
          schoolName: event.unidadeEducacao?.nome || null,
          zoneId: event.zoneId,
          zoneName: event.zone?.name || null,
          eventType: event.type,
          recognizedAt: event.recognizedAt.toISOString(),
        },
      });

      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: {
          notificationStatus: GuardianNotificationStatus.SENT,
          notificationAttempts: { increment: 1 },
          lastNotificationError: null,
        },
      });
    } catch (error: any) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: {
          notificationStatus: GuardianNotificationStatus.FAILED,
          notificationAttempts: { increment: 1 },
          lastNotificationError: error.message || 'Falha ao enfileirar notificação',
        },
      });
      throw error;
    }
  }

  private async ensureIdentityForCitizen(citizenId: string) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        phone: true,
        rg: true,
        birthDate: true,
        isActive: true,
        personId: true,
      },
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    let personId = citizen.personId;

    if (!personId) {
      const result = await syncCitizenPersonIdentity(prisma, {
        citizenId: citizen.id,
        currentPersonId: citizen.personId,
        cpf: citizen.cpf,
        name: citizen.name,
        email: citizen.email,
        phone: citizen.phone,
        rg: citizen.rg,
        birthDate: citizen.birthDate,
        isActive: citizen.isActive,
      });
      personId = result.personId;
    }

    const existing = await prisma.faceRecognitionIdentity.findFirst({
      where: {
        OR: [{ citizenId: citizen.id }, { personId }],
      },
      include: {
        citizen: true,
        person: true,
      },
    });

    if (existing) {
      if (!existing.citizenId) {
        return prisma.faceRecognitionIdentity.update({
          where: { id: existing.id },
          data: {
            citizenId: citizen.id,
          },
          include: {
            citizen: true,
            person: true,
          },
        });
      }

      return existing;
    }

    return prisma.faceRecognitionIdentity.create({
      data: {
        personId,
        citizenId: citizen.id,
        label: citizen.name,
        status: FaceRecognitionIdentityStatus.PENDING,
      },
      include: {
        citizen: true,
        person: true,
      },
    });
  }

  private serializeDevice(device: any) {
    return {
      id: device.id,
      code: device.code,
      name: device.name,
      unidadeEducacaoId: device.unidadeEducacaoId,
      unidadeEducacao: device.unidadeEducacao || null,
      type: device.type,
      protocol: device.protocol,
      manufacturer: device.manufacturer,
      model: device.model,
      locationDescription: device.locationDescription,
      healthStatus: device.healthStatus,
      lastHeartbeatAt: device.lastHeartbeatAt,
      isActive: device.isActive,
      metadata: device.metadata || {},
      hasStreamConfigured: Boolean(device.streamUrlEncrypted),
      hasCredentialsConfigured: Boolean(device.usernameEncrypted || device.passwordEncrypted),
      zones:
        device.zones?.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          direction: zone.direction,
          gateName: zone.gateName,
          dedupeWindowSecs: zone.dedupeWindowSecs,
          isActive: zone.isActive,
        })) || [],
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  private serializeEvent(event: any) {
    return {
      ...event,
      previewUrl: faceStorageService.buildPublicPath(event.previewPath),
    };
  }
}

export default new FacePlatformService();
