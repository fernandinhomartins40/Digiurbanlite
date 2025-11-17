// ============================================================================
// SECRETARIA: SECRETARIA DE PLANEJAMENTO URBANO - GERADO AUTOMATICAMENTE
// ============================================================================
// ⚠️  ATENÇÃO: Este arquivo foi gerado automaticamente pelo sistema de templates.
// ⚠️  NÃO EDITE MANUALMENTE! Qualquer alteração será sobrescrita na próxima geração.
//
// Para fazer alterações:
// 1. Edite a configuração em: generator/configs/secretarias/planejamento-urbano.config.ts
// 2. Regenere o código: npm run generate -- --secretaria=planejamento-urbano --force
//
// Secretaria: Secretaria de Planejamento Urbano
// Total de módulos: 6
// Gerado em: 2025-11-13T12:09:03.604Z
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
      where: { id: 'planejamento-urbano' }
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
    moduleStats['alvara-construcao'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ALVARA_CONSTRUCAO' }
    });
    moduleStats['alvara-funcionamento'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ALVARA_FUNCIONAMENTO' }
    });
    moduleStats['projetos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'APROVACAO_PROJETO' }
    });
    moduleStats['denuncias'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR' }
    });
    moduleStats['loteamentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_LOTEAMENTO' }
    });
    moduleStats['servicos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ATENDIMENTOS_PLANEJAMENTO' }
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
    console.error('[planejamento-urbano] Error in stats:', error);
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
      where: { id: 'planejamento-urbano' }
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
    console.error('[planejamento-urbano] Error listing services:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// ROTAS DOS MÓDULOS (CRUD GENÉRICO)
// ============================================================================

// ==========================================================================
// MÓDULO: alvara-construcao (ALVARA_CONSTRUCAO)
// ==========================================================================

/**
 * GET /alvara-construcao
 * Lista todos os registros deste módulo
 */
router.get('/alvara-construcao', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ALVARA_CONSTRUCAO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module alvara-construcao'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'ALVARA_CONSTRUCAO'
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
    console.error('[planejamento-urbano/alvara-construcao] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /alvara-construcao/:id
 * Busca um registro específico por ID
 */
router.get('/alvara-construcao/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'ALVARA_CONSTRUCAO') {
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
    console.error('[planejamento-urbano/alvara-construcao] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /alvara-construcao
 * Cria um novo registro
 */
router.post('/alvara-construcao', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ALVARA_CONSTRUCAO'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/alvara-construcao',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ALVARA_CONSTRUCAO',
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
    console.error('[planejamento-urbano/alvara-construcao] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /alvara-construcao/:id
 * Atualiza um registro existente
 */
router.put('/alvara-construcao/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-construcao] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /alvara-construcao/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/alvara-construcao/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-construcao] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /alvara-construcao/:id/approve
 * Aprova um protocolo
 */
router.post('/alvara-construcao/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-construcao] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /alvara-construcao/:id/reject
 * Rejeita um protocolo
 */
router.post('/alvara-construcao/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-construcao] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /alvara-construcao/:id/history
 * Histórico de mudanças de status
 */
router.get('/alvara-construcao/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[planejamento-urbano/alvara-construcao] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: alvara-funcionamento (ALVARA_FUNCIONAMENTO)
// ==========================================================================

/**
 * GET /alvara-funcionamento
 * Lista todos os registros deste módulo
 */
router.get('/alvara-funcionamento', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ALVARA_FUNCIONAMENTO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module alvara-funcionamento'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'ALVARA_FUNCIONAMENTO'
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /alvara-funcionamento/:id
 * Busca um registro específico por ID
 */
router.get('/alvara-funcionamento/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'ALVARA_FUNCIONAMENTO') {
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /alvara-funcionamento
 * Cria um novo registro
 */
router.post('/alvara-funcionamento', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ALVARA_FUNCIONAMENTO'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/alvara-funcionamento',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ALVARA_FUNCIONAMENTO',
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /alvara-funcionamento/:id
 * Atualiza um registro existente
 */
router.put('/alvara-funcionamento/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /alvara-funcionamento/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/alvara-funcionamento/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /alvara-funcionamento/:id/approve
 * Aprova um protocolo
 */
router.post('/alvara-funcionamento/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /alvara-funcionamento/:id/reject
 * Rejeita um protocolo
 */
router.post('/alvara-funcionamento/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/alvara-funcionamento] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /alvara-funcionamento/:id/history
 * Histórico de mudanças de status
 */
router.get('/alvara-funcionamento/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[planejamento-urbano/alvara-funcionamento] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: projetos (APROVACAO_PROJETO)
// ==========================================================================

/**
 * GET /projetos
 * Lista todos os registros deste módulo
 */
router.get('/projetos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'APROVACAO_PROJETO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module projetos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'APROVACAO_PROJETO'
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
    console.error('[planejamento-urbano/projetos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /projetos/:id
 * Busca um registro específico por ID
 */
router.get('/projetos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'APROVACAO_PROJETO') {
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
    console.error('[planejamento-urbano/projetos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /projetos
 * Cria um novo registro
 */
router.post('/projetos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'APROVACAO_PROJETO'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/projetos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'APROVACAO_PROJETO',
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
    console.error('[planejamento-urbano/projetos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /projetos/:id
 * Atualiza um registro existente
 */
router.put('/projetos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/projetos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /projetos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/projetos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/projetos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /projetos/:id/approve
 * Aprova um protocolo
 */
router.post('/projetos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/projetos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /projetos/:id/reject
 * Rejeita um protocolo
 */
router.post('/projetos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/projetos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /projetos/:id/history
 * Histórico de mudanças de status
 */
router.get('/projetos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[planejamento-urbano/projetos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: denuncias (DENUNCIA_CONSTRUCAO_IRREGULAR)
// ==========================================================================

/**
 * GET /denuncias
 * Lista todos os registros deste módulo
 */
router.get('/denuncias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module denuncias'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR'
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
    console.error('[planejamento-urbano/denuncias] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /denuncias/:id
 * Busca um registro específico por ID
 */
router.get('/denuncias/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'DENUNCIA_CONSTRUCAO_IRREGULAR') {
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
    console.error('[planejamento-urbano/denuncias] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /denuncias
 * Cria um novo registro
 */
router.post('/denuncias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/denuncias',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
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
    console.error('[planejamento-urbano/denuncias] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /denuncias/:id
 * Atualiza um registro existente
 */
router.put('/denuncias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/denuncias] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /denuncias/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/denuncias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/denuncias] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /denuncias/:id/approve
 * Aprova um protocolo
 */
router.post('/denuncias/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/denuncias] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /denuncias/:id/reject
 * Rejeita um protocolo
 */
router.post('/denuncias/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/denuncias] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /denuncias/:id/history
 * Histórico de mudanças de status
 */
router.get('/denuncias/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[planejamento-urbano/denuncias] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: loteamentos (CADASTRO_LOTEAMENTO)
// ==========================================================================

/**
 * GET /loteamentos
 * Lista todos os registros deste módulo
 */
router.get('/loteamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_LOTEAMENTO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module loteamentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_LOTEAMENTO'
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
    console.error('[planejamento-urbano/loteamentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /loteamentos/:id
 * Busca um registro específico por ID
 */
router.get('/loteamentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_LOTEAMENTO') {
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
    console.error('[planejamento-urbano/loteamentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /loteamentos
 * Cria um novo registro
 */
router.post('/loteamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_LOTEAMENTO'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/loteamentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_LOTEAMENTO',
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
    console.error('[planejamento-urbano/loteamentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /loteamentos/:id
 * Atualiza um registro existente
 */
router.put('/loteamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/loteamentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /loteamentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/loteamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/loteamentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /loteamentos/:id/approve
 * Aprova um protocolo
 */
router.post('/loteamentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/loteamentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /loteamentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/loteamentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[planejamento-urbano/loteamentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /loteamentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/loteamentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[planejamento-urbano/loteamentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: servicos (ATENDIMENTOS_PLANEJAMENTO)
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
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_PLANEJAMENTO'
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
      moduleType: 'ATENDIMENTOS_PLANEJAMENTO'
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
    console.error('[planejamento-urbano/servicos] Error listing:', error);
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
    if (protocol.moduleType !== 'ATENDIMENTOS_PLANEJAMENTO') {
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
    console.error('[planejamento-urbano/servicos] Error getting by ID:', error);
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
      where: { id: 'planejamento-urbano' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_PLANEJAMENTO'
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
        title: req.body.title || service.name || 'Protocolo planejamento-urbano/servicos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_PLANEJAMENTO',
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
    console.error('[planejamento-urbano/servicos] Error creating:', error);
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
    console.error('[planejamento-urbano/servicos] Error updating:', error);
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
    console.error('[planejamento-urbano/servicos] Error deleting:', error);
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
    console.error('[planejamento-urbano/servicos] Error approving:', error);
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
    console.error('[planejamento-urbano/servicos] Error rejecting:', error);
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
    console.error('[planejamento-urbano/servicos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// ============================================================================
// EXPORT
// ============================================================================

export default router;
