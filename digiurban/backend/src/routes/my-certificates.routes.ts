import { Router } from 'express';
import { authenticateAdmin, authenticateCitizen } from '../middleware/auth';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

/**
 * GET /api/admin/my-certificates
 * Lista certificados digitais do usuário admin/servidor logado
 */
router.get('/admin/my-certificates', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const certificates = await prisma.digitalCertificate.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      include: {
        _count: {
          select: { signatures: true }
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json({
      success: true,
      certificates
    });
  } catch (error: any) {
    console.error('Erro ao buscar certificados do admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar certificados'
    });
  }
});

/**
 * GET /api/citizen/my-certificates
 * Lista certificados digitais do cidadão logado
 */
router.get('/citizen/my-certificates', authenticateCitizen, async (req, res) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({
        success: false,
        message: 'Cidadão não autenticado'
      });
    }

    const certificates = await prisma.digitalCertificate.findMany({
      where: {
        citizenId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      include: {
        _count: {
          select: { signatures: true }
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json({
      success: true,
      certificates
    });
  } catch (error: any) {
    console.error('Erro ao buscar certificados do cidadão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar certificados'
    });
  }
});

export default router;
