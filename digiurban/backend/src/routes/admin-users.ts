import { Router } from 'express';
import { Prisma, SituacaoVinculo } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

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
        userDepartments: {
          where: {
            isActive: true,
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' },
          ],
          select: {
            departmentId: true,
            isPrimary: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignments: {
          where: {
            situacao: SituacaoVinculo.ATIVO,
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' },
          ],
          select: {
            departmentId: true,
            isPrimary: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    // Resolver departamento do servidor usando o vínculo primário ativo quando o campo legado estiver vazio.
    const formattedUsers = users.map(user => {
      const linkedDepartment =
        user.department ||
        user.userDepartments.find(department => department.isPrimary)?.department ||
        user.userDepartments[0]?.department ||
        user.assignments.find(assignment => assignment.isPrimary)?.department ||
        user.assignments[0]?.department;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId || linkedDepartment?.id || undefined,
        department: linkedDepartment?.name || undefined,
      };
    });

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
