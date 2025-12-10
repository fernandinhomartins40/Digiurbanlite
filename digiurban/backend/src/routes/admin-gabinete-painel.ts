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

// GET /api/admin/gabinete/painel-prefeito/stats
router.get('/stats', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    // 1. Total de protocolos ativos (não concluídos)
    const totalActive = await prisma.protocolSimplified.count({
      where: {
        status: {
          not: 'CONCLUIDO'
        }
      }
    })

    // 2. Total de protocolos (todos)
    const totalProtocols = await prisma.protocolSimplified.count()

    // 3. Total de protocolos concluídos
    const totalCompleted = await prisma.protocolSimplified.count({
      where: {
        status: 'CONCLUIDO'
      }
    })

    // 4. Taxa de conclusão (%)
    const completionRate = totalProtocols > 0
      ? Math.round((totalCompleted / totalProtocols) * 100)
      : 0

    // 5. Tempo médio de resposta em horas
    // Calcular diferença entre createdAt e concludedAt para protocolos concluídos
    const completedProtocols = await prisma.protocolSimplified.findMany({
      where: {
        status: 'CONCLUIDO',
        concludedAt: { not: null }
      },
      select: {
        createdAt: true,
        concludedAt: true
      },
      take: 100 // Últimos 100 protocolos concluídos para performance
    })

    let avgResponseTime = 0
    if (completedProtocols.length > 0) {
      const totalHours = completedProtocols.reduce((sum, protocol) => {
        if (protocol.concludedAt) {
          const diff = protocol.concludedAt.getTime() - protocol.createdAt.getTime()
          const hours = diff / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)
      avgResponseTime = Math.round(totalHours / completedProtocols.length)
    }

    // 6. Satisfação do cidadão (média das avaliações)
    // Retornar 4.5 como padrão por enquanto (implementar sistema de avaliações depois)
    const citizenSatisfaction = 4.5

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
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true
      }
    })

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        // Contar protocolos por status
        const total = await prisma.protocolSimplified.count({
          where: {
            departmentId: dept.id
          }
        })

        const completed = await prisma.protocolSimplified.count({
          where: {
            departmentId: dept.id,
            status: 'CONCLUIDO'
          }
        })

        const pending = await prisma.protocolSimplified.count({
          where: {
            departmentId: dept.id,
            status: {
              notIn: ['CONCLUIDO']
            }
          }
        })

        // Calcular eficiência
        const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0

        // Calcular tempo médio de resposta
        const completedProtocols = await prisma.protocolSimplified.findMany({
          where: {
            departmentId: dept.id,
            status: 'CONCLUIDO',
            concludedAt: { not: null }
          },
          select: {
            createdAt: true,
            concludedAt: true
          },
          take: 50
        })

        let avgResponseTime = 0
        if (completedProtocols.length > 0) {
          const totalHours = completedProtocols.reduce((sum, p) => {
            if (p.concludedAt) {
              const diff = p.concludedAt.getTime() - p.createdAt.getTime()
              return sum + (diff / (1000 * 60 * 60))
            }
            return sum
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
    )

    // Ordenar por eficiência (maior primeiro)
    departmentStats.sort((a, b) => b.efficiency - a.efficiency)

    res.json({
      success: true,
      data: { departments: departmentStats }
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
    // Buscar usuários com protocolos atribuídos
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const userStats = await Promise.all(
      users.map(async (user) => {
        const totalAssigned = await prisma.protocolSimplified.count({
          where: {
            assignedUserId: user.id
          }
        })

        const totalCompleted = await prisma.protocolSimplified.count({
          where: {
            assignedUserId: user.id,
            status: 'CONCLUIDO'
          }
        })

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
    )

    // Ordenar por taxa de conclusão (maior primeiro) e pegar top 5
    const topServers = userStats
      .sort((a, b) => b.completionRate - a.completionRate)
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
