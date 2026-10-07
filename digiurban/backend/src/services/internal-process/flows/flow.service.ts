/**
 * Etapas e documentos dos fluxos (Lei 14.133/2021 e fluxos próprios) dentro
 * do processo interno.
 *  - Avançar exige os documentos da etapa feitos e, quando a lei pede, assinados.
 *  - Ao avançar, o processo vai SOZINHO para a unidade do papel da próxima
 *    etapa ("quem faz cada etapa", configurado uma vez pelo município).
 *  - "Devolver para ajuste" volta uma etapa, para a unidade dela.
 *  - Pedido de assinatura a uma pessoa (fila de assinaturas), com coassinatura.
 */

import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { tryGetTenantId } from '../../../lib/tenant-context';
import { addWorkingDays } from '../../protocol-sla.service';
import notificationService from '../../notification.service';
import { getUnit, InternalProcessError, notifyUnit } from '../internal-process.service';
import { canActOnProcess, canViewProcess, isOpen, ProcessActor } from '../rules';
import {
  dispensaLimitWarning,
  FlowDefinition,
  flowBaseKey,
  getStage,
  missingForStage,
  nextStage,
  previousStage,
  resolveFlow,
  roleName,
  RoleRoute,
  stageRoute,
} from './flows';
import { getRoleUnits, RoleUnits, roleRoutes } from './roles.service';
import {
  answerRequest,
  createSignature,
  internalContentHash,
  listRequests,
  listSignatures,
  requestSignatures as requestDocumentSignatures,
  SignMeta,
  SigningError,
} from '../../signing/signature.service';
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


/** Etapas com situação (feita / atual / a fazer), para onde cada uma vai e o que falta na atual */
export function buildFlowView(
  flow: FlowDefinition,
  stageKey: string | null,
  documents: Array<{ templateKey: string; signedAt: Date | null }>,
  routing?: { origin: { id: string; name: string }; roleUnits: RoleUnits }
) {
  const currentIndex = flow.stages.findIndex((stage) => stage.key === stageKey);
  return {
    key: flow.key,
    baseKey: flowBaseKey(flow),
    name: flow.name,
    stages: flow.stages.map((stage, index) => {
      const target = routing ? stageRoute(stage, routing.origin, roleRoutes(routing.roleUnits)) : null;
      return {
        key: stage.key,
        name: stage.name,
        legal: stage.legal,
        description: stage.description,
        checklist: stage.checklist,
        requiredDocs: stage.requiredDocs.map((key) => ({ key, title: DOCUMENT_TEMPLATES[key]?.title || key, mustSign: (stage.signedDocs || []).includes(key) })),
        optionalDocs: (stage.optionalDocs || []).map((key) => ({ key, title: DOCUMENT_TEMPLATES[key]?.title || key })),
        days: stage.days,
        owner: stage.owner,
        role: stage.role,
        roleName: roleName(stage.role),
        unitId: target?.unitId || null,
        unitName: target?.unitName || null,
        userId: target?.userId || null,
        userName: target?.userName || null,
        status: currentIndex < 0 ? 'done' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
      };
    }),
    missing: currentIndex >= 0 ? missingForStage(flow.stages[currentIndex], documents).map(humanMissing) : [],
    isLast: currentIndex === flow.stages.length - 1,
    isFirst: currentIndex === 0,
  };
}

/** Visão do fluxo já com o encaminhamento (lê os papéis do município) */
export async function buildFlowViewFor(process: { flowKey: string | null; flowSnapshot?: unknown; stageKey: string | null; originUnitId: string; originUnitName: string }, documents: Array<{ templateKey: string; signedAt: Date | null }>) {
  const flow = resolveFlow(process);
  if (!flow) return null;
  const roleUnits = await getRoleUnits();
  return buildFlowView(flow, process.stageKey, documents, { origin: { id: process.originUnitId, name: process.originUnitName }, roleUnits });
}

export function humanMissing(item: string): string {
  const [kind, key] = item.split(': ');
  const title = DOCUMENT_TEMPLATES[key]?.title || key;
  return kind === 'assinatura' ? `Assinar: ${title}` : `Fazer: ${title}`;
}

export function flowWarnings(baseKey: string | null, fields: Record<string, any> | null): string[] {
  if (baseKey !== 'DISPENSA') return [];
  const warning = dispensaLimitWarning({ hipotese: fields?.hipotese, valorEstimado: fields?.valorEstimado });
  return warning ? [warning] : [];
}

/** Dados da contratação, limpos (valor, modalidade, critério, hipótese, ata) */
export function sanitizeFields(input: Record<string, any> | null | undefined, current: Record<string, any> = {}) {
  if (!input || typeof input !== 'object') return current;
  return {
    ...current,
    ...(input.valorEstimado !== undefined ? { valorEstimado: Math.max(0, Number(input.valorEstimado) || 0) } : {}),
    ...(typeof input.modalidade === 'string' ? { modalidade: input.modalidade.slice(0, 60) } : {}),
    ...(typeof input.criterio === 'string' ? { criterio: input.criterio.slice(0, 80) } : {}),
    ...(typeof input.hipotese === 'string' ? { hipotese: input.hipotese.slice(0, 200) } : {}),
    ...(typeof input.ata === 'string' ? { ata: input.ata.slice(0, 200) } : {}),
  };
}

/** Novo documento a partir do modelo, já preenchido com os dados do processo */
export async function createDocument(actor: ProcessActor & { name: string }, processId: string, templateKey: string) {
  const process = await loadProcess(actor, processId, true);
  const base = DOCUMENT_TEMPLATES[templateKey];
  if (!base) throw new InternalProcessError('Modelo não encontrado.');
  // o modelo do município (editável em Modelos de documentos) vale mais que o padrão
  const own = await prisma.documentTemplate.findFirst({
    where: { scope: 'INTERNAL_PROCESS', code: templateKey, isActive: true },
    select: { name: true, htmlTemplate: true },
  });
  const template = own ? { ...base, title: own.name || base.title, body: own.htmlTemplate || base.body } : base;

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
    flowKey: flowBaseKey(resolveFlow(process)),
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

const codeOf = (hash: string | null | undefined) => (hash ? hash.slice(0, 16).toUpperCase().match(/.{1,4}/g)!.join('-') : null);

export async function getDocument(actor: ProcessActor, documentId: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  const process = await loadProcess(actor, document.processId, false);
  const [requests, signed, legacy] = await Promise.all([
    listRequests('INTERNAL', documentId),
    listSignatures('INTERNAL', documentId),
    // assinaturas de antes do motor único (senha + código, sem certificado)
    signedSignaturesBeforeEngine(document),
  ]);
  const myRequest = requests.find((request) => request.userId === actor.id && request.status === 'PENDENTE') || null;
  const holder = isOpen(process.status) && canActOnProcess(actor, process);
  const signatures = [
    ...legacy,
    ...signed.map((item) => ({ name: item.signerName, signedAt: item.signedAt, code: item.code })),
  ];
  const mine = signed.some((item) => item.signerUserId === actor.id) || legacy.some((item) => item.userId === actor.id);
  return {
    document,
    canEdit: !document.signedAt && holder,
    canSign: isOpen(process.status) && !mine && (holder || !!myRequest),
    canRequest: holder,
    myRequest: myRequest ? { id: myRequest.id, requestedByName: myRequest.requestedByName, note: myRequest.note } : null,
    signatures,
    requests: requests.map((request) => ({
      id: request.id,
      userId: request.userId,
      userName: request.userName,
      requestedById: request.requestedById,
      requestedByName: request.requestedByName,
      status: request.status,
      answerNote: request.answerNote,
      createdAt: request.createdAt,
      signedAt: request.signedAt,
    })),
    process: { id: process.id, number: process.number },
  };
}

/** Assinaturas antigas (antes do motor único): a principal do documento e as coassinaturas */
async function signedSignaturesBeforeEngine(document: { id: string; signatureHash: string | null; signedAt: Date | null; signedByName: string | null; signedById: string | null }) {
  const hasEngine = await prisma.signature.findFirst({ where: { internalDocumentId: document.id }, select: { id: true } });
  const legacyMain = document.signedAt && document.signatureHash && !(hasEngine && (await prisma.signature.findFirst({ where: { internalDocumentId: document.id, signerUserId: document.signedById || '' }, select: { id: true } })))
    ? [{ name: document.signedByName, signedAt: document.signedAt, code: codeOf(document.signatureHash), userId: document.signedById }]
    : [];
  const old = await prisma.internalProcessSignatureRequest.findMany({ where: { documentId: document.id, status: 'ASSINADO' }, orderBy: { signedAt: 'asc' } });
  return [
    ...legacyMain,
    ...old
      .filter((request) => request.signatureHash && request.signatureHash !== document.signatureHash)
      .map((request) => ({ name: request.userName, signedAt: request.signedAt, code: codeOf(request.signatureHash), userId: request.userId })),
  ];
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

/**
 * Assinar o documento (pede a senha) — motor único de assinatura: certificado
 * da pessoa, código de conferência público. A primeira assinatura trava o
 * texto. Quem está com o processo assina; quem recebeu um PEDIDO também (mesmo
 * de outra unidade) — as assinaturas seguintes somam.
 */
export async function signDocument(actor: ProcessActor & { name: string }, documentId: string, password: string, meta: SignMeta = {}) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  const process = await loadProcess(actor, document.processId, false);
  if (!isOpen(process.status)) throw new InternalProcessError('Este processo já foi encerrado.');
  const request = await prisma.signatureRequest.findFirst({ where: { targetType: 'INTERNAL', targetId: documentId, userId: actor.id, status: 'PENDENTE' } });
  if (!request && !canActOnProcess(actor, process)) throw new InternalProcessError('O processo não está com a sua unidade.', 403);

  const user = await prisma.user.findFirst({ where: { id: actor.id }, select: { password: true, name: true } });
  if (!user || !password || !(await bcrypt.compare(password, user.password))) throw new InternalProcessError('Senha incorreta.');

  let signature;
  try {
    ({ signature } = await createSignature('INTERNAL', documentId, { kind: 'user', id: actor.id }, internalContentHash(document), meta));
  } catch (error) {
    if (error instanceof SigningError) throw new InternalProcessError(error.message, error.status);
    throw error;
  }
  const code = signature.code!;

  let updated = document;
  if (!document.signedAt) {
    // trava o texto; signatureHash = SHA-256 da assinatura (o código é o começo dele)
    updated = await prisma.internalProcessDocument.update({
      where: { id: documentId },
      data: { signatureHash: createHash('sha256').update(signature.signatureValue).digest('hex'), signedById: actor.id, signedByName: user.name, signedAt: signature.signedAt },
    });
  }
  await prisma.internalProcessMovement.create({
    data: { processId: document.processId, action: 'ASSINADO', note: `${document.title} assinado por ${user.name} — código ${code}`, userId: actor.id, userName: user.name, readAt: signature.signedAt },
  });
  return { document: updated, code };
}

/** Pedir a assinatura de pessoas (ex.: Prefeito na autorização). Quem está com o processo pede. */
export async function requestSignatures(actor: ProcessActor & { name: string }, documentId: string, userIds: string[], note?: string) {
  const document = await prisma.internalProcessDocument.findFirst({ where: { id: documentId } });
  if (!document) throw new InternalProcessError('Documento não encontrado', 404);
  const process = await loadProcess(actor, document.processId, true);
  let result;
  try {
    result = await requestDocumentSignatures('INTERNAL', documentId, { id: actor.id, name: actor.name }, userIds, note);
  } catch (error) {
    if (error instanceof SigningError) throw new InternalProcessError(error.message, error.status);
    throw error;
  }
  const text = String(note || '').trim().slice(0, 1000);
  for (const person of result.requested) {
    // o movimento com toUserId deixa a pessoa ver o processo e conta como novo para ela
    await prisma.internalProcessMovement.create({
      data: {
        processId: process.id,
        action: 'ASSINATURA_PEDIDA',
        note: `Assinar: ${document.title}${text ? `\n${text}` : ''}`,
        userId: actor.id,
        userName: actor.name,
        toUserId: person.id,
        toUserName: person.name,
      },
    });
  }
  return { requested: result.requested.map((person) => person.name) };
}

/** Recusar o pedido de assinatura (com motivo) ou, para quem pediu, cancelar */
export async function answerSignatureRequest(actor: ProcessActor & { name: string }, requestId: string, action: 'RECUSADO' | 'CANCELADO', note?: string) {
  let request;
  try {
    request = await answerRequest(requestId, { id: actor.id, name: actor.name }, action, note);
  } catch (error) {
    if (error instanceof SigningError) throw new InternalProcessError(error.message, error.status);
    throw error;
  }
  if (request.targetType === 'INTERNAL' && request.processId) {
    await prisma.internalProcessMovement.create({
      data: {
        processId: request.processId,
        action: action === 'RECUSADO' ? 'ASSINATURA_RECUSADA' : 'DESPACHO',
        note: action === 'RECUSADO' ? `${request.userName} não assinou: ${request.answerNote}` : `Pedido de assinatura a ${request.userName} cancelado.`,
        userId: actor.id,
        userName: actor.name,
        readAt: new Date(),
      },
    });
  }
  return { ok: true };
}

/** Muda o processo de etapa e, se for o caso, de unidade (um movimento só) */
async function moveToStage(
  actor: ProcessActor & { name: string },
  process: { id: string; number: string; subject: string; currentUnitId: string; currentUnitName: string },
  stage: { key: string; name: string; days: number },
  target: { id: string; nome: string; departmentId: string | null } | null,
  action: 'ETAPA' | 'ETAPA_DEVOLVIDA',
  note: string,
  person: { id: string; name: string } | null = null
) {
  const changesUnit = !!target && target.id !== process.currentUnitId;
  const moving = changesUnit || !!person;
  const updated = await prisma.internalProcess.update({
    where: { id: process.id },
    data: {
      stageKey: stage.key,
      stageDueAt: addWorkingDays(new Date(), stage.days),
      ...(moving && target
        ? {
            status: 'EM_TRAMITE',
            currentUnitId: target.id,
            currentUnitName: target.nome,
            currentDepartmentId: target.departmentId,
            currentUserId: person?.id || null,
            currentUserName: person?.name || null,
          }
        : {}),
      movements: {
        create: {
          ...nestedTenant(),
          action,
          note,
          userId: actor.id,
          userName: actor.name,
          ...(moving && target
            ? {
                fromUnitId: process.currentUnitId,
                fromUnitName: process.currentUnitName,
                toUnitId: target.id,
                toUnitName: target.nome,
                toUserId: person?.id || null,
                toUserName: person?.name || null,
              }
            : { readAt: new Date() }),
        },
      },
    },
  });
  if (moving && target) {
    const title = action === 'ETAPA' ? `Processo ${process.number}: etapa "${stage.name}" com você` : `Processo ${process.number} devolvido para ajuste`;
    await notifyUnit(target.id, person?.id || null, title, process.subject, process.id, actor.id);
  }
  return { updated, moved: moving && target ? `${target.nome}${person ? ` (${person.name})` : ''}` : null };
}

/** Unidade e pessoa (conferidas no banco) de um destino de etapa */
async function loadRoute(route: RoleRoute | null) {
  if (!route) return { unit: null, person: null };
  const unit = await getUnit(route.unitId).catch(() => null);
  const person = unit && route.userId
    ? await prisma.user.findFirst({ where: { id: route.userId, isActive: true }, select: { id: true, name: true } })
    : null;
  return { unit, person };
}

/**
 * Concluir a etapa atual e ir para a próxima (só com os documentos da etapa
 * prontos). O processo vai sozinho para a unidade do papel da próxima etapa;
 * `toUnitId` troca o destino só desta vez.
 */
export async function advanceStage(actor: ProcessActor & { name: string }, processId: string, input: { note?: string; toUnitId?: string; toUserId?: string } = {}) {
  const process = await loadProcess(actor, processId, true);
  const flow = resolveFlow(process);
  if (!flow) throw new InternalProcessError('Este processo não tem etapas.');
  const stage = getStage(flow, process.stageKey);
  if (!stage) throw new InternalProcessError('Etapa atual não encontrada.');
  const documents = await prisma.internalProcessDocument.findMany({ where: { processId }, select: { templateKey: true, signedAt: true } });
  const missing = missingForStage(stage, documents);
  if (missing.length) throw new InternalProcessError(`Para concluir "${stage.name}" falta: ${missing.map(humanMissing).join('; ')}.`);

  const next = nextStage(flow, stage.key);
  if (!next) throw new InternalProcessError('Esta é a última etapa. Conclua o processo.');
  const roleUnits = await getRoleUnits();
  const route = input.toUnitId
    ? { unitId: input.toUnitId, userId: input.toUserId || null }
    : stageRoute(next, { id: process.originUnitId, name: process.originUnitName }, roleRoutes(roleUnits));
  const { unit: target, person } = await loadRoute(route);
  const extra = input.note ? `\n${String(input.note).slice(0, 2000)}` : '';
  const where = target
    ? target.id === process.currentUnitId && !person
      ? ' Continua com esta unidade.'
      : ` Enviado para ${target.nome}${person ? ` (${person.name})` : ''}.`
    : ` Ninguém definido para "${roleName(next.role)}": continua com esta unidade.`;
  const { updated, moved } = await moveToStage(actor, process, next, target, 'ETAPA', `Etapa concluída: ${stage.name}. Próxima: ${next.name}${next.legal ? ` (${next.legal})` : ''}.${where}${extra}`, person);
  return { process: updated, next, movedTo: moved, warnings: flowWarnings(flowBaseKey(flow), process.fields as Record<string, any>) };
}

/** Voltar uma etapa para ajuste (ex.: jurídico devolve o termo de referência) */
export async function returnStage(actor: ProcessActor & { name: string }, processId: string, note: string) {
  const process = await loadProcess(actor, processId, true);
  const text = String(note || '').trim();
  if (!text) throw new InternalProcessError('Diga o que precisa ser ajustado.');
  const flow = resolveFlow(process);
  if (!flow) throw new InternalProcessError('Este processo não tem etapas.');
  const stage = getStage(flow, process.stageKey);
  const previous = previousStage(flow, process.stageKey);
  if (!stage || !previous) throw new InternalProcessError('Não há etapa anterior.');
  const roleUnits = await getRoleUnits();
  const { unit: target, person } = await loadRoute(stageRoute(previous, { id: process.originUnitId, name: process.originUnitName }, roleRoutes(roleUnits)));
  const { updated, moved } = await moveToStage(actor, process, previous, target, 'ETAPA_DEVOLVIDA', `Devolvido de "${stage.name}" para "${previous.name}": ${text.slice(0, 2000)}`, person);
  return { process: updated, previous, movedTo: moved };
}

/** Dados da contratação (valor, modalidade, critério, hipótese, ata) */
export async function updateFields(actor: ProcessActor & { name: string }, processId: string, input: Record<string, any>) {
  const process = await loadProcess(actor, processId, true);
  const fields = sanitizeFields(input, (process.fields as Record<string, any>) || {});
  await prisma.internalProcess.update({ where: { id: processId }, data: { fields } });
  return { fields, warnings: flowWarnings(flowBaseKey(resolveFlow(process)), fields) };
}

/**
 * Rotina diária: etapa com prazo vencido avisa a unidade (uma vez por etapa).
 * Chamar no contexto de cada município.
 */
export async function notifyOverdueStages(): Promise<number> {
  const overdue = await prisma.internalProcess.findMany({
    where: { status: { in: ['ABERTO', 'EM_TRAMITE'] }, flowKey: { not: null }, stageDueAt: { lt: new Date() } },
    select: { id: true, number: true, subject: true, flowKey: true, flowSnapshot: true, stageKey: true, currentUnitId: true, currentUserId: true },
    take: 200,
  });
  let sent = 0;
  for (const process of overdue) {
    const marker = `Prazo da etapa vencido: ${process.stageKey}`;
    const already = await prisma.internalProcessMovement.findFirst({ where: { processId: process.id, action: 'PRAZO', note: { startsWith: marker } }, select: { id: true } });
    if (already) continue;
    const flow = resolveFlow(process);
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
