import { Router } from 'express';
import { authenticateAdmin, authenticateCitizen, authenticateToken } from '../middleware/auth';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';
import { assertProtocolAccess } from '../services/protocol-access.service';
import {
  answerRequest,
  listRequests,
  listSignatures,
  myQueue,
  requestSignatures,
  SigningError,
} from '../services/signing/signature.service';

/**
 * GET /api/signatures/my-signatures
 * Buscar assinaturas do usuário admin logado
 */
router.get('/my-signatures', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    // Buscar certificados do usuário
    const certificates = await prisma.digitalCertificate.findMany({
      where: { userId },
      select: { id: true },
    });

    const certificateIds = certificates.map(cert => cert.id);

    // Buscar assinaturas usando os certificados do usuário
    const signatures = await prisma.signature.findMany({
      where: {
        certificateId: {
          in: certificateIds,
        },
      },
      include: {
        certificate: {
          select: {
            id: true,
            commonName: true,
            email: true,
            certificateType: true,
            status: true,
            serialNumber: true,
          },
        },
        externalDocument: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Mapear para o formato esperado pelo frontend
    const mappedSignatures = signatures.map((sig: any) => ({
      id: sig.id,
      signedAt: sig.signedAt,
      verificationStatus: sig.verificationStatus || 'VALID',
      certificate: {
        id: sig.certificate.id,
        commonName: sig.certificate.commonName,
        email: sig.certificate.email,
        type: sig.certificate.certificateType,
        status: sig.certificate.status,
        serialNumber: sig.certificate.serialNumber,
      },
      document: sig.externalDocument || sig.document,
    }));

    res.json({ success: true, signatures: mappedSignatures });
  } catch (error: any) {
    console.error('Erro ao buscar assinaturas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar assinaturas',
    });
  }
});

/**
 * GET /api/signatures/my-signatures-citizen
 * Buscar assinaturas do cidadão logado
 */
router.get('/my-signatures-citizen', authenticateCitizen, async (req, res) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ success: false, message: 'Cidadão não autenticado' });
    }

    // Buscar certificados do cidadão
    const certificates = await prisma.digitalCertificate.findMany({
      where: { citizenId },
      select: { id: true },
    });

    const certificateIds = certificates.map(cert => cert.id);

    // Buscar assinaturas usando os certificados do cidadão
    const signatures = await prisma.signature.findMany({
      where: {
        certificateId: {
          in: certificateIds,
        },
      },
      include: {
        certificate: {
          select: {
            id: true,
            commonName: true,
            email: true,
            certificateType: true,
            status: true,
            serialNumber: true,
          },
        },
        externalDocument: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Mapear para o formato esperado pelo frontend
    const mappedSignatures = signatures.map((sig: any) => ({
      id: sig.id,
      signedAt: sig.signedAt,
      verificationStatus: sig.verificationStatus || 'VALID',
      certificate: {
        id: sig.certificate.id,
        commonName: sig.certificate.commonName,
        email: sig.certificate.email,
        type: sig.certificate.certificateType,
        status: sig.certificate.status,
        serialNumber: sig.certificate.serialNumber,
      },
      document: sig.externalDocument || sig.document,
    }));

    res.json({ success: true, signatures: mappedSignatures });
  } catch (error: any) {
    console.error('Erro ao buscar assinaturas do cidadão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar assinaturas',
    });
  }
});

/**
 * GET /api/signatures/document/:documentId
 * Buscar assinaturas de um documento específico
 */
// Exige login (antes: aberto — expunha nome/e-mail dos signatários)
router.get('/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const signatures = await prisma.signature.findMany({
      where: {
        OR: [
          { externalDocumentId: documentId },
          { documentId: documentId },
        ],
      },
      include: {
        certificate: {
          select: {
            id: true,
            commonName: true,
            email: true,
            certificateType: true,
            status: true,
            serialNumber: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Mapear para o formato esperado pelo frontend
    const mappedSignatures = signatures.map((sig: any) => ({
      id: sig.id,
      signedAt: sig.signedAt,
      code: sig.code,
      signerName: sig.signerName || sig.certificate.commonName,
      signerRole: sig.signerRole,
      verificationStatus: sig.verificationStatus || 'VALID',
      certificate: {
        id: sig.certificate.id,
        commonName: sig.certificate.commonName,
        email: sig.certificate.email,
        type: sig.certificate.certificateType,
        status: sig.certificate.status,
        serialNumber: sig.certificate.serialNumber,
      },
    }));

    res.json({ success: true, signatures: mappedSignatures });
  } catch (error: any) {
    console.error('Erro ao buscar assinaturas do documento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar assinaturas',
    });
  }
});

// ============================================================================
// Pedidos de assinatura (fila única: documento do protocolo, enviado, processo interno)
// ============================================================================

const sendError = (res: any, error: any) => {
  if (error instanceof SigningError) return res.status(error.status).json({ success: false, message: error.message });
  console.error('[assinaturas]', error);
  return res.status(500).json({ success: false, message: 'Não foi possível concluir agora.' });
};

/** GET /api/signatures/queue — esperando a minha assinatura / que eu pedi */
router.get('/queue', authenticateAdmin, async (req, res) => {
  try {
    res.json({ success: true, data: await myQueue(req.user!.id) });
  } catch (error) {
    sendError(res, error);
  }
});

/** GET /api/signatures/target/:type/:id — assinaturas e pedidos de um documento */
router.get('/target/:type/:id', authenticateToken, async (req, res) => {
  try {
    const type = String(req.params.type).toUpperCase();
    if (!['GENERATED', 'EXTERNAL'].includes(type)) return res.status(400).json({ success: false, message: 'Tipo inválido' });
    const [signatures, requests] = await Promise.all([listSignatures(type as any, req.params.id), listRequests(type as any, req.params.id)]);
    const userId = (req as any).user?.id;
    res.json({
      success: true,
      data: {
        signatures,
        requests,
        myRequest: userId ? requests.find((item) => item.userId === userId && item.status === 'PENDENTE') || null : null,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
});

/** POST /api/signatures/requests — pedir a assinatura de servidores */
router.post('/requests', authenticateAdmin, async (req, res) => {
  try {
    const type = String(req.body?.targetType || '').toUpperCase();
    const targetId = String(req.body?.targetId || '');
    const user = req.user as any;
    if (type === 'GENERATED') {
      const doc = await prisma.generatedDocument.findFirst({ where: { id: targetId }, select: { protocolId: true } });
      if (!doc) return res.status(404).json({ success: false, message: 'Documento não encontrado' });
      await assertProtocolAccess({ id: user.id, role: user.role, departmentId: user.departmentId, departmentIds: user.departmentIds } as any, doc.protocolId);
    } else if (type === 'EXTERNAL') {
      const doc = await prisma.externalDocument.findFirst({ where: { id: targetId }, select: { userId: true } });
      if (!doc || doc.userId !== user.id) return res.status(403).json({ success: false, message: 'Este documento não é seu.' });
    } else {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }
    const result = await requestSignatures(type as any, targetId, { id: user.id, name: user.name }, Array.isArray(req.body?.userIds) ? req.body.userIds : [], req.body?.note);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === 'ProtocolAccessDeniedError' || error?.status === 403) {
      return res.status(403).json({ success: false, message: 'Você não tem acesso a este protocolo.' });
    }
    sendError(res, error);
  }
});

/** POST /api/signatures/requests/:id/decline — quem recebeu não vai assinar (com motivo) */
router.post('/requests/:id/decline', authenticateAdmin, async (req, res) => {
  try {
    const user = req.user as any;
    res.json({ success: true, data: await answerRequest(req.params.id, { id: user.id, name: user.name }, 'RECUSADO', req.body?.note) });
  } catch (error) {
    sendError(res, error);
  }
});

/** POST /api/signatures/requests/:id/cancel — quem pediu cancela */
router.post('/requests/:id/cancel', authenticateAdmin, async (req, res) => {
  try {
    const user = req.user as any;
    res.json({ success: true, data: await answerRequest(req.params.id, { id: user.id, name: user.name }, 'CANCELADO') });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
