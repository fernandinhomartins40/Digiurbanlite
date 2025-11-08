// ============================================================
// PUBLIC WORKS HANDLER - Vistoria Técnica de Obras
// FASE 3: Obras Públicas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class TechnicalInspectionHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'VISTORIA_TECNICA_OBRAS';
  entityName = 'TechnicalInspectionPhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;
    if (action.action === 'create') return this.createInspection(data, protocol, tx);
    if (action.action === 'complete') return this.completeInspection(data, tx);
    if (action.action === 'issue_report') return this.issueReport(data, tx);
    throw new Error(`Action ${action.action} not supported`);
  }

  private async createInspection(data: any, protocol: string, tx: PrismaTransaction) {
    return { inspection: await tx.technicalInspectionPhase3.create({
      data: {
        protocolId: protocol,
        requesterName: data.requesterName,
        requesterCpf: data.requesterCpf || null,
        requesterCnpj: data.requesterCnpj || null,
        phone: data.phone,
        email: data.email || null,
        inspectionType: data.inspectionType,
        purpose: data.purpose,
        address: data.address,
        neighborhood: data.neighborhood,
        reference: data.reference || null,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        urgency: data.urgency || false,
        observations: data.observations || null,
        status: 'REQUESTED',
        isActive: true,
      },
    })};
  }

  private async completeInspection(data: any, tx: PrismaTransaction) {
    return { inspection: await tx.technicalInspectionPhase3.update({
      where: { id: data.inspectionId },
      data: {
        status: 'COMPLETED',
        inspectionDate: new Date(),
        inspectorName: data.inspectorName,
        findings: data.findings,
        recommendations: data.recommendations || null,
      },
    })};
  }

  private async issueReport(data: any, tx: PrismaTransaction) {
    return { inspection: await tx.technicalInspectionPhase3.update({
      where: { id: data.inspectionId },
      data: { reportIssued: true, reportUrl: data.reportUrl },
    })};
  }
}
