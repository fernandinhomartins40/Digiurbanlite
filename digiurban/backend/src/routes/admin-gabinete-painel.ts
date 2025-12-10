import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { adminAuthMiddleware } from '../middleware/admin-auth'

const router = Router()

// Middleware para garantir que apenas ADMIN (Prefeito) pode acessar
const requireAdmin = (req: Request, res: Response, next: Function): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao Gabinete do Prefeito' })
    return
  }
  next()
}

// ============================================
// PAINEL DO PREFEITO - Estatísticas Gerais
// ============================================

// ============================================
// PAINEL SIMPLIFICADO - Estatísticas Básicas
// ============================================

// GET /api/admin/gabinete/painel-prefeito/simple-stats
router.get('/simple-stats', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalActive,
      totalCompleted,
      completedProtocolsSample
    ] = await Promise.all([
      prisma.protocolSimplified.count({
        where: { status: { not: 'CONCLUIDO' } }
      }),
      prisma.protocolSimplified.count({
        where: { status: 'CONCLUIDO' }
      }),
      prisma.protocolSimplified.findMany({
        where: {
          status: 'CONCLUIDO',
          concludedAt: { not: null }
        },
        select: {
          createdAt: true,
          concludedAt: true
        },
        take: 50,
        orderBy: { concludedAt: 'desc' }
      })
    ])

    const totalProtocols = totalActive + totalCompleted
    const completionRate = totalProtocols > 0
      ? Math.round((totalCompleted / totalProtocols) * 100)
      : 0

    let avgResponseTime = 0
    if (completedProtocolsSample.length > 0) {
      const totalDays = completedProtocolsSample.reduce((sum, protocol) => {
        if (protocol.concludedAt) {
          const diff = protocol.concludedAt.getTime() - protocol.createdAt.getTime()
          return sum + (diff / (1000 * 60 * 60 * 24))
        }
        return sum
      }, 0)
      avgResponseTime = Math.round(totalDays / completedProtocolsSample.length)
    }

    res.json({
      success: true,
      data: {
        totalActive,
        totalCompleted,
        completionRate,
        avgResponseTime
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas simples:', error)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

// POST /api/admin/gabinete/painel-prefeito/request-urgency/:protocolId
router.post('/request-urgency/:protocolId', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        department: { select: { name: true } },
        citizen: { select: { name: true } }
      }
    })

    if (!protocol) {
      res.status(404).json({ error: 'Protocolo não encontrado' })
      return
    }

    // Registrar interação de cobrança de urgência
    await prisma.protocolInteraction.create({
      data: {
        protocolId: protocol.id,
        type: 'URGENCY_REQUEST',
        authorType: 'SERVER',
        authorId: req.user!.id,
        authorName: req.user!.name || 'Prefeito',
        message: `Prefeito solicitou urgência na resolução do protocolo #${protocol.number}`,
        isInternal: true,
        metadata: {
          requestedBy: 'ADMIN',
          requestedAt: new Date().toISOString(),
          assignedUser: protocol.assignedUser?.name || 'Não atribuído',
          department: protocol.department?.name || 'Não definido'
        }
      }
    })

    // TODO: Enviar notificação ao responsável (email, push, etc)
    // Por ora, apenas registra na timeline

    res.json({
      success: true,
      message: 'Cobrança de urgência registrada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cobrar urgência:', error)
    res.status(500).json({ error: 'Erro ao processar cobrança de urgência' })
  }
})

// GET /api/admin/gabinete/painel-prefeito/chamados
router.get('/chamados', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    // Buscar apenas chamados criados pela equipe administrativa (createdBy preenchido)
    const chamados = await prisma.protocolSimplified.findMany({
      where: {
        createdBy: {
          isNot: null
        }
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        citizen: {
          select: {
            name: true,
            cpf: true
          }
        },
        service: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        assignedUser: {
          select: {
            name: true
          }
        },
        createdBy: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Estatísticas apenas dos chamados criados pela equipe
    const stats = await prisma.protocolSimplified.count({
      where: {
        createdBy: {
          isNot: null
        }
      }
    })

    const statusCount = await prisma.protocolSimplified.groupBy({
      by: ['status'],
      where: {
        createdBy: {
          isNot: null
        }
      },
      _count: {
        status: true
      }
    })

    res.json({
      success: true,
      data: {
        chamados,
        stats: {
          total: stats,
          byStatus: statusCount.reduce((acc, item) => {
            acc[item.status] = item._count.status
            return acc
          }, {} as Record<string, number>)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar chamados:', error)
    res.status(500).json({ error: 'Erro ao buscar chamados' })
  }
})

// GET /api/admin/gabinete/painel-prefeito/stats (MANTIDO PARA COMPATIBILIDADE)
router.get('/stats', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    // ⚡ Otimização: Usar Promise.all para executar queries em paralelo
    const [
      totalActive,
      totalProtocols,
      totalCompleted,
      completedProtocolsSample
    ] = await Promise.all([
      // 1. Total de protocolos ativos (não concluídos)
      prisma.protocolSimplified.count({
        where: { status: { not: 'CONCLUIDO' } }
      }),
      // 2. Total de protocolos (todos)
      prisma.protocolSimplified.count(),
      // 3. Total de protocolos concluídos
      prisma.protocolSimplified.count({
        where: { status: 'CONCLUIDO' }
      }),
      // 4. Amostra para cálculo de tempo médio
      prisma.protocolSimplified.findMany({
        where: {
          status: 'CONCLUIDO',
          concludedAt: { not: null }
        },
        select: {
          createdAt: true,
          concludedAt: true
        },
        take: 100, // Amostra de 100 protocolos para performance
        orderBy: { concludedAt: 'desc' } // Mais recentes
      })
    ])

    // Cálculos derivados
    const completionRate = totalProtocols > 0
      ? Math.round((totalCompleted / totalProtocols) * 100)
      : 0

    let avgResponseTime = 0
    if (completedProtocolsSample.length > 0) {
      const totalHours = completedProtocolsSample.reduce((sum, protocol) => {
        if (protocol.concludedAt) {
          const diff = protocol.concludedAt.getTime() - protocol.createdAt.getTime()
          return sum + (diff / (1000 * 60 * 60))
        }
        return sum
      }, 0)
      avgResponseTime = Math.round(totalHours / completedProtocolsSample.length)
    }

    const citizenSatisfaction = 4.5 // TODO: Implementar sistema de avaliações

    res.json({
      success: true,
      data: {
        totalActive,
        totalProtocols,
        totalCompleted,
        completionRate,
        avgResponseTime,
        citizenSatisfaction
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do painel do prefeito:', error)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

// ============================================
// TENDÊNCIAS - Últimos 30 dias
// ============================================

// GET /api/admin/gabinete/painel-prefeito/trends
router.get('/trends', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Buscar todos os protocolos dos últimos 30 dias
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        concludedAt: true,
        status: true
      }
    })

    // Criar objeto com dados diários
    const dailyData: { [key: string]: { novos: number; concluidos: number; pendentes: number } } = {}

    // Inicializar todos os dias dos últimos 30 dias com zeros
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toISOString().split('T')[0]
      dailyData[dateStr] = { novos: 0, concluidos: 0, pendentes: 0 }
    }

    // Contar novos protocolos por dia
    protocols.forEach(protocol => {
      const createdDate = protocol.createdAt.toISOString().split('T')[0]
      if (dailyData[createdDate]) {
        dailyData[createdDate].novos++
      }

      // Contar concluídos por dia
      if (protocol.concludedAt) {
        const concludedDate = protocol.concludedAt.toISOString().split('T')[0]
        if (dailyData[concludedDate]) {
          dailyData[concludedDate].concluidos++
        }
      }
    })

    // Calcular pendentes acumulados por dia
    let accumulatedPending = 0
    Object.keys(dailyData).sort().forEach(date => {
      accumulatedPending += dailyData[date].novos - dailyData[date].concluidos
      dailyData[date].pendentes = Math.max(0, accumulatedPending)
    })

    // Converter para array
    const daily = Object.keys(dailyData).sort().map(date => ({
      date,
      novos: dailyData[date].novos,
      concluidos: dailyData[date].concluidos,
      pendentes: dailyData[date].pendentes
    }))

    res.json({
      success: true,
      data: { daily }
    })
  } catch (error) {
    console.error('Erro ao buscar tendências:', error)
    res.status(500).json({ error: 'Erro ao buscar tendências' })
  }
})

// ============================================
// PERFORMANCE POR SECRETARIA
// ============================================

// GET /api/admin/gabinete/painel-prefeito/departments-performance
router.get('/departments-performance', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    // ⚡ Otimização: Usar agregação do Prisma em vez de múltiplas queries
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            protocolsSimplified: true // Total de protocolos
          }
        },
        protocolsSimplified: {
          where: { status: 'CONCLUIDO' },
          select: {
            id: true,
            createdAt: true,
            concludedAt: true
          },
          take: 50 // Amostra para tempo médio
        }
      }
    })

    // Calcular métricas para cada departamento
    const performance = departmentStats.map(dept => {
      const total = dept._count.protocolsSimplified
      const completed = dept.protocolsSimplified.length
      const pending = total - completed
      const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0

      // Calcular tempo médio de resposta
      let avgResponseTime = 0
      const completedProtocols = dept.protocolsSimplified.filter(p => p.concludedAt)
      if (completedProtocols.length > 0) {
        const totalHours = completedProtocols.reduce((sum, p) => {
          const diff = p.concludedAt!.getTime() - p.createdAt.getTime()
          return sum + (diff / (1000 * 60 * 60))
        }, 0)
        avgResponseTime = Math.round(totalHours / completedProtocols.length)
      }

      return {
        id: dept.id,
        name: dept.name,
        total,
        completed,
        pending,
        efficiency,
        avgResponseTime
      }
    })

    // Ordenar por eficiência (maior primeiro)
    performance.sort((a, b) => b.efficiency - a.efficiency)

    res.json({
      success: true,
      data: { departments: performance }
    })
  } catch (error) {
    console.error('Erro ao buscar performance das secretarias:', error)
    res.status(500).json({ error: 'Erro ao buscar performance' })
  }
})

// ============================================
// ALERTAS CRÍTICOS
// ============================================

// GET /api/admin/gabinete/painel-prefeito/critical-alerts
router.get('/critical-alerts', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const alerts = []

    // 1. Protocolos atrasados (>30 dias sem conclusão)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const overdueProtocols = await prisma.protocolSimplified.findMany({
      where: {
        status: { not: 'CONCLUIDO' },
        createdAt: { lt: thirtyDaysAgo }
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        createdAt: true,
        citizen: {
          select: { name: true }
        },
        department: {
          select: { name: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'asc' }
    })

    if (overdueProtocols.length > 0) {
      alerts.push({
        type: 'OVERDUE',
        title: 'Protocolos Atrasados',
        count: overdueProtocols.length,
        protocols: overdueProtocols
      })
    }

    // 2. Protocolos urgentes (prioridade 1 ou 2)
    const urgentProtocols = await prisma.protocolSimplified.findMany({
      where: {
        status: { not: 'CONCLUIDO' },
        priority: { lte: 2 }
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        citizen: {
          select: { name: true }
        },
        department: {
          select: { name: true }
        }
      },
      take: 5,
      orderBy: { priority: 'asc' }
    })

    if (urgentProtocols.length > 0) {
      alerts.push({
        type: 'URGENT',
        title: 'Protocolos Urgentes',
        count: urgentProtocols.length,
        protocols: urgentProtocols
      })
    }

    // 3. Protocolos sem atribuição
    const unassignedProtocols = await prisma.protocolSimplified.findMany({
      where: {
        status: { not: 'CONCLUIDO' },
        assignedUserId: null
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        createdAt: true,
        citizen: {
          select: { name: true }
        },
        department: {
          select: { name: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    if (unassignedProtocols.length > 0) {
      alerts.push({
        type: 'UNASSIGNED',
        title: 'Protocolos sem Atribuição',
        count: unassignedProtocols.length,
        protocols: unassignedProtocols
      })
    }

    res.json({
      success: true,
      data: { alerts }
    })
  } catch (error) {
    console.error('Erro ao buscar alertas críticos:', error)
    res.status(500).json({ error: 'Erro ao buscar alertas' })
  }
})

// ============================================
// TOP SERVIDORES
// ============================================

// GET /api/admin/gabinete/painel-prefeito/top-servers
router.get('/top-servers', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    // ⚡ Otimização: Usar agregação e filtrar apenas usuários com protocolos
    const userStats = await prisma.user.findMany({
      where: {
        assignedProtocolsSimplified: {
          some: {} // Apenas usuários que têm protocolos atribuídos
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            assignedProtocolsSimplified: true // Total de protocolos atribuídos
          }
        },
        assignedProtocolsSimplified: {
          where: { status: 'CONCLUIDO' },
          select: { id: true } // Apenas contar
        }
      }
    })

    // Calcular taxa de conclusão
    const serversWithStats = userStats.map(user => {
      const totalAssigned = user._count.assignedProtocolsSimplified
      const totalCompleted = user.assignedProtocolsSimplified.length
      const completionRate = totalAssigned > 0
        ? Math.round((totalCompleted / totalAssigned) * 100)
        : 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        completionRate,
        totalCompleted,
        totalAssigned
      }
    })

    // Ordenar por taxa de conclusão e pegar top 5
    const topServers = serversWithStats
      .sort((a, b) => {
        // Priorizar por taxa de conclusão, depois por total concluído
        if (b.completionRate === a.completionRate) {
          return b.totalCompleted - a.totalCompleted
        }
        return b.completionRate - a.completionRate
      })
      .slice(0, 5)

    res.json({
      success: true,
      data: { servers: topServers }
    })
  } catch (error) {
    console.error('Erro ao buscar top servidores:', error)
    res.status(500).json({ error: 'Erro ao buscar top servidores' })
  }
})

// ============================================
// HISTÓRICO COMPLETO DO CIDADÃO
// ============================================

// GET /api/admin/citizens/:id/complete-history
router.get('/citizens/:id/complete-history', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Buscar cidadão completo
    const citizen = await prisma.citizen.findUnique({
      where: { id },
      include: {
        protocolsSimplified: {
          include: {
            service: {
              select: {
                name: true,
                category: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        familyAsHead: {
          include: {
            member: true
          }
        }
      }
    })

    if (!citizen) {
      res.status(404).json({ error: 'Cidadão não encontrado' })
      return
    }

    // Criar timeline de eventos
    const timeline: Array<{
      date: string
      event: string
      type: string
      metadata: any
    }> = []

    // Adicionar cadastro
    timeline.push({
      date: citizen.createdAt.toISOString(),
      event: 'Cidadão cadastrado no sistema',
      type: 'REGISTRATION',
      metadata: { source: citizen.registrationSource }
    })

    // Adicionar verificação
    if (citizen.verifiedAt) {
      timeline.push({
        date: citizen.verifiedAt.toISOString(),
        event: 'Cadastro verificado',
        type: 'VERIFICATION',
        metadata: { status: citizen.verificationStatus }
      })
    }

    // Adicionar protocolos
    citizen.protocolsSimplified.forEach(protocol => {
      timeline.push({
        date: protocol.createdAt.toISOString(),
        event: `Protocolo criado: ${protocol.title}`,
        type: 'PROTOCOL_CREATED',
        metadata: {
          protocolNumber: protocol.number,
          service: protocol.service?.name
        }
      })

      if (protocol.concludedAt) {
        timeline.push({
          date: protocol.concludedAt.toISOString(),
          event: `Protocolo concluído: ${protocol.title}`,
          type: 'PROTOCOL_COMPLETED',
          metadata: {
            protocolNumber: protocol.number
          }
        })
      }
    })

    // Ordenar timeline por data (mais recente primeiro)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.json({
      success: true,
      data: {
        citizen,
        protocols: citizen.protocolsSimplified,
        family: citizen.familyAsHead,
        timeline
      }
    })
  } catch (error) {
    console.error('Erro ao buscar histórico completo do cidadão:', error)
    res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

export default router
