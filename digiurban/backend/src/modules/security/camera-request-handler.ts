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
 * Handler para Solicitações de Câmeras/Monitoramento
 * Tipo: security
 * Entidade: CameraRequest
 */
export class CameraRequestHandler {
  private moduleType = 'security';
  private entityName = 'CameraRequest';

  canHandle(action: ModuleAction): boolean {
    return action.type === this.moduleType && action.entity === this.entityName;
  }

  async execute(action: ModuleAction, tx: any): Promise<any> {
    const { data, protocol, serviceId } = action;

    // Determinar tipo de solicitação
    const requestType = this.mapRequestType(data.requestType || data.type);

    // Criar solicitação de câmera
    const cameraRequest = await tx.cameraRequest.create({
      data: {
                // Tipo de solicitação
        type: requestType,
        purpose: data.purpose || data.justification,

        // Localização
        location: data.location,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
        area: data.area || data.neighborhood || null,
        address: data.address || data.location,

        // Detalhes da solicitação
        cameraType: data.cameraType || null,
        quantity: data.quantity || 1,
        justification: data.justification || data.purpose,

        // Para solicitação de imagens
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        incidentTime: data.incidentTime || null,
        timeRange: data.timeRange ? JSON.stringify(data.timeRange) : null,
        incidentDescription: data.incidentDescription || null,

        // Solicitante
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail || null,
        requesterDocument: data.requesterDocument || null,
        requesterType: data.requesterType || 'citizen',

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
      cameraRequest,
      message: this.getSuccessMessage(requestType)
        };
  }

  private mapRequestType(type: string): string {
    const typeMap: Record<string, string> = {
      'instalacao': 'installation',
      'instalação': 'installation',
      'nova': 'installation',
      'manutencao': 'maintenance',
      'manutenção': 'maintenance',
      'reparo': 'maintenance',
      'imagens': 'footage',
      'gravacao': 'footage',
      'gravação': 'footage',
      'video': 'footage',
      'vídeo': 'footage',
      'realocacao': 'relocation',
      'realocação': 'relocation',
      'mudanca': 'relocation',
      'mudança': 'relocation'
        };

    return typeMap[type.toLowerCase()] || 'installation';
  }

  private determinePriority(data: any): string {
    // Solicitações de imagens de incidentes têm prioridade
    if (data.type === 'footage' || data.requestType === 'footage') {
      return 'normal';
    }

    // Manutenção urgente
    if (data.isUrgent || data.isEmergency) {
      return 'normal';
    }

    return 'normal';
  }

  private getSuccessMessage(type: string): string {
    const messages: Record<string, string> = {
      'installation': 'Solicitação de instalação de câmera registrada com sucesso',
      'maintenance': 'Solicitação de manutenção de câmera registrada com sucesso',
      'footage': 'Solicitação de imagens registrada com sucesso',
      'relocation': 'Solicitação de realocação de câmera registrada com sucesso'
        };

    return messages[type] || 'Solicitação registrada com sucesso';
  }
}
