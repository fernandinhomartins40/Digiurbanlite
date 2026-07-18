import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { isPrismaMissingTableError } from '../utils/prisma-missing-table';
import {
  listDepartmentTicketAssignees,
  resolveDefaultDepartmentTicketAssignee,
} from '../services/ticket-assignment.service';

const router = Router();
router.use(adminAuthMiddleware);

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

router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      res.status(401).json({ error: 'Nao autenticado' });
      return;
    }

    const status = req.query.status as string;
    const where: Record<string, unknown> = {};

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
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        protocol: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const statsWhere: Record<string, unknown> = {};
    if (user.departmentId) {
      statsWhere.departmentId = user.departmentId;
    }

    const stats = await prisma.adminTicket.groupBy({
      by: ['status'],
      where: statsWhere,
      _count: { status: true },
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
          byStatus: statusCount,
        },
      },
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

const acceptTicketSchema = z.object({
  assignedUserId: z.string().optional(),
  observations: z.string().optional(),
});

router.post('/tickets/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.departmentId) {
      res.status(403).json({ error: 'Usuario nao pertence a nenhuma secretaria' });
      return;
    }

    const data = acceptTicketSchema.parse(req.body);
    const ticket = await prisma.adminTicket.findUnique({
      where: { id },
      include: {
        citizen: true,
        service: true,
        department: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Chamado nao encontrado' });
      return;
    }

    if (ticket.departmentId !== user.departmentId) {
      res.status(403).json({ error: 'Este chamado nao pertence a sua secretaria' });
      return;
    }

    if (ticket.status !== 'PENDING') {
      res.status(400).json({
        error: `Chamado ja foi ${ticket.status === 'ACCEPTED' ? 'aceito' : 'processado'}`,
      });
      return;
    }

    const departmentAssignees = await listDepartmentTicketAssignees(ticket.departmentId);
    const fallbackAssignee = await resolveDefaultDepartmentTicketAssignee(ticket.departmentId);
    const resolvedAssignedUserId =
      data.assignedUserId || ticket.assignedUserId || fallbackAssignee?.id || undefined;

    if (resolvedAssignedUserId) {
      const assignedUser = departmentAssignees.find(
        (candidate) => candidate.id === resolvedAssignedUserId
      );

      if (!assignedUser) {
        res.status(404).json({ error: 'Servidor nao encontrado ou nao pertence a secretaria' });
        return;
      }
    }

    // Número gerado DENTRO da transação de criação — o lock de numeração só
    // vale enquanto a transação está aberta (fora dela, duas requisições
    // simultâneas recebiam o mesmo número).
    const protocol = await prisma.$transaction(async (tx) => {
      const protocolNumber = await generateProtocolNumberSafe(tx);

      return tx.protocolSimplified.create({
        data: {
          number: protocolNumber,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          citizenId: ticket.citizenId,
          serviceId: ticket.serviceId,
          departmentId: ticket.departmentId,
          createdById: user.id,
          assignedUserId: resolvedAssignedUserId,
          currentAssignedUserId: resolvedAssignedUserId,
          status: 'VINCULADO',
        },
        include: {
          citizen: {
            select: {
              name: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    const updatedTicket = await prisma.adminTicket.update({
      where: { id },
      data: {
        status: 'PROTOCOL_CREATED',
        protocolId: protocol.id,
        acceptedAt: new Date(),
        protocolCreatedAt: new Date(),
        acceptedBy: user.name,
        assignedUserId: resolvedAssignedUserId,
        observations: data.observations,
      },
      include: {
        protocol: true,
        citizen: true,
        service: true,
        department: true,
        requestedBy: true,
        assignedUser: true,
      },
    });

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'TICKET_ACCEPTED',
        comment: `Chamado administrativo #${ticket.number} aceito por ${user.name}. ${data.observations || ''}`,
        userId: user.id,
      },
    });

    await prisma.notification.create({
      data: {
        citizenId: ticket.citizenId,
        title: 'Protocolo Criado',
        message: `A secretaria criou o protocolo ${protocol.number} para atender sua solicitacao: ${ticket.title}`,
        type: 'INFO',
        protocolId: protocol.id,
      },
    });

    res.json({
      success: true,
      message: 'Chamado aceito e protocolo criado com sucesso',
      data: {
        ticket: updatedTicket,
        protocol,
      },
    });
  } catch (error: any) {
    console.error('Erro ao aceitar chamado:', error);
    res.status(500).json({
      error: 'Erro ao aceitar chamado',
      message: error.message,
    });
  }
});

const rejectTicketSchema = z.object({
  reason: z.string().min(10, 'Informe o motivo da recusa (minimo 10 caracteres)'),
});

router.post('/tickets/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.departmentId) {
      res.status(403).json({ error: 'Usuario nao pertence a nenhuma secretaria' });
      return;
    }

    const data = rejectTicketSchema.parse(req.body);
    const ticket = await prisma.adminTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Chamado nao encontrado' });
      return;
    }

    if (ticket.departmentId !== user.departmentId) {
      res.status(403).json({ error: 'Este chamado nao pertence a sua secretaria' });
      return;
    }

    if (ticket.status !== 'PENDING') {
      res.status(400).json({ error: 'Chamado ja foi processado' });
      return;
    }

    const updatedTicket = await prisma.adminTicket.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: data.reason,
        rejectedBy: user.name,
      },
      include: {
        citizen: true,
        service: true,
        department: true,
        requestedBy: true,
      },
    });

    res.json({
      success: true,
      message: 'Chamado recusado com sucesso',
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error: any) {
    console.error('Erro ao recusar chamado:', error);
    res.status(500).json({
      error: 'Erro ao recusar chamado',
      message: error.message,
    });
  }
});

export default router;
