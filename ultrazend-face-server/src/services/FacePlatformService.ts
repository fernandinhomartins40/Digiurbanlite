/**
 * Serviço de biometria facial (por município).
 *
 * Revisão de 2026-10-04 (migração para o motor UniFace no servidor):
 * - TODA consulta é filtrada pelo município da chamada (antes a busca comparava
 *   rostos de todos os municípios e devolvia nome/CPF de outro município);
 * - o rosto é analisado no SERVIDOR (ultrazend-face-engine): o navegador só
 *   captura as fotos — antes ele mandava o vetor e a "nota de prova de vida"
 *   e o servidor acreditava;
 * - prova de vida com desafio sorteado pelo servidor + anti-fraude passivo;
 * - consentimento por finalidade, registro de acesso e fotos cifradas;
 * - vetores de rosto nunca saem deste serviço.
 */

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
import prisma from '../utils/prisma';
import { deviceSecretKey } from '../utils/secrets';
import { syncCitizenPersonIdentity } from './person-identity.service';
import digiUrbanIntegration from '../integrations/DigiUrbanIntegration';
import faceStorageService from './face/face-storage.service';
import { analyzeFrames, engineStatus } from './face/engine-client';
import { evaluateChallenge, findBestMatch, normalize, sanitizeMetadata, type GalleryEntry } from './face/decisions';
import { getEngineSettings } from './face/settings';
import { consumeChallenge, createChallenge } from './face/challenge.service';
import {
  assertPurpose,
  citizenIdsWithConsent,
  grantConsent,
  hasActiveConsent,
  listConsents,
  revokeConsent,
  type ConsentInput,
  type FacePurpose,
} from './face/consent.service';
import { listFaceAccess, logFaceAccess, type FaceActor } from './face/access-log';

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

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
}

export interface EnrollmentInput {
  citizenId: string;
  purpose: FacePurpose;
  frames: string[];
  challengeId: string;
  sourceType: string;
  sourceLabel?: string | null;
  actor: FaceActor;
  /** Consentimento registrado junto (termo aceito na tela) */
  consent?: Omit<ConsentInput, 'tenantId' | 'citizenId' | 'purpose'> | null;
}

export interface VerifyInput {
  frames: string[];
  challengeId: string;
  /** 1:1 — confirma se é este cidadão. Sem ele: busca no município (1:N). */
  expectedCitizenId?: string | null;
  purpose: FacePurpose;
  sourceType: string;
  actor: FaceActor;
  /** chave do desafio (o cidadão do autoatendimento ou o servidor que lê) */
  challengeSubject: string;
}

export interface IngestInput {
  deviceId: string;
  zoneId?: string | null;
  eventType?: 'DETECTION' | 'ENTRY' | 'EXIT';
  frame: string;
  actor: FaceActor;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function faceError(message: string, status = 500, details?: unknown) {
  const error = new Error(message) as Error & { status?: number; details?: unknown };
  error.status = status;
  error.details = details;
  return error;
}

function encryptSecret(value?: string | null) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deviceSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function renderTemplate(template: string | null | undefined, variables: Record<string, string>) {
  if (!template) return null;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => variables[key] || '');
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(date);
}

function assertFrames(frames: unknown, expected: number): string[] {
  if (!Array.isArray(frames) || frames.length !== expected || frames.some((frame) => typeof frame !== 'string' || frame.length < 100)) {
    throw faceError(
      expected === 3
        ? 'A validação ao vivo precisa de 3 fotos. Atualize a página e tente de novo.'
        : 'Envie uma foto da câmera.',
      400
    );
  }
  return frames as string[];
}

// Galeria (vetores) por município + modelo + finalidade, com cache curto
const galleryCache = new Map<string, { at: number; entries: GalleryEntry[] }>();
function invalidateGallery(tenantId: string) {
  for (const key of galleryCache.keys()) if (key.startsWith(`${tenantId}:`)) galleryCache.delete(key);
}

// ---------------------------------------------------------------------------
// Serviço
// ---------------------------------------------------------------------------

export class FacePlatformService {
  // ----- status e painel -----

  public async getStatus(tenantId: string) {
    const [engine, settings] = await Promise.all([engineStatus(), getEngineSettings()]);
    let schemaReady = true;
    try {
      await prisma.faceRecognitionIdentity.count({ where: { tenantId } });
    } catch {
      schemaReady = false;
    }

    return {
      available: Boolean(engine.available) && schemaReady,
      schemaReady,
      service: 'ultrazend-face-server',
      message: !schemaReady
        ? 'As tabelas da biometria ainda não foram aplicadas no banco.'
        : engine.available
          ? 'Serviço facial disponível.'
          : 'O motor de reconhecimento facial está indisponível no momento.',
      providers: {
        recognition: {
          configured: true,
          available: Boolean(engine.available),
          engine: 'uniface',
          model: settings.recognitionModel,
          message: engine.available ? 'Reconhecimento no servidor (UniFace).' : engine.message,
        },
        liveness: {
          configured: true,
          available: Boolean(engine.available),
          provider: 'desafio-servidor+minifasnet',
          message: 'Prova de vida com desafio sorteado pelo servidor e anti-fraude passivo.',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  public async getDashboard(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const where = { tenantId };

    const [totalIdentities, totalDevices, totalZones, totalSchools, eventsToday, matchedToday, pendingReviews, notificationsPending, recentEvents] =
      await Promise.all([
        prisma.faceRecognitionIdentity.count({ where }),
        prisma.faceDevice.count({ where: { ...where, isActive: true } }),
        prisma.faceZone.count({ where: { ...where, isActive: true } }),
        prisma.unidadeEducacao.count({ where: { ...where, isActive: true } }),
        prisma.faceRecognitionEvent.count({ where: { ...where, recognizedAt: { gte: today } } }),
        prisma.faceRecognitionEvent.count({ where: { ...where, recognizedAt: { gte: today }, matchStatus: FaceMatchStatus.MATCHED } }),
        prisma.faceRecognitionEvent.count({ where: { ...where, matchStatus: FaceMatchStatus.REVIEW_REQUIRED } }),
        prisma.faceRecognitionEvent.count({ where: { ...where, notificationStatus: GuardianNotificationStatus.PENDING } }),
        prisma.faceRecognitionEvent.findMany({
          where,
          take: 10,
          orderBy: { recognizedAt: 'desc' },
          include: this.eventInclude(),
        }),
      ]);

    return {
      totals: { totalIdentities, totalDevices, totalZones, totalSchools, eventsToday, matchedToday, pendingReviews, notificationsPending },
      recentEvents: recentEvents.map((event) => this.serializeEvent(event)),
    };
  }

  // ----- escolas -----

  public async listSchools(tenantId: string) {
    const schools = await prisma.unidadeEducacao.findMany({
      where: { tenantId, isActive: true },
      include: {
        schoolSecurityConfiguration: true,
        _count: { select: { faceDevices: true, faceZones: true, faceEvents: true } },
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

  private async assertSchool(tenantId: string, unidadeEducacaoId: string | null | undefined) {
    if (!unidadeEducacaoId) return null;
    const school = await prisma.unidadeEducacao.findFirst({ where: { id: unidadeEducacaoId, tenantId }, select: { id: true } });
    if (!school) throw faceError('Unidade escolar não encontrada', 404);
    return school.id;
  }

  public async listSchoolCitizens(tenantId: string, unidadeEducacaoId: string) {
    await this.assertSchool(tenantId, unidadeEducacaoId);
    const settings = await getEngineSettings();
    const matriculas = await prisma.matricula.findMany({
      where: { tenantId, unidadeEducacaoId, situacao: SituacaoMatricula.ATIVA },
      orderBy: { updatedAt: 'desc' },
    });

    const citizenIds = unique(matriculas.map((item) => item.alunoId));
    const guardianIds = unique(matriculas.map((item) => item.responsavelId));

    const [citizens, guardians, identities, school, consented] = await Promise.all([
      prisma.citizen.findMany({ where: { tenantId, id: { in: citizenIds } }, select: { id: true, name: true, cpf: true } }),
      prisma.citizen.findMany({ where: { tenantId, id: { in: guardianIds } }, select: { id: true, name: true } }),
      prisma.faceRecognitionIdentity.findMany({
        where: { tenantId, citizenId: { in: citizenIds } },
        include: {
          enrollments: { orderBy: { createdAt: 'desc' }, take: 1 },
          embeddings: { where: { isActive: true }, select: { modelName: true } },
        },
      }),
      prisma.unidadeEducacao.findFirst({ where: { id: unidadeEducacaoId, tenantId }, select: { id: true, nome: true, tipo: true } }),
      citizenIdsWithConsent(tenantId, 'SCHOOL_SECURITY'),
    ]);

    const citizenMap = new Map(citizens.map((citizen) => [citizen.id, citizen]));
    const guardianMap = new Map(guardians.map((guardian) => [guardian.id, guardian]));
    const identityMap = new Map(identities.map((identity) => [identity.citizenId, identity]));

    return {
      school,
      citizens: matriculas
        .map((matricula) => {
          const citizen = citizenMap.get(matricula.alunoId);
          if (!citizen) return null;
          const guardian = guardianMap.get(matricula.responsavelId) || null;
          const identity = identityMap.get(matricula.alunoId);
          return {
            matriculaId: matricula.id,
            numeroMatricula: matricula.numeroMatricula,
            citizen: { id: citizen.id, name: citizen.name, cpf: maskCpf(citizen.cpf) },
            aluno: { id: citizen.id, name: citizen.name },
            guardian,
            responsavel: guardian,
            schoolConsent: consented.has(citizen.id),
            faceIdentity: identity ? this.summarizeIdentity(identity, settings.recognitionModel) : null,
          };
        })
        .filter(Boolean),
    };
  }

  // ----- dispositivos, zonas e configurações -----

  public async listDevices(tenantId: string) {
    const devices = await prisma.faceDevice.findMany({
      where: { tenantId },
      include: { unidadeEducacao: { select: { id: true, nome: true, tipo: true } }, zones: true },
      orderBy: { name: 'asc' },
    });
    return devices.map((device) => this.serializeDevice(device));
  }

  public async createDevice(tenantId: string, input: CreateDeviceInput) {
    if (!input?.code?.trim() || !input?.name?.trim()) throw faceError('Informe código e nome do dispositivo', 400);
    const unidadeEducacaoId = await this.assertSchool(tenantId, input.unidadeEducacaoId);
    const device = await prisma.faceDevice.create({
      data: {
        tenantId,
        code: input.code.trim(),
        name: input.name.trim(),
        unidadeEducacaoId,
        type: input.type || 'CAMERA',
        protocol: input.protocol || 'RTSP',
        manufacturer: input.manufacturer || null,
        model: input.model || null,
        locationDescription: input.locationDescription || null,
        streamUrlEncrypted: encryptSecret(input.streamUrl),
        usernameEncrypted: encryptSecret(input.username),
        passwordEncrypted: encryptSecret(input.password),
        metadata: sanitizeMetadata(input.metadata) as Prisma.InputJsonValue,
        isActive: true,
      },
      include: { unidadeEducacao: { select: { id: true, nome: true, tipo: true } }, zones: true },
    });
    return this.serializeDevice(device);
  }

  public async updateDevice(tenantId: string, id: string, input: Partial<CreateDeviceInput>) {
    const existing = await prisma.faceDevice.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!existing) throw faceError('Dispositivo não encontrado', 404);
    const unidadeEducacaoId =
      input.unidadeEducacaoId !== undefined ? await this.assertSchool(tenantId, input.unidadeEducacaoId) : undefined;

    const device = await prisma.faceDevice.update({
      where: { id },
      data: {
        ...(input.code ? { code: input.code.trim() } : {}),
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(unidadeEducacaoId !== undefined ? { unidadeEducacaoId } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.protocol !== undefined ? { protocol: input.protocol || null } : {}),
        ...(input.manufacturer !== undefined ? { manufacturer: input.manufacturer || null } : {}),
        ...(input.model !== undefined ? { model: input.model || null } : {}),
        ...(input.locationDescription !== undefined ? { locationDescription: input.locationDescription || null } : {}),
        ...(input.streamUrl !== undefined ? { streamUrlEncrypted: encryptSecret(input.streamUrl) } : {}),
        ...(input.username !== undefined ? { usernameEncrypted: encryptSecret(input.username) } : {}),
        ...(input.password !== undefined ? { passwordEncrypted: encryptSecret(input.password) } : {}),
      },
      include: { unidadeEducacao: { select: { id: true, nome: true, tipo: true } }, zones: true },
    });
    return this.serializeDevice(device);
  }

  public async listZones(tenantId: string) {
    const zones = await prisma.faceZone.findMany({
      where: { tenantId },
      include: { device: true, unidadeEducacao: { select: { id: true, nome: true, tipo: true } } },
      orderBy: [{ name: 'asc' }],
    });
    return zones.map((zone) => ({ ...zone, device: this.serializeDevice(zone.device) }));
  }

  public async createZone(tenantId: string, input: CreateZoneInput) {
    if (!input?.name?.trim()) throw faceError('Informe o nome da zona', 400);
    const device = await prisma.faceDevice.findFirst({ where: { id: input.deviceId, tenantId } });
    if (!device) throw faceError('Dispositivo não encontrado', 404);
    const unidadeEducacaoId = await this.assertSchool(tenantId, input.unidadeEducacaoId || device.unidadeEducacaoId);

    const zone = await prisma.faceZone.create({
      data: {
        tenantId,
        deviceId: device.id,
        unidadeEducacaoId,
        name: input.name.trim(),
        gateName: input.gateName || null,
        direction: input.direction || 'BOTH',
        dedupeWindowSecs: Math.min(Math.max(Number(input.dedupeWindowSecs) || 180, 10), 3600),
      },
      include: { device: true, unidadeEducacao: { select: { id: true, nome: true, tipo: true } } },
    });
    return { ...zone, device: this.serializeDevice(zone.device) };
  }

  public async listConfigurations(tenantId: string) {
    return prisma.schoolSecurityConfiguration.findMany({
      where: { unidadeEducacao: { tenantId } },
      include: { unidadeEducacao: { select: { id: true, nome: true, tipo: true } } },
      orderBy: { unidadeEducacao: { nome: 'asc' } },
    });
  }

  public async upsertSchoolConfiguration(tenantId: string, input: UpsertSchoolConfigurationInput) {
    await this.assertSchool(tenantId, input.unidadeEducacaoId);
    const data = {
      notifyOnEntry: input.notifyOnEntry ?? true,
      notifyOnExit: input.notifyOnExit ?? true,
      preferredChannel: input.preferredChannel === 'whatsapp' ? 'chat' : input.preferredChannel || 'chat',
      dedupeWindowSecs: Math.min(Math.max(Number(input.dedupeWindowSecs) || 180, 10), 3600),
      entryMessageTemplate: input.entryMessageTemplate || null,
      exitMessageTemplate: input.exitMessageTemplate || null,
      activeHoursStart: input.activeHoursStart || null,
      activeHoursEnd: input.activeHoursEnd || null,
      isActive: input.isActive ?? true,
    };
    return prisma.schoolSecurityConfiguration.upsert({
      where: { unidadeEducacaoId: input.unidadeEducacaoId },
      update: data,
      create: { unidadeEducacaoId: input.unidadeEducacaoId, ...data },
      include: { unidadeEducacao: { select: { id: true, nome: true, tipo: true } } },
    });
  }

  // ----- identidades (sem vetores!) -----

  public async listIdentities(tenantId: string, actor: FaceActor) {
    const settings = await getEngineSettings();
    const identities = await prisma.faceRecognitionIdentity.findMany({
      where: { tenantId },
      include: {
        citizen: { select: { id: true, name: true, cpf: true } },
        enrollments: { orderBy: { createdAt: 'desc' }, take: 3 },
        embeddings: { where: { isActive: true }, select: { modelName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    await logFaceAccess({ tenantId, actor, action: 'LIST', details: { total: identities.length } });

    return identities.map((identity) => ({
      ...this.summarizeIdentity(identity, settings.recognitionModel),
      citizen: identity.citizen ? { id: identity.citizen.id, name: identity.citizen.name, cpf: maskCpf(identity.citizen.cpf) } : null,
    }));
  }

  public async getCitizenBiometry(tenantId: string, citizenId: string, actor: FaceActor) {
    const settings = await getEngineSettings();
    const [identity, consents] = await Promise.all([
      prisma.faceRecognitionIdentity.findFirst({
        where: { tenantId, citizenId },
        include: {
          enrollments: { orderBy: { createdAt: 'desc' } },
          embeddings: { where: { isActive: true }, select: { modelName: true } },
        },
      }),
      listConsents(tenantId, citizenId),
    ]);
    await logFaceAccess({ tenantId, actor, action: 'VIEW', citizenId, identityId: identity?.id });
    return {
      identity: identity ? this.summarizeIdentity(identity, settings.recognitionModel) : null,
      consents,
    };
  }

  private summarizeIdentity(
    identity: {
      id: string;
      status: FaceRecognitionIdentityStatus;
      label?: string | null;
      citizenId: string | null;
      enrollments: Array<{ id: string; status: FaceEnrollmentStatus; sourceType: string; qualityScore: number | null; livenessScore: number | null; capturedAt: Date; createdAt: Date; imagePath: string | null; metadata: Prisma.JsonValue | null }>;
      embeddings: Array<{ modelName: string }>;
    },
    currentModel: string
  ) {
    const current = identity.embeddings.filter((embedding) => embedding.modelName === currentModel).length;
    const latest = identity.enrollments[0];
    return {
      id: identity.id,
      status: identity.status,
      label: identity.label || null,
      citizenId: identity.citizenId,
      totalEmbeddings: current,
      // tinha biometria do motor antigo mas não deu para converter: refazer o cadastro
      needsReenrollment: current === 0 && identity.embeddings.length > 0,
      latestEnrollment: latest
        ? {
            id: latest.id,
            status: latest.status,
            sourceType: latest.sourceType,
            qualityScore: latest.qualityScore,
            livenessScore: latest.livenessScore,
            capturedAt: latest.capturedAt,
            createdAt: latest.createdAt,
            hasImage: Boolean(latest.imagePath),
            reviewReasons: Array.isArray((latest.metadata as any)?.reviewReasons) ? (latest.metadata as any).reviewReasons : [],
          }
        : null,
    };
  }

  // ----- consentimento -----

  public async listConsents(tenantId: string, citizenId: string) {
    return listConsents(tenantId, citizenId);
  }

  public async grantConsent(tenantId: string, citizenId: string, purpose: FacePurpose, consent: EnrollmentInput['consent'], actor: FaceActor) {
    await this.assertCitizen(tenantId, citizenId);
    if (!consent) throw faceError('Consentimento ausente', 400);
    const saved = await grantConsent({ ...consent, tenantId, citizenId, purpose: assertPurpose(purpose) });
    invalidateGallery(tenantId);
    await logFaceAccess({ tenantId, actor, action: 'CONSENT_GRANTED', citizenId, details: { purpose, relationship: consent.relationship, channel: consent.channel } });
    return saved;
  }

  public async revokeConsent(tenantId: string, citizenId: string, purpose: FacePurpose, actor: FaceActor, reason: string) {
    const count = await revokeConsent(tenantId, citizenId, assertPurpose(purpose), `${actor.type}:${actor.id || ''}`, reason);
    invalidateGallery(tenantId);
    await logFaceAccess({ tenantId, actor, action: 'CONSENT_REVOKED', citizenId, details: { purpose, reason } });

    // sem nenhuma finalidade ativa, a biometria não tem mais por que existir
    const remaining = await prisma.faceConsent.count({ where: { tenantId, citizenId, revokedAt: null } });
    let deletion = null;
    if (remaining === 0) {
      deletion = await this.deleteCitizenBiometry(tenantId, {
        citizenId,
        actor,
        reason: 'Consentimento revogado para todas as finalidades',
        allowEmpty: true,
      });
    }
    return { revoked: count, biometryDeleted: Boolean(deletion?.deletedEmbeddings || deletion?.deletedEnrollments) };
  }

  // ----- desafio da prova de vida -----

  public createChallenge(tenantId: string, subject: string) {
    return createChallenge(tenantId, subject);
  }

  // ----- cadastro -----

  public async createEnrollment(tenantId: string, input: EnrollmentInput) {
    const purpose = assertPurpose(input.purpose);
    const frames = assertFrames(input.frames, 3);
    await this.assertCitizen(tenantId, input.citizenId);

    if (input.consent) {
      await grantConsent({ ...input.consent, tenantId, citizenId: input.citizenId, purpose });
      await logFaceAccess({ tenantId, actor: input.actor, action: 'CONSENT_GRANTED', citizenId: input.citizenId, details: { purpose, channel: input.consent.channel } });
    }
    if (!(await hasActiveConsent(tenantId, input.citizenId, purpose))) {
      throw faceError('É preciso registrar o consentimento para a biometria antes do cadastro.', 403);
    }

    const direction = consumeChallenge(input.challengeId, tenantId, `enroll:${input.citizenId}`);
    const identity = await this.ensureIdentityForCitizen(tenantId, input.citizenId);
    await this.assertIdentityCanEnroll(identity.id);

    const settings = await getEngineSettings();
    const analysis = await analyzeFrames(frames, { model: settings.recognitionModel });
    const liveness = evaluateChallenge(analysis.frames, direction, settings);

    if (!liveness.passed || !liveness.embedding) {
      await logFaceAccess({ tenantId, actor: input.actor, action: 'ENROLL_REJECTED', citizenId: input.citizenId, identityId: identity.id, details: { reasons: liveness.reasons } });
      throw faceError(liveness.reasons[0] || 'Não foi possível validar o rosto ao vivo.', 422, { reasons: liveness.reasons });
    }

    const quality = liveness.quality ?? 0;
    if (quality < settings.minQuality) {
      throw faceError('A foto ficou com pouca qualidade. Procure um lugar bem iluminado, sem óculos escuros ou boné, e tente de novo.', 422);
    }

    const vector = normalize(liveness.embedding);

    // Mesmo rosto já cadastrado para OUTRO cidadão do município? Vai para revisão
    const gallery = await this.loadGallery(tenantId, settings.recognitionModel, null);
    const duplicate = findBestMatch(vector, gallery.filter((entry) => entry.citizenId !== input.citizenId), settings);
    const reviewReasons: string[] = [];
    if (duplicate.status !== 'UNMATCHED') {
      reviewReasons.push('Este rosto se parece com o de outro cidadão já cadastrado. Confirme a identidade antes de aprovar.');
    }

    const staffApproval = input.actor.type === 'USER';
    const approved = reviewReasons.length === 0;
    const imagePath = await faceStorageService.persistBase64Image(tenantId, 'enrollments', frames[0]);

    const enrollment = await prisma.faceEnrollment.create({
      data: {
        tenantId,
        identityId: identity.id,
        sourceType: input.sourceType,
        sourceLabel: input.sourceLabel || null,
        imagePath,
        qualityScore: quality,
        livenessScore: liveness.score,
        status: approved ? FaceEnrollmentStatus.APPROVED : FaceEnrollmentStatus.PENDING,
        approvedById: approved && staffApproval ? input.actor.id || null : null,
        approvedAt: approved ? new Date() : null,
        metadata: {
          engine: analysis.model,
          purpose,
          liveness: { score: liveness.score, realFraction: liveness.realFraction, challenge: direction },
          reviewReasons,
          ...(duplicate.status !== 'UNMATCHED' ? { possibleDuplicateIdentityId: duplicate.identityId, duplicateScore: duplicate.score } : {}),
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.faceEmbedding.create({
      data: {
        tenantId,
        identityId: identity.id,
        enrollmentId: enrollment.id,
        modelName: analysis.model.name,
        modelVersion: `uniface-${analysis.model.version}`,
        vector,
        qualityScore: quality,
        isActive: true,
      },
    });

    await prisma.faceRecognitionIdentity.update({
      where: { id: identity.id },
      data: { tenantId, status: approved ? FaceRecognitionIdentityStatus.ACTIVE : FaceRecognitionIdentityStatus.REVIEW },
    });
    invalidateGallery(tenantId);

    await logFaceAccess({
      tenantId,
      actor: input.actor,
      action: 'ENROLL',
      citizenId: input.citizenId,
      identityId: identity.id,
      details: { purpose, approved, sourceType: input.sourceType },
    });

    return {
      identityId: identity.id,
      enrollmentId: enrollment.id,
      status: enrollment.status,
      approved,
      reviewReasons,
      qualityScore: quality,
      livenessScore: liveness.score,
    };
  }

  // ----- leitura (1:1 ou 1:N no município) -----

  public async verify(tenantId: string, input: VerifyInput) {
    const purpose = assertPurpose(input.purpose);
    const frames = assertFrames(input.frames, 3);
    const direction = consumeChallenge(input.challengeId, tenantId, input.challengeSubject);
    const settings = await getEngineSettings();
    const analysis = await analyzeFrames(frames, { model: settings.recognitionModel });
    const liveness = evaluateChallenge(analysis.frames, direction, settings);

    const base = {
      livenessScore: liveness.score,
      liveness: { passed: liveness.passed, score: liveness.score, reasons: liveness.reasons, provider: 'uniface' },
      provider: 'uniface',
      modelName: analysis.model.name,
      modelVersion: analysis.model.version,
      expectedCitizenId: input.expectedCitizenId || null,
      readAt: new Date().toISOString(),
    };

    if (!liveness.passed || !liveness.embedding) {
      await logFaceAccess({ tenantId, actor: input.actor, action: 'READ_REJECTED', citizenId: input.expectedCitizenId, details: { reasons: liveness.reasons, purpose } });
      return {
        ...base,
        recognized: false,
        matchStatus: 'UNMATCHED' as const,
        confidence: 0,
        reviewReason: liveness.reasons[0] || 'Prova de vida não confirmada',
        belongsToExpectedCitizen: input.expectedCitizenId ? false : null,
        identity: null,
      };
    }

    const probe = normalize(liveness.embedding);
    const expected = input.expectedCitizenId || null;
    // 1:1: compara SÓ com o cidadão esperado. 1:N: só quem consentiu para a finalidade.
    const gallery = expected
      ? (await this.loadGallery(tenantId, settings.recognitionModel, null)).filter((entry) => entry.citizenId === expected)
      : await this.loadGallery(tenantId, settings.recognitionModel, purpose);

    const match = findBestMatch(probe, gallery, settings);
    const identity = match.identityId
      ? await prisma.faceRecognitionIdentity.findFirst({
          where: { id: match.identityId, tenantId },
          include: { citizen: { select: { id: true, name: true, cpf: true } } },
        })
      : null;

    await logFaceAccess({
      tenantId,
      actor: input.actor,
      action: expected ? 'VERIFY' : 'IDENTIFY',
      citizenId: match.citizenId || expected,
      identityId: match.identityId,
      details: { purpose, status: match.status, score: Math.round(match.score * 1000) / 1000, sourceType: input.sourceType },
    });

    const noTemplate = gallery.length === 0;
    return {
      ...base,
      recognized: match.status === 'MATCHED',
      matchStatus: match.status,
      confidence: Math.round(match.score * 1000) / 1000,
      reviewReason: noTemplate
        ? expected
          ? 'Este cidadão ainda não tem biometria no motor atual. Faça um novo cadastro.'
          : 'Nenhuma biometria cadastrada para esta finalidade no município.'
        : match.reviewReason,
      belongsToExpectedCitizen: expected ? match.status === 'MATCHED' && match.citizenId === expected : null,
      identity:
        identity && match.status !== 'UNMATCHED'
          ? {
              id: identity.id,
              status: identity.status,
              citizenId: identity.citizenId,
              citizen: identity.citizen
                ? { id: identity.citizen.id, name: identity.citizen.name, cpf: maskCpf(identity.citizen.cpf) }
                : null,
            }
          : null,
    };
  }

  // ----- exclusão (direito do titular) -----

  public async deleteCitizenBiometry(
    tenantId: string,
    input: { citizenId: string; actor: FaceActor; reason?: string | null; allowEmpty?: boolean }
  ) {
    const identity = await prisma.faceRecognitionIdentity.findFirst({
      where: { tenantId, citizenId: input.citizenId },
      include: { enrollments: true, embeddings: true },
    });

    if (!identity) {
      if (input.allowEmpty) return null;
      throw faceError('Nenhuma biometria facial encontrada para este cidadão.', 404);
    }

    const events = await prisma.faceRecognitionEvent.findMany({
      where: { tenantId, OR: [{ identityId: identity.id }, { studentCitizenId: input.citizenId }], previewPath: { not: null } },
      select: { id: true, previewPath: true },
    });

    if (identity.enrollments.length === 0 && identity.embeddings.length === 0 && events.length === 0) {
      if (input.allowEmpty) return null;
      throw faceError('Este cidadão não possui biometria facial cadastrada.', 404);
    }

    const imagePaths = unique(
      [...identity.enrollments.map((item) => item.imagePath), ...events.map((item) => item.previewPath)].filter(
        (item): item is string => Boolean(item)
      )
    );
    const reason = input.reason?.trim() || 'Biometria facial excluída.';

    await prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({ where: { identityId: identity.id } });
      await tx.faceEnrollment.deleteMany({ where: { identityId: identity.id } });
      // os registros de entrada/saída ficam (histórico escolar), SEM a foto
      await tx.faceRecognitionEvent.updateMany({
        where: { id: { in: events.map((event) => event.id) } },
        data: { previewPath: null },
      });
      await tx.faceRecognitionIdentity.update({
        where: { id: identity.id },
        data: { status: FaceRecognitionIdentityStatus.PENDING, notes: reason },
      });
    });

    await Promise.allSettled(imagePaths.map((imagePath) => faceStorageService.deleteRelativePath(imagePath)));
    invalidateGallery(tenantId);

    await logFaceAccess({
      tenantId,
      actor: input.actor,
      action: 'DELETE',
      citizenId: input.citizenId,
      identityId: identity.id,
      details: { reason, enrollments: identity.enrollments.length, embeddings: identity.embeddings.length, images: imagePaths.length },
    });

    return {
      identityId: identity.id,
      citizenId: input.citizenId,
      deletedEnrollments: identity.enrollments.length,
      deletedEmbeddings: identity.embeddings.length,
      deletedImages: imagePaths.length,
      resetAt: new Date().toISOString(),
      reason,
    };
  }

  // ----- eventos da escola -----

  public async listEvents(
    tenantId: string,
    params: { unidadeEducacaoId?: string; zoneId?: string; matchStatus?: FaceMatchStatus; limit?: number }
  ) {
    const events = await prisma.faceRecognitionEvent.findMany({
      where: {
        tenantId,
        ...(params.unidadeEducacaoId ? { unidadeEducacaoId: params.unidadeEducacaoId } : {}),
        ...(params.zoneId ? { zoneId: params.zoneId } : {}),
        ...(params.matchStatus ? { matchStatus: params.matchStatus } : {}),
      },
      include: this.eventInclude(),
      orderBy: { recognizedAt: 'desc' },
      take: Math.min(Math.max(Number(params.limit) || 50, 1), 200),
    });
    return events.map((event) => this.serializeEvent(event));
  }

  /**
   * Portaria: uma foto da câmera -> cada rosto vira um registro. O reconhecimento
   * é SEMPRE feito aqui (antes dava para registrar "aluno entrou" informando só o
   * código do aluno, sem rosto, e o responsável era avisado).
   */
  public async ingestRecognition(tenantId: string, input: IngestInput) {
    const frame = assertFrames([input.frame], 1)[0];
    const device = await prisma.faceDevice.findFirst({ where: { id: input.deviceId, tenantId } });
    if (!device) throw faceError('Dispositivo facial não encontrado', 404);
    const zone = input.zoneId ? await prisma.faceZone.findFirst({ where: { id: input.zoneId, tenantId, deviceId: device.id } }) : null;
    if (input.zoneId && !zone) throw faceError('Zona não encontrada para este dispositivo', 404);

    const settings = await getEngineSettings();
    const analysis = await analyzeFrames([frame], { model: settings.recognitionModel, multi: true, maxFaces: 10 });
    const faces = analysis.frames[0]?.faces || [];
    if (faces.length === 0) {
      return { facesDetected: 0, events: [] };
    }

    const gallery = await this.loadGallery(tenantId, settings.recognitionModel, 'SCHOOL_SECURITY');
    const recognizedAt = new Date();
    const results = [];
    let previewPath: string | null = null;

    for (const face of faces) {
      const match = findBestMatch(normalize(face.embedding), gallery, settings);
      let status = match.status;
      let reviewReason = match.reviewReason;
      // foto/tela mostrada à câmera: não avisa o responsável sem alguém conferir
      if (status === 'MATCHED' && !face.spoof.isReal) {
        status = 'REVIEW_REQUIRED';
        reviewReason = 'Possível foto ou tela mostrada à câmera: confirme manualmente';
      }
      const citizenId = status === 'UNMATCHED' ? null : match.citizenId;

      const schoolContext = await this.resolveSchoolContext(tenantId, citizenId, zone?.unidadeEducacaoId || device.unidadeEducacaoId || null);
      const eventType = this.resolveEventType(input.eventType, zone?.direction || null, status);
      const dedupeKey = citizenId && eventType !== FaceEventType.UNMATCHED ? `${citizenId}:${zone?.id || device.id}:${eventType}` : null;

      if (dedupeKey) {
        const windowSecs = zone?.dedupeWindowSecs || schoolContext.configuration?.dedupeWindowSecs || 180;
        const duplicate = await prisma.faceRecognitionEvent.findFirst({
          where: { tenantId, dedupeKey, recognizedAt: { gte: new Date(recognizedAt.getTime() - windowSecs * 1000) } },
          include: this.eventInclude(),
          orderBy: { recognizedAt: 'desc' },
        });
        if (duplicate) {
          results.push({ duplicate: true, event: this.serializeEvent(duplicate) });
          continue;
        }
      }

      // a foto é guardada uma vez por leitura (e some pelo prazo de guarda)
      if (!previewPath) previewPath = await faceStorageService.persistBase64Image(tenantId, 'events', frame);

      const notificationStatus =
        schoolContext.guardianCitizenId && status === 'MATCHED' && (eventType === FaceEventType.ENTRY || eventType === FaceEventType.EXIT)
          ? GuardianNotificationStatus.PENDING
          : GuardianNotificationStatus.NOT_REQUIRED;

      const created = await prisma.faceRecognitionEvent.create({
        data: {
          tenantId,
          identityId: status === 'UNMATCHED' ? null : match.identityId,
          deviceId: device.id,
          zoneId: zone?.id || null,
          unidadeEducacaoId: schoolContext.unidadeEducacaoId,
          studentCitizenId: citizenId,
          guardianCitizenId: schoolContext.guardianCitizenId,
          type: eventType,
          matchStatus: status as FaceMatchStatus,
          confidence: Math.round(match.score * 1000) / 1000,
          provider: 'uniface',
          modelName: analysis.model.name,
          modelVersion: analysis.model.version,
          previewPath,
          boundingBox: face.bbox as unknown as Prisma.InputJsonValue,
          metadata: { spoofReal: face.spoof.isReal, recordedBy: input.actor.id || null } as Prisma.InputJsonValue,
          dedupeKey,
          reviewReason,
          notificationStatus,
          recognizedAt,
        },
        include: this.eventInclude(),
      });

      if (created.notificationStatus === GuardianNotificationStatus.PENDING) {
        await this.notifyGuardianForEvent(tenantId, created.id).catch(() => undefined);
      }
      results.push({ duplicate: false, event: this.serializeEvent(created) });
    }

    await logFaceAccess({
      tenantId,
      actor: input.actor,
      action: 'IDENTIFY',
      details: { deviceId: device.id, faces: faces.length, matched: results.filter((item) => item.event.matchStatus === 'MATCHED').length },
    });

    return { facesDetected: faces.length, events: results };
  }

  public async reviewEvent(tenantId: string, eventId: string, actor: FaceActor, decision: 'approve' | 'reject') {
    if (decision !== 'approve' && decision !== 'reject') throw faceError('Decisão inválida', 400);
    const event = await prisma.faceRecognitionEvent.findFirst({ where: { id: eventId, tenantId } });
    if (!event) throw faceError('Evento não encontrado', 404);
    if (event.matchStatus !== FaceMatchStatus.REVIEW_REQUIRED) {
      throw faceError('Só registros em revisão podem ser confirmados ou recusados.', 409);
    }

    const approve = decision === 'approve' && Boolean(event.studentCitizenId);
    const updated = await prisma.faceRecognitionEvent.update({
      where: { id: eventId },
      data: {
        matchStatus: approve ? FaceMatchStatus.MATCHED : FaceMatchStatus.UNMATCHED,
        type: approve && event.type === FaceEventType.REVIEW ? FaceEventType.DETECTION : event.type,
        ...(approve ? {} : { identityId: null, studentCitizenId: null, guardianCitizenId: null }),
        reviewedById: actor.id || null,
        reviewedAt: new Date(),
        reviewReason: approve ? null : 'Revisão manual recusou a identificação',
        notificationStatus:
          approve && event.guardianCitizenId && (event.type === FaceEventType.ENTRY || event.type === FaceEventType.EXIT)
            ? GuardianNotificationStatus.PENDING
            : GuardianNotificationStatus.NOT_REQUIRED,
      },
      include: { ...this.eventInclude(), reviewedBy: { select: { id: true, name: true } } },
    });

    await logFaceAccess({ tenantId, actor, action: 'EVENT_REVIEW', citizenId: event.studentCitizenId, details: { eventId, decision } });

    if (updated.notificationStatus === GuardianNotificationStatus.PENDING) {
      await this.notifyGuardianForEvent(tenantId, updated.id).catch(() => undefined);
    }
    return this.serializeEvent(updated);
  }

  // ----- fotos (só por dentro do backend, com registro) -----

  public async getMedia(tenantId: string, kind: 'enrollment' | 'event', id: string, actor: FaceActor) {
    const record =
      kind === 'enrollment'
        ? await prisma.faceEnrollment.findFirst({ where: { id, tenantId }, select: { imagePath: true, identity: { select: { citizenId: true } } } })
        : await prisma.faceRecognitionEvent.findFirst({ where: { id, tenantId }, select: { previewPath: true, studentCitizenId: true } });
    const relativePath = record ? ('imagePath' in record ? record.imagePath : record.previewPath) : null;
    if (!record || !relativePath) throw faceError('Foto não encontrada (pode ter sido apagada pelo prazo de guarda).', 404);

    const citizenId = 'identity' in record ? record.identity?.citizenId : (record as any).studentCitizenId;
    await logFaceAccess({ tenantId, actor, action: 'MEDIA_VIEW', citizenId, details: { kind, id } });
    return faceStorageService.readImage(relativePath);
  }

  public async listAccessLogs(tenantId: string, filters: { citizenId?: string; limit?: number }) {
    return listFaceAccess(tenantId, filters);
  }

  // -------------------------------------------------------------------------
  // Internos
  // -------------------------------------------------------------------------

  private async assertCitizen(tenantId: string, citizenId: string) {
    const citizen = await prisma.citizen.findFirst({ where: { id: citizenId, tenantId }, select: { id: true } });
    if (!citizen) throw faceError('Cidadão não encontrado neste município', 404);
  }

  /** Vetores do município para o modelo atual; com finalidade, só de quem consentiu */
  private async loadGallery(tenantId: string, modelName: string, purpose: FacePurpose | null): Promise<GalleryEntry[]> {
    const key = `${tenantId}:${modelName}:${purpose || 'all'}`;
    const cached = galleryCache.get(key);
    if (cached && Date.now() - cached.at < 60000) return cached.entries;

    const embeddings = await prisma.faceEmbedding.findMany({
      where: {
        tenantId,
        modelName,
        isActive: true,
        identity: { tenantId, status: FaceRecognitionIdentityStatus.ACTIVE, citizenId: { not: null } },
        OR: [{ enrollmentId: null }, { enrollment: { status: FaceEnrollmentStatus.APPROVED } }],
      },
      select: { identityId: true, vector: true, identity: { select: { citizenId: true } } },
    });

    const consented = purpose ? await citizenIdsWithConsent(tenantId, purpose) : null;
    const entries = embeddings
      .filter((item) => item.vector.length > 0 && (!consented || (item.identity.citizenId && consented.has(item.identity.citizenId))))
      .map((item) => ({ identityId: item.identityId, citizenId: item.identity.citizenId, vector: item.vector }));

    galleryCache.set(key, { at: Date.now(), entries });
    return entries;
  }

  private async assertIdentityCanEnroll(identityId: string) {
    const identity = await prisma.faceRecognitionIdentity.findUnique({
      where: { id: identityId },
      include: { enrollments: { orderBy: { createdAt: 'desc' }, take: 1 }, embeddings: { where: { isActive: true }, select: { modelName: true } } },
    });
    if (!identity) throw faceError('Identidade facial não encontrada.', 404);

    const settings = await getEngineSettings();
    const hasCurrent = identity.embeddings.some((embedding) => embedding.modelName === settings.recognitionModel);
    const latest = identity.enrollments[0];

    if (latest?.status === FaceEnrollmentStatus.PENDING) {
      throw faceError('Já existe uma biometria em análise para este cidadão.', 409);
    }
    if (hasCurrent) {
      throw faceError('Este cidadão já possui biometria facial ativa. Para refazer, exclua a atual primeiro.', 409);
    }
    // biometria só do motor antigo: pode cadastrar de novo (a antiga é substituída)
    if (identity.embeddings.length > 0) {
      await prisma.faceEmbedding.deleteMany({ where: { identityId, modelName: { not: settings.recognitionModel } } });
    }
  }

  private async ensureIdentityForCitizen(tenantId: string, citizenId: string) {
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, tenantId },
      select: { id: true, cpf: true, name: true, email: true, phone: true, rg: true, birthDate: true, isActive: true, personId: true },
    });
    if (!citizen) throw faceError('Cidadão não encontrado neste município', 404);

    const byCitizen = await prisma.faceRecognitionIdentity.findUnique({ where: { citizenId: citizen.id } });
    if (byCitizen) {
      if (byCitizen.tenantId !== tenantId) {
        return prisma.faceRecognitionIdentity.update({ where: { id: byCitizen.id }, data: { tenantId } });
      }
      return byCitizen;
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

    const samePerson = await prisma.faceRecognitionIdentity.findFirst({ where: { tenantId, personId } });
    if (samePerson) {
      return prisma.faceRecognitionIdentity.update({ where: { id: samePerson.id }, data: { citizenId: citizen.id } });
    }

    return prisma.faceRecognitionIdentity.create({
      data: { tenantId, personId, citizenId: citizen.id, label: citizen.name, status: FaceRecognitionIdentityStatus.PENDING },
    });
  }

  private resolveEventType(explicitType: IngestInput['eventType'], zoneDirection: 'ENTRY' | 'EXIT' | 'BOTH' | null, status: string) {
    if (status === 'REVIEW_REQUIRED') return FaceEventType.REVIEW;
    if (status === 'UNMATCHED') return FaceEventType.UNMATCHED;
    if (explicitType === 'ENTRY' || explicitType === 'EXIT' || explicitType === 'DETECTION') return explicitType as FaceEventType;
    if (zoneDirection === 'ENTRY') return FaceEventType.ENTRY;
    if (zoneDirection === 'EXIT') return FaceEventType.EXIT;
    return FaceEventType.DETECTION;
  }

  private async resolveSchoolContext(tenantId: string, citizenId: string | null, unidadeEducacaoId: string | null) {
    const matricula = citizenId
      ? await prisma.matricula.findFirst({
          where: { tenantId, alunoId: citizenId, situacao: SituacaoMatricula.ATIVA, ...(unidadeEducacaoId ? { unidadeEducacaoId } : {}) },
          orderBy: { updatedAt: 'desc' },
        })
      : null;
    const finalSchoolId = unidadeEducacaoId || matricula?.unidadeEducacaoId || null;
    const configuration = finalSchoolId
      ? await prisma.schoolSecurityConfiguration.findUnique({ where: { unidadeEducacaoId: finalSchoolId } })
      : null;
    return { unidadeEducacaoId: finalSchoolId, guardianCitizenId: matricula?.responsavelId || null, configuration };
  }

  private async notifyGuardianForEvent(tenantId: string, eventId: string) {
    const event = await prisma.faceRecognitionEvent.findFirst({
      where: { id: eventId, tenantId },
      include: { zone: true, device: true, unidadeEducacao: true, studentCitizen: true, guardianCitizen: true },
    });
    const markNotRequired = async () => {
      if (event) await prisma.faceRecognitionEvent.update({ where: { id: event.id }, data: { notificationStatus: GuardianNotificationStatus.NOT_REQUIRED } });
    };

    if (!event || !event.guardianCitizenId || !event.guardianCitizen || !event.studentCitizen) return markNotRequired();
    if (event.type !== FaceEventType.ENTRY && event.type !== FaceEventType.EXIT) return markNotRequired();

    const configuration = event.unidadeEducacaoId
      ? await prisma.schoolSecurityConfiguration.findUnique({ where: { unidadeEducacaoId: event.unidadeEducacaoId } })
      : null;
    if (configuration?.isActive === false) return markNotRequired();
    if (event.type === FaceEventType.ENTRY && configuration && !configuration.notifyOnEntry) return markNotRequired();
    if (event.type === FaceEventType.EXIT && configuration && !configuration.notifyOnExit) return markNotRequired();

    const variables = {
      aluno: event.studentCitizen.name,
      escola: event.unidadeEducacao?.nome || 'Unidade escolar',
      local: event.zone?.gateName || event.zone?.name || event.device.name,
      horario: formatDateTime(event.recognizedAt),
    };
    const isEntry = event.type === FaceEventType.ENTRY;
    const message =
      renderTemplate(isEntry ? configuration?.entryMessageTemplate : configuration?.exitMessageTemplate, variables) ||
      (isEntry
        ? `${variables.aluno} entrou em ${variables.escola} às ${variables.horario}. Local: ${variables.local}.`
        : `${variables.aluno} saiu de ${variables.escola} às ${variables.horario}. Local: ${variables.local}.`);

    const savedChannel = configuration?.preferredChannel || 'chat';
    const preferredChannel = (savedChannel === 'whatsapp' ? 'chat' : savedChannel) as 'web' | 'push' | 'email' | 'sms' | 'chat';
    const channels = Array.from(new Set<typeof preferredChannel>([preferredChannel, 'web']));

    try {
      await digiUrbanIntegration.dispatchNotification(tenantId, {
        recipientType: 'citizen',
        recipientId: event.guardianCitizenId,
        type: isEntry ? 'STUDENT_ENTRY' : 'STUDENT_EXIT',
        title: isEntry ? 'Aluno identificado na entrada' : 'Aluno identificado na saída',
        message,
        channels,
        priority: 'high',
        data: {
          eventId: event.id,
          studentCitizenId: event.studentCitizenId,
          schoolId: event.unidadeEducacaoId,
          schoolName: event.unidadeEducacao?.nome || null,
          eventType: event.type,
          recognizedAt: event.recognizedAt.toISOString(),
        },
      });
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: { notificationStatus: GuardianNotificationStatus.SENT, notificationAttempts: { increment: 1 }, lastNotificationError: null },
      });
    } catch (error: any) {
      await prisma.faceRecognitionEvent.update({
        where: { id: event.id },
        data: {
          notificationStatus: GuardianNotificationStatus.FAILED,
          notificationAttempts: { increment: 1 },
          lastNotificationError: error?.message || 'Falha ao enviar aviso',
        },
      });
      throw error;
    }
  }

  private eventInclude() {
    return {
      device: { select: { id: true, name: true, code: true } },
      zone: { select: { id: true, name: true, gateName: true, direction: true } },
      unidadeEducacao: { select: { id: true, nome: true } },
      studentCitizen: { select: { id: true, name: true } },
      guardianCitizen: { select: { id: true, name: true } },
    } as const;
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
    const { previewPath, metadata, dedupeKey, boundingBox, ...rest } = event;
    return {
      ...rest,
      citizenId: event.studentCitizenId,
      citizen: event.studentCitizen || null,
      hasPreview: Boolean(previewPath),
      spoofSuspect: metadata && typeof metadata === 'object' ? (metadata as any).spoofReal === false : false,
    };
  }
}

function maskCpf(cpf: string | null | undefined) {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return null;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export default new FacePlatformService();
