// ============================================================================
// SECRETARIA: SECRETARIA DE TURISMO - GERADO AUTOMATICAMENTE
// ============================================================================
// ⚠️  ATENÇÃO: Este arquivo foi gerado automaticamente pelo sistema de templates.
// ⚠️  NÃO EDITE MANUALMENTE! Qualquer alteração será sobrescrita na próxima geração.
//
// Para fazer alterações:
// 1. Edite a configuração em: generator/configs/secretarias/turismo.config.ts
// 2. Regenere o código: npm run generate -- --secretaria=turismo --force
//
// Secretaria: Secretaria de Turismo
// Total de módulos: 7
// Gerado em: 2025-11-13T12:09:03.641Z
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
      where: { id: 'turismo' }
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
    moduleStats['guias'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_GUIA_TURISTICO' }
    });
    moduleStats['estabelecimentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO' }
    });
    moduleStats['eventos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_EVENTO_TURISTICO' }
    });
    moduleStats['roteiros'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_ROTEIRO_TURISTICO' }
    });
    moduleStats['programas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'INSCRICAO_PROGRAMA_TURISTICO' }
    });
    moduleStats['atrativos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'REGISTRO_ATRATIVO_TURISTICO' }
    });
    moduleStats['servicos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ATENDIMENTOS_TURISMO' }
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
    console.error('[turismo] Error in stats:', error);
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
      where: { id: 'turismo' }
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
    console.error('[turismo] Error listing services:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// ROTAS DOS MÓDULOS (CRUD GENÉRICO)
// ============================================================================

// ==========================================================================
// MÓDULO: guias (CADASTRO_GUIA_TURISTICO)
// ==========================================================================

/**
 * GET /guias
 * Lista todos os registros deste módulo
 */
router.get('/guias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_GUIA_TURISTICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module guias'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_GUIA_TURISTICO'
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
    console.error('[turismo/guias] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /guias/:id
 * Busca um registro específico por ID
 */
router.get('/guias/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_GUIA_TURISTICO') {
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
    console.error('[turismo/guias] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /guias
 * Cria um novo registro
 */
router.post('/guias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_GUIA_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/guias',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_GUIA_TURISTICO',
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
    console.error('[turismo/guias] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /guias/:id
 * Atualiza um registro existente
 */
router.put('/guias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/guias] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /guias/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/guias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/guias] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /guias/:id/approve
 * Aprova um protocolo
 */
router.post('/guias/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/guias] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /guias/:id/reject
 * Rejeita um protocolo
 */
router.post('/guias/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/guias] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /guias/:id/history
 * Histórico de mudanças de status
 */
router.get('/guias/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[turismo/guias] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: estabelecimentos (CADASTRO_ESTABELECIMENTO_TURISTICO)
// ==========================================================================

/**
 * GET /estabelecimentos
 * Lista todos os registros deste módulo
 */
router.get('/estabelecimentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module estabelecimentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO'
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
    console.error('[turismo/estabelecimentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /estabelecimentos/:id
 * Busca um registro específico por ID
 */
router.get('/estabelecimentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_ESTABELECIMENTO_TURISTICO') {
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
    console.error('[turismo/estabelecimentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /estabelecimentos
 * Cria um novo registro
 */
router.post('/estabelecimentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/estabelecimentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
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
    console.error('[turismo/estabelecimentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /estabelecimentos/:id
 * Atualiza um registro existente
 */
router.put('/estabelecimentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/estabelecimentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /estabelecimentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/estabelecimentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/estabelecimentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /estabelecimentos/:id/approve
 * Aprova um protocolo
 */
router.post('/estabelecimentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/estabelecimentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /estabelecimentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/estabelecimentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/estabelecimentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /estabelecimentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/estabelecimentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[turismo/estabelecimentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: eventos (CADASTRO_EVENTO_TURISTICO)
// ==========================================================================

/**
 * GET /eventos
 * Lista todos os registros deste módulo
 */
router.get('/eventos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_EVENTO_TURISTICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module eventos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_EVENTO_TURISTICO'
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
    console.error('[turismo/eventos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /eventos/:id
 * Busca um registro específico por ID
 */
router.get('/eventos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_EVENTO_TURISTICO') {
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
    console.error('[turismo/eventos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /eventos
 * Cria um novo registro
 */
router.post('/eventos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_EVENTO_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/eventos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_EVENTO_TURISTICO',
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
    console.error('[turismo/eventos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /eventos/:id
 * Atualiza um registro existente
 */
router.put('/eventos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/eventos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /eventos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/eventos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/eventos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /eventos/:id/approve
 * Aprova um protocolo
 */
router.post('/eventos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/eventos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /eventos/:id/reject
 * Rejeita um protocolo
 */
router.post('/eventos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/eventos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /eventos/:id/history
 * Histórico de mudanças de status
 */
router.get('/eventos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[turismo/eventos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: roteiros (CADASTRO_ROTEIRO_TURISTICO)
// ==========================================================================

/**
 * GET /roteiros
 * Lista todos os registros deste módulo
 */
router.get('/roteiros', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_ROTEIRO_TURISTICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module roteiros'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_ROTEIRO_TURISTICO'
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
    console.error('[turismo/roteiros] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /roteiros/:id
 * Busca um registro específico por ID
 */
router.get('/roteiros/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_ROTEIRO_TURISTICO') {
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
    console.error('[turismo/roteiros] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /roteiros
 * Cria um novo registro
 */
router.post('/roteiros', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_ROTEIRO_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/roteiros',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_ROTEIRO_TURISTICO',
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
    console.error('[turismo/roteiros] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /roteiros/:id
 * Atualiza um registro existente
 */
router.put('/roteiros/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/roteiros] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /roteiros/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/roteiros/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/roteiros] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /roteiros/:id/approve
 * Aprova um protocolo
 */
router.post('/roteiros/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/roteiros] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /roteiros/:id/reject
 * Rejeita um protocolo
 */
router.post('/roteiros/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/roteiros] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /roteiros/:id/history
 * Histórico de mudanças de status
 */
router.get('/roteiros/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[turismo/roteiros] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: programas (INSCRICAO_PROGRAMA_TURISTICO)
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
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_TURISTICO'
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
      moduleType: 'INSCRICAO_PROGRAMA_TURISTICO'
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
    console.error('[turismo/programas] Error listing:', error);
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
    if (protocol.moduleType !== 'INSCRICAO_PROGRAMA_TURISTICO') {
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
    console.error('[turismo/programas] Error getting by ID:', error);
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
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/programas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'INSCRICAO_PROGRAMA_TURISTICO',
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
    console.error('[turismo/programas] Error creating:', error);
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
    console.error('[turismo/programas] Error updating:', error);
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
    console.error('[turismo/programas] Error deleting:', error);
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
    console.error('[turismo/programas] Error approving:', error);
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
    console.error('[turismo/programas] Error rejecting:', error);
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
    console.error('[turismo/programas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: atrativos (REGISTRO_ATRATIVO_TURISTICO)
// ==========================================================================

/**
 * GET /atrativos
 * Lista todos os registros deste módulo
 */
router.get('/atrativos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'REGISTRO_ATRATIVO_TURISTICO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module atrativos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'REGISTRO_ATRATIVO_TURISTICO'
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
    console.error('[turismo/atrativos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /atrativos/:id
 * Busca um registro específico por ID
 */
router.get('/atrativos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'REGISTRO_ATRATIVO_TURISTICO') {
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
    console.error('[turismo/atrativos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /atrativos
 * Cria um novo registro
 */
router.post('/atrativos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'REGISTRO_ATRATIVO_TURISTICO'
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
        title: req.body.title || service.name || 'Protocolo turismo/atrativos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'REGISTRO_ATRATIVO_TURISTICO',
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
    console.error('[turismo/atrativos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /atrativos/:id
 * Atualiza um registro existente
 */
router.put('/atrativos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/atrativos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /atrativos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/atrativos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/atrativos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /atrativos/:id/approve
 * Aprova um protocolo
 */
router.post('/atrativos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/atrativos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /atrativos/:id/reject
 * Rejeita um protocolo
 */
router.post('/atrativos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[turismo/atrativos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /atrativos/:id/history
 * Histórico de mudanças de status
 */
router.get('/atrativos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[turismo/atrativos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: servicos (ATENDIMENTOS_TURISMO)
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
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_TURISMO'
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
      moduleType: 'ATENDIMENTOS_TURISMO'
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
    console.error('[turismo/servicos] Error listing:', error);
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
    if (protocol.moduleType !== 'ATENDIMENTOS_TURISMO') {
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
    console.error('[turismo/servicos] Error getting by ID:', error);
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
      where: { id: 'turismo' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_TURISMO'
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
        title: req.body.title || service.name || 'Protocolo turismo/servicos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_TURISMO',
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
    console.error('[turismo/servicos] Error creating:', error);
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
    console.error('[turismo/servicos] Error updating:', error);
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
    console.error('[turismo/servicos] Error deleting:', error);
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
    console.error('[turismo/servicos] Error approving:', error);
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
    console.error('[turismo/servicos] Error rejecting:', error);
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
    console.error('[turismo/servicos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// ============================================================================
// EXPORT
// ============================================================================

export default router;
