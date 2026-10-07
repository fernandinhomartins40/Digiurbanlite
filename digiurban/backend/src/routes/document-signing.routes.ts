/**
 * Assinar documento (servidor ou cidadão) — motor único (services/signing).
 * Assinar = confirmar a senha. A chave privada nunca vem nem vai para a tela;
 * o PDF original não é carimbado (a folha de assinaturas vai no fim do PDF
 * assinado, com QR e selo do município).
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { checkSignature, signTarget, SigningError } from '../services/signing/signature.service';

const router = Router();

function actorFrom(req: any) {
  const user = req.user;
  const citizen = req.citizen;
  if (user?.id && !citizen) {
    return { kind: 'user' as const, id: user.id, role: user.role, departmentId: user.departmentId, departmentIds: user.departmentIds };
  }
  if (citizen?.id) return { kind: 'citizen' as const, id: citizen.id };
  return null;
}

/**
 * POST /api/documents/sign
 * body: { documentId (gerado no protocolo) | externalDocumentId (enviado), password }
 */
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const { documentId, externalDocumentId, password } = req.body || {};
    const actor = actorFrom(req);
    if (!actor) return res.status(401).json({ success: false, message: 'Faça login de novo.' });
    if (!documentId && !externalDocumentId) {
      return res.status(400).json({ success: false, message: 'Informe o documento.' });
    }
    if (!password) return res.status(400).json({ success: false, message: 'Digite a sua senha para assinar.' });
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'desconhecido';
    const result = await signTarget(documentId ? 'GENERATED' : 'EXTERNAL', String(documentId || externalDocumentId), actor, String(password), {
      ipAddress,
      userAgent: String(req.headers['user-agent'] || ''),
    });
    res.json({ success: true, message: 'Documento assinado', code: result.code, signature: result.signature });
  } catch (error: any) {
    if (error instanceof SigningError) return res.status(error.status).json({ success: false, message: error.message });
    console.error('Erro ao assinar documento:', error);
    res.status(500).json({ success: false, message: 'Não foi possível assinar agora. Tente de novo.' });
  }
});

/**
 * POST /api/documents/verify-signature/:signatureId
 * Confere uma assinatura (criptografia, conteúdo e certificado)
 */
router.post('/verify-signature/:signatureId', authenticateToken, async (req, res) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: { id: req.params.signatureId },
      include: { certificate: true },
    });
    if (!signature) return res.status(404).json({ success: false, message: 'Assinatura não encontrada' });
    const result = await checkSignature(signature);
    res.json({
      success: true,
      valid: result.valid,
      reason: result.reason,
      signer: { name: signature.signerName || signature.certificate.commonName, role: signature.signerRole },
      signedAt: signature.signedAt,
      code: signature.code,
      certificate: { serialNumber: signature.certificate.serialNumber, issuedAt: signature.certificate.issuedAt, expiresAt: signature.certificate.expiresAt },
    });
  } catch (error: any) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({ success: false, message: 'Não foi possível conferir agora.' });
  }
});

export default router;
