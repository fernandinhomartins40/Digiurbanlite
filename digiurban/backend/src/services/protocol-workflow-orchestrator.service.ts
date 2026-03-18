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

import { ProtocolStatus, StageStatus, PendingStatus, PendingType, DocumentStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as stageService from './protocol-stage.service';
import * as slaService from './protocol-sla.service';
import * as documentService from './protocol-document.service';
import * as pendingService from './protocol-pending.service';
import * as interactionService from './protocol-interaction.service';
import { protocolStatusEngine } from './protocol-status.engine';
import * as categoryService from './citizen-category.service';
import { matchDocumentType } from '../utils/document-mapping';

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
  missingDocuments?: string[];
  awaitingReviewDocuments?: string[];
  rejectedDocuments?: string[];
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

    // 0. Resolver automaticamente pendências relacionadas a este documento
    const candidateDocumentPendings = await prisma.protocolPending.findMany({
      where: {
        protocolId: doc.protocolId,
        type: 'DOCUMENT',
        status: { in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS, PendingStatus.UNDER_REVIEW] },
      }
    });

    const documentPendings = candidateDocumentPendings.filter((pending) => {
      const metadata = pending.metadata as Record<string, unknown> | null;
      return matchDocumentType(doc.documentType, String(metadata?.documentType || ''));
    });

    if (documentPendings.length > 0) {
      console.log(`🔄 [Orchestrator] Resolvendo ${documentPendings.length} pendência(s) do documento ${doc.documentType}`);

      for (const pending of documentPendings) {
        await pendingService.resolvePending(
          pending.id,
          approvedBy,
          `Documento aprovado automaticamente pelo sistema`
        );

      }
    }

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
      const approver = await prisma.user.findUnique({ where: { id: approvedBy }, select: { name: true } });
      await interactionService.createInteraction({
        protocolId: doc.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SERVER',
        authorId: approvedBy,
        authorName: approver?.name || 'Servidor',
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

    // 1. ✅ FASE 3: Criar pendência automática (sem duplicar rejectionReason)
    await pendingService.createDocumentPending(
      doc.protocolId,
      doc.documentType,
      rejectedBy,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      {
        documentId,
        sourceType: 'DOCUMENT_REJECTION',
      }
    );

    // 2. ✅ FASE 1: Mudar protocolo para ATUALIZACAO (aguarda ação do cidadão)
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: doc.protocolId }
    });

    if (protocol?.status !== ProtocolStatus.ATUALIZACAO) {
      await protocolStatusEngine.updateStatus({
        protocolId: doc.protocolId,
        newStatus: ProtocolStatus.ATUALIZACAO, // Aguardando cidadão reenviar documento
        actorRole: UserRole.ADMIN,
        actorId: rejectedBy,
        comment: `Documento "${doc.documentType}" rejeitado - Aguardando reenvio`,
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
  async onStageCompleted(stageId: string, completedBy: string, result?: string, notes?: string) {
    const stage = await prisma.protocolStage.findUnique({
      where: { id: stageId },
      include: { protocol: { include: { stages: true } } }
    });
    if (!stage) return;

    const stageMetadata = stage.metadata as any;
    const finalResult = result || (stage as any).result;
    const stageType = stageMetadata?.stageType;

    if (finalResult === 'REJECTED') {
      const rejector = await prisma.user.findUnique({ where: { id: completedBy }, select: { name: true } });
      await protocolStatusEngine.updateStatus({
        protocolId: stage.protocolId,
        newStatus: ProtocolStatus.PENDENCIA,
        actorRole: UserRole.ADMIN,
        actorId: completedBy,
        comment: `Etapa "${stage.stageName}" rejeitada`,
        reason: notes
      });

      await this.pauseSLA(stage.protocolId, `Etapa rejeitada: ${stage.stageName}`);

      await interactionService.createInteraction({
        protocolId: stage.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SERVER',
        authorId: completedBy,
        authorName: rejector?.name || 'Servidor',
        message: `Seu protocolo foi rejeitado na etapa "${stage.stageName}". Motivo: ${notes || 'Nao informado'}.`,
        isInternal: false
      });

      return;
    }

    if (stageType === 'RECEPTION' && finalResult === 'APPROVED') {
      const approver = await prisma.user.findUnique({ where: { id: completedBy }, select: { name: true } });
      await interactionService.createInteraction({
        protocolId: stage.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SERVER',
        authorId: completedBy,
        authorName: approver?.name || 'Servidor',
        message: 'Seu protocolo foi aceito e iniciou o fluxo de atendimento.',
        isInternal: false
      });
    }

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

      // ═══ ATRIBUIR CATEGORIAS AO CIDADÃO ═══
      await this.assignCitizenCategories(stage.protocolId, completedBy);

      // Interação de conclusão
      const completer = await prisma.user.findUnique({ where: { id: completedBy }, select: { name: true } });
      await interactionService.createInteraction({
        protocolId: stage.protocolId,
        type: 'STATUS_CHANGED', // Usar tipo existente
        authorType: 'SERVER',
        authorId: completedBy,
        authorName: completer?.name || 'Servidor',
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
          const stageCompleter = await prisma.user.findUnique({ where: { id: completedBy }, select: { name: true } });
          await interactionService.createInteraction({
            protocolId: stage.protocolId,
            type: 'STATUS_CHANGED',
            authorType: 'SERVER',
            authorId: completedBy,
            authorName: stageCompleter?.name || 'Servidor',
            message: `Etapa "${stage.stageName}" concluída. Iniciando: "${nextStage.stageName}"`,
            isInternal: false
          });
        } else {
          // Há bloqueios - criar pendência
          console.log(`⚠️ [Orchestrator] Não pode iniciar stage. Bloqueios: ${validation.blockers.join(', ')}`);

          await pendingService.createInformationPending(
            stage.protocolId,
            `Pré-requisitos pendentes para: ${nextStage.stageName}`,
            validation.blockers.join('\n'),
            completedBy,
            undefined,
            {
              stageId: nextStage.id,
              sourceType: 'STAGE_VALIDATION',
            }
          );
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
      stageId,
      type: PendingType.VALIDATION,
      title: `Etapa "${stage.stageName}" falhou`,
      description: reason,
      blocksProgress: true,
      requiresReview: false,
      sourceType: 'STAGE_FAILURE',
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
        status: { in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS, PendingStatus.UNDER_REVIEW] }
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
      const resolver = await prisma.user.findUnique({ where: { id: resolvedBy }, select: { name: true } });
      await interactionService.createInteraction({
        protocolId: pending.protocolId,
        type: 'STATUS_CHANGED',
        authorType: 'SERVER',
        authorId: resolvedBy,
        authorName: resolver?.name || 'Servidor',
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
        }
      });

      const requiredDocuments = Array.isArray(metadata.requiredDocuments)
        ? metadata.requiredDocuments.filter((value: unknown): value is string => typeof value === 'string')
        : [];
      const missingDocuments: string[] = [];
      const awaitingReviewDocuments: string[] = [];
      const rejectedDocuments: string[] = [];

      for (const requiredDocument of requiredDocuments) {
        const matchingDocuments = docs.filter((document) =>
          matchDocumentType(document.documentType || document.fileName || '', requiredDocument)
        );

        if (matchingDocuments.some((document) => document.status === DocumentStatus.APPROVED)) {
          continue;
        }

        if (matchingDocuments.some(
          (document) =>
            document.status === DocumentStatus.UPLOADED ||
            document.status === DocumentStatus.UNDER_REVIEW
        )) {
          awaitingReviewDocuments.push(requiredDocument);
          continue;
        }

        if (matchingDocuments.some((document) => document.status === DocumentStatus.REJECTED)) {
          rejectedDocuments.push(requiredDocument);
          continue;
        }

        missingDocuments.push(requiredDocument);
      }

      if (missingDocuments.length > 0) {
        blockers.push(`Documentos não enviados: ${missingDocuments.join(', ')}`);
      }

      if (awaitingReviewDocuments.length > 0) {
        blockers.push(`Documentos enviados aguardando aprovação: ${awaitingReviewDocuments.join(', ')}`);
      }

      if (rejectedDocuments.length > 0) {
        blockers.push(`Documentos rejeitados aguardando reenvio: ${rejectedDocuments.join(', ')}`);
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

  /**
   * ═══════════════════════════════════════════════════════════════════
   * ATRIBUIÇÃO DE CATEGORIAS AO CIDADÃO
   * ═══════════════════════════════════════════════════════════════════
   *
   * Atribui automaticamente categorias ao cidadão após conclusão do protocolo
   * baseado no moduleType do serviço solicitado.
   */
  private async assignCitizenCategories(protocolId: string, assignedBy: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        select: {
          id: true,
          citizenId: true,
          moduleType: true,
          service: {
            select: {
              name: true
            }
          }
        }
      });

      if (!protocol || !protocol.moduleType) {
        console.log(`⚠️ [Orchestrator] Protocolo sem moduleType, pulando categorização`);
        return;
      }

      console.log(`🏷️ [Orchestrator] Verificando categorias para moduleType: ${protocol.moduleType}`);

      // Atribuir categorias automaticamente
      const results = await categoryService.autoAssignCategoriesByProtocol(
        protocol.id,
        protocol.citizenId,
        protocol.moduleType,
        assignedBy
      );

      if (results.length > 0) {
        const newCategories = results.filter(r => r.isNew && r.success);
        const reactivatedCategories = results.filter(r => !r.isNew && r.success);

        if (newCategories.length > 0) {
          console.log(`✅ [Orchestrator] ${newCategories.length} categoria(s) atribuída(s) ao cidadão`);

          // Criar interação informativa
          const categoryNames = newCategories
            .map(r => r.assignment?.category?.name || 'Categoria')
            .join(', ');

          await interactionService.createInteraction({
            protocolId: protocol.id,
            type: 'NOTE',
            authorType: 'SERVER',
            authorId: assignedBy,
            authorName: 'Sistema',
            message: `🏷️ Categoria(s) atribuída(s): ${categoryNames}`,
            isInternal: true
          });
        }

        if (reactivatedCategories.length > 0) {
          console.log(`🔄 [Orchestrator] ${reactivatedCategories.length} categoria(s) reativada(s)`);
        }
      } else {
        console.log(`ℹ️ [Orchestrator] Nenhuma categoria configurada para este serviço`);
      }
    } catch (error) {
      console.error(`❌ [Orchestrator] Erro ao atribuir categorias:`, error);
      // Não falhar o workflow por erro na categorização
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 7: CAMPO DE DADOS REJEITADO
   * ═══════════════════════════════════════════════════════════════════
   */
  async onDataFieldRejected(fieldId: string, rejectedBy: string, reason: string) {
    const field = await prisma.protocolDataField.findUnique({
      where: { id: fieldId },
      select: { protocolId: true, fieldLabel: true, isRequired: true }
    });

    if (!field) return;

    console.log(`❌ [Orchestrator] Campo de dados rejeitado: ${field.fieldLabel}`);

    // 1. Pendência já foi criada pelo service ✅

    // 2. Status já foi atualizado para ATUALIZACAO se obrigatório ✅

    // 3. Pausar SLA
    await this.pauseSLA(
      field.protocolId,
      `Aguardando correção de campo: ${field.fieldLabel}`
    );

    // 4. Criar interação para cidadão
    await interactionService.createInteraction({
      protocolId: field.protocolId,
      type: 'STATUS_CHANGED',
      authorType: 'SERVER',
      authorId: rejectedBy,
      authorName: 'Analista',
      message: `⚠️ O campo "${field.fieldLabel}" foi rejeitado. Motivo: ${reason}. Por favor, corrija o campo na aba Dados.`,
      isInternal: false
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 8: CAMPO DE DADOS CORRIGIDO
   * ═══════════════════════════════════════════════════════════════════
   */
  async onDataFieldCorrected(fieldId: string, correctedBy: string) {
    const field = await prisma.protocolDataField.findUnique({
      where: { id: fieldId },
      select: { protocolId: true, fieldLabel: true }
    });

    if (!field) return;

    console.log(`📝 [Orchestrator] Campo de dados corrigido: ${field.fieldLabel}`);

    // 1. A resposta do cidadão foi recebida e está aguardando reanálise.
    // O protocolo só deve retomar quando o servidor aprovar o campo novamente.

    // 2. Verificar se ainda há campos obrigatórios rejeitados
    const hasRejectedRequired = await prisma.protocolDataField.count({
      where: {
        protocolId: field.protocolId,
        isRequired: true,
        status: { in: ['REJECTED'] }
      }
    });

    // Se não houver mais campos rejeitados, registrar que o material foi enviado para revisão.
    if (hasRejectedRequired === 0) {
      await interactionService.createInteraction({
        protocolId: field.protocolId,
        type: 'NOTE',
        authorType: 'SYSTEM',
        authorId: correctedBy,
        authorName: 'Sistema',
        message: `Recebemos a correção do campo "${field.fieldLabel}". A resposta foi enviada para reanálise da equipe.`,
        isInternal: false
      });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * EVENTO 9: CAMPO DE DADOS APROVADO
   * ═══════════════════════════════════════════════════════════════════
   * ✅ ALINHADO COM SISTEMA DE DOCUMENTOS - Aprovação automática robusta
   */
  async onDataFieldApproved(fieldId: string, approvedBy: string) {
    const field = await prisma.protocolDataField.findUnique({
      where: { id: fieldId },
      include: {
        protocol: {
          include: {
            stages: true // ✅ Buscar TODAS as stages para encontrar a correta
          }
        }
      }
    });

    if (!field) return;

    console.log(`✅ [Orchestrator] Campo de dados aprovado: ${field.fieldLabel}`);

    const correctionCandidates = await prisma.protocolPending.findMany({
      where: {
        protocolId: field.protocolId,
        type: 'CORRECTION',
        status: { in: [PendingStatus.OPEN, PendingStatus.IN_PROGRESS, PendingStatus.UNDER_REVIEW] },
      }
    });

    const fieldPendings = correctionCandidates.filter((pending) => {
      const metadata = pending.metadata && typeof pending.metadata === 'object'
        ? pending.metadata as Record<string, any>
        : {};

      return metadata.fieldId === field.id || metadata.fieldKey === field.fieldKey;
    });

    for (const pending of fieldPendings) {
      await pendingService.resolvePending(
        pending.id,
        approvedBy,
        'Campo revisado e aprovado pela equipe'
      );
    }

    // Verificar se todos os campos obrigatórios foram aprovados
    const stats = await prisma.protocolDataField.groupBy({
      by: ['status'],
      where: {
        protocolId: field.protocolId,
        isRequired: true
      },
      _count: true
    });

    const requiredCount = stats.reduce((acc, s) => acc + s._count, 0);
    const approvedCount = stats.find(s => s.status === 'APPROVED')?._count || 0;

    if (requiredCount === approvedCount && requiredCount > 0) {
      console.log(`🎉 [Orchestrator] Todos os ${requiredCount} campos obrigatórios aprovados!`);

      // ✅ NOVO: Buscar stage atual de "Análise de Dados" (IGUAL ao sistema de documentos)
      const currentStage = field.protocol.stages.find((s: any) =>
        s.status === StageStatus.IN_PROGRESS &&
        (s.stageName.toLowerCase().includes('análise') ||
         s.stageName.toLowerCase().includes('dados') ||
         s.stageName.toLowerCase().includes('validação') ||
         s.stageName.toLowerCase().includes('validacao'))
      );

      if (currentStage) {
        // ✅ Completar stage automaticamente (SEMPRE, independente de metadata)
        console.log(`🚀 [Orchestrator] Completando stage automaticamente: ${currentStage.stageName}`);

        await stageService.completeStage(
          currentStage.id,
          approvedBy,
          'APPROVED',
          'Todos os campos obrigatórios foram aprovados'
        );

        // ✅ Criar interação de sucesso
        const approver = await prisma.user.findUnique({
          where: { id: approvedBy },
          select: { name: true }
        });

        await interactionService.createInteraction({
          protocolId: field.protocolId,
          type: 'STATUS_CHANGED',
          authorType: 'SERVER',
          authorId: approvedBy,
          authorName: approver?.name || 'Servidor',
          message: '✅ Dados aprovados! Seu protocolo avançou no fluxo.',
          isInternal: false
        });

        // ✅ O onStageCompleted será chamado automaticamente e avançará para próxima stage

      } else {
        // ✅ Se não há stage específica de análise de dados, mudar protocolo para PROGRESSO
        if (field.protocol.status === ProtocolStatus.VINCULADO) {
          await protocolStatusEngine.updateStatus({
            protocolId: field.protocolId,
            newStatus: ProtocolStatus.PROGRESSO,
            actorRole: UserRole.ADMIN,
            actorId: approvedBy,
            comment: 'Dados completos e aprovados'
          });
        }

        // ✅ Criar interação informativa
        const approver = await prisma.user.findUnique({
          where: { id: approvedBy },
          select: { name: true }
        });

        await interactionService.createInteraction({
          protocolId: field.protocolId,
          type: 'STATUS_CHANGED',
          authorType: 'SERVER',
          authorId: approvedBy,
          authorName: approver?.name || 'Servidor',
          message: `✅ Todos os ${requiredCount} campos obrigatórios foram aprovados!`,
          isInternal: false
        });
      }
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const workflowOrchestrator = new ProtocolWorkflowOrchestrator();
