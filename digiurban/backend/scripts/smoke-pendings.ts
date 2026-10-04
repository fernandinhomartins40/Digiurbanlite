/**
 * Smoke do ciclo de pendências e análise de documentos (requer banco).
 *
 *   DATABASE_URL=... REDIS_URL=... JWT_SECRET=... npx tsx scripts/smoke-pendings.ts
 *
 * Cria um município efêmero, roda o ciclo completo e apaga tudo no fim.
 * Cobre as correções de 2026-10-04: cancelar/expirar destrava o protocolo,
 * lembretes sem repetição, versões de documento guardadas, análise unificada
 * (pendência x documento), encerramento fecha pendências e checagem de acesso.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import * as pendingService from '../src/services/protocol-pending.service';
import * as documentService from '../src/services/protocol-document.service';
import { createProtocolSLA } from '../src/services/protocol-sla.service';
import { protocolStatusEngine } from '../src/services/protocol-status.engine';
import pendingRoutes from '../src/routes/protocol-pendings';
import documentRoutes from '../src/routes/protocol-documents';

const STAMP = Date.now();
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.log(`  ❌ ${label}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

async function main() {
  const tenant = await runAsPlatform(() =>
    prisma.tenant.create({
      data: {
        slug: `smoke-pend-${STAMP}`,
        nome: 'Smoke Pendências',
        cnpj: `00.000.000/0009-${String(STAMP).slice(-2)}`,
        nomeMunicipio: 'Smoke Pendências',
        ufMunicipio: 'PR',
        status: 'ACTIVE',
      },
    })
  );

  try {
    await runAsTenant(tenant.id, () => scenario());
  } finally {
    await runAsPlatform(async () => {
      const where = { tenantId: tenant.id };
      await prisma.protocolSimplified.deleteMany({ where }).catch(() => undefined);
      await prisma.serviceSimplified.deleteMany({ where }).catch(() => undefined);
      await prisma.citizen.deleteMany({ where }).catch(() => undefined);
      await prisma.user.deleteMany({ where }).catch(() => undefined);
      await prisma.department.deleteMany({ where }).catch(() => undefined);
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch((e) => console.warn('limpeza:', e.message));
    });
  }
}

async function scenario() {
  const [deptA, deptB] = await Promise.all([
    prisma.department.create({ data: { name: `Obras ${STAMP}`, code: `OBRAS_${STAMP}` } as any }),
    prisma.department.create({ data: { name: `Saúde ${STAMP}`, code: `SAUDE_${STAMP}` } as any }),
  ]);
  const mkUser = (name: string, role: any, departmentId: string) =>
    prisma.user.create({
      data: { name, email: `${name}-${STAMP}@t.local`, password: 'x', role, departmentId, isActive: true } as any,
    });
  const userA = await mkUser('servidor-a', 'USER', deptA.id);
  const userB = await mkUser('servidor-b', 'USER', deptB.id);
  const admin = await mkUser('admin', 'ADMIN', deptA.id);
  const citizen = await prisma.citizen.create({
    data: { name: 'Cidadão Teste', cpf: String(STAMP).slice(-11).padStart(11, '0'), email: `c-${STAMP}@t.local`, password: 'x' } as any,
  });
  const service = await prisma.serviceSimplified.create({
    data: { name: 'Alvará teste', departmentId: deptA.id, serviceType: 'SEM_DADOS', estimatedDays: 10 } as any,
  });

  let seq = 0;
  const newProtocol = async () => {
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: `SMK-${STAMP}-${++seq}`,
        title: 'Teste',
        citizenId: citizen.id,
        serviceId: service.id,
        departmentId: deptA.id,
        status: 'PROGRESSO',
        currentAssignedUserId: userA.id,
      } as any,
    });
    await createProtocolSLA(protocol.id);
    return protocol;
  };
  const statusOf = async (id: string) => (await prisma.protocolSimplified.findUnique({ where: { id } }))!.status;
  const slaPaused = async (id: string) => (await prisma.protocolSLA.findUnique({ where: { protocolId: id } }))!.isPaused;

  console.log('\n1. Cancelar pendência destrava o protocolo');
  const p1 = await newProtocol();
  const info = await pendingService.createPending({
    protocolId: p1.id, type: 'INFORMATION' as any, title: 'Informe o telefone', description: 'x', createdBy: userA.id,
  });
  check('criar pendência coloca o protocolo em Pendência', (await statusOf(p1.id)) === 'PENDENCIA');
  check('e pausa o prazo', await slaPaused(p1.id));
  await pendingService.cancelPending(info.id, userA.id, 'não precisa mais');
  check('cancelar volta para Em andamento', (await statusOf(p1.id)) === 'PROGRESSO', await statusOf(p1.id));
  check('e retoma o prazo', !(await slaPaused(p1.id)));
  let doubleCancel = false;
  try { await pendingService.cancelPending(info.id, userA.id, 'de novo'); } catch (e) { doubleCancel = e instanceof pendingService.PendingActionError; }
  check('cancelar de novo é recusado com mensagem', doubleCancel);

  console.log('\n2. Pendência sem resposta expira e destrava');
  const stale = await pendingService.createPending({
    protocolId: p1.id, type: 'INFORMATION' as any, title: 'Mande o endereço', description: 'x', createdBy: userA.id,
    dueDate: new Date(Date.now() - 40 * 24 * 3600 * 1000),
  });
  await pendingService.expireStalePendings();
  const staleNow = await prisma.protocolPending.findUnique({ where: { id: stale.id } });
  check('pendência expirada', staleNow?.status === 'EXPIRED', staleNow?.status);
  check('protocolo voltou para Em andamento', (await statusOf(p1.id)) === 'PROGRESSO', await statusOf(p1.id));
  check('prazo retomado', !(await slaPaused(p1.id)));

  console.log('\n3. Lembrete de vencida sai uma vez só');
  const overdue = await pendingService.createPending({
    protocolId: p1.id, type: 'INFORMATION' as any, title: 'Mande a foto', description: 'x', createdBy: userA.id,
    dueDate: new Date(Date.now() - 3600 * 1000),
  });
  const r1 = await pendingService.processPendingReminders();
  const r2 = await pendingService.processPendingReminders();
  check('primeira rodada avisa', r1.overdueSent === 1, r1);
  check('segunda rodada não repete', r2.overdueSent === 0 && r2.upcomingSent === 0, r2);

  console.log('\n4. Encerrar o protocolo fecha as pendências abertas');
  await protocolStatusEngine.updateStatus({ protocolId: p1.id, newStatus: 'CONCLUIDO' as any, actorRole: 'ADMIN' as any, actorId: admin.id });
  const closed = await prisma.protocolPending.findUnique({ where: { id: overdue.id } });
  check('pendência aberta foi encerrada', closed?.status === 'CANCELLED', closed?.status);
  const r3 = await pendingService.processPendingReminders();
  check('sem lembretes depois de concluído', r3.processed === 0, r3);
  let blocked = false;
  try {
    await pendingService.createPending({ protocolId: p1.id, type: 'INFORMATION' as any, title: 't', description: 'd', createdBy: userA.id });
  } catch (e) { blocked = e instanceof pendingService.PendingActionError; }
  check('não cria pendência em protocolo encerrado', blocked);

  console.log('\n5. Documento recusado, reenviado e aprovado (versões e análise unificada)');
  const p2 = await newProtocol();
  const doc = await prisma.protocolDocument.create({
    data: { protocolId: p2.id, documentType: 'RG', isRequired: true, status: 'PENDING' } as any,
  });
  let noFile = false;
  try { await documentService.approveDocument(doc.id, userA.id); } catch (e) { noFile = e instanceof documentService.DocumentActionError; }
  check('não aprova documento que não foi enviado', noFile);

  const send = (name: string) =>
    documentService.uploadDocument(doc.id, {
      fileName: name, fileUrl: `/uploads/protocols/${p2.id}/${name}`, fileSize: 10, mimeType: 'image/png', uploadedBy: citizen.id,
    }, { skipPendingSubmission: true });

  await send('rg-1.png');
  await documentService.rejectDocument(doc.id, userA.id, 'foto ilegível');
  const transitions = await prisma.protocolHistorySimplified.findMany({
    where: { protocolId: p2.id, newStatus: { not: null } },
  });
  check('recusar muda a situação uma vez só (direto para Atualização)',
    (await statusOf(p2.id)) === 'ATUALIZACAO' && !transitions.some((h) => h.newStatus === 'PENDENCIA'),
    transitions.map((h) => h.newStatus));
  let docPendings = await prisma.protocolPending.findMany({ where: { protocolId: p2.id, type: 'DOCUMENT' } });
  check('uma pendência de documento aberta', docPendings.length === 1 && docPendings[0].status === 'OPEN', docPendings.map((p) => p.status));
  const pendingId = docPendings[0].id;

  const answer = async (name: string) => {
    const updated = await send(name);
    await pendingService.submitPendingResponse(pendingId, citizen.id, `Documento enviado: RG`, {
      submittedDocuments: [{ id: updated.id, documentType: 'RG', fileName: name }],
    });
  };

  await answer('rg-2.png');
  let versions = await documentService.getDocumentVersions(doc.id);
  check('reenvio guarda a versão recusada', versions?.versions.length === 2 && versions.versions[0].status === 'REJECTED',
    versions?.versions.map((v: any) => [v.version, v.status]));
  const docNow = await prisma.protocolDocument.findUnique({ where: { id: doc.id } });
  check('documento não aponta mais para si mesmo', docNow?.previousDocId === null && docNow?.version === 2, docNow);

  // servidor recusa pela aba Documentos com a pendência "em análise"
  await documentService.rejectDocument(doc.id, userA.id, 'ainda ilegível');
  docPendings = await prisma.protocolPending.findMany({ where: { protocolId: p2.id, type: 'DOCUMENT' } });
  check('recusar com pendência em análise reaproveita a mesma (sem duplicar)',
    docPendings.length === 1 && docPendings[0].status === 'OPEN', docPendings.map((p) => p.status));

  await answer('rg-3.png');
  // servidor pede novo ajuste pela aba Pendências
  await pendingService.reopenPending(pendingId, userA.id, 'falta o verso');
  const afterReopen = await prisma.protocolDocument.findUnique({ where: { id: doc.id } });
  check('pedir novo ajuste recusa o arquivo enviado', afterReopen?.status === 'REJECTED' && afterReopen?.rejectionReason === 'falta o verso', afterReopen?.status);

  await answer('rg-4.png');
  await pendingService.resolvePending(pendingId, userA.id, 'tudo certo', { approveSubmittedDocuments: true });
  const approved = await prisma.protocolDocument.findUnique({ where: { id: doc.id } });
  check('aprovar a resposta aprova o documento', approved?.status === 'APPROVED', approved?.status);
  check('pendência resolvida', (await prisma.protocolPending.findUnique({ where: { id: pendingId } }))?.status === 'RESOLVED');
  check('protocolo voltou a andar', (await statusOf(p2.id)) === 'PROGRESSO', await statusOf(p2.id));
  check('prazo retomado', !(await slaPaused(p2.id)));
  versions = await documentService.getDocumentVersions(doc.id);
  check('histórico com os 4 envios', versions?.versions.length === 4, versions?.versions.length);

  const old = versions!.versions[0];
  const { restoredFromVersion } = await documentService.restoreDocumentVersion(doc.id, old.id, admin.id);
  versions = await documentService.getDocumentVersions(doc.id);
  check('restaurar versão guarda a atual e não entra em laço', restoredFromVersion === 1 && versions?.versions.length === 5);

  console.log('\n6. Acesso pelas rotas do servidor');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => runAsTenant(tenant(), () => next()));
  app.use('/api/protocols', documentRoutes);
  app.use('/api/protocols', pendingRoutes);
  const token = (userId: string) => jwt.sign({ userId, type: 'admin' }, process.env.JWT_SECRET!);
  const as = (userId: string) => ({ Cookie: `digiurban_admin_token=${token(userId)}` });

  const p3 = await newProtocol();
  const resA = await request(app).get(`/api/protocols/${p3.id}/pendings`).set(as(userA.id));
  check('servidor responsável vê as pendências', resA.status === 200, resA.status);
  const resB = await request(app).get(`/api/protocols/${p3.id}/pendings`).set(as(userB.id));
  check('servidor de outra secretaria é barrado', resB.status === 403, resB.status);
  const docsB = await request(app).get(`/api/protocols/${p2.id}/documents/${doc.id}/versions`).set(as(userB.id));
  check('outra secretaria não vê versões de documento', docsB.status === 403, docsB.status);
  const wrongPair = await request(app).put(`/api/protocols/${p3.id}/pendings/${pendingId}/cancel`).set(as(admin.id)).send({ reason: 'x' });
  check('pendência de outro protocolo no endereço = não encontrada', wrongPair.status === 404, wrongPair.status);

  const created = await request(app).post(`/api/protocols/${p3.id}/pendings`).set(as(userA.id))
    .send({ type: 'INFORMATION', title: 'Telefone', description: 'Informe', dueDate: '2000-01-01' });
  check('prazo no passado é recusado', created.status === 400, created.body);
  const created2 = await request(app).post(`/api/protocols/${p3.id}/pendings`).set(as(userA.id))
    .send({ type: 'INFORMATION', title: 'Telefone', description: 'Informe', dueDate: '2099-01-10' });
  check('cria pendência com prazo no fim do dia de Brasília',
    created2.status === 201 && created2.body.data.dueDate === '2099-01-11T02:59:59.000Z', created2.body?.data?.dueDate);
  const statusEdit = await request(app).put(`/api/protocols/${p3.id}/pendings/${created2.body.data.id}`).set(as(userA.id)).send({ status: 'RESOLVED' });
  check('não muda a situação pela edição genérica', statusEdit.status === 400, statusEdit.status);
  const del = await request(app).delete(`/api/protocols/${p3.id}/pendings/${created2.body.data.id}`).set(as(admin.id));
  check('administrador consegue apagar (antes respondia 401 sempre)', del.status === 200, del.body);
  check('apagar a última pendência destrava o protocolo', (await statusOf(p3.id)) === 'PROGRESSO', await statusOf(p3.id));

  console.log('\n7. Cidadão responde com documento (caminho único do portal e do bot)');
  const fs = await import('fs');
  const os = await import('os');
  const pathMod = await import('path');
  const { loadAnswerablePending, submitPendingDocuments, PendingResponseError } = await import('../src/services/pending-response.service');
  const p4 = await newProtocol();
  const askDoc = await pendingService.createDocumentPending(p4.id, 'Comprovante de residência', userA.id);
  const tmpDir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'smoke-pend-'));
  const fakeFile = (name: string) => {
    const filename = `${Date.now()}-${name}`;
    const filePath = pathMod.join(tmpDir, filename);
    fs.writeFileSync(filePath, 'conteudo');
    return { path: filePath, filename, originalname: name, size: 8, mimetype: 'application/pdf' } as any;
  };
  const answerable = await loadAnswerablePending(p4.id, askDoc.id);
  const extra = fakeFile('sobrando.pdf');
  await submitPendingDocuments(p4.id, answerable, citizen.id, [fakeFile('comprovante.pdf'), extra],
    JSON.stringify([{ documentType: 'Comprovante de residência' }, { documentType: 'outra coisa' }]));
  const answered = await prisma.protocolPending.findUnique({ where: { id: askDoc.id } });
  const sent = (answered?.metadata as any)?.submittedDocuments || [];
  check('resposta com documento vai para análise', answered?.status === 'UNDER_REVIEW' && sent.length === 1, answered?.status);
  check('arquivo que sobrou foi apagado (antes ficava no disco)', !fs.existsSync(extra.path));
  let again: unknown = null;
  try { await loadAnswerablePending(p4.id, askDoc.id); } catch (e) { again = e; }
  check('responder de novo enquanto em análise é recusado', again instanceof PendingResponseError && (again as any).statusCode === 409);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  function tenant() {
    return (citizen as any).tenantId as string;
  }
}

main()
  .then(async () => {
    console.log(failures === 0 ? '\n🎉 Smoke de pendências OK' : `\n💥 ${failures} verificação(ões) falharam`);
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error('Erro no smoke:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
