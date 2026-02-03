/**
 * ROTAS: Family Invites
 * Gerenciamento de convites de composição familiar
 */

import { Router, Response } from 'express'
import { z } from 'zod'
import { familyService } from '../services/family.service'
import { citizenAuthMiddleware } from '../middleware/citizen-auth'
import {
  TenantCitizenAuthenticatedRequest,
  createSuccessResponse,
  createErrorResponse
} from '../types'

const router = Router()

// Middleware de autenticação
router.use(citizenAuthMiddleware as any)

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const sendInviteSchema = z.object({
  email: z.string().email('Email inválido'),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  relationship: z.enum([
    'SPOUSE',
    'SON',
    'DAUGHTER',
    'FATHER',
    'MOTHER',
    'BROTHER',
    'SISTER',
    'GRANDFATHER',
    'GRANDMOTHER',
    'GRANDSON',
    'GRANDDAUGHTER',
    'OTHER'
  ]),
  isDependent: z.boolean().optional(),
  message: z.string().optional(),
  monthlyIncome: z.number().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  hasDisability: z.boolean().optional()
})

const respondInviteSchema = z.object({
  token: z.string(),
  accept: z.boolean(),
  reason: z.string().optional()
})

// ============================================================================
// ROTAS - ENVIAR E GERENCIAR CONVITES
// ============================================================================

/**
 * POST /api/citizen/family/invites
 * Enviar convite para composição familiar
 */
router.post('/invites', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest
    const data = sendInviteSchema.parse(req.body)

    const result = await familyService.sendFamilyInvite(citizen.id, data as any)

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('INVITE_ERROR', result.error || 'Erro ao enviar convite')
      )
    }

    return res.json(createSuccessResponse(result.data))
  } catch (error: any) {
    console.error('Erro ao enviar convite:', error)

    if (error.name === 'ZodError') {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Dados inválidos', error.errors)
      )
    }

    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

/**
 * GET /api/citizen/family/invites
 * Listar convites enviados
 */
router.get('/invites', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest

    const invites = await familyService.getFamilyInvites(citizen.id)

    return res.json(createSuccessResponse({ invites }))
  } catch (error) {
    console.error('Erro ao listar convites:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

/**
 * DELETE /api/citizen/family/invites/:id
 * Cancelar convite
 */
router.delete('/invites/:id', async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { id } = req.params

    const result = await familyService.cancelInvite(id, citizen.id)

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('CANCEL_ERROR', result.error || 'Erro ao cancelar convite')
      )
    }

    return res.json(createSuccessResponse({ message: 'Convite cancelado com sucesso' }))
  } catch (error) {
    console.error('Erro ao cancelar convite:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

// ============================================================================
// ROTAS - RESPONDER CONVITES
// ============================================================================

/**
 * POST /api/citizen/family/invites/respond
 * Responder a um convite (aceitar ou rejeitar)
 */
router.post('/invites/respond', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest
    const data = respondInviteSchema.parse(req.body)

    const result = await familyService.respondToInvite(citizen.id, data)

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('RESPOND_ERROR', result.error || 'Erro ao responder convite')
      )
    }

    return res.json(createSuccessResponse(result.data))
  } catch (error: any) {
    console.error('Erro ao responder convite:', error)

    if (error.name === 'ZodError') {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Dados inválidos', error.errors)
      )
    }

    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

/**
 * GET /api/citizen/family/invites/:token
 * Buscar detalhes de um convite por token (para visualizar antes de aceitar)
 */
router.get('/invites/:token', async (req, res) => {
  try {
    const { token } = req.params

    const invite = await familyService.getInviteByToken(token)

    if (!invite) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Convite não encontrado ou expirado')
      )
    }

    return res.json(createSuccessResponse({ invite }))
  } catch (error) {
    console.error('Erro ao buscar convite:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

// ============================================================================
// ROTAS - CONFIRMAÇÃO/REJEIÇÃO DE VÍNCULOS
// ============================================================================

/**
 * POST /api/citizen/family/links/:id/confirm
 * Confirmar vínculo familiar pendente
 */
router.post('/links/:id/confirm', async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { id } = req.params

    const result = await familyService.confirmFamilyLink(id, citizen.id)

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('CONFIRM_ERROR', result.error || 'Erro ao confirmar vínculo')
      )
    }

    return res.json(createSuccessResponse({ message: 'Vínculo confirmado com sucesso' }))
  } catch (error) {
    console.error('Erro ao confirmar vínculo:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

/**
 * POST /api/citizen/family/links/:id/reject
 * Rejeitar vínculo familiar pendente
 */
router.post('/links/:id/reject', async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { id } = req.params

    const result = await familyService.rejectFamilyLink(id, citizen.id)

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('REJECT_ERROR', result.error || 'Erro ao rejeitar vínculo')
      )
    }

    return res.json(createSuccessResponse({ message: 'Vínculo rejeitado' }))
  } catch (error) {
    console.error('Erro ao rejeitar vínculo:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

export default router
