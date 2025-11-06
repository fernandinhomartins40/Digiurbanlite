/**
 * ============================================================================
 * PUBLIC SERVICES HANDLERS - Serviços Públicos de Manutenção Urbana
 * ============================================================================
 *
 * 5 handlers consolidados para serviços de manutenção urbana
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

/**
 * 1. TREE PRUNING - Poda de Árvores
 */
export class TreePruningHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'tree_pruning';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.urbanMaintenanceRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'tree_pruning',
        description: requestData.description || protocol.description,
        location: requestData.location,
        coordinates: requestData.coordinates || null,
        photos: requestData.photos || null,
        status: 'pending',
        priority: this.calculatePriority(requestData),
        source: 'portal',
        details: {
          treeType: requestData.treeType,
          treeHeight: requestData.treeHeight,
          reason: requestData.reason, // "risk", "blocking", "maintenance"
          urgency: requestData.urgency,
          nearPowerLines: requestData.nearPowerLines || false
        }
        }
        });

    return { success: true, entityId: request.id, entityType: 'UrbanMaintenanceRequest', data: request };
  }

  private static calculatePriority(data: any): string {
    if (data.reason === 'risk' || data.nearPowerLines) return 'urgent';
    if (data.reason === 'blocking') return 'high';
    return 'normal';
  }
}

/**
 * 2. WASTE REMOVAL - Retirada de Entulho
 */
export class WasteRemovalHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'waste_removal';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.urbanMaintenanceRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'waste_removal',
        description: requestData.description || protocol.description,
        location: requestData.location,
        coordinates: requestData.coordinates || null,
        photos: requestData.photos || null,
        status: 'pending',
        priority: requestData.blocking === 'yes' ? 'high' : 'normal',
        source: 'portal',
        details: {
          wasteType: requestData.wasteType, // "construction", "furniture", "electronics", "garden"
          estimatedVolume: requestData.estimatedVolume,
          blocking: requestData.blocking, // "yes", "no", "partial"
          hasHazardousMaterial: requestData.hasHazardousMaterial || false
        }
        }
        });

    return { success: true, entityId: request.id, entityType: 'UrbanMaintenanceRequest', data: request };
  }
}

/**
 * 3. PEST CONTROL - Dedetização e Controle de Pragas
 */
export class PestControlHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'pest_control';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.urbanMaintenanceRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'pest_control',
        description: requestData.description || protocol.description,
        location: requestData.location,
        coordinates: requestData.coordinates || null,
        photos: requestData.photos || null,
        status: 'pending',
        priority: this.calculatePriority(requestData),
        source: 'portal',
        details: {
          pestType: requestData.pestType, // "mosquito", "rat", "scorpion", "cockroach", "bee"
          infestation: requestData.infestation, // "light", "moderate", "severe"
          publicArea: requestData.publicArea || false,
          affectedArea: requestData.affectedArea
        }
        }
        });

    return { success: true, entityId: request.id, entityType: 'UrbanMaintenanceRequest', data: request };
  }

  private static calculatePriority(data: any): string {
    if (data.pestType === 'scorpion' || data.infestation === 'severe') return 'urgent';
    if (data.infestation === 'moderate') return 'high';
    return 'normal';
  }
}

/**
 * 4. CLEANING - Limpeza e Capina
 */
export class CleaningHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'cleaning';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.urbanMaintenanceRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'cleaning',
        description: requestData.description || protocol.description,
        location: requestData.location,
        coordinates: requestData.coordinates || null,
        photos: requestData.photos || null,
        status: 'pending',
        priority: 'normal',
        source: 'portal',
        details: {
          cleaningType: requestData.cleaningType, // "weeding", "sweeping", "cleaning", "debris_removal"
          areaSize: requestData.areaSize, // "small", "medium", "large"
          accessDifficulty: requestData.accessDifficulty, // "easy", "moderate", "difficult"
        }
        }
        });

    return { success: true, entityId: request.id, entityType: 'UrbanMaintenanceRequest', data: request };
  }
}

/**
 * 5. GARBAGE COLLECTION - Coleta Especial de Lixo
 */
export class GarbageCollectionHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'garbage_collection';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    const request = await prisma.urbanMaintenanceRequest.create({
      data: {
                protocol: protocol.number,
        serviceId: service.id,
        type: 'garbage_collection',
        description: requestData.description || protocol.description,
        location: requestData.location,
        coordinates: requestData.coordinates || null,
        photos: requestData.photos || null,
        status: 'pending',
        priority: 'normal',
        source: 'portal',
        details: {
          collectionType: requestData.collectionType, // "bulky", "electronics", "hazardous", "recyclable"
          scheduledDate: requestData.scheduledDate,
          items: requestData.items, // Lista de itens
          needsSpecialEquipment: requestData.needsSpecialEquipment || false
        }
        }
        });

    return { success: true, entityId: request.id, entityType: 'UrbanMaintenanceRequest', data: request };
  }
}

/**
 * Funções auxiliares para listagem e gestão
 */
export class PublicServicesManager {
  static async list(tenantId: string, type?: string, filters?: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (type) where.type = type;
    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      prisma.urbanMaintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        }),
      prisma.urbanMaintenanceRequest.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
  }

  static async updateStatus(requestId: string, status: string, userId?: string) {
    return await prisma.urbanMaintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === 'completed' && {
          completedAt: new Date(),
          completedBy: userId
        })
        }
        });
  }

  static async schedule(requestId: string, scheduledFor: Date, assignedTeam?: string) {
    return await prisma.urbanMaintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'in_progress',
        scheduledFor,
        assignedTeam
        }
        });
  }

  static async getStats(tenantId: string) {
    const [total, byStatus, byType] = await Promise.all([
      prisma.urbanMaintenanceRequest.count({ where: {} }),
      prisma.urbanMaintenanceRequest.groupBy({
        by: ['status'],
                _count: true
        }),
      prisma.urbanMaintenanceRequest.groupBy({
        by: ['type'],
                _count: true
        }),
    ]);

    return { total, byStatus, byType };
  }
}

/**
 * Registra todos os handlers de serviços públicos
 */
export function registerPublicServicesHandlers() {
  console.log('✅ Public Services handlers registered');
  // Handlers são registrados automaticamente via exports
}
