// ============================================================================
// DEPARTMENTS-TICKETS.TS - Gerenciamento de chamados administrativos pelas secretarias
// ============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { isPrismaMissingTableError } from '../utils/prisma-missing-table';

const router = Router();

router.use(adminAuthMiddleware);

// ============================================================================
// GET /api/departments - Listar departamentos para selects administrativos
// ============================================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user, userRole } = req as Request & {
      user?: { departmentId?: string | null };
      userRole?: UserRole;
    };

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.SUPER_ADMIN &&
      user?.departmentId
    ) {
      where.id = user.departmentId;
    }

    const departments = await prisma.department.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar departamentos',
    });
  }
});

// ============================================================================
// GET /api/departments/tickets - Listar chamados pendentes da secretaria
// ============================================================================
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const status = req.query.status as string;

    const where: Record<string, unknown> = {};

    // Se usuário tem departmentId, filtra apenas os chamados da secretaria
    // Se é ADMIN (sem departmentId), mostra todos os chamados
    if (user.departmentId) {
      where.departmentId = user.departmentId;
    }

    if (status) {
      where.status = status;
    }

    const tickets = await prisma.adminTicket.findMany({
      where,
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        protocol: {
          select: {
            id: true,
            number: true,
            status: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Estatísticas
    const statsWhere: Record<string, unknown> = {};
    if (user.departmentId) {
      statsWhere.departmentId = user.departmentId;
    }

    const stats = await prisma.adminTicket.groupBy({
      by: ['status'],
      where: statsWhere,
      _count: { status: true }
    });

    const statusCount = stats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        tickets,
        stats: {
          total: tickets.length,
          byStatus: statusCount
        }
      }
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, ['admin_tickets'])) {
      console.warn(
        '[departments-tickets] tabela admin_tickets ausente. Retornando lista vazia para /departments/tickets.'
      );
      return res.json({
        success: true,
        data: {
          tickets: [],
          stats: {
            total: 0,
            byStatus: {},
          },
        },
        degraded: true,
      });
    }

    console.error('Erro ao listar chamados da secretaria:', error);
    res.status(500).json({ error: 'Erro ao listar chamados' });
  }
});

// ============================================================================
// POST /api/departments/tickets/:id/accept - Aceitar chamado e criar protocolo
// ============================================================================

const acceptTicketSchema = z.object({
  assignedUserId: z.string().optional(),
  observations: z.string().optional()
});

router.post('/tickets/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.departmentId) {
      res.status(403).json({ error: 'Usuário não pertence a nenhuma secretaria' });
      return;
    }

    const data = acceptTicketSchema.parse(req.body);

    // Buscar ticket
    const ticket = await prisma.adminTicket.findUnique({
      where: { id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Chamado não encontrado' });
      return;
    }

    // Verificar se o ticket pertence à secretaria do usuário
    if (ticket.departmentId !== user.departmentId) {
      res.status(403).json({ error: 'Este chamado não pertence à sua secretaria' });
      return;
    }

    // Verificar se já foi aceito
    if (ticket.status !== 'PENDING') {
      res.status(400).json({ error: `Chamado já foi ${ticket.status === 'ACCEPTED' ? 'aceito' : 'processado'}` });
      return;
    }

    // Verificar usuário atribuído (se informado)
    if (data.assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: data.assignedUserId,
          departmentId: user.departmentId,
          isActive: true
        }
      });

      if (!assignedUser) {
        res.status(404).json({ error: 'Servidor não encontrado ou não pertence à secretaria' });
        return;
      }
    }

    // Gerar número do protocolo
    const protocolNumber = await generateProtocolNumberSafe();

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        citizenId: ticket.citizenId,
        serviceId: ticket.serviceId,
        departmentId: ticket.departmentId,
        createdById: user.id,
        assignedUserId: data.assignedUserId || undefined,
        status: 'VINCULADO'
      },
      include: {
        citizen: {
          select: {
            name: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            name: true
          }
        }
      }
    });

    // Atualizar ticket
    const updatedTicket = await prisma.adminTicket.update({
      where: { id },
      data: {
        status: 'PROTOCOL_CREATED',
        protocolId: protocol.id,
        acceptedAt: new Date(),
        protocolCreatedAt: new Date(),
        acceptedBy: user.name,
        assignedUserId: data.assignedUserId || undefined,
        observations: data.observations
      },
      include: {
        protocol: true,
        citizen: true,
        service: true,
        department: true,
        requestedBy: true,
        assignedUser: true
      }
    });

    // Criar histórico no protocolo
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'TICKET_ACCEPTED',
        comment: `Chamado administrativo #${ticket.number} aceito por ${user.name}. ${data.observations || ''}`,
        userId: user.id
      }
    });

    // Notificar cidadão
    await prisma.notification.create({
      data: {
        citizenId: ticket.citizenId,
        title: 'Protocolo Criado',
        message: `A secretaria criou o protocolo ${protocolNumber} para atender sua solicitação: ${ticket.title}`,
        type: 'INFO',
        protocolId: protocol.id
      }
    });

    // Notificar prefeito
    console.log(
      `[NOTIFICATION] Chamado ${ticket.number} aceito. Protocolo ${protocolNumber} criado por ${user.name}`
    );

    res.json({
      success: true,
      message: 'Chamado aceito e protocolo criado com sucesso',
      data: {
        ticket: updatedTicket,
        protocol
      }
    });
  } catch (error: any) {
    console.error('Erro ao aceitar chamado:', error);
    res.status(500).json({
      error: 'Erro ao aceitar chamado',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/departments/tickets/:id/reject - Recusar chamado
// ============================================================================

const rejectTicketSchema = z.object({
  reason: z.string().min(10, 'Informe o motivo da recusa (mínimo 10 caracteres)')
});

router.post('/tickets/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.departmentId) {
      res.status(403).json({ error: 'Usuário não pertence a nenhuma secretaria' });
      return;
    }

    const data = rejectTicketSchema.parse(req.body);

    // Buscar ticket
    const ticket = await prisma.adminTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Chamado não encontrado' });
      return;
    }

    // Verificar se o ticket pertence à secretaria do usuário
    if (ticket.departmentId !== user.departmentId) {
      res.status(403).json({ error: 'Este chamado não pertence à sua secretaria' });
      return;
    }

    // Verificar se já foi processado
    if (ticket.status !== 'PENDING') {
      res.status(400).json({ error: 'Chamado já foi processado' });
      return;
    }

    // Atualizar ticket
    const updatedTicket = await prisma.adminTicket.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: data.reason,
        rejectedBy: user.name
      },
      include: {
        citizen: true,
        service: true,
        department: true,
        requestedBy: true
      }
    });

    // Notificar prefeito
    console.log(
      `[NOTIFICATION] Chamado ${ticket.number} recusado por ${user.name}. Motivo: ${data.reason}`
    );

    res.json({
      success: true,
      message: 'Chamado recusado com sucesso',
      data: {
        ticket: updatedTicket
      }
    });
  } catch (error: any) {
    console.error('Erro ao recusar chamado:', error);
    res.status(500).json({
      error: 'Erro ao recusar chamado',
      message: error.message
    });
  }
});

export default router;
