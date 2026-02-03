/**
 * ROTAS: Citizen Family Composition (REFATORADO)
 * Gerenciamento de composição familiar pelo cidadão
 *
 * IMPORTANTE: Cidadãos devem estar cadastrados antes de serem adicionados à família
 * Não há mais criação automática de cadastros
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

const addMemberSchema = z.object({
  memberId: z.string().min(1, 'ID do membro é obrigatório'),
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
  isDependent: z.boolean().default(false),
  monthlyIncome: z.number().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  hasDisability: z.boolean().optional()
})

const updateMemberSchema = z.object({
  relationship: z
    .enum([
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
    ])
    .optional(),
  isDependent: z.boolean().optional(),
  monthlyIncome: z.number().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  hasDisability: z.boolean().optional()
})

// ============================================================================
// ROTAS - COMPOSIÇÃO FAMILIAR
// ============================================================================

/**
 * GET /api/citizen/family
 * Buscar composição familiar completa
 */
router.get('/', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest

    const family = await familyService.getFamilyComposition(citizen.id)

    return res.json(createSuccessResponse({ family }))
  } catch (error: any) {
    console.error('Erro ao buscar composição familiar:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Erro interno do servidor')
    )
  }
})

/**
 * POST /api/citizen/family/members
 * Adicionar membro à família
 *
 * IMPORTANTE: O cidadão deve estar cadastrado no sistema
 * Se não estiver, use o endpoint de convites (/api/citizen/family/invites)
 */
router.post('/members', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest
    const data = addMemberSchema.parse(req.body)

    const result = await familyService.addFamilyMember(citizen.id, data as any)

    if (!result.success) {
      const statusCode = result.error?.includes('não encontrado') ? 404 : 400
      return res.status(statusCode).json(
        createErrorResponse('ADD_MEMBER_ERROR', result.error || 'Erro ao adicionar membro')
      )
    }

    return res.json(
      createSuccessResponse({
        member: result.data,
        warnings: result.warnings
      })
    )
  } catch (error: any) {
    console.error('Erro ao adicionar membro:', error)

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
 * PUT /api/citizen/family/members/:memberId
 * Atualizar informações de um membro
 */
router.put('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params
    const data = updateMemberSchema.parse(req.body)

    const result = await familyService.updateFamilyMember(memberId, data as any)

    if (!result.success) {
      const statusCode = result.error?.includes('não encontrad') ? 404 : 400
      return res.status(statusCode).json(
        createErrorResponse('UPDATE_MEMBER_ERROR', result.error || 'Erro ao atualizar membro')
      )
    }

    return res.json(
      createSuccessResponse({
        member: result.data,
        warnings: result.warnings
      })
    )
  } catch (error: any) {
    console.error('Erro ao atualizar membro:', error)

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
 * DELETE /api/citizen/family/members/:memberId
 * Remover membro da família
 */
router.delete('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params

    const result = await familyService.removeFamilyMember(memberId)

    if (!result.success) {
      const statusCode = result.error?.includes('não encontrad') ? 404 : 400
      return res.status(statusCode).json(
        createErrorResponse('REMOVE_MEMBER_ERROR', result.error || 'Erro ao remover membro')
      )
    }

    return res.json(
      createSuccessResponse({ message: 'Membro removido com sucesso' })
    )
  } catch (error) {
    console.error('Erro ao remover membro:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

/**
 * GET /api/citizen/family/members/:memberId
 * Buscar detalhes de um membro específico
 */
router.get('/members/:memberId', async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { memberId } = req.params

    // Buscar composição familiar onde este membro está incluído
    const composition = await familyService.getFamilyComposition(citizen.id)

    const member = composition.members.find((m: any) => m.id === memberId)

    if (!member) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Membro não encontrado na composição familiar')
      )
    }

    return res.json(createSuccessResponse({ member }))
  } catch (error) {
    console.error('Erro ao buscar membro:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

// ============================================================================
// ROTAS - ESTATÍSTICAS
// ============================================================================

/**
 * GET /api/citizen/family/stats
 * Buscar estatísticas da família (demografia, finanças, etc)
 */
router.get('/stats', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest

    const stats = await familyService.calculateFamilyStats(citizen.id)

    return res.json(createSuccessResponse({ stats }))
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

// ============================================================================
// ROTAS - PROTOCOLOS DA FAMÍLIA
// ============================================================================

/**
 * GET /api/citizen/family/protocols
 * Buscar protocolos de todos os membros da família
 */
router.get('/protocols', async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest

    // Buscar composição familiar
    const family = await familyService.getFamilyComposition(citizen.id)

    // Coletar IDs de todos os membros (incluindo responsável)
    const memberIds = [citizen.id, ...family.members.map((m: any) => m.memberId)]

    // Buscar protocolos de todos os membros
    // TODO: Implementar busca de protocolos (integração com protocols-simplified)
    // const protocols = await protocolService.getProtocolsByMultipleCitizens(memberIds)

    return res.json(
      createSuccessResponse({
        message: 'Funcionalidade de protocolos em desenvolvimento',
        memberIds
      })
    )
  } catch (error) {
    console.error('Erro ao buscar protocolos da família:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

export default router
