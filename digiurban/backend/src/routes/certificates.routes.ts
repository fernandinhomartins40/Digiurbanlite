import { Router } from 'express';
import { issueServerCertificate, revokeCertificate } from '../services/certificate-authority.service';
import { signDocument, verifySignature } from '../services/document-signing.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os certificados
router.get('/', async (req, res) => {
  try {
    const certificates = await prisma.digitalCertificate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            signatures: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      userId: cert.userId,
      citizenId: cert.citizenId,
      userName: cert.user?.name || cert.citizen?.name,
      type: cert.certificateType,
      status: cert.status,
      serialNumber: cert.serialNumber,
      commonName: cert.commonName,
      organization: cert.organization,
      issuer: cert.issuerCA,
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt.toISOString(),
      thumbprint: cert.thumbprint,
      _count: cert._count
    }));

    res.json({ success: true, certificates: formattedCertificates });
  } catch (error: any) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/issue', async (req, res) => {
  try {
    const result = await issueServerCertificate({
      userId: req.body.userId,
      citizenId: req.body.citizenId,
      commonName: req.body.commonName,
      email: req.body.email,
      department: req.body.department,
      certificateType: req.body.certificateType || 'SERVER',
      validityYears: req.body.validityYears || 2,
    });

    res.json({ success: true, certificate: result.certificate, privateKey: result.privateKey });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/revoke', async (req, res) => {
  try {
    const { serialNumber, reason, revokedBy, comments } = req.body;

    // Validar reason - deve ser um valor do enum
    const validReasons = ['UNSPECIFIED', 'KEY_COMPROMISE', 'CA_COMPROMISE', 'AFFILIATION_CHANGED', 'SUPERSEDED', 'CESSATION', 'CERTIFICATE_HOLD'];
    const revocationReason = validReasons.includes(reason) ? reason : 'UNSPECIFIED';

    await revokeCertificate(serialNumber, revocationReason as any, revokedBy, comments);
    res.json({ success: true, message: 'Certificado revogado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao revogar certificado:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sign', async (req, res) => {
  try {
    const signature = await signDocument({
      documentId: req.body.documentId,
      certificateId: req.body.certificateId,
      privateKey: req.body.privateKey,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({ success: true, signature });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/verify/:signatureId', async (req, res) => {
  try {
    const result = await verifySignature(req.params.signatureId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download de certificado
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.digitalCertificate.findUnique({
      where: { id },
      select: {
        id: true,
        serialNumber: true,
        commonName: true,
        certificateChain: true,
        status: true,
      }
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    // Definir headers para download
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="certificado_${certificate.serialNumber}.pem"`);

    // Enviar a cadeia de certificação em formato PEM
    res.send(certificate.certificateChain);
  } catch (error: any) {
    console.error('Erro ao fazer download do certificado:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ROTAS DE GERENCIAMENTO DE SOLICITAÇÕES DE CERTIFICADOS
// ============================================================================

// Listar todas as solicitações de certificados (prefeito/secretário)
router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const requests = await prisma.certificateRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        certificate: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            expiresAt: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    const formattedRequests = requests.map(req => ({
      id: req.id,
      user: req.user,
      commonName: req.commonName,
      email: req.email,
      certificateType: req.certificateType,
      keySize: req.keySize,
      status: req.status,
      requestReason: req.requestReason,
      requestedAt: req.requestedAt.toISOString(),
      reviewedBy: req.reviewer,
      reviewedAt: req.reviewedAt?.toISOString(),
      reviewComments: req.reviewComments,
      certificate: req.certificate,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString()
    }));

    res.json({ success: true, requests: formattedRequests });
  } catch (error: any) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Aprovar solicitação e emitir certificado
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, comments } = req.body;

    // Buscar solicitação
    const request = await prisma.certificateRequest.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Solicitação já foi processada' });
    }

    // Buscar departamento do usuário
    const userWithDept = await prisma.user.findUnique({
      where: { id: request.userId },
      include: { department: true }
    });

    // Emitir certificado
    const result = await issueServerCertificate({
      userId: request.userId,
      commonName: request.commonName,
      email: request.email,
      department: userWithDept?.department?.name || 'Não especificado',
      certificateType: request.certificateType,
      validityYears: 2
    });

    // Atualizar solicitação
    await prisma.certificateRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComments: comments,
        certificateId: result.certificate.id
      }
    });

    res.json({
      success: true,
      message: 'Certificado emitido com sucesso',
      certificate: result.certificate,
      privateKey: result.privateKey
    });
  } catch (error: any) {
    console.error('Erro ao aprovar solicitação:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rejeitar solicitação
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, comments } = req.body;

    const request = await prisma.certificateRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Solicitação já foi processada' });
    }

    await prisma.certificateRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComments: comments || 'Solicitação rejeitada'
      }
    });

    res.json({ success: true, message: 'Solicitação rejeitada' });
  } catch (error: any) {
    console.error('Erro ao rejeitar solicitação:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
