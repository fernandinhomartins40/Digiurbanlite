// ============================================================
// AGRICULTURE HANDLER - Análise de Solo
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class SoilAnalysisHandler extends BaseModuleHandler {
  moduleType = 'agriculture';
  entityName = 'SoilAnalysis';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createAnalysis(data, protocol, serviceId, tx);
    }

    if (action.action === 'collect') {
      return this.collectSamples(data, tx);
    }

    if (action.action === 'send_to_lab') {
      return this.sendToLab(data, tx);
    }

    if (action.action === 'complete') {
      return this.completeAnalysis(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createAnalysis(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const analysis = await tx.soilAnalysis.create({
      data: {
                producerName: data.producerName,
        producerCpf: data.producerCpf,
        producerPhone: data.producerPhone,
        propertyLocation: data.propertyLocation,
        propertyArea: data.propertyArea ? parseFloat(data.propertyArea) : null,
        coordinates: data.coordinates || null,
        analysisType: data.analysisType,
        purpose: data.purpose,
        cropIntended: data.cropIntended || null,
        sampleCount: data.sampleCount ? parseInt(data.sampleCount) : 1,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { analysis };
  }

  private async collectSamples(data: any, tx: PrismaTransaction) {
    const { analysisId, collectionDate, collectedBy, sampleLocations } = data;

    const analysis = await tx.soilAnalysis.update({
      where: { id: analysisId },
      data: {
        status: 'collected',
        collectionDate: new Date(collectionDate),
        collectedBy,
        sampleLocations: sampleLocations || null
      }
    });

    return { analysis };
  }

  private async sendToLab(data: any, tx: PrismaTransaction) {
    const { analysisId, labId, labSentDate } = data;

    const analysis = await tx.soilAnalysis.update({
      where: { id: analysisId },
      data: {
        status: 'lab',
        labId,
        labSentDate: new Date(labSentDate)
      }
    });

    return { analysis };
  }

  private async completeAnalysis(data: any, tx: PrismaTransaction) {
    const {
      analysisId,
      resultsDate,
      results,
      recommendations,
      technicalReport,
      analyzedBy
    } = data;

    const analysis = await tx.soilAnalysis.update({
      where: { id: analysisId },
      data: {
        status: 'completed',
        resultsDate: new Date(resultsDate),
        results: results || null,
        recommendations: recommendations || null,
        technicalReport: technicalReport || null,
        analyzedBy
      }
    });

    return { analysis };
  }
}
