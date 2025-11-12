// ============================================================
// URBAN PLANNING HANDLER - Alvará de Funcionamento
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class OperatingLicenseHandler extends BaseModuleHandler {
  moduleType = 'ALVARA_FUNCIONAMENTO';
  entityName = 'OperatingLicense';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createOperatingLicense(data, protocol, tx);
    }

    if (action.action === 'issue') {
      return this.issueLicense(data, tx);
    }

    if (action.action === 'renew') {
      return this.renewLicense(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectLicense(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createOperatingLicense(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = [
      'companyName', 'cnpj', 'ownerName', 'ownerCpf', 'phone',
      'address', 'neighborhood', 'activityType'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    const operatingLicense = await tx.operatingLicense.create({
      data: {
        protocolId: protocol,
        companyName: data.companyName,
        tradeName: data.tradeName || null,
        cnpj: data.cnpj,
        ownerName: data.ownerName,
        ownerCpf: data.ownerCpf,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        number: data.number || null,
        neighborhood: data.neighborhood,
        complement: data.complement || null,
        zipCode: data.zipCode || null,
        activityType: data.activityType,
        cnae: data.cnae || null,
        businessArea: data.businessArea ? parseFloat(data.businessArea) : null,
        employees: data.employees ? parseInt(data.employees) : null,
        operatingHours: data.operatingHours || null,
        hasFireSafety: data.hasFireSafety || false,
        hasSanitaryLicense: data.hasSanitaryLicense || false,
        hasEnvironmentalLic: data.hasEnvironmentalLic || false,
        observations: data.observations || null,
        status: 'ANALYSIS',
        isActive: true,
      },
    });

    return { operatingLicense };
  }

  private async issueLicense(data: any, tx: PrismaTransaction) {
    const { licenseId, validityMonths = 12 } = data;

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const renewalDate = new Date(expiresAt);
    renewalDate.setMonth(renewalDate.getMonth() - 1);

    const license = await tx.operatingLicense.update({
      where: { id: licenseId },
      data: {
        status: 'ISSUED',
        issuedAt,
        expiresAt,
        renewalDate,
        updatedAt: new Date(),
      },
    });

    return { license };
  }

  private async renewLicense(data: any, tx: PrismaTransaction) {
    const { licenseId, validityMonths = 12 } = data;

    const currentLicense = await tx.operatingLicense.findUnique({
      where: { id: licenseId },
    });

    if (!currentLicense) {
      throw new Error('Alvará não encontrado');
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const renewalDate = new Date(expiresAt);
    renewalDate.setMonth(renewalDate.getMonth() - 1);

    const license = await tx.operatingLicense.update({
      where: { id: licenseId },
      data: {
        status: 'ISSUED',
        issuedAt,
        expiresAt,
        renewalDate,
        updatedAt: new Date(),
      },
    });

    return { license };
  }

  private async rejectLicense(data: any, tx: PrismaTransaction) {
    const { licenseId, rejectionReason } = data;

    const license = await tx.operatingLicense.update({
      where: { id: licenseId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        updatedAt: new Date(),
      },
    });

    return { license };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.cnpj) where.cnpj = filters.cnpj;
    if (filters?.ownerCpf) where.ownerCpf = filters.ownerCpf;

    const [items, total] = await Promise.all([
      tx.operatingLicense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.operatingLicense.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
