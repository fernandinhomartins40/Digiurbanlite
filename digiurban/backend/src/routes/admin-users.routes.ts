import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/users/search
 * Buscar usuários admin por nome ou email
 */
router.get('/search', authenticateAdmin, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = q.toLowerCase().trim();

    // Buscar usuários que correspondem ao termo de busca
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar usuários',
    });
  }
});

export default router;
