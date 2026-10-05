/**
 * Smoke da biometria facial ponta a ponta (backend -> servidor de face -> motor UniFace).
 *
 * Requer: banco migrado, ultrazend-face-engine e ultrazend-face-server rodando, e
 * fotos de teste (mesma pessoa de frente e virada; outra pessoa de frente):
 *
 *   FACE_PLATFORM_API_URL=http://127.0.0.1:9106 FACE_PLATFORM_SERVICE_TOKEN=... \
 *   FACE_TEST_IMAGES=/caminho/com/front.jpg,front2.jpg,turn_left.jpg,turn_right.jpg,other.jpg \
 *   DATABASE_URL=... npx tsx scripts/smoke-biometria.ts
 *
 * Cria 2 municípios efêmeros e apaga tudo no fim.
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import face from '../src/services/face-platform-client.service';

const STAMP = Date.now();
const DIR = process.env.FACE_TEST_IMAGES || '';
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ✅ ${label}`);
  else {
    failures++;
    console.log(`  ❌ ${label}`, detail === undefined ? '' : JSON.stringify(detail)?.slice(0, 400));
  }
}

const img = (name: string) => `data:image/jpeg;base64,${fs.readFileSync(path.join(DIR, name)).toString('base64')}`;
const framesFor = (direction: string) => [img('front.jpg'), img(direction === 'left' ? 'turn_left.jpg' : 'turn_right.jpg'), img('front2.jpg')];
const wrongFramesFor = (direction: string) => framesFor(direction === 'left' ? 'right' : 'left');

async function expectError(label: string, status: number, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(label, false, 'não deu erro');
  } catch (error: any) {
    check(label, error?.status === status, { status: error?.status, message: error?.message });
  }
}

async function main() {
  const [tenantA, tenantB] = await runAsPlatform(() =>
    Promise.all(
      ['a', 'b'].map((suffix, index) =>
        prisma.tenant.create({
          data: {
            slug: `smoke-face-${suffix}-${STAMP}`,
            nome: `Smoke Face ${suffix}`,
            cnpj: `00.000.000/000${index + 3}-${String(STAMP).slice(-2)}`,
            nomeMunicipio: `Smoke Face ${suffix}`,
            ufMunicipio: 'PR',
            status: 'ACTIVE',
          },
        })
      )
    )
  );

  try {
    const mkCitizen = (tenantId: string, name: string, n: number) =>
      runAsTenant(tenantId, async () =>
        prisma.citizen.create({
          data: { name, cpf: `${String(STAMP).slice(-9)}${n}`.padStart(11, '0').slice(-11), email: `face-${n}-${STAMP}@t.local`, password: 'x' } as any,
        })
      );
    const titular = await mkCitizen(tenantA.id, 'Titular Teste', 1);
    const outro = await mkCitizen(tenantA.id, 'Outro Cidadão', 2);
    const cidadaoB = await mkCitizen(tenantB.id, 'Cidadão do Município B', 3);
    const servidor = { type: 'USER' as const, id: 'smoke-user', role: 'MANAGER' };
    const cidadaoActor = { type: 'CITIZEN' as const, id: titular.id };

    console.log('\n1. Cadastro com consentimento e prova de vida');
    await runAsTenant(tenantA.id, async () => {
      let challenge = await face.createChallenge(`enroll:${titular.id}`, cidadaoActor);
      check('servidor sorteia o lado do desafio', ['left', 'right'].includes(challenge.direction), challenge);

      await expectError('sem consentimento o cadastro é recusado (403)', 403, () =>
        face.createEnrollment(titular.id, { purpose: 'IDENTITY_VERIFICATION', frames: framesFor(challenge.direction), challengeId: challenge.challengeId, sourceType: 'SELF_SERVICE' }, cidadaoActor)
      );

      challenge = await face.createChallenge(`enroll:${titular.id}`, cidadaoActor);
      await expectError('virar para o lado errado é recusado (422)', 422, () =>
        face.createEnrollment(titular.id, {
          purpose: 'IDENTITY_VERIFICATION',
          frames: wrongFramesFor(challenge.direction),
          challengeId: challenge.challengeId,
          sourceType: 'SELF_SERVICE',
          consent: { relationship: 'TITULAR', channel: 'SELF_SERVICE', grantedByCitizenId: titular.id },
        }, cidadaoActor)
      );

      challenge = await face.createChallenge(`enroll:${titular.id}`, cidadaoActor);
      const enrollment: any = await face.createEnrollment(titular.id, {
        purpose: 'IDENTITY_VERIFICATION',
        frames: framesFor(challenge.direction),
        challengeId: challenge.challengeId,
        sourceType: 'SELF_SERVICE',
        consent: { relationship: 'TITULAR', channel: 'SELF_SERVICE', grantedByCitizenId: titular.id },
      }, cidadaoActor);
      check('cadastro aprovado com prova de vida no servidor', enrollment.approved === true, enrollment);

      await expectError('mesmo desafio não vale duas vezes (410)', 410, () =>
        face.createEnrollment(titular.id, { purpose: 'IDENTITY_VERIFICATION', frames: framesFor(challenge.direction), challengeId: challenge.challengeId, sourceType: 'SELF_SERVICE' }, cidadaoActor)
      );

      const again = await face.createChallenge(`enroll:${titular.id}`, cidadaoActor);
      await expectError('não cadastra de novo com biometria ativa (409)', 409, () =>
        face.createEnrollment(titular.id, { purpose: 'IDENTITY_VERIFICATION', frames: framesFor(again.direction), challengeId: again.challengeId, sourceType: 'SELF_SERVICE' }, cidadaoActor)
      );

      const storedFile = await prisma.faceEnrollment.findFirst({ where: { identity: { citizenId: titular.id } }, select: { imagePath: true } });
      const raw = fs.readFileSync(path.join(process.env.FACE_PLATFORM_STORAGE_PATH || '', storedFile!.imagePath!));
      check('foto gravada CIFRADA no disco', raw.subarray(0, 4).toString() === 'DUF1');
      check('foto separada por município', storedFile!.imagePath!.startsWith(`${tenantA.id}/`), storedFile);
    });

    console.log('\n2. Leitura (1:1) e isolamento entre municípios');
    await runAsTenant(tenantA.id, async () => {
      let challenge = await face.createChallenge(`read:citizen:${titular.id}`, cidadaoActor);
      const ok: any = await face.verify({ frames: framesFor(challenge.direction), challengeId: challenge.challengeId, challengeSubject: `read:citizen:${titular.id}`, expectedCitizenId: titular.id, purpose: 'IDENTITY_VERIFICATION', sourceType: 'TEST' }, cidadaoActor);
      check('reconhece o próprio cidadão', ok.recognized === true && ok.belongsToExpectedCitizen === true, ok);
      check('CPF volta mascarado', String(ok.identity?.citizen?.cpf || '').includes('***'), ok.identity);

      challenge = await face.createChallenge(`read:citizen:${titular.id}`, cidadaoActor);
      const spoof: any = await face.verify({ frames: wrongFramesFor(challenge.direction), challengeId: challenge.challengeId, challengeSubject: `read:citizen:${titular.id}`, expectedCitizenId: titular.id, purpose: 'IDENTITY_VERIFICATION', sourceType: 'TEST' }, cidadaoActor);
      check('sem a prova de vida não reconhece', spoof.recognized === false && spoof.liveness?.passed === false, spoof.liveness);

      challenge = await face.createChallenge(`read:user:${servidor.id}`, servidor);
      const otherCitizen: any = await face.verify({ frames: framesFor(challenge.direction), challengeId: challenge.challengeId, challengeSubject: `read:user:${servidor.id}`, expectedCitizenId: outro.id, purpose: 'IDENTITY_VERIFICATION', sourceType: 'TEST' }, servidor);
      check('rosto do titular NÃO confirma outro cidadão (1:1)', otherCitizen.recognized === false, otherCitizen);

      const identities: any = await face.listIdentities(servidor);
      const json = JSON.stringify(identities);
      check('lista de biometrias sem vetor de rosto', !/"(vector|embedding|descriptor)"\s*:/i.test(json), json.slice(0, 200));
    });

    await runAsTenant(tenantB.id, async () => {
      const challenge = await face.createChallenge(`read:user:${servidor.id}`, servidor);
      const other: any = await face.verify({ frames: framesFor(challenge.direction), challengeId: challenge.challengeId, challengeSubject: `read:user:${servidor.id}`, purpose: 'IDENTITY_VERIFICATION', sourceType: 'TEST' }, servidor);
      check('município B NÃO encontra o rosto cadastrado no A', other.recognized === false && !other.identity, other);
      const listB: any = await face.listIdentities(servidor);
      check('lista do município B vem vazia', Array.isArray(listB) && listB.length === 0, listB);
      const challengeA = await runAsTenant(tenantA.id, () => face.createChallenge(`enroll:${cidadaoB.id}`, servidor));
      await expectError('desafio de um município não vale em outro (410)', 410, () =>
        face.createEnrollment(cidadaoB.id, {
          purpose: 'IDENTITY_VERIFICATION', frames: framesFor(challengeA.direction), challengeId: challengeA.challengeId, sourceType: 'TEST',
          consent: { relationship: 'TITULAR', channel: 'PRESENCIAL', recordedByUserId: servidor.id },
        }, servidor)
      );
    });

    console.log('\n3. Portaria da escola');
    await runAsTenant(tenantA.id, async () => {
      const school = await prisma.unidadeEducacao.create({ data: { nome: `Escola ${STAMP}`, tipo: 'Escola' } as any });
      const device: any = await face.createDevice({ code: `CAM-${STAMP}`, name: 'Portão', unidadeEducacaoId: school.id });
      const zone: any = await face.createZone({ deviceId: device.id, name: 'Entrada', direction: 'ENTRY' });

      const first: any = await face.ingestRecognition({ deviceId: device.id, zoneId: zone.id, frame: img('front.jpg') }, servidor);
      check('sem autorização escolar o aluno NÃO é reconhecido na portaria', first.events[0]?.event?.matchStatus === 'UNMATCHED', first.events[0]?.event);

      await face.grantConsent(titular.id, 'SCHOOL_SECURITY', { relationship: 'MAE', channel: 'PRESENCIAL', grantedByName: 'Mãe Teste', recordedByUserId: servidor.id }, servidor);
      const second: any = await face.ingestRecognition({ deviceId: device.id, zoneId: zone.id, frame: img('front.jpg') }, servidor);
      check('com autorização: reconhecido na entrada', second.events[0]?.event?.matchStatus === 'MATCHED' && second.events[0]?.event?.type === 'ENTRY', second.events[0]?.event);
      const third: any = await face.ingestRecognition({ deviceId: device.id, zoneId: zone.id, frame: img('front.jpg') }, servidor);
      check('passagem repetida em seguida não duplica', third.events[0]?.duplicate === true, third.events[0]);
      const stranger: any = await face.ingestRecognition({ deviceId: device.id, zoneId: zone.id, frame: img('other.jpg') }, servidor);
      check('pessoa de fora: não reconhecida', stranger.events[0]?.event?.matchStatus === 'UNMATCHED', stranger.events[0]?.event);

      const event = second.events[0].event;
      const media = await face.getMedia('event', event.id, servidor);
      check('foto da passagem sai decifrada pelo backend', media.buffer.subarray(0, 2).toString('hex') === 'ffd8', media.mimeType);
      await expectError('outro município não vê a foto (404)', 404, () => runAsTenant(tenantB.id, () => face.getMedia('event', event.id, servidor)));

      const logs: any = await face.listAccessLogs({ citizenId: titular.id });
      const actions = new Set((logs || []).map((log: any) => log.action));
      check('registro de acesso guarda cadastro, leitura e foto vista', ['ENROLL', 'VERIFY', 'MEDIA_VIEW'].every((action) => actions.has(action)), Array.from(actions));
    });

    console.log('\n4. Segurança do serviço');
    const base = (process.env.FACE_PLATFORM_API_URL || '').replace(/\/$/, '');
    const noToken = await axios.get(`${base}/api/face-platform/status`, { headers: { 'X-Tenant-Id': tenantA.id }, validateStatus: () => true });
    check('sem token: 401', noToken.status === 401, noToken.status);
    const noTenant = await axios.get(`${base}/api/face-platform/identities`, { headers: { Authorization: `Bearer ${process.env.FACE_PLATFORM_SERVICE_TOKEN}` }, validateStatus: () => true });
    check('sem município: recusado', noTenant.status === 400, noTenant.status);
    const uploads = await axios.get(`${base}/uploads/face-platform/`, { validateStatus: () => true });
    check('fotos não são mais servidas abertas em /uploads', uploads.status === 404, uploads.status);

    console.log('\n5. Motor antigo -> reprocessamento automático');
    await runAsTenant(tenantA.id, async () => {
      const identity = await prisma.faceRecognitionIdentity.findFirst({ where: { citizenId: outro.id } })
        ?? await (async () => {
          const person = await runAsPlatform(async () => prisma.person.create({ data: { name: 'Outro Cidadão' } as any }));
          return prisma.faceRecognitionIdentity.create({ data: { personId: person.id, citizenId: outro.id, status: 'ACTIVE' } as any });
        })();
      const legacyDir = path.join(process.env.FACE_PLATFORM_STORAGE_PATH || '', 'enrollments', 'legado');
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.copyFileSync(path.join(DIR, 'other.jpg'), path.join(legacyDir, `legado-${STAMP}.jpg`));
      const enrollment = await prisma.faceEnrollment.create({
        data: { identityId: identity.id, sourceType: 'LEGADO', imagePath: `enrollments/legado/legado-${STAMP}.jpg`, status: 'APPROVED' } as any,
      });
      await prisma.faceEmbedding.create({ data: { identityId: identity.id, enrollmentId: enrollment.id, modelName: 'face-api.js', vector: Array(128).fill(0.1), isActive: true } as any });
      await prisma.faceConsent.create({ data: { citizenId: outro.id, purpose: 'IDENTITY_VERIFICATION', relationship: 'TITULAR', channel: 'LEGADO', termsVersion: 'legado' } as any });
    });
    const reprocess = await axios.post(`${base}/api/face-platform/maintenance/reprocess`, {}, { headers: { Authorization: `Bearer ${process.env.FACE_PLATFORM_SERVICE_TOKEN}` } });
    const after = await runAsTenant(tenantA.id, async () => prisma.faceEmbedding.findMany({ where: { identity: { citizenId: outro.id } }, select: { modelName: true } }));
    check('cadastro antigo recalculado no modelo novo pela foto', reprocess.data.converted >= 1 && after.length === 1 && after[0].modelName === 'auraface', { reprocess: reprocess.data, after });

    console.log('\n6. Prazo de guarda e exclusão');
    await runAsTenant(tenantA.id, async () =>
      prisma.faceRecognitionEvent.updateMany({ where: { matchStatus: 'UNMATCHED' }, data: { recognizedAt: new Date(Date.now() - 10 * 86400000) } })
    );
    const retention = await axios.post(`${base}/api/face-platform/maintenance/retention`, {}, { headers: { Authorization: `Bearer ${process.env.FACE_PLATFORM_SERVICE_TOKEN}` } });
    const unmatchedWithPhoto = await runAsTenant(tenantA.id, async () => prisma.faceRecognitionEvent.count({ where: { matchStatus: 'UNMATCHED', previewPath: { not: null } } }));
    const matchedWithPhoto = await runAsTenant(tenantA.id, async () => prisma.faceRecognitionEvent.count({ where: { matchStatus: 'MATCHED', previewPath: { not: null } } }));
    check('foto de quem não foi reconhecido apagada após 7 dias', unmatchedWithPhoto === 0, retention.data);
    check('foto da passagem reconhecida ainda dentro do prazo continua', matchedWithPhoto === 1, matchedWithPhoto);

    await runAsTenant(tenantA.id, async () => {
      const result: any = await face.revokeConsent(titular.id, 'IDENTITY_VERIFICATION', 'teste', cidadaoActor);
      check('revogar uma finalidade mantém a biometria (ainda há a escolar)', result.biometryDeleted === false, result);
      const all: any = await face.revokeConsent(titular.id, 'SCHOOL_SECURITY', 'teste', cidadaoActor);
      check('sem nenhuma finalidade a biometria é apagada', all.biometryDeleted === true, all);
      const left = await prisma.faceEmbedding.count({ where: { identity: { citizenId: titular.id } } });
      const photos = await prisma.faceRecognitionEvent.count({ where: { studentCitizenId: titular.id, previewPath: { not: null } } });
      check('assinaturas e fotos do titular apagadas', left === 0 && photos === 0, { left, photos });
    });
  } finally {
    await runAsPlatform(async () => {
      for (const tenantId of [tenantA.id, tenantB.id]) {
        const where = { tenantId };
        await prisma.faceRecognitionEvent.deleteMany({ where }).catch(() => undefined);
        await prisma.faceZone.deleteMany({ where }).catch(() => undefined);
        await prisma.faceDevice.deleteMany({ where }).catch(() => undefined);
        await prisma.faceEmbedding.deleteMany({ where }).catch(() => undefined);
        await prisma.faceEnrollment.deleteMany({ where }).catch(() => undefined);
        await prisma.faceRecognitionIdentity.deleteMany({ where }).catch(() => undefined);
        await prisma.faceConsent.deleteMany({ where }).catch(() => undefined);
        await prisma.faceAccessLog.deleteMany({ where }).catch(() => undefined);
        await prisma.unidadeEducacao.deleteMany({ where }).catch(() => undefined);
        await prisma.citizen.deleteMany({ where }).catch(() => undefined);
        await prisma.tenant.delete({ where: { id: tenantId } }).catch((error) => console.warn('limpeza:', error.message));
      }
    });
  }
}

main()
  .then(async () => {
    console.log(failures === 0 ? '\n🎉 Smoke da biometria OK' : `\n💥 ${failures} verificação(ões) falharam`);
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error('Erro no smoke:', error?.message || error, error?.details || '');
    await prisma.$disconnect();
    process.exit(1);
  });
