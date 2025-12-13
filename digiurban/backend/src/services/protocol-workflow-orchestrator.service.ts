/**
 * ============================================================================
 * PROTOCOL WORKFLOW ORCHESTRATOR
 * ============================================================================
 *
 * Motor central que orquestra TODAS as mudanças de estado em protocolos:
 * - Aprovação/Rejeição de Documentos
 * - Conclusão/Falha de Stages
 * - Criação/Resolução de Pendências
 * - Atualização de Status
 * - Gerenciamento de SLA
 */

import { ProtocolStatus, StageStatus, PendingStatus, DocumentStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as stageService from './protocol-stage.service';
import * as slaService from './protocol-sla.service';
import * as documentService from './protocol-document.service';
import * as pendingService from './protocol-pending.service';
import * as interactionService from './protocol-interaction.service';
import { protocolStatusEngine } from './protocol-status.engine';

// ============================================================================
// TIPOS
// ============================================================================

interface OrchestrationContext {
  protocolId: string;
  triggeredBy: 'DOCUMENT' | 'STAGE' | 'PENDING' | 'MANUAL';
  userId: string;
  metadata?: any;
}

interface StageValidationResult {
  canProgress: boolean;
  blockers: string[];
  warnings: string[];
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class ProtocolWorkflowOrchestrator {

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 1: DOCUMENTO APROVADO
   * ═══════════════════════════════════════════════════════════════════
   */
  async onDocumentApproved(documentId: string, approvedBy: string) {
    const doc = await prisma.protocolDocument.findUnique({
      where: { id: documentId },
      include: { protocol: { include: { stages: true } } }
    });

    if (!doc) return;

    console.log(`📄 [Orchestrator] Documento aprovado: ${doc.documentType}`);

    // 1. Verificar se TODOS documentos obrigatórios estão aprovados
    const allDocsApproved = await documentService.checkAllDocumentsApproved(doc.protocolId);

    if (allDocsApproved.allApproved) {
      console.log(`✅ [Orchestrator] Todos documentos aprovados!`);

      // 2. Encontrar stage atual de "Análise Documental"
      const currentStage = doc.protocol.stages.find(s =>
        s.status === StageStatus.IN_PROGRESS &&
        (s.stageName.toLowerCase().includes('análise') ||
         s.stageName.toLowerCase().includes('documen'))
      );

      if (currentStage) {
        // 3. Completar stage automaticamente
        console.log(`🎯 [Orchestrator] Completando stage: ${currentStage.stageName}`);
        await stageService.completeStage(
          currentStage.id,
          approvedBy,
          'APPROVED',
          'Todos os documentos obrigatórios foram aprovados'
        );

        // 4. Isso vai disparar onStageCompleted() automaticamente
      } else {
        // Se não há stage de análise documental, só mudar protocolo para PROGRESSO
        if (doc.protocol.status === ProtocolStatus.VINCULADO) {
          await protocolStatusEngine.updateStatus({
            protocolId: doc.protocolId,
            newStatus: ProtocolStatus.PROGRESSO,
            actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
            actorId: approvedBy,
            comment: 'Documentação completa e aprovada'
          });
        }
      }

      // 5. Criar interação de sucesso
      await interactionService.createInteraction({
        protocolId: doc.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SYSTEM',
        authorId: approvedBy,
        authorName: 'Sistema',
        message: '✅ Documentação aprovada! Seu protocolo avançou no fluxo.',
        isInternal: false
      });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 2: DOCUMENTO REJEITADO
   * ═══════════════════════════════════════════════════════════════════
   */
  async onDocumentRejected(documentId: string, rejectedBy: string, reason: string) {
    const doc = await prisma.protocolDocument.findUnique({
      where: { id: documentId },
      select: { protocolId: true, documentType: true }
    });

    if (!doc) return;

    console.log(`❌ [Orchestrator] Documento rejeitado: ${doc.documentType}`);

    // 1. Criar pendência automática
    await pendingService.createPending({
      protocolId: doc.protocolId,
      type: 'DOCUMENT',
      title: `Documento Rejeitado: ${doc.documentType}`,
      description: reason,
      blocksProgress: true,
      createdBy: rejectedBy,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    });

    // 2. Mudar protocolo para PENDENCIA (se ainda não estiver)
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: doc.protocolId }
    });

    if (protocol?.status !== ProtocolStatus.PENDENCIA) {
      await protocolStatusEngine.updateStatus({
        protocolId: doc.protocolId,
        newStatus: ProtocolStatus.PENDENCIA,
        actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
        actorId: rejectedBy,
        comment: `Documento "${doc.documentType}" rejeitado`,
        reason: reason
      });
    }

    // 3. Pausar SLA
    await this.pauseSLA(doc.protocolId, `Aguardando reenvio de documento: ${doc.documentType}`);

    // 4. Criar interação para cidadão
    await interactionService.createInteraction({
      protocolId: doc.protocolId,
      type: 'STATUS_CHANGED', // Usar tipo existente
      authorType: 'SERVER',
      authorId: rejectedBy,
      authorName: 'Analista',
      message: `⚠️ O documento "${doc.documentType}" foi rejeitado. Motivo: ${reason}. Por favor, envie um novo documento.`,
      isInternal: false
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 3: STAGE CONCLUÍDA
   * ═══════════════════════════════════════════════════════════════════
   */
  async onStageCompleted(stageId: string, completedBy: string) {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId },
      include: { protocol: { include: { stages: true } } }
    });

    if (!stage) return;

    console.log(`✅ [Orchestrator] Stage concluída: ${stage.stageName} (${stage.stageOrder})`);

    // 1. Verificar se TODAS as stages foram concluídas
    const allStagesCompleted = stage.protocol.stages.every(s =>
      s.status === StageStatus.COMPLETED || s.status === StageStatus.SKIPPED
    );

    if (allStagesCompleted) {
      // ═══ TODAS CONCLUÍDAS → PROTOCOLO CONCLUÍDO ═══
      console.log(`🎉 [Orchestrator] Todas stages concluídas! Finalizando protocolo.`);

      await protocolStatusEngine.updateStatus({
        protocolId: stage.protocolId,
        newStatus: ProtocolStatus.CONCLUIDO,
        actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
        actorId: completedBy,
        comment: 'Todas as etapas do workflow foram concluídas com sucesso',
        reason: 'workflow_completed'
      });

      // Marcar SLA como concluído
      await slaService.completeSLA(stage.protocolId);

      // Interação de conclusão
      await interactionService.createInteraction({
        protocolId: stage.protocolId,
        type: 'STATUS_CHANGED', // Usar tipo existente
        authorType: 'SYSTEM',
        authorName: 'Sistema',
        message: '🎉 Parabéns! Seu protocolo foi concluído com sucesso!',
        isInternal: false
      });

    } else {
      // ═══ PRÓXIMA STAGE ═══
      const nextStage = stage.protocol.stages.find(s =>
        s.stageOrder === stage.stageOrder + 1 &&
        s.status === StageStatus.PENDING
      );

      if (nextStage) {
        console.log(`➡️ [Orchestrator] Iniciando próxima stage: ${nextStage.stageName}`);

        // Validar se pode iniciar próxima stage
        const validation = await this.validateStageStart(nextStage.id);

        if (validation.canProgress) {
          await stageService.startStage(nextStage.id, completedBy);

          // Interação informativa
          await interactionService.createInteraction({
            protocolId: stage.protocolId,
            type: 'STATUS_CHANGED',
            authorType: 'SYSTEM',
            authorName: 'Sistema',
            message: `Etapa "${stage.stageName}" concluída. Iniciando: "${nextStage.stageName}"`,
            isInternal: false
          });
        } else {
          // Há bloqueios - criar pendência
          console.log(`⚠️ [Orchestrator] Não pode iniciar stage. Bloqueios: ${validation.blockers.join(', ')}`);

          await pendingService.createPending({
            protocolId: stage.protocolId,
            type: 'OTHER',
            title: `Pré-requisitos pendentes para: ${nextStage.stageName}`,
            description: validation.blockers.join('\n'),
            blocksProgress: true,
            createdBy: 'SYSTEM'
          });
        }
      }
    }

    // Recalcular SLA
    await this.recalculateSLA(stage.protocolId);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 4: STAGE FALHADA
   * ═══════════════════════════════════════════════════════════════════
   */
  async onStageFailed(stageId: string, failedBy: string, reason: string) {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId },
      select: { protocolId: true, stageName: true }
    });

    if (!stage) return;

    console.log(`❌ [Orchestrator] Stage falhou: ${stage.stageName}`);

    // 1. Criar pendência
    await pendingService.createPending({
      protocolId: stage.protocolId,
      type: 'APPROVAL',
      title: `Etapa "${stage.stageName}" falhou`,
      description: reason,
      blocksProgress: true,
      createdBy: failedBy
    });

    // 2. Mudar protocolo para PENDENCIA
    await protocolStatusEngine.updateStatus({
      protocolId: stage.protocolId,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
      actorId: failedBy,
      comment: `Falha na etapa: ${stage.stageName}`,
      reason: reason
    });

    // 3. Pausar SLA
    await this.pauseSLA(stage.protocolId, `Aguardando resolução de falha: ${stage.stageName}`);

    // 4. Notificar
    await interactionService.createInteraction({
      protocolId: stage.protocolId,
      type: 'STATUS_CHANGED', // Usar tipo existente
      authorType: 'SERVER',
      authorId: failedBy,
      authorName: 'Sistema',
      message: `⚠️ A etapa "${stage.stageName}" encontrou problemas. Motivo: ${reason}`,
      isInternal: false
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 5: PENDÊNCIA CRIADA
   * ═══════════════════════════════════════════════════════════════════
   */
  async onPendingCreated(pendingId: string) {
    const pending = await prisma.protocolPending.findUnique({
      where: { id: pendingId },
      include: { protocol: true }
    });

    if (!pending || !pending.blocksProgress) return;

    console.log(`⚠️ [Orchestrator] Pendência bloqueante criada: ${pending.title}`);

    // 1. Mudar protocolo para PENDENCIA (se ainda não estiver)
    if (pending.protocol.status !== ProtocolStatus.PENDENCIA) {
      await protocolStatusEngine.updateStatus({
        protocolId: pending.protocolId,
        newStatus: ProtocolStatus.PENDENCIA,
        actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
        actorId: pending.createdBy,
        comment: pending.title,
        metadata: { pendingId }
      });
    }

    // 2. Pausar SLA
    await this.pauseSLA(pending.protocolId, pending.title);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 6: PENDÊNCIA RESOLVIDA
   * ═══════════════════════════════════════════════════════════════════
   */
  async onPendingResolved(pendingId: string, resolvedBy: string) {
    const pending = await prisma.protocolPending.findUnique({
      where: { id: pendingId },
      select: { protocolId: true, blocksProgress: true, title: true }
    });

    if (!pending || !pending.blocksProgress) return;

    console.log(`✅ [Orchestrator] Pendência resolvida: ${pending.title}`);

    // 1. Verificar se ainda há outras pendências bloqueantes
    const otherBlockers = await prisma.protocolPending.count({
      where: {
        protocolId: pending.protocolId,
        id: { not: pendingId },
        blocksProgress: true,
        status: { in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS] }
      }
    });

    if (otherBlockers === 0) {
      console.log(`✅ [Orchestrator] Todas pendências resolvidas! Retomando workflow.`);

      // 2. Voltar protocolo para PROGRESSO
      await protocolStatusEngine.updateStatus({
        protocolId: pending.protocolId,
        newStatus: ProtocolStatus.PROGRESSO,
        actorRole: UserRole.ADMIN, // SYSTEM não existe, usar ADMIN
        actorId: resolvedBy,
        comment: 'Pendências resolvidas, protocolo retomado',
        metadata: { pendingId }
      });

      // 3. Retomar SLA
      await this.resumeSLA(pending.protocolId);

      // 4. Verificar se stage atual pode ser iniciada/continuada
      const currentStage = await stageService.getCurrentStage(pending.protocolId);
      if (currentStage && currentStage.status === StageStatus.PENDING) {
        await stageService.startStage(currentStage.id, resolvedBy);
      }

      // 5. Notificar
      await interactionService.createInteraction({
        protocolId: pending.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SYSTEM',
        authorName: 'Sistema',
        message: '✅ Pendências resolvidas! Seu protocolo voltou ao andamento normal.',
        isInternal: false
      });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * VALIDAÇÕES
   * ═══════════════════════════════════════════════════════════════════
   */

  /**
   * Valida se uma stage pode ser iniciada
   */
  private async validateStageStart(stageId: string): Promise<StageValidationResult> {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId }
    });

    if (!stage) {
      return { canProgress: false, blockers: ['Stage não encontrada'], warnings: [] };
    }

    const blockers: string[] = [];
    const warnings: string[] = [];
    const metadata = stage.metadata as any;

    // 1. Verificar documentos obrigatórios
    if (metadata?.requiredDocuments && metadata.requiredDocuments.length > 0) {
      const docs = await prisma.protocolDocument.findMany({
        where: {
          protocolId: stage.protocolId,
          documentType: { in: metadata.requiredDocuments }
        }
      });

      const approvedDocs = docs.filter(d => d.status === DocumentStatus.APPROVED);
      if (approvedDocs.length < metadata.requiredDocuments.length) {
        const missing = metadata.requiredDocuments.filter(
          (req: string) => !approvedDocs.find(d => d.documentType === req)
        );
        blockers.push(`Documentos pendentes: ${missing.join(', ')}`);
      }
    }

    // 2. Verificar pendências bloqueantes
    const hasBlockers = await pendingService.hasBlockingPendings(stage.protocolId);
    if (hasBlockers) {
      blockers.push('Existem pendências bloqueantes abertas');
    }

    // 3. Verificar ações obrigatórias (futuro)
    if (metadata?.requiredActions && metadata.requiredActions.length > 0) {
      warnings.push('Esta etapa requer ações manuais');
    }

    return {
      canProgress: blockers.length === 0,
      blockers,
      warnings
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * GERENCIAMENTO DE SLA
   * ═══════════════════════════════════════════════════════════════════
   */

  private async pauseSLA(protocolId: string, reason: string) {
    const sla = await prisma.protocolSLA.findUnique({
      where: { protocolId }
    });

    if (!sla || sla.isPaused) return;

    await prisma.protocolSLA.update({
      where: { protocolId },
      data: {
        isPaused: true,
        pausedAt: new Date(),
        pausedReason: reason
      }
    });

    console.log(`⏸️ [Orchestrator] SLA pausado: ${reason}`);
  }

  private async resumeSLA(protocolId: string) {
    const sla = await prisma.protocolSLA.findUnique({
      where: { protocolId }
    });

    if (!sla || !sla.isPaused) return;

    const pausedDays = Math.floor(
      (Date.now() - sla.pausedAt!.getTime()) / (1000 * 60 * 60 * 24)
    );

    await prisma.protocolSLA.update({
      where: { protocolId },
      data: {
        isPaused: false,
        pausedAt: null,
        pausedReason: null,
        totalPausedDays: sla.totalPausedDays + pausedDays,
        // Estender prazo final
        expectedEndDate: new Date(
          sla.expectedEndDate.getTime() + pausedDays * 24 * 60 * 60 * 1000
        )
      }
    });

    console.log(`▶️ [Orchestrator] SLA retomado (pausado por ${pausedDays} dias)`);
  }

  private async recalculateSLA(protocolId: string) {
    const sla = await prisma.protocolSLA.findUnique({
      where: { protocolId }
    });

    if (!sla) return;

    const now = new Date();
    const isOverdue = now > sla.expectedEndDate && !sla.isPaused;
    const daysOverdue = isOverdue
      ? Math.floor((now.getTime() - sla.expectedEndDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    await prisma.protocolSLA.update({
      where: { protocolId },
      data: {
        isOverdue,
        daysOverdue
      }
    });

    if (isOverdue && daysOverdue > 0) {
      console.log(`⏰ [Orchestrator] SLA vencido! ${daysOverdue} dia(s) de atraso`);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const workflowOrchestrator = new ProtocolWorkflowOrchestrator();
