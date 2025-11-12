/**
 * ============================================================================
 * HOUSING HANDLERS - Habitação
 * ============================================================================
 *
 * 6 handlers consolidados para serviços de habitação
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export { HousingAttendanceHandler } from './housing-attendance-handler';
export { HousingUnitHandler } from './housing-unit-handler';

/**
 * 1. HOUSING APPLICATION - Inscrição em Programas Habitacionais (MCMV, etc)
 */
export class HousingApplicationHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'housing_program';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.housingRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'housing_program',
        citizenName: requestData.citizenName,
        citizenCpf: requestData.citizenCpf,
        citizenRg: requestData.citizenRg,
        phone: requestData.phone,
        email: requestData.email,
        familySize: parseInt(requestData.familySize),
        monthlyIncome: parseFloat(requestData.monthlyIncome || '0'),
        familyData: {
          members: requestData.familyMembers || [],
          dependents: requestData.dependents || 0
        },
        currentAddress: requestData.currentAddress,
        currentSituation: requestData.currentSituation, // "aluguel", "casa_cedida", "situacao_rua"
        requestDetails: {
          programType: requestData.programType, // "MCMV", "casa_verde_amarela", "municipal"
          hasDisabledMember: requestData.hasDisabledMember || false,
          hasElderly: requestData.hasElderly || false,
          isWomanHeaded: requestData.isWomanHeaded || false,
          previousApplication: requestData.previousApplication || false
        },
        status: 'pending',
        priority: this.calculatePriority(requestData),
        source: 'portal',
        documents: requestData.documents || null
        }
        });

    return { success: true, entityId: request.id, entityType: 'HousingRequest', data: request };
  }

  private static calculatePriority(data: any): string {
    if (data.currentSituation === 'situacao_rua') return 'urgent';
    if (data.hasDisabledMember || data.hasElderly || data.isWomanHeaded) return 'high';
    return 'normal';
  }
}

/**
 * 2. LOT APPLICATION - Solicitação de Lote
 */
export class LotApplicationHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'lot_application';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.housingRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'lot_application',
        citizenName: requestData.citizenName,
        citizenCpf: requestData.citizenCpf,
        citizenRg: requestData.citizenRg,
        phone: requestData.phone,
        email: requestData.email,
        familySize: parseInt(requestData.familySize),
        monthlyIncome: parseFloat(requestData.monthlyIncome || '0'),
        familyData: requestData.familyData,
        currentAddress: requestData.currentAddress,
        currentSituation: requestData.currentSituation,
        requestDetails: {
          preferredArea: requestData.preferredArea,
          lotSize: requestData.lotSize, // "small", "medium", "large"
          purpose: requestData.purpose, // "residence", "commerce", "mixed"
          hasConstructionPlan: requestData.hasConstructionPlan || false,
          canPayInstallments: requestData.canPayInstallments || true
        },
        status: 'pending',
        priority: 'normal',
        source: 'portal',
        documents: requestData.documents || null
        }
        });

    return { success: true, entityId: request.id, entityType: 'HousingRequest', data: request };
  }
}

/**
 * 3. REGULARIZATION - Regularização Fundiária
 */
export class RegularizationHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'regularization';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.housingRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'regularization',
        citizenName: requestData.citizenName,
        citizenCpf: requestData.citizenCpf,
        citizenRg: requestData.citizenRg,
        phone: requestData.phone,
        email: requestData.email,
        familySize: parseInt(requestData.familySize || '1'),
        monthlyIncome: parseFloat(requestData.monthlyIncome || '0'),
        currentAddress: requestData.propertyAddress, // Endereço do imóvel a regularizar
        requestDetails: {
          propertyAddress: requestData.propertyAddress,
          occupationTime: requestData.occupationTime, // Anos morando no local
          hasAnyDocument: requestData.hasAnyDocument || false,
          documentType: requestData.documentType, // "posse", "compra_venda", "doacao", "nenhum"
          propertySize: requestData.propertySize,
          isUrbanArea: requestData.isUrbanArea || true,
          hasNeighborsInSameSituation: requestData.hasNeighborsInSameSituation || false
        },
        status: 'pending',
        priority: 'normal',
        source: 'portal',
        documents: requestData.documents || null
        }
        });

    return { success: true, entityId: request.id, entityType: 'HousingRequest', data: request };
  }
}

/**
 * 4. HOUSING AID - Auxílio Habitacional (Construção/Aluguel)
 */
export class HousingAidHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'housing_aid';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.housingRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'housing_aid',
        citizenName: requestData.citizenName,
        citizenCpf: requestData.citizenCpf,
        citizenRg: requestData.citizenRg,
        phone: requestData.phone,
        email: requestData.email,
        familySize: parseInt(requestData.familySize),
        monthlyIncome: parseFloat(requestData.monthlyIncome || '0'),
        familyData: requestData.familyData,
        currentAddress: requestData.currentAddress,
        currentSituation: requestData.currentSituation,
        requestDetails: {
          aidType: requestData.aidType, // "rent", "construction", "renovation", "emergency"
          reason: requestData.reason, // Motivo do auxílio
          urgency: requestData.urgency, // "normal", "high", "urgent"
          hasOwnLot: requestData.hasOwnLot || false,
          estimatedValue: requestData.estimatedValue,
          hasOtherIncome: requestData.hasOtherIncome || false
        },
        status: 'pending',
        priority: this.calculatePriority(requestData),
        source: 'portal',
        documents: requestData.documents || null
        }
        });

    return { success: true, entityId: request.id, entityType: 'HousingRequest', data: request };
  }

  private static calculatePriority(data: any): string {
    if (data.aidType === 'emergency' || data.urgency === 'urgent') return 'urgent';
    if (data.urgency === 'high') return 'high';
    return 'normal';
  }
}

/**
 * Funções auxiliares para gestão de solicitações de habitação
 */
export class HousingManager {
  static async list(tenantId: string, type?: string, filters?: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (type) where.type = type;
    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      prisma.housingRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        }),
      prisma.housingRequest.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
  }

  static async getById(requestId: string) {
    return await prisma.housingRequest.findUnique({
      where: { id: requestId }
        });
  }

  static async getByProtocol(protocol: string) {
    return await prisma.housingRequest.findFirst({
      where: { protocol }
        });
  }

  static async updateStatus(requestId: string, status: string, userId?: string, notes?: string) {
    return await prisma.housingRequest.update({
      where: { id: requestId },
      data: {
        status,
        analysisNotes: notes,
        ...(status === 'approved' && {
          reviewedAt: new Date(),
          reviewedBy: userId
        }),
        ...(status === 'rejected' && {
          reviewedAt: new Date(),
          reviewedBy: userId,
          rejectionReason: notes
        })
        }
        });
  }

  static async approve(requestId: string, userId: string, notes?: string) {
    return this.updateStatus(requestId, 'approved', userId, notes);
  }

  static async reject(requestId: string, userId: string, reason: string) {
    return this.updateStatus(requestId, 'rejected', userId, reason);
  }

  static async getStats(tenantId: string) {
    const [total, byStatus, byType, byPriority] = await Promise.all([
      prisma.housingRequest.count({ where: {} }),
      prisma.housingRequest.groupBy({
        by: ['status'],
                _count: true
        }),
      prisma.housingRequest.groupBy({
        by: ['type'],
                _count: true
        }),
      prisma.housingRequest.groupBy({
        by: ['priority'],
                _count: true
        }),
    ]);

    return { total, byStatus, byType, byPriority };
  }

  static async search(tenantId: string, cpf: string) {
    return await prisma.housingRequest.findMany({
      where: {
                citizenCpf: cpf
        },
      orderBy: { createdAt: 'desc' }
        });
  }
}

/**
 * Registra todos os handlers de habitação
 */
export function registerHousingHandlers() {
  console.log('✅ Housing handlers registered (6 módulos)');
  // Handlers são registrados automaticamente via exports
}
