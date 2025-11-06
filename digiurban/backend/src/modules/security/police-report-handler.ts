import { PrismaClient } from '@prisma/client';
interface ModuleAction {
  type: string;
  entity: string;
  action: string;
  data: any;
  protocol: string;
  serviceId: string;

}

/**
 * Handler para Boletins de Ocorrência
 * Tipo: security
 * Entidade: PoliceReport
 */
export class PoliceReportHandler {
  private moduleType = 'security';
  private entityName = 'PoliceReport';

  canHandle(action: ModuleAction): boolean {
    return action.type === this.moduleType && action.entity === this.entityName;
  }

  async execute(action: ModuleAction, tx: any): Promise<any> {
    const { data, protocol, serviceId } = action;

    // Gerar número único do BO
    const reportNumber = await this.generateReportNumber(tx);

    // Determinar tipo de ocorrência
    const reportType = this.mapReportType(data.reportType || data.type);

    // Criar boletim de ocorrência
    const policeReport = await tx.policeReport.create({
      data: {
                // Informações do relato
        type: reportType,
        description: data.description,
        location: data.location,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
        occurrenceDate: new Date(data.occurrenceDate),
        occurrenceTime: data.occurrenceTime || null,

        // Envolvidos
        reporterName: data.reporterName || null,
        reporterPhone: data.reporterPhone || null,
        reporterEmail: data.reporterEmail || null,
        witnessInfo: data.witnesses ? JSON.stringify(data.witnesses) : null,
        suspectInfo: data.suspectInfo ? JSON.stringify(data.suspectInfo) : null,

        // Evidências
        photos: data.photos ? JSON.stringify(data.photos) : null,
        videos: data.videos ? JSON.stringify(data.videos) : null,
        documents: data.documents ? JSON.stringify(data.documents) : null,

        // Status
        reportNumber,
        status: 'registered',
        priority: this.determinePriority(data),
        category: data.category || null,

        // Vínculo com protocolo
        protocol,
        serviceId,
        source: 'service',

        // Metadados
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        isAnonymous: data.isAnonymous || false,
        createdBy: data.userId || null
      }
      });

    return {
      success: true,
      policeReport,
      reportNumber,
      message: `Boletim de ocorrência ${reportNumber} registrado com sucesso`
        };
  }

  private async generateReportNumber(tx: any): Promise<string> {
    const year = new Date().getFullYear();

    // Contar BOs do ano atual
    const count = await tx.policeReport.count({
      where: {
                createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
      }
        }
      });

    // Formato: BO-2025-00001
    const number = (count + 1).toString().padStart(5, '0');
    return `BO-${year}-${number}`;
  }

  private mapReportType(type: string): string {
    const typeMap: Record<string, string> = {
      'roubo': 'theft',
      'furto': 'theft',
      'vandalismo': 'vandalism',
      'perturbacao': 'disturbance',
      'perturbação': 'disturbance',
      'transito': 'traffic',
      'trânsito': 'traffic',
      'acidente': 'traffic',
      'violencia': 'violence',
      'violência': 'violence',
      'agressao': 'violence',
      'agressão': 'violence'
        };

    return typeMap[type.toLowerCase()] || 'other';
  }

  private determinePriority(data: any): string {
    // Critérios de prioridade
    if (data.hasVictim || data.inProgress || data.dangerLevel === 'high') {
      return 'urgent';
    }

    if (data.hasWeapon || data.dangerLevel === 'medium') {
      return 'high';
    }

    if (data.requiresImmediateAction) {
      return 'high';
    }

    return 'normal';
      }
}
