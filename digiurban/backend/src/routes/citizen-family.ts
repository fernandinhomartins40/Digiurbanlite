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
import rateLimit from 'express-rate-limit'
import { prisma } from '../lib/prisma'
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

// ============================================================================
// BUSCA DE FAMILIAR POR CPF (privacidade: decisão do produto 2026-09-28)
// ============================================================================

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

/** "Maria Souza Lima" → "Maria S. L." — só o suficiente para o cidadão confirmar */
function maskName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/)
  return [first, ...rest.map((p) => `${p[0]?.toUpperCase() ?? ''}.`)].join(' ')
}

function maskCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`
}

// Limite por cidadão: impede varrer CPFs para descobrir quem é cadastrado
const familySearchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => `family-search:${req.citizen?.id || req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas buscas. Tente novamente em 1 hora.' }
})

/**
 * GET /api/citizen/family/search?cpf=00000000000
 * Só CPF completo e válido; nunca busca por nome; devolve nome e CPF
 * mascarados (sem data de nascimento, e-mail ou telefone).
 */
router.get('/search', familySearchLimiter, async (req, res) => {
  try {
    const { citizen } = req as TenantCitizenAuthenticatedRequest
    const cpf = String(req.query.cpf ?? req.query.q ?? '').replace(/\D/g, '')

    if (!isValidCpf(cpf)) {
      return res.status(400).json(createErrorResponse('INVALID_CPF', 'Informe o CPF completo e válido do familiar'))
    }

    const found = await prisma.citizen.findFirst({
      where: { cpf, isActive: true, NOT: { id: citizen.id } },
      select: { id: true, name: true, cpf: true }
    })

    const citizens = found
      ? [{ id: found.id, name: maskName(found.name), cpf: maskCpf(found.cpf) }]
      : []

    return res.json(createSuccessResponse({ citizens }))
  } catch (error: any) {
    console.error('Erro ao buscar familiar por CPF:', error)
    return res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro ao buscar familiar'))
  }
})

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
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { memberId } = req.params
    const data = updateMemberSchema.parse(req.body)

    const result = await familyService.updateFamilyMember(memberId, data as any, { headId: citizen.id })

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
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const { memberId } = req.params

    const result = await familyService.removeFamilyMember(memberId, citizen.id)

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
// ROTAS - DEPENDENTES SEM CONTA (menores de 18 anos)
// ============================================================================

const dependentSchema = z.object({
  name: z.string().min(3).max(120),
  cpf: z.string().min(11).max(14),
  birthDate: z.string().min(8),
  relationship: z.enum(['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER', 'BROTHER', 'SISTER', 'OTHER']),
  hasDisability: z.boolean().optional()
})

const dependentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  keyGenerator: (req: any) => `family-dependent:${req.citizen?.id || req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Tente novamente em 1 hora.' }
})

/** POST /api/citizen/family/dependents — cadastrar filho(a) ou outro menor sem conta */
router.post('/dependents', dependentLimiter, async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const data = dependentSchema.parse(req.body)
    const result = await familyService.createDependent(citizen.id, data as any)
    if (!result.success) {
      return res.status(400).json(createErrorResponse('DEPENDENT_ERROR', result.error || 'Erro ao cadastrar dependente'))
    }
    return res.status(201).json(createSuccessResponse({ member: result.data }))
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Confira o nome, o CPF, a data de nascimento e o parentesco'))
    }
    console.error('Erro ao cadastrar dependente:', error)
    return res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'))
  }
})

/** PUT /api/citizen/family/dependents/:memberId — corrigir nome/nascimento */
router.put('/dependents/:memberId', async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const result = await familyService.updateDependent(citizen.id, req.params.memberId, {
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      birthDate: typeof req.body?.birthDate === 'string' ? req.body.birthDate : undefined
    })
    if (!result.success) {
      return res.status(400).json(createErrorResponse('DEPENDENT_ERROR', result.error || 'Erro ao atualizar dependente'))
    }
    return res.json(createSuccessResponse({ member: result.data }))
  } catch (error) {
    console.error('Erro ao atualizar dependente:', error)
    return res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'))
  }
})

/** POST /api/citizen/family/dependents/:memberId/access — criar o acesso do dependente (e-mail dele) */
router.post('/dependents/:memberId/access', dependentLimiter, async (req, res) => {
  try {
    const { citizen } = req as unknown as TenantCitizenAuthenticatedRequest
    const result = await familyService.giveDependentAccess(citizen.id, req.params.memberId, String(req.body?.email || ''))
    if (!result.success) {
      return res.status(400).json(createErrorResponse('DEPENDENT_ERROR', result.error || 'Erro ao criar o acesso'))
    }
    return res.json(createSuccessResponse(result.data))
  } catch (error) {
    console.error('Erro ao criar acesso do dependente:', error)
    return res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'))
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

    // Pedidos dos dependentes (os do próprio cidadão ficam em "Meus pedidos")
    const protocols = await familyService.listDependentsProtocols(citizen.id)

    return res.json(createSuccessResponse({ protocols }))
  } catch (error) {
    console.error('Erro ao buscar protocolos da família:', error)
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor')
    )
  }
})

export default router
