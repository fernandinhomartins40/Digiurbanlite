/**
 * Motor ÚNICO de assinatura do DigiUrban.
 *
 * Assina qualquer documento — gerado no protocolo (GENERATED), enviado para
 * assinar (EXTERNAL) ou do processo interno (INTERNAL) — do mesmo jeito:
 *  1. confere a senha de quem assina (servidor ou cidadão);
 *  2. usa o certificado da pessoa (emitido sozinho na 1ª vez, AC DigiUrban);
 *  3. assina o resumo SHA-256 do CONTEÚDO (o original nunca é alterado), então
 *     várias pessoas podem assinar o mesmo documento;
 *  4. grava a assinatura com um código de conferência (XXXX-XXXX-XXXX-XXXX);
 *  5. refaz o PDF assinado (original + folha de assinaturas + selo).
 *
 * Pedidos de assinatura (fila "Esperando a sua assinatura") ficam em
 * SignatureRequest, para os três tipos.
 */

import crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import * as forge from 'node-forge';
import { prisma } from '../../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { uploadUrlToDiskPath } from '../../config/upload';
import notificationService from '../notification.service';
import { tenantPortalUrl } from '../mail/links';
import { assertProtocolAccess } from '../protocol-access.service';
import { ensureCitizenCertificate, ensureUserCertificate, loadSigningKey } from '../certificate-authority.service';
import { isIssuedByPlatformCA } from './keystore.service';
import { appendManifest, sealPdf } from './signed-pdf.service';

export type SignTargetType = 'GENERATED' | 'EXTERNAL' | 'INTERNAL';

export class SigningError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface SignerActor {
  kind: 'user' | 'citizen';
  id: string;
  /** servidor: papel e secretarias (para conferir o acesso ao protocolo) */
  role?: string;
  departmentId?: string | null;
  departmentIds?: string[];
}

export interface SignMeta {
  ipAddress?: string;
  userAgent?: string;
}

// ---------------------------------------------------------------- regras puras

/** Código de conferência da assinatura: 16 primeiros do SHA-256, em grupos de 4 */
export function signatureCode(signatureValue: string): string {
  return crypto.createHash('sha256').update(signatureValue).digest('hex').slice(0, 16).toUpperCase().match(/.{1,4}/g)!.join('-');
}

/** Código digitado/lido do QR → formato canônico (ou null) */
export function normalizeCode(raw: string): string | null {
  const clean = String(raw || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  return clean.length === 16 ? clean.match(/.{1,4}/g)!.join('-') : null;
}

/** Conteúdo do documento do processo interno (o que a assinatura cobre) */
export function internalContentHash(doc: { id: string; title: string; content: string }): string {
  return crypto.createHash('sha256').update(`${doc.id}|${doc.title}|${doc.content}`).digest('hex');
}

export function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function rsaSign(privateKeyPem: string, contentHashHex: string): string {
  const key = forge.pki.privateKeyFromPem(privateKeyPem);
  const md = forge.md.sha256.create();
  md.update(Buffer.from(contentHashHex, 'hex').toString('binary'), 'raw');
  return forge.util.encode64(key.sign(md));
}

export function rsaVerify(publicKeyPem: string, contentHashHex: string, signatureValue: string): boolean {
  try {
    const key = forge.pki.publicKeyFromPem(publicKeyPem);
    const md = forge.md.sha256.create();
    md.update(Buffer.from(contentHashHex, 'hex').toString('binary'), 'raw');
    return key.verify(md.digest().bytes(), forge.util.decode64(signatureValue));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- quem assina

async function signerProfile(actor: SignerActor) {
  if (actor.kind === 'user') {
    const user = await prisma.user.findFirst({
      where: { id: actor.id, isActive: true },
      select: { id: true, name: true, password: true, department: { select: { name: true } } },
    });
    if (!user) throw new SigningError('Servidor não encontrado', 404);
    return { name: user.name, password: user.password, role: `Servidor${(user as any).department?.name ? ` - ${(user as any).department.name}` : ''}` };
  }
  const citizen = await prisma.citizen.findFirst({ where: { id: actor.id, isActive: true }, select: { id: true, name: true, password: true } });
  if (!citizen) throw new SigningError('Cidadão não encontrado', 404);
  return { name: citizen.name, password: citizen.password, role: 'Cidadão' };
}

async function checkPassword(hash: string | null | undefined, password: string) {
  if (!password || !hash || !(await bcrypt.compare(password, hash))) throw new SigningError('Senha incorreta.');
}

// ---------------------------------------------------------------- documentos

interface TargetInfo {
  title: string;
  contentHash: string;
  protocolId?: string | null;
  processId?: string | null;
  ownerUserId?: string | null;
  ownerCitizenId?: string | null;
  verifyCode?: string | null;
}

async function originalBytes(fileUrl: string): Promise<Buffer> {
  try {
    return await fs.readFile(uploadUrlToDiskPath(fileUrl));
  } catch {
    // arquivos antigos gravados com caminho relativo ao processo
    return fs.readFile(path.join(process.cwd(), fileUrl.replace(/^\/+/, '')));
  }
}

async function loadTarget(type: SignTargetType, id: string): Promise<TargetInfo> {
  if (type === 'GENERATED') {
    const doc = await prisma.generatedDocument.findFirst({
      where: { id },
      include: { template: { select: { name: true } }, protocol: { select: { number: true } } },
    });
    if (!doc || !doc.isActive) throw new SigningError('Documento não encontrado', 404);
    if (doc.status === 'SUPERSEDED') throw new SigningError('Este documento foi substituído por uma versão mais nova.');
    const contentHash = sha256(await originalBytes(doc.filePath));
    if (doc.documentHash !== contentHash) {
      await prisma.generatedDocument.update({ where: { id }, data: { documentHash: contentHash } });
    }
    return { title: `${doc.template.name} - protocolo ${doc.protocol.number}`, contentHash, protocolId: doc.protocolId, verifyCode: doc.validationCode };
  }
  if (type === 'EXTERNAL') {
    const doc = await prisma.externalDocument.findFirst({ where: { id } });
    if (!doc || !doc.isActive) throw new SigningError('Documento não encontrado', 404);
    const contentHash = sha256(await originalBytes(doc.filePath));
    if (doc.documentHash !== contentHash) {
      await prisma.externalDocument.update({ where: { id }, data: { documentHash: contentHash } });
    }
    return { title: doc.fileName, contentHash, ownerUserId: doc.userId, ownerCitizenId: doc.citizenId };
  }
  const doc = await prisma.internalProcessDocument.findFirst({ where: { id }, include: { process: { select: { number: true } } } });
  if (!doc) throw new SigningError('Documento não encontrado', 404);
  return { title: `${doc.title} - ${doc.process.number}`, contentHash: internalContentHash(doc), processId: doc.processId };
}

async function pendingRequest(type: SignTargetType, id: string, userId: string) {
  return prisma.signatureRequest.findFirst({ where: { targetType: type, targetId: id, userId, status: 'PENDENTE' } });
}

/** Quem pode assinar (fora do processo interno, que confere no próprio serviço) */
async function assertCanSign(type: SignTargetType, id: string, target: TargetInfo, actor: SignerActor) {
  if (actor.kind === 'user' && (await pendingRequest(type, id, actor.id))) return;
  if (type === 'GENERATED') {
    if (actor.kind !== 'user') throw new SigningError('Só servidores assinam documentos do protocolo.', 403);
    try {
      await assertProtocolAccess({ id: actor.id, role: actor.role || 'USER', departmentId: actor.departmentId, departmentIds: actor.departmentIds } as any, target.protocolId!);
    } catch {
      throw new SigningError('Você não tem acesso a este protocolo. Peça a quem cuida dele para pedir a sua assinatura.', 403);
    }
    return;
  }
  if (type === 'EXTERNAL') {
    const owner = actor.kind === 'user' ? target.ownerUserId === actor.id : target.ownerCitizenId === actor.id;
    if (!owner) throw new SigningError('Este documento não é seu.', 403);
  }
}

/**
 * Grava a assinatura (permissão e senha já conferidas por quem chama).
 * Usado direto pelo processo interno; os outros tipos passam por signTarget.
 */
export async function createSignature(type: SignTargetType, id: string, actor: SignerActor, contentHash: string, meta: SignMeta = {}) {
  const profile = await signerProfile(actor);
  const already = await prisma.signature.findFirst({
    where: {
      ...(type === 'GENERATED' ? { documentId: id } : type === 'EXTERNAL' ? { externalDocumentId: id } : { internalDocumentId: id }),
      ...(actor.kind === 'user' ? { signerUserId: actor.id } : { signerCitizenId: actor.id }),
      signatureHash: contentHash,
      isValid: true,
    },
    select: { id: true },
  });
  if (already) throw new SigningError('Você já assinou este documento.');

  const certificate = actor.kind === 'user' ? await ensureUserCertificate(actor.id) : await ensureCitizenCertificate(actor.id);
  const signatureValue = rsaSign(await loadSigningKey(certificate), contentHash);
  const signature = await prisma.signature.create({
    data: {
      documentId: type === 'GENERATED' ? id : null,
      externalDocumentId: type === 'EXTERNAL' ? id : null,
      internalDocumentId: type === 'INTERNAL' ? id : null,
      certificateId: certificate.id,
      signatureValue,
      signatureHash: contentHash,
      signatureAlgo: 'SHA256withRSA',
      ipAddress: meta.ipAddress || 'desconhecido',
      userAgent: meta.userAgent || null,
      signerName: profile.name,
      signerUserId: actor.kind === 'user' ? actor.id : null,
      signerCitizenId: actor.kind === 'citizen' ? actor.id : null,
      signerRole: profile.role,
      code: signatureCode(signatureValue),
    },
  });

  if (actor.kind === 'user') {
    const request = await pendingRequest(type, id, actor.id);
    if (request) {
      await prisma.signatureRequest.update({ where: { id: request.id }, data: { status: 'ASSINADO', signatureId: signature.id, signedAt: signature.signedAt } });
      await notificationService
        .notify({ recipientType: 'user', recipientId: request.requestedById, type: 'DOCUMENT_SIGNED', title: `${profile.name} assinou`, message: request.title, data: { actionUrl: requestUrl(request) } })
        .catch(() => undefined);
    }
  }
  return { signature, signerName: profile.name };
}

/** Assinar documento do protocolo ou enviado: senha → assinatura → PDF assinado */
export async function signTarget(type: Exclude<SignTargetType, 'INTERNAL'>, id: string, actor: SignerActor, password: string, meta: SignMeta = {}) {
  const profile = await signerProfile(actor);
  await checkPassword(profile.password, password);
  const target = await loadTarget(type, id);
  await assertCanSign(type, id, target, actor);
  const { signature } = await createSignature(type, id, actor, target.contentHash, meta);

  let autoPublish = false;
  if (type === 'GENERATED') {
    const doc = await prisma.generatedDocument.findFirst({ where: { id }, select: { status: true, sourceStageName: true, publishedToCitizen: true } });
    await prisma.generatedDocument.update({
      where: { id },
      data: { isSigned: true, ...(doc?.status === 'PENDING_SIGNATURE' ? { status: 'SIGNED' } : {}) },
    });
    // documento final do serviço (gerado na conclusão): vai sozinho ao cidadão
    autoPublish = doc?.sourceStageName === 'Documento final do serviço' && !doc.publishedToCitizen;
  } else {
    await prisma.externalDocument.update({ where: { id }, data: { isSigned: true } });
  }
  await renderSignedFile(type, id).catch((error) => console.warn('[assinatura] PDF assinado não refeito:', error?.message || error));
  if (autoPublish && actor.kind === 'user') {
    const { publishGeneratedDocument } = await import('../generated-document-lifecycle.service');
    await publishGeneratedDocument({ documentId: id, publishedBy: actor.id }).catch((error) =>
      console.warn('[assinatura] documento final não publicado:', error?.message || error)
    );
  }
  return { signature, code: signature.code };
}

/** Assinaturas válidas de um documento, na ordem */
export async function listSignatures(type: SignTargetType, id: string) {
  return prisma.signature.findMany({
    where: { ...(type === 'GENERATED' ? { documentId: id } : type === 'EXTERNAL' ? { externalDocumentId: id } : { internalDocumentId: id }), isValid: true },
    orderBy: { signedAt: 'asc' },
    select: { id: true, signerName: true, signerRole: true, signedAt: true, code: true, signerUserId: true, signerCitizenId: true, signatureHash: true },
  });
}

async function verifyUrl(code: string) {
  return `${await tenantPortalUrl(tryGetTenantId())}/validar-documento?codigo=${encodeURIComponent(code)}`;
}

async function municipalityName() {
  const tenantId = tryGetTenantId();
  const tenant = tenantId ? await prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null) : null;
  return (tenant as any)?.nome || 'Prefeitura Municipal';
}

/** PDF com folha de assinaturas e selo, a partir de bytes de conteúdo */
export async function buildSignedPdf(original: Buffer, type: SignTargetType, id: string, title: string, contentHash: string, fallbackCode?: string | null) {
  const signatures = await listSignatures(type, id);
  const verifyCode = fallbackCode || signatures[signatures.length - 1]?.code || '';
  const withManifest = await appendManifest(original, {
    municipality: await municipalityName(),
    title,
    verifyCode,
    verifyUrl: await verifyUrl(verifyCode),
    contentHash,
    signatures: signatures.map((item) => ({ name: item.signerName || 'Assinante', role: item.signerRole, signedAt: item.signedAt, code: item.code || '' })),
  });
  return sealPdf(withManifest, `Documento com ${signatures.length} assinatura(s) - ${verifyCode}`);
}

/** Refaz o arquivo assinado do documento (mesmo caminho: links já enviados seguem valendo) */
export async function renderSignedFile(type: Exclude<SignTargetType, 'INTERNAL'>, id: string) {
  const record =
    type === 'GENERATED'
      ? await prisma.generatedDocument.findFirst({ where: { id }, select: { filePath: true, validationCode: true } })
      : await prisma.externalDocument.findFirst({ where: { id }, select: { filePath: true } });
  if (!record) return null;
  const target = await loadTarget(type, id);
  const original = await originalBytes(record.filePath);
  const final = await buildSignedPdf(original, type, id, target.title, target.contentHash, (record as any).validationCode || null);
  const signedUrl = record.filePath.replace(/\.pdf$/i, '') + '-assinado.pdf';
  const diskPath = uploadUrlToDiskPath(signedUrl);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, final);
  const data = { signedFilePath: signedUrl, finalHash: sha256(final) };
  if (type === 'GENERATED') {
    await prisma.generatedDocument.update({ where: { id }, data });
    // o cidadão recebe sempre a versão assinada mais nova
    await prisma.citizenDocument.updateMany({ where: { sourceDocumentId: id }, data: { filePath: signedUrl, fileSize: final.length } }).catch(() => undefined);
  } else {
    await prisma.externalDocument.update({ where: { id }, data });
  }
  return { signedUrl, size: final.length };
}

/** Arquivo para baixar/enviar: o assinado, se existir; senão o original */
export function deliverablePath(doc: { filePath: string; signedFilePath?: string | null }) {
  return doc.signedFilePath || doc.filePath;
}

// ---------------------------------------------------------------- pedidos

function requestUrl(request: { targetType: string; targetId: string; protocolId?: string | null; processId?: string | null }) {
  if (request.targetType === 'INTERNAL' && request.processId) return `/admin/processos-internos/${request.processId}/documentos/${request.targetId}`;
  if (request.targetType === 'GENERATED' && request.protocolId) return `/admin/protocolos/${request.protocolId}`;
  return '/admin/assinaturas-digitais';
}
export { requestUrl };

/** Pedir a assinatura de pessoas (quem está com o documento pede) */
export async function requestSignatures(
  type: SignTargetType,
  id: string,
  requester: { id: string; name: string },
  userIds: string[],
  note?: string
) {
  const target = await loadTarget(type, id);
  const ids = [...new Set((userIds || []).map(String).filter(Boolean))].slice(0, 10);
  if (ids.length === 0) throw new SigningError('Escolha quem vai assinar.');
  const users = await prisma.user.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true, name: true } });
  if (users.length === 0) throw new SigningError('Servidor não encontrado.', 404);
  const signed = await listSignatures(type, id);
  const text = String(note || '').trim().slice(0, 1000) || null;
  const created: Array<{ id: string; name: string; requestId: string }> = [];
  for (const user of users) {
    if (signed.some((item) => item.signerUserId === user.id && item.signatureHash === target.contentHash)) continue;
    if (await pendingRequest(type, id, user.id)) continue;
    const request = await prisma.signatureRequest.create({
      data: {
        targetType: type,
        targetId: id,
        title: target.title.slice(0, 300),
        protocolId: target.protocolId || null,
        processId: target.processId || null,
        userId: user.id,
        userName: user.name,
        requestedById: requester.id,
        requestedByName: requester.name,
        note: text,
      },
    });
    await notificationService
      .notify({
        recipientType: 'user',
        recipientId: user.id,
        type: 'SIGNATURE_REQUESTED',
        title: 'Assinatura pedida',
        message: `${requester.name} pediu a sua assinatura em: ${target.title}`,
        data: { actionUrl: requestUrl(request) },
      })
      .catch(() => undefined);
    created.push({ id: user.id, name: user.name, requestId: request.id });
  }
  return { requested: created };
}

/** Recusar (quem recebeu, com motivo) ou cancelar (quem pediu) */
export async function answerRequest(requestId: string, actor: { id: string; name: string }, action: 'RECUSADO' | 'CANCELADO', note?: string) {
  const request = await prisma.signatureRequest.findFirst({ where: { id: requestId } });
  if (!request || request.status !== 'PENDENTE') throw new SigningError('Pedido não encontrado.', 404);
  if (action === 'RECUSADO' && request.userId !== actor.id) throw new SigningError('O pedido não é para você.', 403);
  if (action === 'CANCELADO' && request.requestedById !== actor.id) throw new SigningError('Só quem pediu pode cancelar.', 403);
  const text = String(note || '').trim().slice(0, 1000);
  if (action === 'RECUSADO' && !text) throw new SigningError('Diga por que não vai assinar.');
  const updated = await prisma.signatureRequest.update({ where: { id: requestId }, data: { status: action, answerNote: text || null } });
  if (action === 'RECUSADO') {
    await notificationService
      .notify({ recipientType: 'user', recipientId: request.requestedById, type: 'SIGNATURE_DECLINED', title: `${request.userName} não assinou`, message: `${request.title}: ${text}`, data: { actionUrl: requestUrl(request) } })
      .catch(() => undefined);
  }
  return updated;
}

/** Pedidos de um documento (para a tela do documento) */
export async function listRequests(type: SignTargetType, id: string) {
  return prisma.signatureRequest.findMany({ where: { targetType: type, targetId: id }, orderBy: { createdAt: 'asc' } });
}

/** Fila do servidor: esperando a assinatura dele / que ele pediu */
export async function myQueue(userId: string) {
  const [toSign, asked] = await Promise.all([
    prisma.signatureRequest.findMany({ where: { userId, status: 'PENDENTE' }, orderBy: { createdAt: 'asc' }, take: 50 }),
    prisma.signatureRequest.findMany({ where: { requestedById: userId, status: 'PENDENTE' }, orderBy: { createdAt: 'asc' }, take: 50 }),
  ]);
  return {
    toSign: toSign.map((item) => ({ ...item, url: requestUrl(item) })),
    asked: asked.map((item) => ({ ...item, url: requestUrl(item) })),
  };
}

// ---------------------------------------------------------------- conferência pública

async function currentContentHash(signature: { documentId: string | null; externalDocumentId: string | null; internalDocumentId: string | null }) {
  try {
    if (signature.documentId) return (await loadTarget('GENERATED', signature.documentId)).contentHash;
    if (signature.externalDocumentId) return (await loadTarget('EXTERNAL', signature.externalDocumentId)).contentHash;
    if (signature.internalDocumentId) return (await loadTarget('INTERNAL', signature.internalDocumentId)).contentHash;
  } catch (error) {
    if (error instanceof SigningError && /substituído/.test(error.message)) {
      const doc = await prisma.generatedDocument.findFirst({ where: { id: signature.documentId! }, select: { documentHash: true } });
      return doc?.documentHash || null;
    }
  }
  return null;
}

/** Situação de uma assinatura: confere a criptografia, o conteúdo e o certificado */
export async function checkSignature(signature: {
  id: string;
  signatureValue: string;
  signatureHash: string;
  signedAt: Date;
  documentId: string | null;
  externalDocumentId: string | null;
  internalDocumentId: string | null;
  certificate: { publicKey: string; certificateChain: string; serialNumber: string; status: string; revokedAt: Date | null; revocationReason: string | null };
}) {
  const cryptoOk = rsaVerify(signature.certificate.publicKey, signature.signatureHash, signature.signatureValue);
  const contentHash = await currentContentHash(signature);
  const contentOk = !!contentHash && contentHash === signature.signatureHash;
  const fromPlatformCA = await isIssuedByPlatformCA(signature.certificate.certificateChain);
  // revogação só invalida assinatura feita DEPOIS dela, ou se a chave vazou
  const revokedBefore =
    signature.certificate.status === 'REVOKED' &&
    (signature.certificate.revocationReason === 'KEY_COMPROMISE' || (!!signature.certificate.revokedAt && signature.certificate.revokedAt <= signature.signedAt));
  return {
    valid: cryptoOk && contentOk && !revokedBefore,
    cryptoOk,
    contentOk,
    fromPlatformCA,
    revoked: revokedBefore,
    reason: !cryptoOk
      ? 'A assinatura não confere com o certificado.'
      : !contentOk
        ? 'O conteúdo do documento mudou depois da assinatura.'
        : revokedBefore
          ? 'O certificado de quem assinou estava revogado.'
          : null,
  };
}

/**
 * Conferência pública por código (QR ou digitado). Aceita o código de uma
 * assinatura (XXXX-XXXX-XXXX-XXXX) ou o código de validação de documento do
 * protocolo (VAL-...). Busca em todos os municípios (códigos são únicos e
 * aleatórios) e devolve só o que é público.
 */
export async function verifyPublicCode(raw: string) {
  return runAsPlatform(async () => {
    const code = normalizeCode(raw);
    let documentRef: { type: SignTargetType; id: string } | null = null;
    if (code) {
      const signature = await prisma.signature.findFirst({ where: { code }, select: { documentId: true, externalDocumentId: true, internalDocumentId: true } });
      if (signature?.documentId) documentRef = { type: 'GENERATED', id: signature.documentId };
      else if (signature?.externalDocumentId) documentRef = { type: 'EXTERNAL', id: signature.externalDocumentId };
      else if (signature?.internalDocumentId) documentRef = { type: 'INTERNAL', id: signature.internalDocumentId };
    }
    if (!documentRef) {
      const generated = await prisma.generatedDocument.findFirst({ where: { validationCode: String(raw || '').trim().toUpperCase() }, select: { id: true } });
      if (generated) documentRef = { type: 'GENERATED', id: generated.id };
    }
    if (!documentRef) return null;
    return describeDocument(documentRef.type, documentRef.id, code);
  });
}

async function describeDocument(type: SignTargetType, id: string, highlightCode: string | null) {
  const where = type === 'GENERATED' ? { documentId: id } : type === 'EXTERNAL' ? { externalDocumentId: id } : { internalDocumentId: id };
  const signatures = await prisma.signature.findMany({
    where,
    orderBy: { signedAt: 'asc' },
    include: { certificate: { select: { publicKey: true, certificateChain: true, serialNumber: true, status: true, revokedAt: true, revocationReason: true, organization: true } } },
  });
  const checked = await Promise.all(
    signatures.map(async (item) => ({
      name: item.signerName || 'Assinante',
      role: item.signerRole,
      signedAt: item.signedAt,
      code: item.code,
      highlighted: !!highlightCode && item.code === highlightCode,
      ...(await checkSignature(item)),
    }))
  );

  let documentInfo: Record<string, unknown> = {};
  let status: 'VALID' | 'SUPERSEDED' | 'REVOKED' | 'EXPIRED' | 'UNSIGNED' = signatures.length ? 'VALID' : 'UNSIGNED';
  let tenantId: string | null = null;
  if (type === 'GENERATED') {
    const doc = await prisma.generatedDocument.findFirst({
      where: { id },
      include: {
        template: { select: { name: true } },
        protocol: { select: { number: true, service: { select: { name: true } }, department: { select: { name: true } }, citizen: { select: { name: true } } } },
      },
    });
    if (doc) {
      tenantId = doc.tenantId;
      const newer = doc.status === 'SUPERSEDED'
        ? await prisma.generatedDocument.findFirst({ where: { previousVersionId: doc.id }, select: { validationCode: true, revisionNumber: true } })
        : null;
      if (!doc.isActive || doc.deletedAt) status = 'REVOKED';
      else if (doc.status === 'SUPERSEDED') status = 'SUPERSEDED';
      else if (doc.expiresAt && doc.expiresAt < new Date()) status = 'EXPIRED';
      documentInfo = {
        kind: 'Documento de protocolo',
        title: doc.template.name,
        number: doc.protocol.number,
        service: doc.protocol.service?.name,
        department: doc.protocol.department?.name,
        person: maskName(doc.protocol.citizen?.name),
        createdAt: doc.generatedAt,
        validationCode: doc.validationCode,
        revision: doc.revisionNumber,
        newerVersionCode: newer?.validationCode || null,
        expiresAt: doc.expiresAt,
      };
      await prisma.generatedDocument.update({ where: { id }, data: { validatedCount: { increment: 1 }, lastValidatedAt: new Date() } }).catch(() => undefined);
    }
  } else if (type === 'EXTERNAL') {
    const doc = await prisma.externalDocument.findFirst({ where: { id }, select: { fileName: true, uploadedAt: true, isActive: true, tenantId: true } });
    if (doc) {
      tenantId = doc.tenantId;
      if (!doc.isActive) status = 'REVOKED';
      documentInfo = { kind: 'Documento assinado', title: doc.fileName, createdAt: doc.uploadedAt };
    }
  } else {
    const doc = await prisma.internalProcessDocument.findFirst({
      where: { id },
      include: { process: { select: { number: true, subject: true, confidential: true, type: { select: { name: true } } } } },
    });
    if (doc) {
      tenantId = doc.tenantId;
      documentInfo = {
        kind: doc.process.type?.name || 'Processo interno',
        title: doc.title,
        number: doc.process.number,
        // processo sigiloso: não mostra o assunto
        subject: doc.process.confidential ? null : doc.process.subject,
        createdAt: doc.createdAt,
      };
    }
  }

  const municipality = tenantId ? await prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null) : null;
  const allValid = checked.length > 0 && checked.every((item) => item.valid);
  return {
    municipality: (municipality as any)?.nome || null,
    status: status === 'VALID' && !allValid ? 'INVALID' : status,
    document: documentInfo,
    signatures: checked.map(({ cryptoOk, contentOk, ...rest }) => rest),
  };
}

/** Nome do cidadão na conferência pública: só o primeiro e as iniciais (LGPD) */
export function maskName(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return [parts[0], ...parts.slice(1).map((part) => (part.length <= 3 && part === part.toLowerCase() ? part : `${part[0]}.`))].join(' ');
}

/** Conferir um arquivo baixado: bate com o arquivo assinado ou com o original? */
export async function verifyUploadedFile(raw: string, file: Buffer) {
  return runAsPlatform(async () => {
    const result = await verifyPublicCode(raw);
    if (!result) return null;
    const hash = sha256(file);
    const code = normalizeCode(raw);
    const signature = code ? await prisma.signature.findFirst({ where: { code }, select: { documentId: true, externalDocumentId: true, signatureHash: true } }) : null;
    let matches = false;
    if (signature?.documentId || !code) {
      const doc = signature?.documentId
        ? await prisma.generatedDocument.findFirst({ where: { id: signature.documentId }, select: { documentHash: true, finalHash: true } })
        : await prisma.generatedDocument.findFirst({ where: { validationCode: String(raw).trim().toUpperCase() }, select: { documentHash: true, finalHash: true } });
      matches = !!doc && (hash === doc.finalHash || hash === doc.documentHash);
    } else if (signature?.externalDocumentId) {
      const doc = await prisma.externalDocument.findFirst({ where: { id: signature.externalDocumentId }, select: { documentHash: true, finalHash: true } });
      matches = !!doc && (hash === doc.finalHash || hash === doc.documentHash);
    }
    return { ...result, fileMatches: matches };
  });
}
