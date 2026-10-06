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
import { assignTagsOnProtocolConcluded } from './citizen-tags.service';
import { matchDocumentType } from '../utils/document-mapping';
import {
  autoAssignProtocolToStageResponsible,
  resolveStageAutomaticAssignment
} from './protocolAssignmentService';

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

function getPendingRequestedDocumentTypes(metadata: unknown): string[] {
  const source =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null;

  if (!source) return [];

  const requestedTypes = new Set<string>();

  const pushValue = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed) {
      requestedTypes.add(trimmed);
    }
  };

  pushValue(source.documentType);

  if (Array.isArray(source.documentTypes)) {
    for (const documentType of source.documentTypes) {
      pushValue(documentType);
    }
  }

  if (Array.isArray(source.documentRequests)) {
    for (const item of source.documentRequests) {
      if (!item || typeof item !== 'object') continue;
      const documentRequest = item as Record<string, unknown>;
      pushValue(documentRequest.documentType);
      pushValue(documentRequest.label);
      pushValue(documentRequest.documentId);
    }
  }

  return Array.from(requestedTypes);
}

const TERMINAL_STATUSES: ProtocolStatus[] = [ProtocolStatus.CONCLUIDO, ProtocolStatus.CANCELADO];
const ACTIVE_PENDING: PendingStatus[] = [PendingStatus.OPEN, PendingStatus.IN_PROGRESS, PendingStatus.UNDER_REVIEW];

export { isDocumentAnalysisStage } from './pending-rules';
import { isDocumentAnalysisStage } from './pending-rules';

export type PendingCloseKind = 'RESOLVED' | 'CANCELLED' | 'EXPIRED' | 'DELETED';

const CLOSE_MESSAGES: Record<PendingCloseKind, string> = {
  RESOLVED: '✅ Pendências resolvidas! Seu protocolo voltou ao andamento normal.',
  CANCELLED: 'A equipe cancelou a pendência. Seu protocolo voltou ao andamento normal.',
  EXPIRED: 'O prazo da pendência terminou sem resposta. Seu protocolo voltou para a equipe decidir os próximos passos.',
  DELETED: 'A pendência foi retirada pela equipe. Seu protocolo voltou ao andamento normal.',
};

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

    const protocolDocuments = await documentService.getProtocolDocuments(doc.protocolId);

    const documentPendings = candidateDocumentPendings.filter((pending) => {
      const requestedTypes = getPendingRequestedDocumentTypes(pending.metadata);
      return requestedTypes.some((requestedType) =>
        matchDocumentType(doc.documentType, requestedType)
      );
    });

    if (documentPendings.length > 0) {
      console.log(`🔄 [Orchestrator] Resolvendo ${documentPendings.length} pendência(s) do documento ${doc.documentType}`);

      for (const pending of documentPendings) {
        const requestedTypes = getPendingRequestedDocumentTypes(pending.metadata);
        const shouldResolveAutomatically =
          requestedTypes.length === 0 ||
          requestedTypes.every((requestedType) =>
            protocolDocuments.some((document) =>
              document.status === DocumentStatus.APPROVED &&
              matchDocumentType(document.documentType || document.fileName || '', requestedType)
            )
          );

        if (!shouldResolveAutomatically) {
          console.log(
            `ℹ️ [Orchestrator] Pendência ${pending.id} ainda aguarda outros documentos: ${requestedTypes.join(', ')}`
          );
          continue;
        }

        try {
          await pendingService.resolvePending(
            pending.id,
            approvedBy,
            `Documento aprovado automaticamente pelo sistema`
          );
        } catch (error) {
          console.error('[workflow-orchestrator] Falha ao resolver pendência de documento automaticamente:', {
            pendingId: pending.id,
            protocolId: doc.protocolId,
            documentId,
            documentType: doc.documentType,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    await this.advanceIfAllDocumentsApproved(doc.protocolId, approvedBy);
  }

  /**
   * Quando TODOS os documentos obrigatórios estão aprovados: conclui a etapa
   * de análise documental em andamento ou tira o protocolo de "Vinculado".
   */
  async advanceIfAllDocumentsApproved(protocolId: string, approvedBy: string) {
    const allDocsApproved = await documentService.checkAllDocumentsApproved(protocolId);
    if (!allDocsApproved.allApproved) return;

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: { stages: true }
    });
    if (!protocol || TERMINAL_STATUSES.includes(protocol.status)) return;

    console.log(`✅ [Orchestrator] Todos documentos aprovados!`);
    let advanced = false;

    const currentStage = protocol.stages.find(s =>
      s.status === StageStatus.IN_PROGRESS && isDocumentAnalysisStage(s)
    );

    if (currentStage) {
      console.log(`🎯 [Orchestrator] Completando stage: ${currentStage.stageName}`);
      await stageService.completeStage(
        currentStage.id,
        approvedBy,
        'APPROVED',
        'Todos os documentos obrigatórios foram aprovados'
      );
      advanced = true;
    } else if (protocol.status === ProtocolStatus.VINCULADO) {
      await protocolStatusEngine.updateStatus({
        protocolId,
        newStatus: ProtocolStatus.PROGRESSO,
        actorRole: 'SYSTEM', // transição automática do orquestrador
        actorId: approvedBy,
        comment: 'Documentação completa e aprovada'
      });
      advanced = true;
    }

    // Só avisa quando algo andou (antes repetia a cada documento aprovado)
    if (advanced) {
      const approver = await prisma.user.findUnique({ where: { id: approvedBy }, select: { name: true } });
      await interactionService.createInteraction({
        protocolId,
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
      select: { protocolId: true, documentType: true, protocol: { select: { status: true } } }
    });

    if (!doc || TERMINAL_STATUSES.includes(doc.protocol.status)) return;

    console.log(`❌ [Orchestrator] Documento rejeitado: ${doc.documentType}`);

    // 1. Já existe pendência pedindo este documento? Reaproveita (antes nascia
    //    uma segunda e a primeira ficava "em análise" travando o protocolo)
    const activeDocumentPendings = await prisma.protocolPending.findMany({
      where: { protocolId: doc.protocolId, type: PendingType.DOCUMENT, status: { in: ACTIVE_PENDING } }
    });
    const related = activeDocumentPendings.filter((pending) =>
      getPendingRequestedDocumentTypes(pending.metadata).some((requestedType) =>
        matchDocumentType(doc.documentType, requestedType)
      )
    );

    if (related.length > 0) {
      for (const pending of related) {
        if (pending.status === PendingStatus.UNDER_REVIEW) {
          await pendingService.reopenPending(pending.id, rejectedBy, reason);
        }
      }
    } else {
      // 2. Situação vai direto para "Atualização" (aguarda o cidadão reenviar).
      //    Antes passava por "Pendência" e logo "Atualização": dois avisos seguidos
      await protocolStatusEngine.updateStatus({
        protocolId: doc.protocolId,
        newStatus: ProtocolStatus.ATUALIZACAO,
        actorRole: 'SYSTEM',
        actorId: rejectedBy,
        comment: `Documento "${doc.documentType}" rejeitado - Aguardando reenvio`,
        reason: reason
      });

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
    }

    // 3. Pausar SLA
    await this.pauseSLA(doc.protocolId, `Aguardando reenvio de documento: ${doc.documentType}`);

    // 4. Criar interação para cidadão
    const rejector = await prisma.user.findUnique({ where: { id: rejectedBy }, select: { name: true } });
    await interactionService.createInteraction({
      protocolId: doc.protocolId,
      type: 'STATUS_CHANGED', // Usar tipo existente
      authorType: 'SERVER',
      authorId: rejectedBy,
      authorName: rejector?.name || 'Analista',
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
        actorRole: 'SYSTEM',
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
        actorRole: 'SYSTEM', // transição automática do orquestrador
        actorId: completedBy,
        comment: 'Todas as etapas do workflow foram concluídas com sucesso',
        reason: 'workflow_completed'
      });

      // SLA é finalizado pelo próprio engine em status terminal
      // (finalizeSLA dentro da transação da transição).

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
        const automaticAssignment = await resolveStageAutomaticAssignment(stage.protocolId, nextStage.id);

        if (automaticAssignment.blocked && automaticAssignment.blocker) {
          validation.canProgress = false;
          validation.blockers = [...validation.blockers, automaticAssignment.blocker];
        }

        if (validation.canProgress) {
          const stageCompleter = await prisma.user.findUnique({
            where: { id: completedBy },
            select: { name: true }
          });

          if (automaticAssignment.matched && automaticAssignment.assignee) {
            await stageService.startStage(nextStage.id, {
              assignedToUserId: automaticAssignment.assignee.userId
            });

            await autoAssignProtocolToStageResponsible({
              protocolId: stage.protocolId,
              stageId: nextStage.id,
              assignedById: completedBy,
              assignedByName: stageCompleter?.name || 'Servidor',
              notifyCitizen: false
            });
          } else {
            await stageService.startStage(nextStage.id, completedBy);
          }

          // Interação informativa
          await interactionService.createInteraction({
            protocolId: stage.protocolId,
            type: 'STATUS_CHANGED',
            authorType: 'SERVER',
            authorId: completedBy,
            authorName: stageCompleter?.name || 'Servidor',
            message:
              automaticAssignment.matched && automaticAssignment.assignee
                ? `Etapa "${stage.stageName}" concluída. Iniciando "${nextStage.stageName}" com responsável ${automaticAssignment.assignee.name}.`
                : `Etapa "${stage.stageName}" concluída. Iniciando: "${nextStage.stageName}"`,
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
      actorRole: 'SYSTEM', // transição automática do orquestrador
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

    if (TERMINAL_STATUSES.includes(pending.protocol.status)) return;

    // 1. Mudar protocolo para PENDENCIA (se já não estiver aguardando o cidadão)
    if (
      pending.protocol.status !== ProtocolStatus.PENDENCIA &&
      pending.protocol.status !== ProtocolStatus.ATUALIZACAO
    ) {
      await protocolStatusEngine.updateStatus({
        protocolId: pending.protocolId,
        newStatus: ProtocolStatus.PENDENCIA,
        actorRole: 'SYSTEM', // transição automática do orquestrador
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
      select: { protocolId: true, blocksProgress: true }
    });
    if (!pending) return;

    await this.onPendingClosed({ ...pending, pendingId, actorId: resolvedBy, kind: 'RESOLVED' });
  }

  /**
   * Pendência fechada de QUALQUER jeito (resolvida, cancelada, expirada,
   * apagada). Se era a última que travava, o protocolo volta ao andamento e o
   * prazo é retomado. Antes só a resolução fazia isso: cancelar ou expirar
   * deixava o protocolo parado em "Pendência" com o prazo pausado para sempre.
   */
  async onPendingClosed(input: {
    protocolId: string;
    pendingId: string;
    blocksProgress: boolean;
    actorId: string;
    kind: PendingCloseKind;
  }) {
    if (!input.blocksProgress) return;

    const otherBlockers = await prisma.protocolPending.count({
      where: {
        protocolId: input.protocolId,
        id: { not: input.pendingId },
        blocksProgress: true,
        status: { in: ACTIVE_PENDING }
      }
    });
    if (otherBlockers > 0) return;

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: input.protocolId },
      select: { status: true }
    });
    if (!protocol || TERMINAL_STATUSES.includes(protocol.status)) return;

    console.log(`✅ [Orchestrator] Nenhuma pendência travando (${input.kind}). Retomando workflow.`);

    if (protocol.status === ProtocolStatus.PENDENCIA || protocol.status === ProtocolStatus.ATUALIZACAO) {
      // o motor de status também retoma o prazo ao entrar em PROGRESSO
      await protocolStatusEngine.updateStatus({
        protocolId: input.protocolId,
        newStatus: ProtocolStatus.PROGRESSO,
        actorRole: 'SYSTEM', // transição automática do orquestrador
        actorId: input.actorId,
        comment: input.kind === 'EXPIRED'
          ? 'Pendência encerrada por falta de resposta, protocolo retomado'
          : 'Pendências resolvidas, protocolo retomado',
        metadata: { pendingId: input.pendingId }
      });
    }
    await this.resumeSLA(input.protocolId);

    const currentStage = await stageService.getCurrentStage(input.protocolId);
    if (currentStage && currentStage.status === StageStatus.PENDING) {
      await stageService.startStage(currentStage.id, input.actorId);
    }

    const actor = await prisma.user.findUnique({ where: { id: input.actorId }, select: { name: true } });
    await interactionService.createInteraction({
      protocolId: input.protocolId,
      type: 'STATUS_CHANGED',
      authorType: actor ? 'SERVER' : 'SYSTEM',
      authorId: actor ? input.actorId : undefined,
      authorName: actor?.name || 'Sistema',
      message: CLOSE_MESSAGES[input.kind],
      isInternal: false
    });
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
    if (await slaService.resumePausedSla(protocolId)) {
      console.log(`▶️ [Orchestrator] SLA retomado`);
    }
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
    const assigned = await assignTagsOnProtocolConcluded(protocolId);
    const fresh = assigned.filter((tag) => tag.isNew);
    if (fresh.length === 0) return;
    try {
      await interactionService.createInteraction({
        protocolId,
        type: 'NOTE',
        authorType: 'SERVER',
        authorId: assignedBy,
        authorName: 'Sistema',
        message: `Etiqueta(s) do cidadão: ${fresh.map((tag) => tag.name).join(', ')}`,
        isInternal: true
      });
    } catch (error) {
      console.error('[Orchestrator] nota de etiqueta não registrada:', error);
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
            actorRole: 'SYSTEM',
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
