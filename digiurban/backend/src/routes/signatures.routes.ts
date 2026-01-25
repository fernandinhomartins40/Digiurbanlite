import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, authenticateCitizen } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

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
router.get('/document/:documentId', async (req, res) => {
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

export default router;
