import {
  Citizen,
  CitizenDocument,
  FaceEnrollmentStatus,
  FaceRecognitionIdentityStatus,
  Prisma,
  type VerificationStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import notificationService from './notification.service';

/**
 * Aviso de nível pelo serviço central (sino + push + e-mail). Antes era só uma
 * linha gravada direto no banco: o cidadão nunca recebia e-mail nem push.
 * Nunca falha quem chamou.
 */
export async function notifyCitizenLevel(
  citizenId: string,
  type: 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED' | 'VERIFICATION_UPGRADED' | 'VERIFICATION_REVIEW' | 'FACE_BIOMETRY_CONFIRMED',
  title: string,
  message: string
): Promise<void> {
  try {
    await notificationService.notify({
      recipientType: 'citizen',
      recipientId: citizenId,
      type,
      title,
      message,
      data: { actionUrl: '/cidadao/perfil' },
    });
  } catch (error) {
    console.warn('[citizen-verification] aviso de nível não enviado:', error instanceof Error ? error.message : error);
  }
}

export type RegistrationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export const GOLD_REQUIREMENTS = {
  // Sem o CPF como documento separado: o RG novo, a CIN e a CNH já trazem o
  // CPF, e a leitura automática confere o número com o cadastro
  requiredTypes: ['rg_frente', 'rg_verso', 'comprovante_residencia'],
  minApprovedCount: 3,
  expirationDays: {
    comprovante_residencia: 90,
    comprovante_renda: 60,
    default: 365,
  },
} as const;

const PERSONAL_DOCUMENT_WHERE: Prisma.CitizenDocumentWhereInput = {
  AND: [
    {
      OR: [{ sourceType: null }, { sourceType: 'UPLOAD' }],
    },
    {
      NOT: {
        documentType: {
          startsWith: 'Protocolo:',
        },
      },
    },
  ],
};

const REQUIRED_PROFILE_FIELDS = [
  { key: 'name', label: 'Nome completo' },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail' },
  { key: 'birthDate', label: 'Data de nascimento' },
  { key: 'rg', label: 'RG' },
  { key: 'motherName', label: 'Nome da mãe' },
] as const;

interface CitizenProfileSnapshot {
  name: string | null;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  birthDate: Date | null;
  rg: string | null;
  motherName: string | null;
  address: any;
}

export interface FaceBiometryStatus {
  hasIdentity: boolean;
  confirmed: boolean;
  approvedEnrollments: number;
  pendingEnrollments: number;
  rejectedEnrollments: number;
  totalEmbeddings: number;
  latestEnrollmentStatus: FaceEnrollmentStatus | null;
  latestCapturedAt: string | null;
}

export interface GoldEligibilityResult {
  eligible: boolean;
  approvedDocs: CitizenDocument[];
  missingTypes: string[];
  missingProfileFields: string[];
  profileComplete: boolean;
  biometric: FaceBiometryStatus;
  currentStatus: string;
  reason?: string;
}

export interface PromotionResult {
  success: boolean;
  citizen: Citizen;
  previousStatus: string;
  newStatus: string;
  message: string;
}

export interface CitizenAccessLevelSummary {
  currentStatus: VerificationStatus;
  currentLevel: RegistrationLevel;
  nextLevel: RegistrationLevel | null;
  profileComplete: boolean;
  missingProfileFields: string[];
  silverCriteria: {
    profileComplete: boolean;
    missingProfileFields: string[];
    adminReviewRequired: boolean;
  };
  goldCriteria: {
    eligible: boolean;
    approvedDocsCount: number;
    requiredDocCount: number;
    missingDocumentTypes: string[];
    profileComplete: boolean;
    missingProfileFields: string[];
    biometricConfirmed: boolean;
    biometric: FaceBiometryStatus;
    reason?: string;
  };
}

function mapVerificationStatusToLevel(status: VerificationStatus): RegistrationLevel {
  if (status === 'GOLD') return 'GOLD';
  if (status === 'VERIFIED') return 'SILVER';
  return 'BRONZE';
}

function getNextLevel(currentStatus: VerificationStatus): RegistrationLevel | null {
  if (currentStatus === 'PENDING' || currentStatus === 'REJECTED') {
    return 'SILVER';
  }

  if (currentStatus === 'VERIFIED') {
    return 'GOLD';
  }

  return null;
}

function isFilled(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function getMissingProfileFields(citizen: CitizenProfileSnapshot): string[] {
  const missingFields: string[] = REQUIRED_PROFILE_FIELDS
    .filter((field) => !isFilled(citizen[field.key]))
    .map((field) => field.label);

  if (!isFilled(citizen.phone) && !isFilled(citizen.phoneSecondary)) {
    missingFields.push('Telefone principal ou secundário');
  }

  const address = citizen.address && typeof citizen.address === 'object' ? citizen.address : {};
  const hasAddress =
    isFilled(address.cep) &&
    isFilled(address.logradouro) &&
    isFilled(address.numero) &&
    isFilled(address.bairro) &&
    isFilled(address.cidade) &&
    isFilled(address.uf);

  if (!hasAddress) {
    missingFields.push('Endereço completo');
  }

  return missingFields;
}

function isDocumentExpired(document: CitizenDocument): boolean {
  const expirationConfig = GOLD_REQUIREMENTS.expirationDays as Record<string, number>;
  const expirationDays = expirationConfig[document.documentType] || expirationConfig.default;

  const uploadDate = new Date(document.uploadedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff > expirationDays;
}

function buildBiometricStatus(faceIdentity?: {
  enrollments: Array<{
    status: FaceEnrollmentStatus;
    capturedAt: Date;
  }>;
  embeddings: Array<{ id: string; isActive: boolean }>;
} | null): FaceBiometryStatus {
  const enrollments = faceIdentity?.enrollments || [];
  const approvedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'APPROVED').length;
  const pendingEnrollments = enrollments.filter((enrollment) => enrollment.status === 'PENDING').length;
  const rejectedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'REJECTED').length;
  const latestEnrollment = enrollments[0];
  const totalEmbeddings = (faceIdentity?.embeddings || []).filter((embedding) => embedding.isActive).length;

  return {
    hasIdentity: Boolean(faceIdentity),
    confirmed: approvedEnrollments > 0 && totalEmbeddings > 0,
    approvedEnrollments,
    pendingEnrollments,
    rejectedEnrollments,
    totalEmbeddings,
    latestEnrollmentStatus: latestEnrollment?.status || null,
    latestCapturedAt: latestEnrollment?.capturedAt?.toISOString() || null,
  };
}

export function getDocumentLabel(type: string): string {
  const labels: Record<string, string> = {
    rg_frente: 'RG (frente)',
    rg_verso: 'RG (verso)',
    cpf: 'CPF',
    comprovante_residencia: 'Comprovante de residência',
    certidao_nascimento: 'Certidão de nascimento',
    certidao_casamento: 'Certidão de casamento',
    titulo_eleitor: 'Título de eleitor',
    carteira_trabalho: 'Carteira de trabalho',
    comprovante_renda: 'Comprovante de renda',
    declaracao_escolar: 'Declaração escolar',
    cartao_sus: 'Cartão do SUS',
    laudo_medico: 'Laudo médico',
    outro: 'Outro documento',
  };

  return labels[type] || type;
}

type GoldCitizen = CitizenProfileSnapshot & { verificationStatus: VerificationStatus; isActive: boolean };
type GoldFaceIdentity = Parameters<typeof buildBiometricStatus>[0];

const GOLD_CITIZEN_SELECT = {
  id: true,
  name: true,
  cpf: true,
  email: true,
  phone: true,
  phoneSecondary: true,
  birthDate: true,
  rg: true,
  motherName: true,
  address: true,
  verificationStatus: true,
  isActive: true,
} as const;

/** Regra do Ouro sem banco (a mesma para um cidadão ou para a lista inteira) */
function evaluateGold(citizen: GoldCitizen, documents: CitizenDocument[], faceIdentity: GoldFaceIdentity): GoldEligibilityResult {
  const missingProfileFields = getMissingProfileFields(citizen);
  const profileComplete = missingProfileFields.length === 0;
  const biometric = buildBiometricStatus(faceIdentity);

  if (citizen.verificationStatus === 'GOLD') {
    return {
      eligible: false,
      approvedDocs: documents,
      missingTypes: [],
      missingProfileFields,
      profileComplete,
      biometric,
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão já possui nível ouro',
    };
  }

  if (citizen.verificationStatus !== 'VERIFIED') {
    return {
      eligible: false,
      approvedDocs: documents,
      missingTypes: [...GOLD_REQUIREMENTS.requiredTypes],
      missingProfileFields,
      profileComplete,
      biometric,
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão precisa estar no nível prata para ser promovido ao ouro',
    };
  }

  if (!citizen.isActive) {
    return {
      eligible: false,
      approvedDocs: documents,
      missingTypes: [...GOLD_REQUIREMENTS.requiredTypes],
      missingProfileFields,
      profileComplete,
      biometric,
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão está inativo',
    };
  }

  const validDocs = documents.filter((document: CitizenDocument) => !isDocumentExpired(document));
  const approvedTypes = validDocs.map((document) => document.documentType);
  const missingTypes = GOLD_REQUIREMENTS.requiredTypes.filter((type) => !approvedTypes.includes(type));

  const hasAllRequiredDocs = missingTypes.length === 0;
  const hasMinApprovedDocs = validDocs.length >= GOLD_REQUIREMENTS.minApprovedCount;
  const biometricConfirmed = biometric.confirmed;
  const eligible = profileComplete && hasAllRequiredDocs && hasMinApprovedDocs && biometricConfirmed;

  let reason = 'Todos os critérios foram atendidos';

  if (!profileComplete) {
    reason = `Perfil incompleto: ${missingProfileFields.join(', ')}`;
  } else if (!hasAllRequiredDocs) {
    reason = `Documentos faltando: ${missingTypes.map((type) => getDocumentLabel(type)).join(', ')}`;
  } else if (!hasMinApprovedDocs) {
    reason = `Mínimo de ${GOLD_REQUIREMENTS.minApprovedCount} documentos aprovados necessários (atual: ${validDocs.length})`;
  } else if (!biometricConfirmed) {
    reason = biometric.pendingEnrollments > 0
      ? 'A biometria facial foi enviada, mas ainda depende de confirmação do servidor'
      : 'É necessário cadastrar e confirmar a biometria facial para alcançar o nível ouro';
  }

  return {
    eligible,
    approvedDocs: validDocs,
    missingTypes,
    missingProfileFields,
    profileComplete,
    biometric,
    currentStatus: citizen.verificationStatus,
    reason,
  };
}

export async function checkGoldEligibility(citizenId: string): Promise<GoldEligibilityResult> {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    select: GOLD_CITIZEN_SELECT,
  });

  if (!citizen) {
    return {
      eligible: false,
      approvedDocs: [],
      missingTypes: [...GOLD_REQUIREMENTS.requiredTypes],
      missingProfileFields: [...REQUIRED_PROFILE_FIELDS.map((field) => field.label), 'Telefone principal ou secundário', 'Endereço completo'],
      profileComplete: false,
      biometric: buildBiometricStatus(null),
      currentStatus: 'UNKNOWN',
      reason: 'Cidadão não encontrado',
    };
  }

  const [documents, faceIdentity] = await Promise.all([
    prisma.citizenDocument.findMany({
      where: {
        citizenId,
        status: 'APPROVED',
        ...PERSONAL_DOCUMENT_WHERE,
      },
    }),
    prisma.faceRecognitionIdentity.findFirst({
      where: { citizenId },
      include: {
        enrollments: {
          orderBy: { createdAt: 'desc' },
        },
        embeddings: {
          where: { isActive: true },
        },
      },
    }),
  ]);

  return evaluateGold(citizen, documents, faceIdentity);
}

/**
 * Avalia o Ouro de vários cidadãos com 3 consultas no total (antes eram 3 por
 * cidadão — a tela de documentos ficava cada vez mais lenta).
 */
async function evaluateGoldForPrata(): Promise<Array<{ citizen: { id: string; name: string; cpf: string; email: string; verificationStatus: VerificationStatus }; result: GoldEligibilityResult }>> {
  const citizens = await prisma.citizen.findMany({
    where: { verificationStatus: 'VERIFIED', isActive: true },
    select: GOLD_CITIZEN_SELECT,
  });
  if (citizens.length === 0) return [];
  const ids = citizens.map((citizen) => citizen.id);
  const [documents, identities] = await Promise.all([
    prisma.citizenDocument.findMany({
      where: { citizenId: { in: ids }, status: 'APPROVED', ...PERSONAL_DOCUMENT_WHERE },
    }),
    prisma.faceRecognitionIdentity.findMany({
      where: { citizenId: { in: ids } },
      include: {
        enrollments: { orderBy: { createdAt: 'desc' } },
        embeddings: { where: { isActive: true } },
      },
    }),
  ]);
  const docsByCitizen = new Map<string, CitizenDocument[]>();
  for (const document of documents) {
    const list = docsByCitizen.get(document.citizenId) || [];
    list.push(document);
    docsByCitizen.set(document.citizenId, list);
  }
  const identityByCitizen = new Map(identities.map((identity) => [identity.citizenId, identity]));
  return citizens.map((citizen) => ({
    citizen: { id: citizen.id, name: citizen.name, cpf: citizen.cpf, email: citizen.email, verificationStatus: citizen.verificationStatus },
    result: evaluateGold(citizen, docsByCitizen.get(citizen.id) || [], identityByCitizen.get(citizen.id) || null),
  }));
}

export async function getCitizenAccessLevelSummary(citizenId: string): Promise<CitizenAccessLevelSummary> {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    select: {
      id: true,
      verificationStatus: true,
      name: true,
      cpf: true,
      email: true,
      phone: true,
      phoneSecondary: true,
      birthDate: true,
      rg: true,
      motherName: true,
      address: true,
    },
  });

  if (!citizen) {
    throw new Error('Cidadão não encontrado');
  }

  const missingProfileFields = getMissingProfileFields(citizen);
  const profileComplete = missingProfileFields.length === 0;
  const eligibility = await checkGoldEligibility(citizenId);

  return {
    currentStatus: citizen.verificationStatus,
    currentLevel: mapVerificationStatusToLevel(citizen.verificationStatus),
    nextLevel: getNextLevel(citizen.verificationStatus),
    profileComplete,
    missingProfileFields,
    silverCriteria: {
      profileComplete,
      missingProfileFields,
      adminReviewRequired: citizen.verificationStatus !== 'VERIFIED' && citizen.verificationStatus !== 'GOLD',
    },
    goldCriteria: {
      eligible: eligibility.eligible,
      approvedDocsCount: eligibility.approvedDocs.length,
      requiredDocCount: GOLD_REQUIREMENTS.minApprovedCount,
      missingDocumentTypes: eligibility.missingTypes,
      profileComplete: eligibility.profileComplete,
      missingProfileFields: eligibility.missingProfileFields,
      biometricConfirmed: eligibility.biometric.confirmed,
      biometric: eligibility.biometric,
      reason: eligibility.reason,
    },
  };
}

export async function autoPromoteToGold(
  citizenId: string,
  approvedBy?: string | null
): Promise<PromotionResult> {
  const eligibility = await checkGoldEligibility(citizenId);

  if (!eligibility.eligible) {
    throw new Error(`Cidadão não elegível para promoção: ${eligibility.reason}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentCitizen = await tx.citizen.findUnique({
      where: { id: citizenId },
    });

    if (!currentCitizen) {
      throw new Error('Cidadão não encontrado');
    }

    const previousStatus = currentCitizen.verificationStatus;

    const promotedCitizen = await tx.citizen.update({
      where: { id: citizenId },
      data: {
        verificationStatus: 'GOLD',
        verifiedAt: new Date(),
        verifiedBy: approvedBy || null,
        verificationNotes:
          'Promovido para o nível ouro após validação do perfil, documentos obrigatórios e biometria facial confirmada',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: approvedBy || null,
        citizenId,
        action: 'CITIZEN_PROMOTED_TO_GOLD',
        resource: 'CITIZEN',
        details: {
          promotionReason: 'PROFILE_DOCUMENTS_AND_FACE_BIOMETRY_CONFIRMED',
          previousStatus,
          newStatus: 'GOLD',
          promotedAt: new Date().toISOString(),
          approvedDocuments: eligibility.approvedDocs.map((document) => ({
            id: document.id,
            type: document.documentType,
            fileName: document.fileName,
          })),
          biometric: {
            hasIdentity: eligibility.biometric.hasIdentity,
            confirmed: eligibility.biometric.confirmed,
            approvedEnrollments: eligibility.biometric.approvedEnrollments,
            pendingEnrollments: eligibility.biometric.pendingEnrollments,
            rejectedEnrollments: eligibility.biometric.rejectedEnrollments,
            totalEmbeddings: eligibility.biometric.totalEmbeddings,
            latestEnrollmentStatus: eligibility.biometric.latestEnrollmentStatus,
            latestCapturedAt: eligibility.biometric.latestCapturedAt,
          },
        } as Prisma.InputJsonObject,
      },
    });

    return {
      success: true,
      citizen: promotedCitizen,
      previousStatus,
      newStatus: 'GOLD',
      message: 'Cidadão promovido para o nível ouro com sucesso',
    };
  });

  await notifyCitizenLevel(
    citizenId,
    'VERIFICATION_UPGRADED',
    'Seu cadastro chegou ao nível Ouro',
    'Seus documentos, seu perfil e sua biometria facial foram confirmados. Agora você pode usar todos os serviços que pedem nível Ouro.'
  );

  return result;
}

export async function approveLatestPendingFaceEnrollment(
  citizenId: string,
  approvedById: string
): Promise<{
  enrollmentId: string;
  promotedToGold: boolean;
  promotionMessage?: string;
  eligibility: GoldEligibilityResult;
}> {
  const identity = await prisma.faceRecognitionIdentity.findFirst({
    where: { citizenId },
    include: {
      enrollments: {
        orderBy: { createdAt: 'desc' },
        include: {
          embeddings: true,
        },
      },
      embeddings: {
        where: { isActive: true },
      },
    },
  });

  if (!identity) {
    throw new Error('Nenhuma identidade facial foi encontrada para este cidadão');
  }

  const latestPendingEnrollment = identity.enrollments.find((enrollment) => enrollment.status === 'PENDING');

  if (!latestPendingEnrollment) {
    throw new Error('Não existe biometria facial pendente para confirmação');
  }

  await prisma.$transaction(async (tx) => {
    await tx.faceEnrollment.update({
      where: { id: latestPendingEnrollment.id },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      },
    });

    await tx.faceRecognitionIdentity.update({
      where: { id: identity.id },
      data: {
        status:
          identity.embeddings.length > 0 || latestPendingEnrollment.embeddings.length > 0
            ? FaceRecognitionIdentityStatus.ACTIVE
            : FaceRecognitionIdentityStatus.REVIEW,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: approvedById,
        citizenId,
        action: 'CITIZEN_FACE_ENROLLMENT_APPROVED',
        resource: 'FACE_ENROLLMENT',
        details: {
          enrollmentId: latestPendingEnrollment.id,
          identityId: identity.id,
        },
      },
    });
  });

  await notifyCitizenLevel(
    citizenId,
    'FACE_BIOMETRY_CONFIRMED',
    'Biometria facial confirmada',
    'Um servidor da prefeitura confirmou a sua biometria facial.'
  );

  const eligibility = await checkGoldEligibility(citizenId);
  let promotedToGold = false;
  let promotionMessage: string | undefined;

  if (eligibility.eligible) {
    const promotion = await autoPromoteToGold(citizenId, approvedById);
    promotedToGold = promotion.success;
    promotionMessage = promotion.message;
  }

  return {
    enrollmentId: latestPendingEnrollment.id,
    promotedToGold,
    promotionMessage,
    eligibility,
  };
}

export async function getDocumentStats() {
  const [pending, underReview, approved, rejected] = await Promise.all([
    prisma.citizenDocument.count({ where: { status: 'PENDING', ...PERSONAL_DOCUMENT_WHERE } }),
    prisma.citizenDocument.count({ where: { status: 'UNDER_REVIEW', ...PERSONAL_DOCUMENT_WHERE } }),
    prisma.citizenDocument.count({ where: { status: 'APPROVED', ...PERSONAL_DOCUMENT_WHERE } }),
    prisma.citizenDocument.count({ where: { status: 'REJECTED', ...PERSONAL_DOCUMENT_WHERE } }),
  ]);

  const eligibleForGold = (await evaluateGoldForPrata()).filter((item) => item.result.eligible).length;

  return {
    pending,
    underReview,
    approved,
    rejected,
    total: pending + underReview + approved + rejected,
    eligibleForGold,
  };
}

export async function getEligibleCitizensForGold() {
  return (await evaluateGoldForPrata())
    .filter((item) => item.result.eligible)
    .map(({ citizen, result }) => ({
      citizen,
      approvedDocsCount: result.approvedDocs.length,
      biometric: result.biometric,
      missingTypes: result.missingTypes,
      missingProfileFields: result.missingProfileFields,
    }));
}
