// ============================================================
// URBAN PLANNING HANDLER - Certidões Diversas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class UrbanCertificateHandler extends BaseModuleHandler {
  moduleType = 'urban_planning';
  entityName = 'UrbanCertificate';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createCertificate(data, protocol, serviceId, tx);
    }

    if (action.action === 'issue') {
      return this.issueCertificate(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectCertificate(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createCertificate(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const certificate = await tx.urbanCertificate.create({
      data: {
                applicantName: data.applicantName,
        applicantCpf: data.applicantCpf,
        applicantPhone: data.applicantPhone,
        applicantEmail: data.applicantEmail || null,
        certificateType: data.certificateType,
        purpose: data.purpose,
        propertyAddress: data.propertyAddress,
        propertyNumber: data.propertyNumber || null,
        neighborhood: data.neighborhood,
        lotNumber: data.lotNumber || null,
        blockNumber: data.blockNumber || null,
        cadastralNumber: data.cadastralNumber || null,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { certificate };
  }

  private async issueCertificate(data: any, tx: PrismaTransaction) {
    const {
      certificateId,
      certificateNumber,
      zoning,
      landUse,
      restrictions,
      observations,
      validUntil,
      issuedBy
    } = data;

    const certificate = await tx.urbanCertificate.update({
      where: { id: certificateId },
      data: {
        status: 'issued',
        certificateNumber,
        zoning: zoning || null,
        landUse: landUse || null,
        restrictions: restrictions || null,
        observations: observations || null,
        issuedDate: new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        issuedBy
      }
    });

    return { certificate };
  }

  private async rejectCertificate(data: any, tx: PrismaTransaction) {
    const { certificateId, observations, issuedBy } = data;

    const certificate = await tx.urbanCertificate.update({
      where: { id: certificateId },
      data: {
        status: 'rejected',
        observations: observations || null,
        issuedBy
      }
    });

    return { certificate };
  }
}
