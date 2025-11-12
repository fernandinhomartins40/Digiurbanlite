// ============================================================
// URBAN PLANNING HANDLER - Solicitação de Certidões
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class CertificateRequestHandler extends BaseModuleHandler {
  moduleType = 'SOLICITACAO_CERTIDAO';
  entityName = 'CertificateRequest';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createCertificateRequest(data, protocol, tx);
    }

    if (action.action === 'issue') {
      return this.issueCertificate(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectRequest(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createCertificateRequest(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = ['requesterName', 'requesterCpf', 'requesterPhone', 'certificateType'];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    const certificateRequest = await tx.certificateRequest.create({
      data: {
        protocolId: protocol,
        requesterName: data.requesterName,
        requesterCpf: data.requesterCpf,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail || null,
        certificateType: data.certificateType,
        purpose: data.purpose || null,
        propertyAddress: data.propertyAddress || null,
        propertyRegistration: data.propertyRegistration || null,
        lotNumber: data.lotNumber || null,
        block: data.block || null,
        urgency: data.urgency || false,
        observations: data.observations || null,
        status: 'PENDING',
        isActive: true,
      },
    });

    return { certificateRequest };
  }

  private async issueCertificate(data: any, tx: PrismaTransaction) {
    const { requestId, certificateNumber, validityDays = 90 } = data;

    const issuedAt = new Date();
    const validUntil = new Date(issuedAt);
    validUntil.setDate(validUntil.getDate() + validityDays);

    const certificate = await tx.certificateRequest.update({
      where: { id: requestId },
      data: {
        status: 'ISSUED',
        issuedAt,
        validUntil,
        certificateNumber: certificateNumber || `CERT-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    return { certificate };
  }

  private async rejectRequest(data: any, tx: PrismaTransaction) {
    const { requestId, rejectionReason } = data;

    const request = await tx.certificateRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        updatedAt: new Date(),
      },
    });

    return { request };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.requesterCpf) where.requesterCpf = filters.requesterCpf;
    if (filters?.certificateType) where.certificateType = filters.certificateType;

    const [items, total] = await Promise.all([
      tx.certificateRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.certificateRequest.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
