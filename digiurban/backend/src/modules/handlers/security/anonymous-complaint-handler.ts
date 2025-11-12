import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class AnonymousComplaintHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'anonymous_complaint' || moduleEntity === 'DENUNCIA_ANONIMA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const complaint = await prisma.securityOccurrence.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        occurrenceType: 'DENUNCIA_ANONIMA',
        type: requestData.type || 'denuncia_anonima',
        description: requestData.description || '',
        location: requestData.location || '',
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        severity: requestData.severity || 'MEDIUM',
        occurrenceDate: new Date(),
        reportedBy: 'Anônimo',
        reporterName: 'Anônimo',
        reporterCpf: 'ANONIMO',
        victimInfo: requestData.victimInfo ? JSON.parse(JSON.stringify(requestData.victimInfo)) : null,
        evidence: {
          complaintType: requestData.complaintType,
          urgency: requestData.urgency,
          evidenceData: requestData.evidence
        },
        witnesses: requestData.witnesses ? JSON.parse(JSON.stringify(requestData.witnesses)) : null,
        status: 'OPEN'
      }
    });

    return {
      success: true,
      entityId: complaint.id,
      entityType: 'SecurityOccurrence',
      data: complaint
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityOccurrence.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, severity } = filters;
    const skip = (page - 1) * limit;

    const where: any = { occurrenceType: 'DENUNCIA_ANONIMA' };
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [items, total] = await Promise.all([
      prisma.securityOccurrence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityOccurrence.count({ where })
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

  static async investigate(id: string, officerName: string, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status: 'INVESTIGATING',
        officerName,
        followUp: true
      }
    });
  }

  static async updateStatus(id: string, status: string, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status,
        ...(notes && { resolution: notes })
      }
    });
  }
}
