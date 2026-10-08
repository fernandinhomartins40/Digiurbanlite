/**
 * Direitos do titular (LGPD art. 18) pelo próprio portal:
 *  - baixar uma cópia dos meus dados;
 *  - excluir a minha conta.
 *
 * Na exclusão ficam só o nome, o CPF e os pedidos já feitos — a prefeitura
 * precisa guardar o registro do atendimento (LGPD art. 16, I: obrigação
 * legal). Todo o resto é apagado: contato, endereço, documentos pessoais,
 * biometria, família, avisos e o acesso ao portal.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BCRYPT_ROUNDS } from '../config/security';
import facePlatformClientService from './face-platform-client.service';

const OPEN_STATUSES = ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'];

const PERSONAL_DOCUMENT_WHERE = {
  AND: [{ OR: [{ sourceType: null }, { sourceType: 'UPLOAD' }] }, { NOT: { documentType: { startsWith: 'Protocolo:' } } }],
};

/** Cópia dos dados do cidadão, em linguagem de gente (sem senha, sem dados de terceiros além do nome) */
export async function exportCitizenData(citizenId: string) {
  const citizen = await prisma.citizen.findUnique({ where: { id: citizenId } });
  if (!citizen) return null;

  const [protocols, documents, familyAsHead, familyAsMember, tags, face, preferences] = await Promise.all([
    prisma.protocolSimplified.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
      select: { number: true, status: true, createdAt: true, concludedAt: true, customData: true, service: { select: { name: true } } },
    }),
    prisma.citizenDocument.findMany({
      where: { citizenId },
      orderBy: { uploadedAt: 'desc' },
      select: { documentType: true, fileName: true, status: true, uploadedAt: true, reviewedAt: true, rejectionReason: true },
    }),
    prisma.familyComposition.findMany({
      where: { headId: citizenId },
      select: { relationship: true, isDependent: true, status: true, member: { select: { name: true } } },
    }),
    prisma.familyComposition.findMany({
      where: { memberId: citizenId },
      select: { relationship: true, status: true, head: { select: { name: true } } },
    }),
    prisma.citizenCategoryAssignment.findMany({
      where: { citizenId, active: true },
      select: { assignedAt: true, category: { select: { name: true } } },
    }),
    prisma.faceRecognitionIdentity.findFirst({ where: { citizenId }, select: { status: true, createdAt: true } }),
    prisma.notificationPreference.findFirst({ where: { citizenId } }).catch(() => null),
  ]);

  const { password: _password, failedLoginAttempts: _attempts, lockedUntil: _locked, ...profile } = citizen;

  return {
    geradoEm: new Date().toISOString(),
    explicacao: 'Cópia dos seus dados guardados no Portal do Cidadão (LGPD, art. 18). As fotos dos documentos podem ser baixadas em "Meus documentos".',
    cadastro: profile,
    pedidos: protocols.map((protocol) => ({
      numero: protocol.number,
      servico: protocol.service?.name || null,
      situacao: protocol.status,
      abertoEm: protocol.createdAt,
      concluidoEm: protocol.concludedAt,
      dadosInformados: protocol.customData,
    })),
    documentos: documents.map((document) => ({
      tipo: document.documentType,
      arquivo: document.fileName,
      situacao: document.status,
      enviadoEm: document.uploadedAt,
      conferidoEm: document.reviewedAt,
      motivoDaRecusa: document.rejectionReason,
    })),
    familia: {
      pessoasQueAdicionei: familyAsHead.map((link) => ({ nome: link.member.name, parentesco: link.relationship, dependente: link.isDependent, situacao: link.status })),
      familiasDeQueFacoParte: familyAsMember.map((link) => ({ responsavel: link.head.name, parentesco: link.relationship, situacao: link.status })),
    },
    etiquetas: tags.map((tag) => ({ nome: tag.category.name, desde: tag.assignedAt })),
    biometriaFacial: face ? { cadastrada: true, situacao: face.status, desde: face.createdAt } : { cadastrada: false },
    preferenciasDeAviso: preferences,
  };
}

export async function countOpenProtocols(citizenId: string): Promise<number> {
  return prisma.protocolSimplified.count({ where: { citizenId, status: { in: OPEN_STATUSES as any } } });
}

function removeFile(filePath: string | null | undefined) {
  if (!filePath) return;
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // arquivo já não existe: segue
  }
}

/**
 * Exclui a conta a pedido do titular. Quem chama já conferiu a senha e que
 * não há pedido em andamento.
 */
export async function deleteCitizenAccount(citizenId: string, context: { ip?: string | null; userAgent?: string | null }) {
  const actor = { type: 'CITIZEN' as const, id: citizenId };

  // 1. biometria (fora do banco principal: face-server)
  for (const purpose of ['IDENTITY_VERIFICATION', 'SCHOOL_SECURITY'] as const) {
    await facePlatformClientService.revokeConsent(citizenId, purpose, 'Conta excluída a pedido do titular', actor as any).catch(() => undefined);
  }
  await facePlatformClientService.deleteCitizenBiometry(citizenId, actor as any, 'Conta excluída a pedido do titular').catch(() => undefined);

  // 2. arquivos dos documentos pessoais
  const documents = await prisma.citizenDocument.findMany({ where: { citizenId, ...PERSONAL_DOCUMENT_WHERE }, select: { id: true, filePath: true } });
  documents.forEach((document) => removeFile(document.filePath));

  // 3. banco: apaga o que é pessoal e deixa só o necessário para os pedidos já feitos
  await prisma.$transaction(async (tx) => {
    await tx.documentReading.deleteMany({ where: { source: 'CITIZEN_DOCUMENT', documentId: { in: documents.map((document) => document.id) } } });
    await tx.citizenDocument.deleteMany({ where: { id: { in: documents.map((document) => document.id) } } });
    await tx.familyComposition.deleteMany({ where: { OR: [{ headId: citizenId }, { memberId: citizenId }] } });
    await tx.familyInvite.deleteMany({ where: { headId: citizenId } });
    await tx.citizenCategoryAssignment.deleteMany({ where: { citizenId } });
    await tx.pushSubscription.deleteMany({ where: { citizenId } });
    await tx.notificationPreference.deleteMany({ where: { citizenId } });
    await tx.notification.deleteMany({ where: { citizenId } });
    await tx.passwordResetToken.deleteMany({ where: { citizenId } });
    await tx.citizen.update({
      where: { id: citizenId },
      data: {
        email: '',
        phone: null,
        phoneSecondary: null,
        address: Prisma.DbNull,
        homeLatitude: null,
        homeLongitude: null,
        homeLocationSource: null,
        homeLocationAt: null,
        homeLocationKey: null,
        rg: null,
        motherName: null,
        maritalStatus: null,
        occupation: null,
        familyIncome: null,
        avatar: null,
        password: await bcrypt.hash(randomBytes(24).toString('base64url'), BCRYPT_ROUNDS),
        isActive: false,
        verificationStatus: 'PENDING',
        verificationNotes: `Conta excluída a pedido do titular em ${new Date().toLocaleDateString('pt-BR')}.`,
      },
    });
    await tx.auditLog.create({
      data: {
        citizenId,
        action: 'CITIZEN_ACCOUNT_DELETED_BY_OWNER',
        resource: 'CITIZEN',
        details: { documentsRemoved: documents.length, ip: context.ip || null, userAgent: (context.userAgent || '').slice(0, 200) },
      },
    });
  });
}
