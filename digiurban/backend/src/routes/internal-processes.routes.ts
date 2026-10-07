/**
 * Processo interno (servidores). Ver services/internal-process/.
 * Substitui /api/flow (proxy do digiurban-flow, que nunca foi para produção).
 */

import { advanceStage, createDocument, deleteDocument, getDocument, signDocument, updateDocument, updateFields } from '../services/internal-process/flows/flow.service';
import { CRITERIOS, DISPENSA_LIMITS, FLOWS, HIPOTESES_DISPENSA, HIPOTESES_INEXIGIBILIDADE, MODALIDADES } from '../services/internal-process/flows/flows';
import { DOCUMENT_TEMPLATES } from '../services/internal-process/flows/templates';
import { documentPdf, processPdf, signProcess, summarizeProcess, verifySignature } from '../services/internal-process/internal-process-extras.service';
import { assertProtocolAccess } from '../services/protocol-access.service';
import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { prisma } from '../lib/prisma';
import {
  addNote,
  assignProcess,
  buildActor,
  closeProcess,
  concludeProcess,
  createProcess,
  destinationUnits,
  ensureDefaultTypes,
  forwardProcess,
  getProcess,
  inboxCount,
  InternalProcessError,
  listProcesses,
  reopenProcess,
  requestOpinion,
  returnProcess,
  unitPeople,
} from '../services/internal-process/internal-process.service';

const router = Router();
router.use(adminAuthMiddleware as any);

const actorOf = (req: Request) => {
  const user = (req as any).user as { id: string; role: string; name: string };
  return buildActor({ id: user.id, role: user.role, name: user.name });
};

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof InternalProcessError) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      console.error('[processos-internos]', error);
      res.status(500).json({ success: false, error: 'Não foi possível concluir agora. Tente de novo.' });
    }
  };

const isAdmin = (req: Request) => ['ADMIN', 'SUPER_ADMIN'].includes((req as any).user?.role);

// tipos (Memorando, Ofício...) — o município ajusta nome e prazo
router.get('/types', handle(async (_req, res) => {
  res.json({ success: true, data: { types: await ensureDefaultTypes() } });
}));

router.post('/types', handle(async (req, res) => {
  if (!isAdmin(req)) throw new InternalProcessError('Só administradores criam tipos.', 403);
  const name = String(req.body?.name || '').trim().slice(0, 60);
  const prefix = String(req.body?.prefix || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (name.length < 3 || prefix.length < 2) throw new InternalProcessError('Informe o nome e a sigla (2 a 4 letras).');
  const exists = await prisma.internalProcessType.findFirst({ where: { prefix } });
  if (exists) throw new InternalProcessError('Já existe um tipo com essa sigla.');
  const type = await prisma.internalProcessType.create({
    data: { name, prefix, description: String(req.body?.description || '').slice(0, 300) || null, defaultDays: Math.max(1, Math.min(180, Number(req.body?.defaultDays) || 5)) },
  });
  res.status(201).json({ success: true, data: { type } });
}));

router.put('/types/:id', handle(async (req, res) => {
  if (!isAdmin(req)) throw new InternalProcessError('Só administradores alteram tipos.', 403);
  const type = await prisma.internalProcessType.findFirst({ where: { id: req.params.id } });
  if (!type) throw new InternalProcessError('Tipo não encontrado', 404);
  const data: Record<string, unknown> = {};
  if (req.body?.name !== undefined) data.name = String(req.body.name).trim().slice(0, 60);
  if (req.body?.description !== undefined) data.description = String(req.body.description).slice(0, 300) || null;
  if (req.body?.defaultDays !== undefined) data.defaultDays = Math.max(1, Math.min(180, Number(req.body.defaultDays) || 5));
  if (typeof req.body?.isActive === 'boolean') data.isActive = req.body.isActive;
  res.json({ success: true, data: { type: await prisma.internalProcessType.update({ where: { id: type.id }, data }) } });
}));

// fluxos de contratação (Lei 14.133/2021): etapas, modelos e limites — para a tela
router.get('/flows', handle(async (_req, res) => {
  res.json({
    success: true,
    data: {
      flows: Object.values(FLOWS).map((flow) => ({ key: flow.key, name: flow.name, description: flow.description, stages: flow.stages.map((stage) => ({ key: stage.key, name: stage.name, legal: stage.legal })) })),
      templates: Object.values(DOCUMENT_TEMPLATES).map((template) => ({ key: template.key, title: template.title, legal: template.legal })),
      modalidades: MODALIDADES,
      criterios: CRITERIOS,
      hipotesesDispensa: HIPOTESES_DISPENSA,
      hipotesesInexigibilidade: HIPOTESES_INEXIGIBILIDADE,
      limites: DISPENSA_LIMITS,
    },
  });
}));

// documentos do processo (feitos a partir dos modelos)
router.get('/documents/:docId', handle(async (req, res) => {
  res.json({ success: true, data: await getDocument(await actorOf(req), req.params.docId) });
}));

router.put('/documents/:docId', handle(async (req, res) => {
  res.json({ success: true, data: { document: await updateDocument(await actorOf(req), req.params.docId, String(req.body?.content || '')) } });
}));

router.delete('/documents/:docId', handle(async (req, res) => {
  await deleteDocument(await actorOf(req), req.params.docId);
  res.json({ success: true });
}));

router.post('/documents/:docId/sign', handle(async (req, res) => {
  res.json({ success: true, data: await signDocument(await actorOf(req), req.params.docId, String(req.body?.password || '')) });
}));

router.get('/documents/:docId/pdf', handle(async (req, res) => {
  const { buffer, filename } = await documentPdf(await actorOf(req), req.params.docId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}));

// destinos (unidades do organograma) + sugestão pelo assunto
router.get('/units', handle(async (req, res) => {
  res.json({ success: true, data: await destinationUnits(typeof req.query.text === 'string' ? req.query.text : undefined) });
}));

router.get('/units/:unitId/people', handle(async (req, res) => {
  res.json({ success: true, data: { people: await unitPeople(req.params.unitId) } });
}));

// minhas unidades (de onde posso enviar)
router.get('/me', handle(async (req, res) => {
  const actor = await actorOf(req);
  const units = actor.unitIds.length
    ? await prisma.organizationalUnit.findMany({ where: { id: { in: actor.unitIds } }, select: { id: true, nome: true } })
    : [];
  res.json({ success: true, data: { units } });
}));

// conferir código de assinatura eletrônica
router.get('/verify/:code', handle(async (req, res) => {
  res.json({ success: true, data: await verifySignature(await actorOf(req), req.params.code) });
}));

router.get('/count', handle(async (req, res) => {
  res.json({ success: true, data: { count: await inboxCount(await actorOf(req)) } });
}));

router.get('/', handle(async (req, res) => {
  const actor = await actorOf(req);
  // ligados a um protocolo: só quem pode ver o protocolo
  if (typeof req.query.protocolId === 'string' && req.query.protocolId) {
    const user = (req as any).user;
    try {
      await assertProtocolAccess({ id: user.id, role: user.role, departmentId: user.departmentId, departmentIds: user.departmentIds }, req.query.protocolId);
    } catch {
      throw new InternalProcessError('Protocolo não encontrado', 404);
    }
  }
  const result = await listProcesses(actor, {
    box: (['entrada', 'enviados', 'todos'].includes(String(req.query.box)) ? req.query.box : 'entrada') as any,
    status: typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    protocolId: typeof req.query.protocolId === 'string' && req.query.protocolId ? req.query.protocolId : undefined,
    page: Number(req.query.page) || 1,
  });
  res.json({ success: true, data: result });
}));

router.post('/', handle(async (req, res) => {
  const actor = await actorOf(req);
  const process = await createProcess(actor, {
    typeId: String(req.body?.typeId || ''),
    subject: String(req.body?.subject || ''),
    body: typeof req.body?.body === 'string' ? req.body.body : undefined,
    originUnitId: typeof req.body?.originUnitId === 'string' ? req.body.originUnitId : undefined,
    toUnitId: typeof req.body?.toUnitId === 'string' && req.body.toUnitId ? req.body.toUnitId : undefined,
    toUserId: typeof req.body?.toUserId === 'string' && req.body.toUserId ? req.body.toUserId : undefined,
    priority: Number(req.body?.priority) === 1 ? 1 : 0,
    confidential: Boolean(req.body?.confidential),
    protocolId: typeof req.body?.protocolId === 'string' && req.body.protocolId ? req.body.protocolId : undefined,
    fields: req.body?.fields && typeof req.body.fields === 'object' ? req.body.fields : undefined,
  });
  res.status(201).json({ success: true, data: { process } });
}));

router.get('/:id', handle(async (req, res) => {
  res.json({ success: true, data: { process: await getProcess(await actorOf(req), req.params.id) } });
}));

router.post('/:id/forward', handle(async (req, res) => {
  const process = await forwardProcess(await actorOf(req), req.params.id, {
    toUnitId: String(req.body?.toUnitId || ''),
    toUserId: typeof req.body?.toUserId === 'string' && req.body.toUserId ? req.body.toUserId : undefined,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  res.json({ success: true, data: { process } });
}));

router.post('/:id/return', handle(async (req, res) => {
  res.json({ success: true, data: { process: await returnProcess(await actorOf(req), req.params.id, String(req.body?.note || '')) } });
}));

router.post('/:id/assign', handle(async (req, res) => {
  res.json({ success: true, data: { process: await assignProcess(await actorOf(req), req.params.id, String(req.body?.toUserId || '')) } });
}));

router.post('/:id/note', handle(async (req, res) => {
  res.status(201).json({ success: true, data: { movement: await addNote(await actorOf(req), req.params.id, String(req.body?.note || '')) } });
}));

router.post('/:id/opinion', handle(async (req, res) => {
  const child = await requestOpinion(await actorOf(req), req.params.id, { toUnitId: String(req.body?.toUnitId || ''), question: String(req.body?.question || '') });
  res.status(201).json({ success: true, data: { process: child } });
}));

router.post('/:id/conclude', handle(async (req, res) => {
  res.json({ success: true, data: { process: await concludeProcess(await actorOf(req), req.params.id, typeof req.body?.note === 'string' ? req.body.note : undefined) } });
}));

router.post('/:id/archive', handle(async (req, res) => {
  res.json({ success: true, data: { process: await closeProcess(await actorOf(req), req.params.id, 'ARQUIVADO', req.body?.note) } });
}));

router.post('/:id/cancel', handle(async (req, res) => {
  res.json({ success: true, data: { process: await closeProcess(await actorOf(req), req.params.id, 'CANCELADO', req.body?.note) } });
}));

router.post('/:id/documents', handle(async (req, res) => {
  res.status(201).json({ success: true, data: { document: await createDocument(await actorOf(req), req.params.id, String(req.body?.templateKey || '')) } });
}));

router.post('/:id/advance', handle(async (req, res) => {
  res.json({ success: true, data: await advanceStage(await actorOf(req), req.params.id, typeof req.body?.note === 'string' ? req.body.note : undefined) });
}));

router.put('/:id/fields', handle(async (req, res) => {
  res.json({ success: true, data: await updateFields(await actorOf(req), req.params.id, req.body || {}) });
}));

router.post('/:id/summary', handle(async (req, res) => {
  res.json({ success: true, data: { summary: await summarizeProcess(await actorOf(req), req.params.id) } });
}));

router.post('/:id/sign', handle(async (req, res) => {
  res.status(201).json({ success: true, data: await signProcess(await actorOf(req), req.params.id, String(req.body?.password || '')) });
}));

router.get('/:id/pdf', handle(async (req, res) => {
  const { buffer, filename } = await processPdf(await actorOf(req), req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}));

router.post('/:id/reopen', handle(async (req, res) => {
  res.json({ success: true, data: { process: await reopenProcess(await actorOf(req), req.params.id, String(req.body?.note || '')) } });
}));

export default router;
