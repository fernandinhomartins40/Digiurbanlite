// ============================================================================
// SECRETARIA: SECRETARIA DE ASSISTÊNCIA SOCIAL - GERADO AUTOMATICAMENTE
// ============================================================================
// ⚠️  ATENÇÃO: Este arquivo foi gerado automaticamente pelo sistema de templates.
// ⚠️  NÃO EDITE MANUALMENTE! Qualquer alteração será sobrescrita na próxima geração.
//
// Para fazer alterações:
// 1. Edite a configuração em: generator/configs/secretarias/assistencia-social.config.ts
// 2. Regenere o código: npm run generate -- --secretaria=assistencia-social --force
//
// Secretaria: Secretaria de Assistência Social
// Total de módulos: 9
// Gerado em: 2025-11-13T12:09:03.530Z
// ============================================================================

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ProtocolStatus, UserRole } from '@prisma/client';
import { requireMinRole } from '../middleware/admin-auth';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ============================================================================
// ROTAS GERAIS DA SECRETARIA
// ============================================================================

/**
 * GET /stats
 * Estatísticas consolidadas da secretaria
 */
router.get('/stats', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    // Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Stats gerais
    const [totalProtocols, activeProtocols, pendingApproval, services] = await Promise.all([
      prisma.protocolSimplified.count({ where: { departmentId: department.id } }),
      prisma.protocolSimplified.count({ where: { departmentId: department.id, status: ProtocolStatus.CONCLUIDO } }),
      prisma.protocolSimplified.count({ where: { departmentId: department.id, status: ProtocolStatus.VINCULADO } }),
      prisma.serviceSimplified.count({ where: { departmentId: department.id } })
    ]);

    // Stats por módulo
    const moduleStats: Record<string, number> = {};
    moduleStats['cadastro-unico'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_UNICO' }
    });
    moduleStats['beneficios'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'SOLICITACAO_BENEFICIO' }
    });
    moduleStats['entregas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ENTREGA_EMERGENCIAL' }
    });
    moduleStats['oficinas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'INSCRICAO_GRUPO_OFICINA' }
    });
    moduleStats['visitas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'VISITAS_DOMICILIARES' }
    });
    moduleStats['programas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'INSCRICAO_PROGRAMA_SOCIAL' }
    });
    moduleStats['agendamentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL' }
    });
    moduleStats['gestao-cras'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'GESTAO_CRAS_CREAS' }
    });
    moduleStats['servicos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL' }
    });

    res.json({
      success: true,
      data: {
        totalProtocols,
        activeProtocols,
        pendingApproval,
        services,
        byModule: moduleStats
      }
    });
  } catch (error) {
    console.error('[assistencia-social] Error in stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /services
 * Lista todos os serviços da secretaria
 */
router.get('/services', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    const services = await prisma.serviceSimplified.findMany({
      where: { departmentId: department.id, isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: services });
  } catch (error) {
    console.error('[assistencia-social] Error listing services:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// ROTAS DOS MÓDULOS (CRUD GENÉRICO)
// ============================================================================

// ==========================================================================
// MÓDULO: cadastro-unico (CADASTRO_UNICO)
// ==========================================================================

/**
 * GET /cadastro-unico
 * Lista todos os registros deste módulo
 */
router.get('/cadastro-unico', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_UNICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module cadastro-unico'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_UNICO'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/cadastro-unico] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /cadastro-unico/:id
 * Busca um registro específico por ID
 */
router.get('/cadastro-unico/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'CADASTRO_UNICO') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/cadastro-unico] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /cadastro-unico
 * Cria um novo registro
 */
router.post('/cadastro-unico', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_UNICO'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/cadastro-unico',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_UNICO',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/cadastro-unico] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /cadastro-unico/:id
 * Atualiza um registro existente
 */
router.put('/cadastro-unico/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/cadastro-unico] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /cadastro-unico/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/cadastro-unico/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/cadastro-unico] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /cadastro-unico/:id/approve
 * Aprova um protocolo
 */
router.post('/cadastro-unico/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/cadastro-unico] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /cadastro-unico/:id/reject
 * Rejeita um protocolo
 */
router.post('/cadastro-unico/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/cadastro-unico] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /cadastro-unico/:id/history
 * Histórico de mudanças de status
 */
router.get('/cadastro-unico/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/cadastro-unico] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: beneficios (SOLICITACAO_BENEFICIO)
// ==========================================================================

/**
 * GET /beneficios
 * Lista todos os registros deste módulo
 */
router.get('/beneficios', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'SOLICITACAO_BENEFICIO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module beneficios'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'SOLICITACAO_BENEFICIO'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/beneficios] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /beneficios/:id
 * Busca um registro específico por ID
 */
router.get('/beneficios/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'SOLICITACAO_BENEFICIO') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/beneficios] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /beneficios
 * Cria um novo registro
 */
router.post('/beneficios', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'SOLICITACAO_BENEFICIO'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/beneficios',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'SOLICITACAO_BENEFICIO',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/beneficios] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /beneficios/:id
 * Atualiza um registro existente
 */
router.put('/beneficios/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/beneficios] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /beneficios/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/beneficios/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/beneficios] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /beneficios/:id/approve
 * Aprova um protocolo
 */
router.post('/beneficios/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/beneficios] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /beneficios/:id/reject
 * Rejeita um protocolo
 */
router.post('/beneficios/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/beneficios] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /beneficios/:id/history
 * Histórico de mudanças de status
 */
router.get('/beneficios/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/beneficios] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: entregas (ENTREGA_EMERGENCIAL)
// ==========================================================================

/**
 * GET /entregas
 * Lista todos os registros deste módulo
 */
router.get('/entregas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ENTREGA_EMERGENCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module entregas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'ENTREGA_EMERGENCIAL'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/entregas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /entregas/:id
 * Busca um registro específico por ID
 */
router.get('/entregas/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'ENTREGA_EMERGENCIAL') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/entregas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /entregas
 * Cria um novo registro
 */
router.post('/entregas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ENTREGA_EMERGENCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/entregas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ENTREGA_EMERGENCIAL',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/entregas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /entregas/:id
 * Atualiza um registro existente
 */
router.put('/entregas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/entregas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /entregas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/entregas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/entregas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /entregas/:id/approve
 * Aprova um protocolo
 */
router.post('/entregas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/entregas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /entregas/:id/reject
 * Rejeita um protocolo
 */
router.post('/entregas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/entregas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /entregas/:id/history
 * Histórico de mudanças de status
 */
router.get('/entregas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/entregas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: oficinas (INSCRICAO_GRUPO_OFICINA)
// ==========================================================================

/**
 * GET /oficinas
 * Lista todos os registros deste módulo
 */
router.get('/oficinas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_GRUPO_OFICINA'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module oficinas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'INSCRICAO_GRUPO_OFICINA'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/oficinas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /oficinas/:id
 * Busca um registro específico por ID
 */
router.get('/oficinas/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'INSCRICAO_GRUPO_OFICINA') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/oficinas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /oficinas
 * Cria um novo registro
 */
router.post('/oficinas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_GRUPO_OFICINA'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/oficinas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'INSCRICAO_GRUPO_OFICINA',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/oficinas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /oficinas/:id
 * Atualiza um registro existente
 */
router.put('/oficinas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/oficinas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /oficinas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/oficinas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/oficinas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /oficinas/:id/approve
 * Aprova um protocolo
 */
router.post('/oficinas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/oficinas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /oficinas/:id/reject
 * Rejeita um protocolo
 */
router.post('/oficinas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/oficinas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /oficinas/:id/history
 * Histórico de mudanças de status
 */
router.get('/oficinas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/oficinas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: visitas (VISITAS_DOMICILIARES)
// ==========================================================================

/**
 * GET /visitas
 * Lista todos os registros deste módulo
 */
router.get('/visitas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'VISITAS_DOMICILIARES'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module visitas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'VISITAS_DOMICILIARES'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/visitas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /visitas/:id
 * Busca um registro específico por ID
 */
router.get('/visitas/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'VISITAS_DOMICILIARES') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/visitas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /visitas
 * Cria um novo registro
 */
router.post('/visitas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'VISITAS_DOMICILIARES'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/visitas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'VISITAS_DOMICILIARES',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/visitas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /visitas/:id
 * Atualiza um registro existente
 */
router.put('/visitas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/visitas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /visitas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/visitas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/visitas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /visitas/:id/approve
 * Aprova um protocolo
 */
router.post('/visitas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/visitas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /visitas/:id/reject
 * Rejeita um protocolo
 */
router.post('/visitas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/visitas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /visitas/:id/history
 * Histórico de mudanças de status
 */
router.get('/visitas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/visitas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: programas (INSCRICAO_PROGRAMA_SOCIAL)
// ==========================================================================

/**
 * GET /programas
 * Lista todos os registros deste módulo
 */
router.get('/programas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module programas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'INSCRICAO_PROGRAMA_SOCIAL'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/programas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /programas/:id
 * Busca um registro específico por ID
 */
router.get('/programas/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'INSCRICAO_PROGRAMA_SOCIAL') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/programas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /programas
 * Cria um novo registro
 */
router.post('/programas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/programas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/programas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /programas/:id
 * Atualiza um registro existente
 */
router.put('/programas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/programas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /programas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/programas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/programas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /programas/:id/approve
 * Aprova um protocolo
 */
router.post('/programas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/programas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /programas/:id/reject
 * Rejeita um protocolo
 */
router.post('/programas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/programas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /programas/:id/history
 * Histórico de mudanças de status
 */
router.get('/programas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/programas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: agendamentos (AGENDAMENTO_ATENDIMENTO_SOCIAL)
// ==========================================================================

/**
 * GET /agendamentos
 * Lista todos os registros deste módulo
 */
router.get('/agendamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module agendamentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/agendamentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /agendamentos/:id
 * Busca um registro específico por ID
 */
router.get('/agendamentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'AGENDAMENTO_ATENDIMENTO_SOCIAL') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/agendamentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /agendamentos
 * Cria um novo registro
 */
router.post('/agendamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/agendamentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/agendamentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /agendamentos/:id
 * Atualiza um registro existente
 */
router.put('/agendamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/agendamentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /agendamentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/agendamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/agendamentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /agendamentos/:id/approve
 * Aprova um protocolo
 */
router.post('/agendamentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/agendamentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /agendamentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/agendamentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/agendamentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /agendamentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/agendamentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/agendamentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: gestao-cras (GESTAO_CRAS_CREAS)
// ==========================================================================

/**
 * GET /gestao-cras
 * Lista todos os registros deste módulo
 */
router.get('/gestao-cras', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_CRAS_CREAS'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module gestao-cras'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'GESTAO_CRAS_CREAS'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/gestao-cras] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /gestao-cras/:id
 * Busca um registro específico por ID
 */
router.get('/gestao-cras/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'GESTAO_CRAS_CREAS') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/gestao-cras] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /gestao-cras
 * Cria um novo registro
 */
router.post('/gestao-cras', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_CRAS_CREAS'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/gestao-cras',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'GESTAO_CRAS_CREAS',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/gestao-cras] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /gestao-cras/:id
 * Atualiza um registro existente
 */
router.put('/gestao-cras/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/gestao-cras] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /gestao-cras/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/gestao-cras/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/gestao-cras] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-cras/:id/approve
 * Aprova um protocolo
 */
router.post('/gestao-cras/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/gestao-cras] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-cras/:id/reject
 * Rejeita um protocolo
 */
router.post('/gestao-cras/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/gestao-cras] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /gestao-cras/:id/history
 * Histórico de mudanças de status
 */
router.get('/gestao-cras/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/gestao-cras] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: servicos (ATENDIMENTOS_ASSISTENCIA_SOCIAL)
// ==========================================================================

/**
 * GET /servicos
 * Lista todos os registros deste módulo
 */
router.get('/servicos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module servicos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL'
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Busca textual (simples, no customData genérico)
    if (search && typeof search === 'string') {
      // Busca no JSON customData - Prisma suporta via JSON path
      // Nota: A busca exata depende da estrutura, mas fazemos uma tentativa genérica
    }

    // 4. Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: { id: true, name: true, cpf: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // 5. Transformar dados: expandir customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      citizen: p.citizen,
      // ✅ Dados dinâmicos do formSchema salvos em customData
      ...(p.customData as object || {})
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[assistencia-social/servicos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /servicos/:id
 * Busca um registro específico por ID
 */
router.get('/servicos/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: {
        citizen: true,
        service: true,
        department: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Verificar se é do módulo correto
    if (protocol.moduleType !== 'ATENDIMENTOS_ASSISTENCIA_SOCIAL') {
      return res.status(400).json({ success: false, error: 'Protocol does not belong to this module' });
    }

    const data = {
      id: protocol.id,
      protocolNumber: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      concludedAt: protocol.concludedAt,
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      // ✅ Dados dinâmicos
      ...(protocol.customData as object || {})
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('[assistencia-social/servicos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /servicos
 * Cria um novo registro
 */
router.post('/servicos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'assistencia-social' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL'
      }
    });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // 3. Validar com formSchema do service (se existir)
    // TODO: Implementar validação dinâmica com JSON Schema
    // if (service.formSchema) {
    //   const valid = validateWithSchema(req.body, service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // 4. Gerar número único do protocolo
    const protocolNumber = `${department.code || department.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: req.body.title || service.name || 'Protocolo assistencia-social/servicos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
        status: ProtocolStatus.VINCULADO,
        priority: req.body.priority || 3,
        // ✅ Salvar TODOS os dados do formulário em customData
        customData: req.body.formData || req.body,
        createdById: authReq.user?.id
      },
      include: {
        citizen: true,
        service: true
      }
    });

    res.status(201).json({ success: true, data: protocol });
  } catch (error) {
    console.error('[assistencia-social/servicos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /servicos/:id
 * Atualiza um registro existente
 */
router.put('/servicos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });

    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Validar com formSchema (se existir)
    // if (protocol.service.formSchema) {
    //   const valid = validateWithSchema(req.body, protocol.service.formSchema);
    //   if (!valid) return res.status(400).json({ error: 'Validation error' });
    // }

    // Atualizar customData
    const updated = await prisma.protocolSimplified.update({
      where: { id: req.params.id },
      data: {
        customData: req.body.formData || req.body,
        updatedAt: new Date()
      },
      include: { citizen: true, service: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[assistencia-social/servicos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /servicos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/servicos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos para cancelar
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.CANCELADO,
      actorRole: authReq.user?.role || UserRole.USER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Cancelado pelo usuário',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/servicos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /servicos/:id/approve
 * Aprova um protocolo
 */
router.post('/servicos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.comment || 'Aprovado'
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/servicos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /servicos/:id/reject
 * Rejeita um protocolo
 */
router.post('/servicos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // ✅ Usa o motor de protocolos
    const result = await protocolStatusEngine.updateStatus({
      protocolId: req.params.id,
      newStatus: ProtocolStatus.PENDENCIA,
      actorRole: authReq.user?.role || UserRole.MANAGER,
      actorId: authReq.user?.id || '',
      comment: req.body.reason || 'Rejeitado',
      reason: req.body.reason
    });

    res.json({ success: true, data: result.protocol });
  } catch (error: any) {
    console.error('[assistencia-social/servicos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /servicos/:id/history
 * Histórico de mudanças de status
 */
router.get('/servicos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[assistencia-social/servicos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// ============================================================================
// EXPORT
// ============================================================================

export default router;
