import {
  Citizen,
  CitizenDocument,
  FaceEnrollmentStatus,
  FaceRecognitionIdentityStatus,
  Prisma,
  type VerificationStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';

export type RegistrationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export const GOLD_REQUIREMENTS = {
  requiredTypes: ['rg_frente', 'rg_verso', 'cpf', 'comprovante_residencia'],
  minApprovedCount: 4,
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

function getMissingProfileFields(citizen: CitizenProfileSnapshot): string[] {
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

export async function checkGoldEligibility(citizenId: string): Promise<GoldEligibilityResult> {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
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

export async function autoPromoteToGold(citizenId: string, approvedBy: string): Promise<PromotionResult> {
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
        verifiedBy: approvedBy,
        verificationNotes:
          'Promovido para o nível ouro após validação do perfil, documentos obrigatórios e biometria facial confirmada',
      },
    });

    await tx.notification.create({
      data: {
        citizenId,
        title: 'Cadastro promovido para Ouro',
        message:
          'Seu cadastro agora está no nível Ouro. Os documentos obrigatórios, o perfil e a biometria facial foram confirmados.',
        type: 'VERIFICATION_UPGRADED',
        isRead: false,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: approvedBy,
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

    await tx.notification.create({
      data: {
        citizenId,
        title: 'Biometria facial confirmada',
        message:
          'Sua biometria facial foi validada por um servidor e já pode ser usada nas funcionalidades do ecossistema Digiurban.',
        type: 'SUCCESS',
        isRead: false,
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

  const verifiedCitizens = await prisma.citizen.findMany({
    where: { verificationStatus: 'VERIFIED' },
    select: { id: true },
  });

  let eligibleForGold = 0;

  for (const citizen of verifiedCitizens) {
    const result = await checkGoldEligibility(citizen.id);
    if (result.eligible) {
      eligibleForGold += 1;
    }
  }

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
  const verifiedCitizens = await prisma.citizen.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      cpf: true,
      email: true,
      verificationStatus: true,
    },
  });

  const eligible = [];

  for (const citizen of verifiedCitizens) {
    const result = await checkGoldEligibility(citizen.id);
    if (result.eligible) {
      eligible.push({
        citizen,
        approvedDocsCount: result.approvedDocs.length,
        biometric: result.biometric,
        missingTypes: result.missingTypes,
        missingProfileFields: result.missingProfileFields,
      });
    }
  }

  return eligible;
}
