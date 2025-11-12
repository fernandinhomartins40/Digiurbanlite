import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

interface ModuleAction {
  type: string;
  entity: string;
  action: string;
  data: any;
  protocol: string;
  serviceId: string;

}

/**
 * Handler para Denúncias Anônimas
 * Tipo: security
 * Entidade: AnonymousTip
 */
export class AnonymousTipHandler {
  private moduleType = 'security';
  private entityName = 'AnonymousTip';

  canHandle(action: ModuleAction): boolean {
    return action.type === this.moduleType && action.entity === this.entityName;
  }

  async execute(action: ModuleAction, tx: any): Promise<any> {
    const { data, protocol, serviceId } = action;

    // Gerar número e código de feedback
    const tipNumber = await this.generateTipNumber(tx);
    const feedbackCode = this.generateFeedbackCode();

    // Determinar tipo de denúncia
    const tipType = this.mapTipType(data.tipType || data.type);

    // Hash do IP (se fornecido) para proteção de anonimato
    const ipHash = data.ipAddress ? this.hashIP(data.ipAddress) : null;

    // Criar denúncia anônima
    const anonymousTip = await tx.anonymousTip.create({
      data: {
                // Tipo de denúncia
        type: tipType,
        category: data.category || null,

        // Informações da denúncia
        description: data.description,
        location: data.location || null,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,

        // Detalhes
        suspectInfo: data.suspectInfo ? JSON.stringify(this.sanitizeSuspectInfo(data.suspectInfo)) : null,
        vehicleInfo: data.vehicleInfo ? JSON.stringify(data.vehicleInfo) : null,
        timeframe: data.timeframe || null,
        frequency: data.frequency || 'once',

        // Evidências
        hasEvidence: data.hasEvidence || false,
        evidenceType: data.evidenceType ? JSON.stringify(data.evidenceType) : null,
        evidenceNotes: data.evidenceNotes || null,

        // Urgência
        isUrgent: data.isUrgent || false,
        dangerLevel: data.dangerLevel || 'low',

        // Status
        tipNumber,
        status: 'received',
        priority: this.determinePriority(data),

        // Feedback
        feedbackCode,
        publicUpdates: JSON.stringify([
          {
            date: new Date().toISOString(),
            message: 'Denúncia recebida e em análise'
        },
        ]),

        // Vínculo com protocolo (se não for totalmente anônimo)
        protocol: data.isAnonymous ? null : protocol,
        serviceId,
        source: 'service',

        // Segurança
        isAnonymous: data.isAnonymous !== false, // Default true
        anonymityLevel: data.anonymityLevel || 'full',
        ipHash,

        // Metadados (sem informações identificadoras)
        metadata: data.metadata ? JSON.stringify(this.sanitizeMetadata(data.metadata)) : null
      }
      });

    return {
      success: true,
      anonymousTip,
      tipNumber,
      feedbackCode,
      message: 'Denúncia registrada com sucesso. Guarde o código de acompanhamento.'
        };
  }

  private async generateTipNumber(tx: any): Promise<string> {
    const year = new Date().getFullYear();

    // Contar denúncias do ano atual
    const count = await tx.anonymousTip.count({
      where: {
                createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
      }
        }
      });

    // Formato: DEN-2025-00001
    const number = (count + 1).toString().padStart(5, '0');
    return `DEN-${year}-${number}`;
  }

  private generateFeedbackCode(): string {
    // Gerar código de 8 caracteres alfanuméricos
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres confusos
    let code = '';

    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
  }

  private hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  private sanitizeSuspectInfo(info: any): any {
    // Remove qualquer informação pessoal identificável
    const sanitized = { ...info };

    // Remove campos sensíveis
    delete sanitized.fullName;
    delete sanitized.cpf;
    delete sanitized.rg;
    delete sanitized.exactAddress;

    return sanitized;
  }

  private sanitizeMetadata(metadata: any): any {
    // Remove informações identificadoras dos metadados
    const sanitized = { ...metadata };

    delete sanitized.userId;
    delete sanitized.userName;
    delete sanitized.userEmail;
    delete sanitized.userPhone;
    delete sanitized.ipAddress;

    return sanitized;
  }

  private mapTipType(type: string): string {
    const typeMap: Record<string, string> = {
      'trafico': 'drug_trafficking',
      'tráfico': 'drug_trafficking',
      'drogas': 'drug_trafficking',
      'roubo': 'theft',
      'furto': 'theft',
      'violencia': 'violence',
      'violência': 'violence',
      'agressao': 'violence',
      'agressão': 'violence',
      'vandalismo': 'vandalism',
      'corrupcao': 'corruption',
      'corrupção': 'corruption'
        };

    return typeMap[type.toLowerCase()] || 'other';
  }

  private determinePriority(data: any): string {
    // Critérios de prioridade
    if (data.isUrgent || data.dangerLevel === 'critical') {
      return 'urgent';
    }

    if (data.dangerLevel === 'high' || data.hasEvidence) {
      return 'high';
    }

    return 'normal';
      }
}
