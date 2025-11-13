import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/departments/:department/stats
 *
 * Retorna estatísticas agregadas de um departamento:
 * - Total de protocolos
 * - Stats por serviço (total, pending, approved, etc)
 * - Stats específicas por tipo de módulo
 */
// Mapping de slugs para nomes de departamentos
function departmentSlugToName(slug: string): string {
  const mapping: Record<string, string> = {
    'agricultura': 'Agricultura',
    'saude': 'Saúde',
    'educacao': 'Educação',
    'esportes': 'Esportes',
    'assistencia-social': 'Assistência Social',
    'cultura': 'Cultura',
    'meio-ambiente': 'Meio Ambiente',
    'obras-publicas': 'Obras Públicas',
    'planejamento-urbano': 'Planejamento Urbano',
    'habitacao': 'Habitação',
    'seguranca-publica': 'Segurança Pública',
    'servicos-publicos': 'Serviços Públicos',
    'turismo': 'Turismo',
  };
  return mapping[slug] || slug;
}

router.get('/:department/stats', authenticateToken, async (req, res) => {
  try {
    const { department: departmentSlug } = req.params;

    // Converte slug para nome do departamento
    const departmentName = departmentSlugToName(departmentSlug);

    // Busca o departamento
    const department = await prisma.department.findFirst({
      where: { name: departmentName },
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Busca todos os serviços do departamento
    const services = await prisma.serviceSimplified.findMany({
      where: {
        departmentId: department.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        serviceType: true,
        moduleType: true,
        formSchema: true,
      },
    });

    // Para cada serviço COM_DADOS, busca stats de protocolos
    const servicesWithStats = await Promise.all(
      services.map(async (service: any) => {
        if (service.serviceType !== 'COM_DADOS') {
          return {
            ...service,
            stats: { total: 0, pending: 0, approved: 0, rejected: 0, inProgress: 0 },
          };
        }

        // Conta protocolos por status
        const protocolStats = await prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: { serviceId: service.id },
          _count: true,
        });

        const statsMap = protocolStats.reduce((acc: any, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>);

        // Gera slug a partir do nome do serviço
        const slug = service.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
          .trim()
          .replace(/\s+/g, '-'); // Substitui espaços por hífen

        return {
          ...service,
          slug,
          stats: {
            total: protocolStats.reduce((sum: number, s: any) => sum + s._count, 0),
            pending: statsMap['PENDENCIA'] || 0,
            approved: statsMap['CONCLUIDO'] || 0,
            rejected: statsMap['CANCELADO'] || 0,
            inProgress: statsMap['PROGRESSO'] || 0,
          },
        };
      })
    );

    // Stats agregadas do departamento
    // Busca IDs de todos os serviços do departamento
    const serviceIds = services.map(s => s.id);

    const totalProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: { in: serviceIds },
      },
    });

    const pendingProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: { in: serviceIds },
        status: 'PENDENCIA',
      },
    });

    const approvedProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: { in: serviceIds },
        status: 'CONCLUIDO',
      },
    });

    const inProgressProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: { in: serviceIds },
        status: 'PROGRESSO',
      },
    });

    res.json({
      department: departmentSlug,
      protocols: {
        total: totalProtocols,
        pending: pendingProtocols,
        approved: approvedProtocols,
        inProgress: inProgressProtocols,
      },
      services: servicesWithStats,
    });
  } catch (error) {
    console.error('Erro ao buscar stats do departamento:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
