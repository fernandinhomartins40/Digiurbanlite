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
 * Handler para Solicitações de Ronda/Patrulha
 * Tipo: security
 * Entidade: PatrolRequest
 */
export class PatrolRequestHandler {
  private moduleType = 'security';
  private entityName = 'PatrolRequest';

  canHandle(action: ModuleAction): boolean {
    return action.type === this.moduleType && action.entity === this.entityName;
  }

  async execute(action: ModuleAction, tx: any): Promise<any> {
    const { data, protocol, serviceId } = action;

    // Determinar tipo de patrulha
    const patrolType = this.mapPatrolType(data.patrolType || data.type);

    // Criar solicitação de patrulha
    const patrolRequest = await tx.patrolRequest.create({
      data: {
                // Informações da solicitação
        type: patrolType,
        reason: data.reason,
        location: data.location,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
        area: data.area || data.neighborhood || null,

        // Período solicitado
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
        requestedTime: data.requestedTime || null,
        frequency: data.frequency || 'once',
        duration: data.duration || null,

        // Solicitante
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail || null,
        requesterAddress: data.requesterAddress || null,

        // Detalhes
        description: data.description,
        concerns: data.concerns ? JSON.stringify(data.concerns) : null,
        additionalInfo: data.additionalInfo || null,

        // Status
        status: 'pending',
        priority: this.determinePriority(data),

        // Vínculo com protocolo
        protocol,
        serviceId,
        source: 'service',

        // Metadados
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdBy: data.userId || null
        }
        });

    return {
      success: true,
      patrolRequest,
      message: 'Solicitação de patrulha registrada com sucesso'
        };
  }

  private mapPatrolType(type: string): string {
    const typeMap: Record<string, string> = {
      'preventiva': 'preventive',
      'preventivo': 'preventive',
      'monitoramento': 'monitoring',
      'evento': 'event',
      'denuncia': 'complaint',
      'denúncia': 'complaint',
      'reclamacao': 'complaint',
      'reclamação': 'complaint'
        };

    return typeMap[type.toLowerCase()] || 'preventive';
  }

  private determinePriority(data: any): string {
    // Critérios de prioridade
    if (data.isUrgent || data.hasThreat || data.priority === 'urgent') {
      return 'high';
    }

    if (data.isEvent || data.frequency === 'daily') {
      return 'normal';
    }

    return 'normal';
  }
}
