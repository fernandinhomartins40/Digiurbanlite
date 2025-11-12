import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TourismGuideHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'tourism_guide' || moduleEntity === 'CADASTRO_GUIA_TURISTICO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const guide = await prisma.tourismGuide.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name || requestData.citizenName || '',
        cpf: requestData.cpf || requestData.citizenCpf || '',
        rg: requestData.rg,
        phone: requestData.phone || '',
        email: requestData.email,
        address: requestData.address,
        birthDate: requestData.birthDate ? new Date(requestData.birthDate) : null,
        languages: requestData.languages ? JSON.parse(JSON.stringify(requestData.languages)) : { languages: ['Português'] },
        specialties: requestData.specialties ? JSON.parse(JSON.stringify(requestData.specialties)) : null,
        certifications: requestData.certifications ? JSON.parse(JSON.stringify(requestData.certifications)) : null,
        licenseNumber: requestData.licenseNumber,
        licenseExpiry: requestData.licenseExpiry ? new Date(requestData.licenseExpiry) : null,
        experienceYears: requestData.experienceYears ? parseInt(requestData.experienceYears) : null,
        bio: requestData.bio || requestData.description,
        photo: requestData.photo,
        availableSchedule: requestData.availableSchedule ? JSON.parse(JSON.stringify(requestData.availableSchedule)) : null,
        emergencyContact: requestData.emergencyContact ? JSON.parse(JSON.stringify(requestData.emergencyContact)) : null,
        bankInfo: requestData.bankInfo ? JSON.parse(JSON.stringify(requestData.bankInfo)) : null,
        status: 'ACTIVE',
        isActive: false
      }
    });

    return {
      success: true,
      entityId: guide.id,
      entityType: 'TourismGuide',
      data: guide
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.tourismGuide.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const [items, total] = await Promise.all([
      prisma.tourismGuide.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.tourismGuide.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async approve(id: string, licenseNumber: string, prisma: PrismaClient) {
    return await prisma.tourismGuide.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isActive: true,
        licenseNumber
      }
    });
  }

  static async suspend(id: string, prisma: PrismaClient) {
    return await prisma.tourismGuide.update({
      where: { id },
      data: {
        isActive: false,
        status: 'SUSPENDED'
      }
    });
  }

  static async updateStatus(id: string, status: string, prisma: PrismaClient) {
    return await prisma.tourismGuide.update({
      where: { id },
      data: {
        status
      }
    });
  }
}
