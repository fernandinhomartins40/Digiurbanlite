// ============================================================================
// CITIZEN-VERIFICATION.SERVICE.TS - Serviço de Verificação e Promoção de Cidadãos
// ============================================================================

import { prisma } from '../lib/prisma';
import { CitizenDocument, Citizen } from '@prisma/client';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

/**
 * Requisitos para promoção ao nível GOLD (Ouro)
 */
export const GOLD_REQUIREMENTS = {
  // Tipos de documentos obrigatórios
  requiredTypes: ['rg_frente', 'rg_verso', 'cpf', 'comprovante_residencia'],

  // Número mínimo de documentos aprovados
  minApprovedCount: 4,

  // Tempo de validade de documentos (em dias)
  expirationDays: {
    comprovante_residencia: 90,  // 3 meses
    comprovante_renda: 60,        // 2 meses
    default: 365                  // 1 ano
  }
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface GoldEligibilityResult {
  eligible: boolean;
  approvedDocs: CitizenDocument[];
  missingTypes: string[];
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

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se um documento está expirado
 */
function isDocumentExpired(document: CitizenDocument): boolean {
  const expirationDays = GOLD_REQUIREMENTS.expirationDays[document.documentType]
    || GOLD_REQUIREMENTS.expirationDays.default;

  const uploadDate = new Date(document.uploadedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff > expirationDays;
}

/**
 * Obtém label amigável do tipo de documento
 */
export function getDocumentLabel(type: string): string {
  const labels: Record<string, string> = {
    rg_frente: 'RG (Frente)',
    rg_verso: 'RG (Verso)',
    cpf: 'CPF',
    comprovante_residencia: 'Comprovante de Residência',
    certidao_nascimento: 'Certidão de Nascimento',
    certidao_casamento: 'Certidão de Casamento',
    titulo_eleitor: 'Título de Eleitor',
    carteira_trabalho: 'Carteira de Trabalho',
    comprovante_renda: 'Comprovante de Renda',
    declaracao_escolar: 'Declaração Escolar',
    cartao_sus: 'Cartão do SUS',
    laudo_medico: 'Laudo Médico',
    outro: 'Outro Documento'
  };

  return labels[type] || type;
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Verifica se um cidadão está elegível para promoção ao nível GOLD
 */
export async function checkGoldEligibility(
  citizenId: string
): Promise<GoldEligibilityResult> {
  // 1. Buscar cidadão
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    include: {
      documents: {
        where: {
          status: 'APPROVED'
        }
      }
    }
  });

  if (!citizen) {
    return {
      eligible: false,
      approvedDocs: [],
      missingTypes: GOLD_REQUIREMENTS.requiredTypes,
      currentStatus: 'UNKNOWN',
      reason: 'Cidadão não encontrado'
    };
  }

  // 2. Verificar se já é GOLD
  if (citizen.verificationStatus === 'GOLD') {
    return {
      eligible: false,
      approvedDocs: citizen.documents,
      missingTypes: [],
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão já possui nível GOLD'
    };
  }

  // 3. Verificar se está em VERIFIED (Prata) - requisito para GOLD
  if (citizen.verificationStatus !== 'VERIFIED') {
    return {
      eligible: false,
      approvedDocs: citizen.documents,
      missingTypes: GOLD_REQUIREMENTS.requiredTypes,
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão precisa estar no nível VERIFIED (Prata) para ser promovido'
    };
  }

  // 4. Verificar se cidadão está ativo
  if (!citizen.isActive) {
    return {
      eligible: false,
      approvedDocs: citizen.documents,
      missingTypes: GOLD_REQUIREMENTS.requiredTypes,
      currentStatus: citizen.verificationStatus,
      reason: 'Cidadão está inativo'
    };
  }

  // 5. Filtrar documentos não expirados
  const validDocs = citizen.documents.filter(doc => !isDocumentExpired(doc));

  // 6. Verificar tipos obrigatórios
  const approvedTypes = validDocs.map(d => d.documentType);
  const missingTypes = GOLD_REQUIREMENTS.requiredTypes.filter(
    type => !approvedTypes.includes(type)
  );

  // 7. Verificar contagem mínima
  const hasAllRequired = missingTypes.length === 0;
  const hasMinCount = validDocs.length >= GOLD_REQUIREMENTS.minApprovedCount;

  const eligible = hasAllRequired && hasMinCount;

  let reason = '';
  if (!hasAllRequired) {
    const missing = missingTypes.map(t => getDocumentLabel(t)).join(', ');
    reason = `Documentos faltando: ${missing}`;
  } else if (!hasMinCount) {
    reason = `Mínimo de ${GOLD_REQUIREMENTS.minApprovedCount} documentos aprovados necessários (atual: ${validDocs.length})`;
  }

  return {
    eligible,
    approvedDocs: validDocs,
    missingTypes,
    currentStatus: citizen.verificationStatus,
    reason: eligible ? 'Todos os requisitos atendidos' : reason
  };
}

/**
 * Promove um cidadão automaticamente para o nível GOLD
 */
export async function autoPromoteToGold(
  citizenId: string,
  approvedBy: string
): Promise<PromotionResult> {
  // 1. Verificar elegibilidade primeiro
  const eligibility = await checkGoldEligibility(citizenId);

  if (!eligibility.eligible) {
    throw new Error(`Cidadão não elegível para promoção: ${eligibility.reason}`);
  }

  // 2. Realizar promoção em transação
  const result = await prisma.$transaction(async (tx) => {
    // 2.1. Buscar cidadão atual
    const currentCitizen = await tx.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!currentCitizen) {
      throw new Error('Cidadão não encontrado');
    }

    const previousStatus = currentCitizen.verificationStatus;

    // 2.2. Promover cidadão
    const promotedCitizen = await tx.citizen.update({
      where: { id: citizenId },
      data: {
        verificationStatus: 'GOLD',
        verifiedAt: new Date(),
        verifiedBy: approvedBy,
        verificationNotes: 'Promovido automaticamente após aprovação de todos os documentos obrigatórios'
      }
    });

    // 2.3. Criar notificação para o cidadão
    await tx.notification.create({
      data: {
        citizenId,
        title: 'Cadastro Promovido para Ouro! 🥇',
        message: `Parabéns! Todos os seus documentos foram aprovados e seu cadastro foi promovido para o nível OURO. Agora você tem acesso prioritário máximo a todos os serviços e programas municipais.`,
        type: 'VERIFICATION_UPGRADED',
        isRead: false
      }
    });

    // 2.4. Criar log de auditoria
    await tx.auditLog.create({
      data: {
        action: 'CITIZEN_PROMOTED_TO_GOLD',
        entityType: 'CITIZEN',
        entityId: citizenId,
        performedBy: approvedBy,
        metadata: {
          promotionReason: 'AUTO_DOCUMENT_APPROVAL',
          previousStatus,
          newStatus: 'GOLD',
          promotedAt: new Date().toISOString(),
          approvedDocuments: eligibility.approvedDocs.map(d => ({
            id: d.id,
            type: d.documentType,
            fileName: d.fileName
          }))
        }
      }
    });

    return {
      success: true,
      citizen: promotedCitizen,
      previousStatus,
      newStatus: 'GOLD',
      message: 'Cidadão promovido para nível GOLD com sucesso'
    };
  });

  return result;
}

/**
 * Obtém estatísticas de documentos para o dashboard
 */
export async function getDocumentStats() {
  const [pending, underReview, approved, rejected] = await Promise.all([
    prisma.citizenDocument.count({ where: { status: 'PENDING' } }),
    prisma.citizenDocument.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.citizenDocument.count({ where: { status: 'APPROVED' } }),
    prisma.citizenDocument.count({ where: { status: 'REJECTED' } })
  ]);

  // Cidadãos elegíveis para promoção
  const verifiedCitizens = await prisma.citizen.findMany({
    where: { verificationStatus: 'VERIFIED' },
    include: { documents: { where: { status: 'APPROVED' } } }
  });

  let eligibleForGold = 0;
  for (const citizen of verifiedCitizens) {
    const result = await checkGoldEligibility(citizen.id);
    if (result.eligible) {
      eligibleForGold++;
    }
  }

  return {
    pending,
    underReview,
    approved,
    rejected,
    total: pending + underReview + approved + rejected,
    eligibleForGold
  };
}

/**
 * Lista cidadãos elegíveis para promoção GOLD
 */
export async function getEligibleCitizensForGold() {
  const verifiedCitizens = await prisma.citizen.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      isActive: true
    },
    include: {
      documents: {
        where: { status: 'APPROVED' }
      }
    }
  });

  const eligible = [];

  for (const citizen of verifiedCitizens) {
    const result = await checkGoldEligibility(citizen.id);
    if (result.eligible) {
      eligible.push({
        citizen,
        approvedDocsCount: result.approvedDocs.length,
        missingTypes: result.missingTypes
      });
    }
  }

  return eligible;
}
