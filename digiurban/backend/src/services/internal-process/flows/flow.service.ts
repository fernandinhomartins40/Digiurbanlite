/**
 * Etapas e documentos dos fluxos de contratação (Lei 14.133/2021) dentro do
 * processo interno. Avançar de etapa exige os documentos da etapa feitos e,
 * quando a lei pede, assinados.
 */

import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { tryGetTenantId } from '../../../lib/tenant-context';
import { addWorkingDays } from '../../protocol-sla.service';
import notificationService from '../../notification.service';
import { InternalProcessError } from '../internal-process.service';
import { canActOnProcess, canViewProcess, isOpen, ProcessActor } from '../rules';
import { dispensaLimitWarning, FlowDefinition, getFlow, getStage, missingForStage, nextStage } from './flows';
import { DOCUMENT_TEMPLATES, fillTemplate } from './templates';

const nestedTenant = () => ({ tenantId: tryGetTenantId() || null });

async function loadProcess(actor: ProcessActor, id: string, mustAct: boolean) {
  const process = await prisma.internalProcess.findFirst({
    where: { id },
    include: { movements: { select: { fromUnitId: true, toUnitId: true, toUserId: true, userId: true } } },
  });
  if (!process) throw new InternalProcessError('Processo não encontrado', 404);
  const access = {
    ...process,
    involvedUnitIds: process.movements.flatMap((move) => [move.fromUnitId, move.toUnitId]).filter(Boolean) as string[],
    involvedUserIds: process.movements.flatMap((move) => [move.userId, move.toUserId]).filter(Boolean) as string[],
  };
  if (!canViewProcess(actor, access)) throw new InternalProcessError('Processo não encontrado', 404);
  if (mustAct) {
    if (!isOpen(process.status)) throw new InternalProcessError('Este processo já foi encerrado.');
    if (!canActOnProcess(actor, process)) throw new InternalProcessError('O processo não está com a sua unidade.', 403);
  }
  return process;
}

/** Etapas com situação (feita / atual / a fazer) e o que falta na atual */
export function buildFlowView(flow: FlowDefinition, stageKey: string | null, documents: Array<{ templateKey: string; signedAt: Date | null }>) {
  const currentIndex = flow.stages.findIndex((stage) => stage.key === stageKey);
  return {
    key: flow.key,
    name: flow.name,
    stages: flow.stages.map((stage, index) => ({
      key: stage.key,
      name: stage.name,
      legal: stage.legal,
      description: stage.description,
      checklist: stage.checklist,
      requiredDocs: stage.requiredDocs.map((key) => ({ key, title: DOCUMENT_TEMPLATES[key]?.title || key, mustSign: (stage.signedDocs || []).includes(key) })),
      optionalDocs: (stage.optionalDocs || []).map((key) => ({ key, title: DOCUMENT_TEMPLATES[key]?.title || key })),
      days: stage.days,
      owner: stage.owner,
      status: currentIndex < 0 ? 'done' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
    })),
    missing: currentIndex >= 0 ? missingForStage(flow.stages[currentIndex], documents).map(humanMissing) : [],
    isLast: currentIndex === flow.stages.length - 1,
  };
}

function humanMissing(item: string): string {
  const [kind, key] = item.split(': ');
  const title = DOCUMENT_TEMPLATES[key]?.title || key;
  return kind === 'assinatura' ? `Assinar: ${title}` : `Fazer: ${title}`;
}

export function flowWarnings(flowKey: string | null, fields: Record<string, any> | null): string[] {
  if (flowKey !== 'DISPENSA') return [];
  const warning = dispensaLimitWarning({ hipotese: fields?.hipotese, valorEstimado: fields?.valorEstimado });
  return warning ? [warning] : [];
}

/** Novo documento a partir do modelo, já preenchido com os dados do processo */
export async function createDocument(actor: ProcessActor & { name: string }, processId: string, templateKey: string) {
  const process = await loadProcess(actor, processId, true);
  const template = DOCUMENT_TEMPLATES[templateKey];
  if (!template) throw new InternalProcessError('Modelo não encontrado.');

  const tenantId = tryGetTenantId();
  const [tenant, user, assignment] = await Promise.all([
    tenantId ? prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true, nomeMunicipio: true } }).catch(() => null) : Promise.resolve(null),
    prisma.user.findFirst({ where: { id: actor.id }, select: { name: true } }),
    prisma.employeeAssignment.findFirst({ where: { userId: actor.id, isPrimary: true }, select: { position: { select: { nome: true } } } }).catch(() => null),
  ]);
  const content = fillTemplate(template, {
    municipio: (tenant as any)?.nome || 'Prefeitura Municipal',
    cidade: (tenant as any)?.nomeMunicipio || '',
    unidade: process.currentUnitName,
    numero: process.number,
    objeto: process.subject,
    responsavel: user?.name || actor.name,
    cargo: (assignment as any)?.position?.nome || '',
    flowKey: process.flowKey,
    fields: (process.fields as Record<string, any>) || {},
  });
  const document = await prisma.internalProcessDocument.create({
    data: { processId, templateKey, title: template.title, stageKey: process.stageKey, content, createdById: actor.id, createdByName: actor.name },
  });
  await prisma.internalProcessMovement.create({
    data: { processId, action: 'DOCUMENTO', note: `Documento criado: ${template.title}`, userId: actor.id, userName: actor.name, readAt: new Date() },
  });
  return document;
}

export async function getDocument(actor: ProcessActor, documentId: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  const process = await loadProcess(actor, document.processId, false);
  return { document, canEdit: !document.signedAt && isOpen(process.status) && canActOnProcess(actor, process), process: { id: process.id, number: process.number } };
}

/** Editar o texto (documento assinado não muda — faça uma nova versão) */
export async function updateDocument(actor: ProcessActor & { name: string }, documentId: string, content: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  await loadProcess(actor, document.processId, true);
  if (document.signedAt) throw new InternalProcessError('Documento assinado não pode ser alterado. Crie uma nova versão a partir do modelo.');
  const text = String(content || '');
  if (text.trim().length < 10) throw new InternalProcessError('O documento ficou vazio.');
  return prisma.internalProcessDocument.update({
    where: { id: documentId },
    data: { content: text.slice(0, 100000), updatedById: actor.id, updatedByName: actor.name },
  });
}

export async function deleteDocument(actor: ProcessActor & { name: string }, documentId: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  await loadProcess(actor, document.processId, true);
  if (document.signedAt) throw new InternalProcessError('Documento assinado não pode ser apagado.');
  await prisma.internalProcessDocument.delete({ where: { id: documentId } });
}

export function documentHash(document: { id: string; title: string; content: string }, userId: string, signedAt: Date) {
  return createHash('sha256').update(`${document.id}|${document.title}|${document.content}|${userId}|${signedAt.toISOString()}`).digest('hex');
}

/** Assinar o documento (pede a senha). Depois de assinado, o texto fica travado. */
export async function signDocument(actor: ProcessActor & { name: string }, documentId: string, password: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  await loadProcess(actor, document.processId, true);
  if (document.signedAt) throw new InternalProcessError('Este documento já foi assinado.');
  const user = await prisma.user.findFirst({ where: { id: actor.id }, select: { password: true, name: true } });
  if (!user || !password || !(await bcrypt.compare(password, user.password))) throw new InternalProcessError('Senha incorreta.');
  const signedAt = new Date();
  const hash = documentHash(document, actor.id, signedAt);
  const code = hash.slice(0, 16).toUpperCase().match(/.{1,4}/g)!.join('-');
  const updated = await prisma.internalProcessDocument.update({
    where: { id: documentId },
    data: { signatureHash: hash, signedById: actor.id, signedByName: user.name, signedAt },
  });
  await prisma.internalProcessMovement.create({
    data: { processId: document.processId, action: 'ASSINADO', note: `${document.title} assinado por ${user.name} — código ${code}`, userId: actor.id, userName: user.name, readAt: signedAt },
  });
  return { document: updated, code };
}

/** Concluir a etapa atual e ir para a próxima (só com os documentos da etapa prontos) */
export async function advanceStage(actor: ProcessActor & { name: string }, processId: string, note?: string) {
  const process = await loadProcess(actor, processId, true);
  const flow = getFlow(process.flowKey);
  if (!flow) throw new InternalProcessError('Este processo não tem etapas.');
  const stage = getStage(flow, process.stageKey);
  if (!stage) throw new InternalProcessError('Etapa atual não encontrada.');
  const documents = await prisma.internalProcessDocument.findMany({ where: { processId }, select: { templateKey: true, signedAt: true } });
  const missing = missingForStage(stage, documents);
  if (missing.length) throw new InternalProcessError(`Para concluir "${stage.name}" falta: ${missing.map(humanMissing).join('; ')}.`);

  const next = nextStage(flow, stage.key);
  if (!next) throw new InternalProcessError('Esta é a última etapa. Conclua o processo.');
  const warnings = flowWarnings(process.flowKey, process.fields as Record<string, any>);
  const updated = await prisma.internalProcess.update({
    where: { id: processId },
    data: {
      stageKey: next.key,
      stageDueAt: addWorkingDays(new Date(), next.days),
      movements: {
        create: {
          ...nestedTenant(),
          action: 'ETAPA',
          note: `Etapa concluída: ${stage.name}. Próxima: ${next.name} (${next.legal}) — conduz: ${next.owner}.${note ? `\n${String(note).slice(0, 2000)}` : ''}`,
          userId: actor.id,
          userName: actor.name,
          readAt: new Date(),
        },
      },
    },
  });
  return { process: updated, next, warnings };
}

/** Dados da contratação (valor, modalidade, critério, hipótese) */
export async function updateFields(actor: ProcessActor & { name: string }, processId: string, input: Record<string, any>) {
  const process = await loadProcess(actor, processId, true);
  const current = (process.fields as Record<string, any>) || {};
  const fields = {
    ...current,
    ...(input.valorEstimado !== undefined ? { valorEstimado: Math.max(0, Number(input.valorEstimado) || 0) } : {}),
    ...(typeof input.modalidade === 'string' ? { modalidade: input.modalidade.slice(0, 60) } : {}),
    ...(typeof input.criterio === 'string' ? { criterio: input.criterio.slice(0, 80) } : {}),
    ...(typeof input.hipotese === 'string' ? { hipotese: input.hipotese.slice(0, 200) } : {}),
  };
  await prisma.internalProcess.update({ where: { id: processId }, data: { fields } });
  return { fields, warnings: flowWarnings(process.flowKey, fields) };
}

/**
 * Rotina diária: etapa com prazo vencido avisa a unidade (uma vez por etapa).
 * Chamar no contexto de cada município.
 */
export async function notifyOverdueStages(): Promise<number> {
  const overdue = await prisma.internalProcess.findMany({
    where: { status: { in: ['ABERTO', 'EM_TRAMITE'] }, flowKey: { not: null }, stageDueAt: { lt: new Date() } },
    select: { id: true, number: true, subject: true, flowKey: true, stageKey: true, currentUnitId: true, currentUserId: true },
    take: 200,
  });
  let sent = 0;
  for (const process of overdue) {
    const marker = `Prazo da etapa vencido: ${process.stageKey}`;
    const already = await prisma.internalProcessMovement.findFirst({ where: { processId: process.id, action: 'PRAZO', note: { startsWith: marker } }, select: { id: true } });
    if (already) continue;
    const flow = getFlow(process.flowKey);
    const stage = flow ? getStage(flow, process.stageKey) : null;
    await prisma.internalProcessMovement.create({
      data: { processId: process.id, action: 'PRAZO', note: `${marker} (${stage?.name || ''})`, userId: 'sistema', userName: 'Sistema', toUnitId: process.currentUnitId },
    });
    const assignments = process.currentUserId
      ? [{ userId: process.currentUserId }]
      : await prisma.employeeAssignment.findMany({ where: { organizationalUnitId: process.currentUnitId, situacao: 'ATIVO' }, select: { userId: true }, take: 20 });
    for (const { userId } of assignments) {
      await notificationService
        .notify({
          recipientType: 'user',
          recipientId: userId,
          type: 'INTERNAL_PROCESS',
          title: `Prazo vencido: ${process.number}`,
          message: `A etapa "${stage?.name || process.stageKey}" passou do prazo. ${process.subject}`,
          data: { actionUrl: `/admin/processos-internos/${process.id}` },
        })
        .catch(() => undefined);
    }
    sent++;
  }
  return sent;
}
