import { Router } from 'express';
import { Prisma, PrismaClient, SituacaoVinculo } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

console.log('🔧 [ADMIN-USERS] Rota admin-users carregada!');

/**
 * GET /api/admin/users/search
 * Buscar usuários admin por nome ou email
 */
router.get('/search', authenticateAdmin, async (req, res) => {
  try {
    const { q, departmentId } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = q.toLowerCase().trim();

    // Buscar usuários que correspondem ao termo de busca
    const where: Prisma.UserWhereInput = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
      isActive: true,
    };

    if (typeof departmentId === 'string' && departmentId) {
      where.AND = [
        {
          OR: [
            { departmentId },
            {
              userDepartments: {
                some: {
                  departmentId,
                  isActive: true,
                },
              },
            },
            {
              assignments: {
                some: {
                  departmentId,
                  situacao: SituacaoVinculo.ATIVO,
                },
              },
            },
          ],
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    // Transformar department de objeto para string
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || user.department?.id || undefined,
      department: user.department?.name || undefined,
    }));

    res.json({
      success: true,
      data: formattedUsers,
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
