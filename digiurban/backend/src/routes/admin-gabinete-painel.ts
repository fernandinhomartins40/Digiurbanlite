/**
 * Painel do Prefeito (perfil Gabinete — middleware/gabinete-auth).
 * Antes: 4 números soltos (os "ativos" contavam até cancelados), uma cobrança
 * que não avisava ninguém e 7 rotas que a tela nem usava. Agora: um resumo
 * completo (services/gabinete/mayor-panel.service) e cobranças que avisam.
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { adminAuthMiddleware } from '../middleware/admin-auth'
import { requireGabinete } from '../middleware/gabinete-auth'
import { chargeDepartment, chargeProtocol, departmentOverdue, mayorOverview, mayorTvSnapshot } from '../services/gabinete/mayor-panel.service'

const router = Router()

// GET /api/admin/gabinete/painel-prefeito/overview — tudo do painel numa leitura
router.get('/overview', adminAuthMiddleware, requireGabinete, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await mayorOverview({ id: (req as any).user.id }) })
  } catch (error) {
    console.error('[painel do prefeito]', error)
    res.status(500).json({ success: false, error: 'Não foi possível carregar o painel' })
  }
})

// GET /api/admin/gabinete/painel-prefeito/tv — modo TV (atualiza a cada 30 s)
router.get('/tv', adminAuthMiddleware, requireGabinete, async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await mayorTvSnapshot() })
  } catch (error) {
    console.error('[painel do prefeito] tv', error)
    res.status(500).json({ success: false, error: 'Não foi possível atualizar' })
  }
})

// GET /api/admin/gabinete/painel-prefeito/secretarias/:id/atrasados
router.get('/secretarias/:id/atrasados', adminAuthMiddleware, requireGabinete, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await departmentOverdue(req.params.id) })
  } catch (error) {
    console.error('[painel do prefeito] atrasados', error)
    res.status(500).json({ success: false, error: 'Não foi possível carregar' })
  }
})

// POST /api/admin/gabinete/painel-prefeito/secretarias/:id/cobrar — avisa a chefia da secretaria
router.post('/secretarias/:id/cobrar', adminAuthMiddleware, requireGabinete, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const result = await chargeDepartment({ id: user.id, name: user.name }, req.params.id, req.body?.note)
    if (!result) return res.status(404).json({ success: false, error: 'Secretaria não encontrada' })
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[painel do prefeito] cobrar secretaria', error)
    res.status(500).json({ success: false, error: 'Não foi possível cobrar' })
  }
})

// POST /api/admin/gabinete/painel-prefeito/request-urgency/:protocolId — cobra um pedido (avisa responsável e chefia)
router.post('/request-urgency/:protocolId', adminAuthMiddleware, requireGabinete, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const result = await chargeProtocol({ id: user.id, name: user.name }, req.params.protocolId, req.body?.note)
    if (!result) return res.status(404).json({ success: false, error: 'Protocolo não encontrado' })
    res.json({ success: true, data: result, message: result.notified ? `Cobrança enviada para ${result.notified} pessoa(s)` : 'Cobrança registrada (ninguém responsável definido para avisar)' })
  } catch (error) {
    console.error('[painel do prefeito] cobrar pedido', error)
    res.status(500).json({ success: false, error: 'Não foi possível cobrar' })
  }
})

// GET /api/admin/citizens/:id/complete-history
router.get('/citizens/:id/complete-history', adminAuthMiddleware, requireGabinete, async (req: Request, res: Response) => {
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
