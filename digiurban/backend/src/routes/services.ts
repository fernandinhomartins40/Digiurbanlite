import { normalizeFormSchema } from '../utils/form-schema-normalize';
import { serviceDays } from '../config/service-defaults';
import { ensureServiceWorkflow } from '../services/service-workflow.service';
import { normalizeLevel } from '../services/service-access-level';
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateUniqueModuleType } from '../services/service-module-type.service';
import { Prisma, UserRole } from '@prisma/client';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { ACTIVE_STATUSES } from '../config/protocol-status.config'; // ✅ FASE 2
import {
  AuthenticatedRequest,
  SuccessResponse,
  ErrorResponse
        } from '../types';
import {
  generateSpecializedWorkflow
} from '../services/workflow-template.service';
import {
  buildNoDataWorkflowTemplate,
  type NoDataServiceSubtype,
  resolveServiceSubtype,
  resolveServiceType,
  shouldAutoCreateWorkflow,
} from '../services/service-creation-policy.service';
import { effectiveDestination, validateServiceDestination } from '../config/app-catalog';

// ====================== TIPOS LOCAIS ISOLADOS ======================

interface WhereCondition {
  [key: string]: unknown;
}

// FASE 2 - Interface para serviços
// WhereClause interface removida - usando WhereCondition do sistema centralizado

const router = Router();

// Aplicar middleware de tenant em todas as rotas
/**
 * GET /api/services
 * Listar serviços (catálogo público - sem autenticação)
 * Query params opcionais:
 * - includeFeatures: "true" para incluir configurações de features
 */
router.get(
  '/',
  async (req, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
      const { departmentId, departmentCode, search, includeFeatures } = req.query;

      console.log('[GET /api/services] Query params:', { departmentId, departmentCode, search });

      // o painel do servidor pede também os desativados (?includeInactive=true) para poder reativar
      const includeInactive = req.query.includeInactive === 'true';
      let whereClause: WhereCondition = {
        ...(includeInactive ? {} : { isActive: true }),
        };

      // Suporte para filtrar por departmentId OU departmentCode (case-insensitive)
      if (departmentId) {
        whereClause.departmentId = departmentId;
      } else if (departmentCode) {
        // Converter slug (assistencia-social) para code (ASSISTENCIA_SOCIAL)
        const code = (departmentCode as string).replace(/-/g, '_').toUpperCase();
        console.log('[GET /api/services] Converted code:', code);
        whereClause.department = {
          code: code
        };
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      console.log('[GET /api/services] WhereClause:', JSON.stringify(whereClause, null, 2));

      // Include condicional baseado em flags
      const services = await prisma.serviceSimplified.findMany({
        where: whereClause as any,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      }
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });

      console.log('[GET /api/services] Services found:', services.length);

      res.json({ data: services.map((svc) => ({ ...svc, ...effectiveDestination(svc) })), success: true });
    } catch (error) {
      console.error('List services error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro interno do servidor'
        });
    }
  }
);

/**
 * GET /api/services/:id
 * Obter serviço específico (público - sem autenticação)
 */
/**
 * GET /api/services/suggestions?department=<slug> — sugestões de serviços que
 * o município ainda não tem (servidor). Compara com TODOS os serviços dele
 * (inclusive desativados) e com o catálogo da plataforma.
 */
router.get('/suggestions', adminAuthMiddleware, async (req, res) => {
  try {
    const slug = String(req.query.department || '').trim().toLowerCase();
    const { getSuggestionsForDepartment } = await import('../catalog/suggestions');
    const { isSameService } = await import('../catalog/suggestions/match');
    const { allServices } = await import('../catalog/services');
    const pool = getSuggestionsForDepartment(slug);
    if (pool.length === 0) return res.json({ success: true, data: { suggestions: [] } });

    const existing = await prisma.serviceSimplified.findMany({ select: { name: true } });
    const known = [...existing.map((service) => service.name), ...allServices.map((service) => service.name)];
    const seen = new Set<string>();
    const suggestions = pool
      .filter((suggestion) => !known.some((name) => isSameService(name, suggestion.name)))
      // id único na lista (havia ids repetidos no conjunto de sugestões)
      .map((suggestion, index) => {
        const id = seen.has(suggestion.id) ? `${suggestion.id}-${index}` : suggestion.id;
        seen.add(id);
        return { ...suggestion, id };
      });
    return res.json({ success: true, data: { suggestions } });
  } catch (error) {
    console.error('Erro ao listar sugestões de serviços:', error);
    return res.status(500).json({ success: false, error: 'Não foi possível carregar as sugestões' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true
        }
      }
        }
        });

    if (!service) {
      res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
      return;
    }

    // Normalizar requiredDocuments para array
    let normalizedRequiredDocuments = service.requiredDocuments
    if (typeof service.requiredDocuments === 'string') {
      try {
        normalizedRequiredDocuments = JSON.parse(service.requiredDocuments)
      } catch (e) {
        console.error('Erro ao parsear requiredDocuments:', e)
        normalizedRequiredDocuments = []
      }
    }

    res.json({
      service: {
        ...service,
        ...effectiveDestination(service),
        requiredDocuments: normalizedRequiredDocuments
      }
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * POST /api/services
 * Criar novo serviço (apenas MANAGER ou superior)
 * Suporta Feature Flags opcionais para recursos avançados
 */
router.post('/', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      // Campos básicos (obrigatórios)
      name,
      description,
      departmentId,
      category,
      serviceType, // COM_DADOS | SEM_DADOS
      serviceSubtype,
      requiresDocuments,
      requiredDocuments,
      estimatedDays,
      priority,
      icon,
      color,

      // Campos para serviços COM_DADOS. O código técnico (moduleType) é opcional:
      // sem ele, o servidor gera um a partir do nome (service-module-type.service)
      moduleType: requestedModuleType, // Ex: "MATRICULA_ALUNO", "ATENDIMENTOS_SAUDE"
      formSchema, // JSON Schema do formulário

      // ✅ NOVO: Campos de validação de unicidade de protocolos
      allowMultipleActiveProtocols,
      uniquenessScope,
      uniquenessRules,
      // nível mínimo do cidadão (BRONZE | SILVER | GOLD)
      minLevel,

      // Destino do pedido (FILA | APP + ação do catálogo de apps)
      destination,
      appAction,
    } = authReq.body;

    if (destination !== undefined && destination !== null) {
      const dept = departmentId
        ? await prisma.department.findFirst({ where: { id: departmentId }, select: { code: true } })
        : null;
      const destinationError = validateServiceDestination(destination, appAction, dept?.code);
      if (destinationError) {
        return res.status(400).json({ success: false, error: 'Invalid destination', message: destinationError });
      }
    }

    const resolvedServiceType = resolveServiceType({
      serviceType,
      formSchema,
      moduleType: requestedModuleType,
    });
    const resolvedServiceSubtype = resolveServiceSubtype({
      serviceType: resolvedServiceType,
      serviceSubtype,
      name,
      description,
      category,
      requiresDocuments,
      requiredDocuments,
      formSchema,
      moduleType: requestedModuleType,
    });

    // ========== VALIDAÇÃO BÁSICA ==========
    if (!name || !departmentId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Nome e departamento são obrigatórios'
        });
    }

    // Código técnico: o informado (API/seeds) ou gerado a partir do nome, sem repetir no município
    let moduleType: string | undefined = requestedModuleType || undefined;
    if (resolvedServiceType === 'COM_DADOS') {
      // Serviço ativo com o mesmo nome: avisar em linguagem simples (antes o
      // bloqueio vinha como "moduleType duplicado", incompreensível para o gestor)
      const sameName = await prisma.serviceSimplified.findFirst({
        where: { isActive: true, name: { equals: String(name).trim(), mode: 'insensitive' } },
        select: { id: true, name: true }
      });
      if (sameName) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate service name',
          message: `Já existe um serviço ativo chamado "${sameName.name}". Use outro nome ou edite o serviço existente.`,
          existingService: sameName
        });
      }
      if (!moduleType) moduleType = await generateUniqueModuleType(String(name));
    }

    // ========== VALIDAÇÃO OBRIGATÓRIA DE UNICIDADE ==========
    if (allowMultipleActiveProtocols === undefined || allowMultipleActiveProtocols === null) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'É obrigatório definir se o serviço permite múltiplos protocolos ativos. Configure o campo "allowMultipleActiveProtocols".'
      });
    }

    // Se não permite múltiplos, validar campos relacionados
    if (allowMultipleActiveProtocols === false) {
      if (!uniquenessScope) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Quando o serviço não permite múltiplos protocolos, é obrigatório definir o "uniquenessScope" (CITIZEN, CUSTOM ou CITIZEN_PER_FIELD).'
        });
      }

      if (!['CITIZEN', 'CUSTOM', 'CITIZEN_PER_FIELD'].includes(uniquenessScope)) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'uniquenessScope deve ser CITIZEN, CUSTOM ou CITIZEN_PER_FIELD.'
        });
      }

      // Se é CUSTOM, precisa de moduleType
      if (uniquenessScope === 'CUSTOM' && !moduleType) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Para uniquenessScope CUSTOM, é obrigatório definir um moduleType.'
        });
      }

      // Se é CITIZEN_PER_FIELD, precisa de uniquenessRules com o campo
      if (uniquenessScope === 'CITIZEN_PER_FIELD') {
        if (!uniquenessRules || !uniquenessRules.field) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Para uniquenessScope CITIZEN_PER_FIELD, é obrigatório definir uniquenessRules com o campo a ser validado.'
          });
        }
      }
    }

    // Verificar se departamento existe
    // ✅ Validar departamento global (sem tenantId)
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true
        }
        });

    if (!department) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Departamento não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode criar serviços do seu departamento'
        });
    }

    // Validar serviceType
    if (serviceType && !['COM_DADOS', 'SEM_DADOS'].includes(serviceType)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'serviceType deve ser COM_DADOS ou SEM_DADOS'
        });
    }

    // Validar campos obrigatórios para COM_DADOS
    if (resolvedServiceType === 'COM_DADOS') {
      if (!moduleType) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'moduleType é obrigatório para serviços COM_DADOS'
        });
      }
      if (!formSchema) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'formSchema é obrigatório para serviços COM_DADOS'
        });
      }
    }

    // ========== VALIDAÇÕES CRÍTICAS DE UNICIDADE ==========

    // VALIDAÇÃO 1: moduleType único em serviços
    if (resolvedServiceType === 'COM_DADOS' && moduleType) {
      // Inclui desativados: a unique [tenantId, moduleType] do banco também inclui
      const existingService = await prisma.serviceSimplified.findFirst({
        where: { moduleType },
        select: { id: true, name: true }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate moduleType',
          message: `O moduleType "${moduleType}" já está em uso pelo serviço "${existingService.name}". Cada moduleType deve ser único. Escolha outro nome ou reutilize o serviço existente.`,
          existingService: {
            id: existingService.id,
            name: existingService.name
          }
        });
      }

      // VALIDAÇÃO 2: moduleType único em workflows
      const existingWorkflow = await prisma.moduleWorkflow.findFirst({
        where: { moduleType },
        select: { id: true, name: true }
      });

      if (existingWorkflow) {
        return res.status(409).json({
          success: false,
          error: 'Workflow already exists',
          message: `Já existe um workflow com moduleType "${moduleType}" (${existingWorkflow.name}). Para usar este moduleType, você precisa reutilizar o serviço existente ou escolher outro nome.`,
          existingWorkflow: {
            id: existingWorkflow.id,
            name: existingWorkflow.name
          }
        });
      }
    }

    // ========== CRIAÇÃO EM TRANSAÇÃO ATÔMICA ==========

    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar serviço
      let service = await tx.serviceSimplified.create({
        data: {
          // Básico
          name,
          description: description || null,
          category: category || null,
          departmentId,
          serviceType: resolvedServiceType,
          serviceSubtype: resolvedServiceSubtype,
          requiresDocuments: requiresDocuments || false,
          requiredDocuments: requiredDocuments || null,
          estimatedDays: estimatedDays || null,
          priority: priority || 3,
          icon: icon || null,
          color: color || null,
          isActive: true,

          // Campos para COM_DADOS
          moduleType: resolvedServiceType === 'COM_DADOS' ? moduleType : null,
          formSchema: resolvedServiceType === 'COM_DADOS' ? normalizeFormSchema(formSchema) : null,

          // ✅ NOVO: Configuração de unicidade de protocolos (agora obrigatório)
          minLevel: normalizeLevel(minLevel),
          allowMultipleActiveProtocols: allowMultipleActiveProtocols,
          uniquenessScope: allowMultipleActiveProtocols === false ? uniquenessScope : null,
          uniquenessRules: allowMultipleActiveProtocols === false && uniquenessRules ? uniquenessRules : null,

          // Destino explícito: sem informação, o pedido é analisado no protocolo
          destination: destination === 'APP' ? 'APP' : 'FILA',
          appAction: destination === 'APP' ? appAction : null
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      return { service };
    });

    // Fluxo de etapas do serviço: o MESMO que o protocolo usa (ServiceWorkflow),
    // criado já agora para o gestor poder ajustar em Fluxos antes do 1º pedido.
    // Antes era gravado em ModuleWorkflow, que nenhum protocolo lia: as etapas
    // "inteligentes" da criação nunca valiam.
    let workflow: any = null;
    try {
      workflow = await ensureServiceWorkflow(result.service.id);
    } catch (workflowError) {
      console.warn('[services] fluxo não criado agora (será criado no 1º pedido):', workflowError instanceof Error ? workflowError.message : workflowError);
    }
    const workflowCreated = Boolean(workflow);
    if (result.service.serviceType === 'COM_DADOS') {
      void import('../services/registry/registry-sync.service').then(({ syncRegistryTypes }) => syncRegistryTypes());
    }
    const workflowType = workflowCreated ? `SUBTYPE_${result.service.serviceSubtype || 'PADRAO'}` : 'NONE';

    // ========== RESPOSTA COM INFORMAÇÕES COMPLETAS ==========

    const stagesCount = Array.isArray(workflow?.stages) ? workflow.stages.length : 0;
    const message = workflowCreated
      ? `Serviço criado com ${stagesCount} etapas de atendimento. Ajuste as etapas em Fluxos, se precisar.`
      : 'Serviço criado com sucesso';

    return res.status(201).json({
      success: true,
      message,
      service: result.service,
      workflow,
      workflowCreated,
      workflowType,
      workflowStages: stagesCount,
      serviceType: result.service.serviceType,
      serviceSubtype: result.service.serviceSubtype,
      hasDataCapture: result.service.serviceType === 'COM_DADOS',
      moduleType: result.service.moduleType,
      intelligentWorkflow: workflowCreated
        });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * PUT /api/services/:id
 * Atualizar serviço (apenas MANAGER ou superior)
 */
router.put('/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const {
      // Campos básicos
      name,
      description,
      category,
      requiresDocuments,
      requiredDocuments,
      estimatedDays,
      priority,
      isActive,
      icon,
      color,

      // Campos avançados
      formSchema,
      moduleType,
      enabledFields,
      formFieldsConfig,

      // Campos de unicidade
      allowMultipleActiveProtocols,
      uniquenessScope,
      uniquenessRules,
      minLevel,

      // Destino do pedido (FILA | APP + ação do catálogo de apps)
      destination,
      appAction
        } = authReq.body;

    // DEBUG: Log dos campos de configuração recebidos
    console.log('📥 [DEBUG] PUT /api/services/:id - Dados recebidos:', {
      serviceId: id,
      enabledFields: enabledFields || 'null',
      formFieldsConfigLength: formFieldsConfig ? (Array.isArray(formFieldsConfig) ? formFieldsConfig.length : 'not array') : 'null'
    });

    // Verificar se serviço existe
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id
        }
        });

    if (!service) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== service.departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode editar serviços do seu departamento'
        });
    }

    if (destination !== undefined && destination !== null) {
      const dept = await prisma.department.findFirst({ where: { id: service.departmentId }, select: { code: true } });
      const destinationError = validateServiceDestination(destination, appAction, dept?.code);
      if (destinationError) {
        return res.status(400).json({ success: false, error: 'Invalid destination', message: destinationError });
      }
    }

    // ========== VALIDAÇÃO DE UNICIDADE DO moduleType ==========
    // Se está tentando alterar o moduleType, validar unicidade
    if (moduleType !== undefined && moduleType !== service.moduleType) {
      // VALIDAÇÃO 1: moduleType único em serviços
      const existingService = await prisma.serviceSimplified.findFirst({
        where: {
          moduleType,
          isActive: true,
          id: { not: id } // Excluir o próprio serviço
        },
        select: { id: true, name: true }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate moduleType',
          message: `O moduleType "${moduleType}" já está em uso pelo serviço "${existingService.name}". Cada moduleType deve ser único. Escolha outro nome.`,
          existingService: {
            id: existingService.id,
            name: existingService.name
          }
        });
      }

      // VALIDAÇÃO 2: moduleType único em workflows
      const existingWorkflow = await prisma.moduleWorkflow.findFirst({
        where: { moduleType },
        select: { id: true, name: true }
      });

      if (existingWorkflow) {
        return res.status(409).json({
          success: false,
          error: 'Workflow already exists',
          message: `Já existe um workflow com moduleType "${moduleType}" (${existingWorkflow.name}). Para usar este moduleType, escolha outro nome ou reutilize o workflow existente.`,
          existingWorkflow: {
            id: existingWorkflow.id,
            name: existingWorkflow.name
          }
        });
      }
    }

    const updatedService = await prisma.serviceSimplified.update({
      where: { id },
      data: {
        name: name !== undefined ? name : service.name,
        description: description !== undefined ? description : service.description,
        category: category !== undefined ? category : service.category,
        requiresDocuments: requiresDocuments !== undefined ? requiresDocuments : service.requiresDocuments,
        requiredDocuments: requiredDocuments !== undefined ? requiredDocuments : service.requiredDocuments,
        estimatedDays: estimatedDays !== undefined ? estimatedDays : service.estimatedDays,
        priority: priority !== undefined ? priority : service.priority,
        isActive: isActive !== undefined ? isActive : service.isActive,
        icon: icon !== undefined ? icon : service.icon,
        color: color !== undefined ? color : service.color,

        // Campos avançados
        formSchema: formSchema !== undefined ? normalizeFormSchema(formSchema) : service.formSchema,
        moduleType: moduleType !== undefined ? moduleType : service.moduleType,
        ...(destination !== undefined && destination !== null && {
          destination,
          appAction: destination === 'APP' ? appAction : null,
        }),

        // Configuração de campos do formulário
        // IMPORTANTE: Aceitar null explicitamente para permitir limpeza
        ...(formFieldsConfig !== undefined && { formFieldsConfig }),
        ...(enabledFields !== undefined && { enabledFields }),

        // Campos de unicidade
        ...(minLevel !== undefined && { minLevel: normalizeLevel(minLevel) }),
        ...(allowMultipleActiveProtocols !== undefined && { allowMultipleActiveProtocols }),
        ...(uniquenessScope !== undefined && { uniquenessScope }),
        ...(uniquenessRules !== undefined && { uniquenessRules })
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      }
        }
        });

    // DEBUG: Log dos campos salvos
    console.log('💾 [DEBUG] PUT /api/services/:id - Serviço atualizado:', {
      serviceId: updatedService.id,
      enabledFieldsSaved: updatedService.enabledFields ? 'sim' : 'null',
      formFieldsConfigSaved: updatedService.formFieldsConfig ? 'sim' : 'null'
    });

    if (formSchema !== undefined && updatedService.serviceType === 'COM_DADOS') {
      void import('../services/registry/registry-sync.service').then(({ syncRegistryTypes }) => syncRegistryTypes());
    }

    // prazo mudou: o fluxo do serviço (e os próximos pedidos) acompanham
    if (estimatedDays !== undefined && Number(estimatedDays || 0) !== Number(service.estimatedDays || 0)) {
      await prisma.serviceWorkflow
        .updateMany({ where: { serviceId: updatedService.id }, data: { defaultSLA: serviceDays(updatedService.estimatedDays) } })
        .catch((error) => console.warn('[services] prazo do fluxo não atualizado:', error?.message || error));
    }

    return res.json({
      message: 'Serviço atualizado com sucesso',
      service: updatedService
        });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * DELETE /api/services/:id
 * Desativar serviço (soft delete)
 */
router.delete('/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    // Verificar se serviço existe
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id
        }
        });

    if (!service) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== service.departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode desativar serviços do seu departamento'
        });
    }

    // Verificar se há protocolos ativos
    const activeProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: id,
        status: {
          in: ACTIVE_STATUSES // ✅ FASE 2: Constante centralizada
        }
        }
        });

    if (activeProtocols > 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Não é possível desativar o serviço. Existem ${activeProtocols} protocolos ativos.`
        });
    }

    await prisma.serviceSimplified.update({
      where: { id },
      data: { isActive: false }
        });

    return res.json({
      message: 'Serviço desativado com sucesso'
        });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * GET /api/services/department/:departmentId
 * Listar serviços de um departamento específico (público - sem autenticação)
 */
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;

    const services = await prisma.serviceSimplified.findMany({
      where: {
        departmentId,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      }
        },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });

    res.json({ data: services, success: true });
  } catch (error) {
    console.error('Get department services error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

export default router;
