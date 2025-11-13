// ============================================================================
// SECRETARIA: SECRETARIA DE SAÚDE - GERADO AUTOMATICAMENTE
// ============================================================================
// ⚠️  ATENÇÃO: Este arquivo foi gerado automaticamente pelo sistema de templates.
// ⚠️  NÃO EDITE MANUALMENTE! Qualquer alteração será sobrescrita na próxima geração.
//
// Para fazer alterações:
// 1. Edite a configuração em: generator/configs/secretarias/saude.config.ts
// 2. Regenere o código: npm run generate -- --secretaria=saude --force
//
// Secretaria: Secretaria de Saúde
// Total de módulos: 11
// Gerado em: 2025-11-13T12:09:03.612Z
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
      where: { id: 'saude' }
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
    moduleStats['agendamentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'AGENDAMENTOS_MEDICOS' }
    });
    moduleStats['exames'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'EXAMES' }
    });
    moduleStats['vacinacao'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'VACINACAO' }
    });
    moduleStats['medicamentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CONTROLE_MEDICAMENTOS' }
    });
    moduleStats['transporte'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'TRANSPORTE_PACIENTES' }
    });
    moduleStats['campanhas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CAMPANHAS_SAUDE' }
    });
    moduleStats['programas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'PROGRAMAS_SAUDE' }
    });
    moduleStats['encaminhamentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ENCAMINHAMENTOS_TFD' }
    });
    moduleStats['cadastro-paciente'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CADASTRO_PACIENTE' }
    });
    moduleStats['gestao-acs'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'GESTAO_ACS' }
    });
    moduleStats['servicos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ATENDIMENTOS_SAUDE' }
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
    console.error('[saude] Error in stats:', error);
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
      where: { id: 'saude' }
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
    console.error('[saude] Error listing services:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// ROTAS DOS MÓDULOS (CRUD GENÉRICO)
// ============================================================================

// ==========================================================================
// MÓDULO: agendamentos (AGENDAMENTOS_MEDICOS)
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'AGENDAMENTOS_MEDICOS'
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
      moduleType: 'AGENDAMENTOS_MEDICOS'
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
    console.error('[saude/agendamentos] Error listing:', error);
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
    if (protocol.moduleType !== 'AGENDAMENTOS_MEDICOS') {
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
    console.error('[saude/agendamentos] Error getting by ID:', error);
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'AGENDAMENTOS_MEDICOS'
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
        title: req.body.title || service.name || 'Protocolo saude/agendamentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'AGENDAMENTOS_MEDICOS',
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
    console.error('[saude/agendamentos] Error creating:', error);
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
    console.error('[saude/agendamentos] Error updating:', error);
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
    console.error('[saude/agendamentos] Error deleting:', error);
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
    console.error('[saude/agendamentos] Error approving:', error);
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
    console.error('[saude/agendamentos] Error rejecting:', error);
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
    console.error('[saude/agendamentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: exames (EXAMES)
// ==========================================================================

/**
 * GET /exames
 * Lista todos os registros deste módulo
 */
router.get('/exames', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'EXAMES'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module exames'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'EXAMES'
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
    console.error('[saude/exames] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /exames/:id
 * Busca um registro específico por ID
 */
router.get('/exames/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'EXAMES') {
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
    console.error('[saude/exames] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /exames
 * Cria um novo registro
 */
router.post('/exames', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'EXAMES'
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
        title: req.body.title || service.name || 'Protocolo saude/exames',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'EXAMES',
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
    console.error('[saude/exames] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /exames/:id
 * Atualiza um registro existente
 */
router.put('/exames/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/exames] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /exames/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/exames/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/exames] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /exames/:id/approve
 * Aprova um protocolo
 */
router.post('/exames/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/exames] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /exames/:id/reject
 * Rejeita um protocolo
 */
router.post('/exames/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/exames] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /exames/:id/history
 * Histórico de mudanças de status
 */
router.get('/exames/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/exames] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: vacinacao (VACINACAO)
// ==========================================================================

/**
 * GET /vacinacao
 * Lista todos os registros deste módulo
 */
router.get('/vacinacao', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'VACINACAO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module vacinacao'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'VACINACAO'
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
    console.error('[saude/vacinacao] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /vacinacao/:id
 * Busca um registro específico por ID
 */
router.get('/vacinacao/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'VACINACAO') {
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
    console.error('[saude/vacinacao] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /vacinacao
 * Cria um novo registro
 */
router.post('/vacinacao', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'VACINACAO'
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
        title: req.body.title || service.name || 'Protocolo saude/vacinacao',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'VACINACAO',
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
    console.error('[saude/vacinacao] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /vacinacao/:id
 * Atualiza um registro existente
 */
router.put('/vacinacao/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/vacinacao] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /vacinacao/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/vacinacao/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/vacinacao] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /vacinacao/:id/approve
 * Aprova um protocolo
 */
router.post('/vacinacao/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/vacinacao] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /vacinacao/:id/reject
 * Rejeita um protocolo
 */
router.post('/vacinacao/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/vacinacao] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /vacinacao/:id/history
 * Histórico de mudanças de status
 */
router.get('/vacinacao/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/vacinacao] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: medicamentos (CONTROLE_MEDICAMENTOS)
// ==========================================================================

/**
 * GET /medicamentos
 * Lista todos os registros deste módulo
 */
router.get('/medicamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONTROLE_MEDICAMENTOS'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module medicamentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CONTROLE_MEDICAMENTOS'
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
    console.error('[saude/medicamentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /medicamentos/:id
 * Busca um registro específico por ID
 */
router.get('/medicamentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CONTROLE_MEDICAMENTOS') {
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
    console.error('[saude/medicamentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /medicamentos
 * Cria um novo registro
 */
router.post('/medicamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONTROLE_MEDICAMENTOS'
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
        title: req.body.title || service.name || 'Protocolo saude/medicamentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CONTROLE_MEDICAMENTOS',
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
    console.error('[saude/medicamentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /medicamentos/:id
 * Atualiza um registro existente
 */
router.put('/medicamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/medicamentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /medicamentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/medicamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/medicamentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /medicamentos/:id/approve
 * Aprova um protocolo
 */
router.post('/medicamentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/medicamentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /medicamentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/medicamentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/medicamentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /medicamentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/medicamentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/medicamentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: transporte (TRANSPORTE_PACIENTES)
// ==========================================================================

/**
 * GET /transporte
 * Lista todos os registros deste módulo
 */
router.get('/transporte', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSPORTE_PACIENTES'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module transporte'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'TRANSPORTE_PACIENTES'
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
    console.error('[saude/transporte] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /transporte/:id
 * Busca um registro específico por ID
 */
router.get('/transporte/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'TRANSPORTE_PACIENTES') {
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
    console.error('[saude/transporte] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /transporte
 * Cria um novo registro
 */
router.post('/transporte', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSPORTE_PACIENTES'
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
        title: req.body.title || service.name || 'Protocolo saude/transporte',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'TRANSPORTE_PACIENTES',
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
    console.error('[saude/transporte] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /transporte/:id
 * Atualiza um registro existente
 */
router.put('/transporte/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/transporte] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /transporte/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/transporte/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/transporte] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /transporte/:id/approve
 * Aprova um protocolo
 */
router.post('/transporte/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/transporte] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /transporte/:id/reject
 * Rejeita um protocolo
 */
router.post('/transporte/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/transporte] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /transporte/:id/history
 * Histórico de mudanças de status
 */
router.get('/transporte/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/transporte] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: campanhas (CAMPANHAS_SAUDE)
// ==========================================================================

/**
 * GET /campanhas
 * Lista todos os registros deste módulo
 */
router.get('/campanhas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CAMPANHAS_SAUDE'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module campanhas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CAMPANHAS_SAUDE'
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
    console.error('[saude/campanhas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /campanhas/:id
 * Busca um registro específico por ID
 */
router.get('/campanhas/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CAMPANHAS_SAUDE') {
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
    console.error('[saude/campanhas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /campanhas
 * Cria um novo registro
 */
router.post('/campanhas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CAMPANHAS_SAUDE'
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
        title: req.body.title || service.name || 'Protocolo saude/campanhas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CAMPANHAS_SAUDE',
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
    console.error('[saude/campanhas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /campanhas/:id
 * Atualiza um registro existente
 */
router.put('/campanhas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/campanhas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /campanhas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/campanhas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/campanhas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /campanhas/:id/approve
 * Aprova um protocolo
 */
router.post('/campanhas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/campanhas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /campanhas/:id/reject
 * Rejeita um protocolo
 */
router.post('/campanhas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/campanhas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /campanhas/:id/history
 * Histórico de mudanças de status
 */
router.get('/campanhas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/campanhas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: programas (PROGRAMAS_SAUDE)
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'PROGRAMAS_SAUDE'
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
      moduleType: 'PROGRAMAS_SAUDE'
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
    console.error('[saude/programas] Error listing:', error);
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
    if (protocol.moduleType !== 'PROGRAMAS_SAUDE') {
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
    console.error('[saude/programas] Error getting by ID:', error);
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'PROGRAMAS_SAUDE'
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
        title: req.body.title || service.name || 'Protocolo saude/programas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'PROGRAMAS_SAUDE',
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
    console.error('[saude/programas] Error creating:', error);
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
    console.error('[saude/programas] Error updating:', error);
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
    console.error('[saude/programas] Error deleting:', error);
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
    console.error('[saude/programas] Error approving:', error);
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
    console.error('[saude/programas] Error rejecting:', error);
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
    console.error('[saude/programas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: encaminhamentos (ENCAMINHAMENTOS_TFD)
// ==========================================================================

/**
 * GET /encaminhamentos
 * Lista todos os registros deste módulo
 */
router.get('/encaminhamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ENCAMINHAMENTOS_TFD'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module encaminhamentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'ENCAMINHAMENTOS_TFD'
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
    console.error('[saude/encaminhamentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /encaminhamentos/:id
 * Busca um registro específico por ID
 */
router.get('/encaminhamentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'ENCAMINHAMENTOS_TFD') {
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
    console.error('[saude/encaminhamentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /encaminhamentos
 * Cria um novo registro
 */
router.post('/encaminhamentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ENCAMINHAMENTOS_TFD'
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
        title: req.body.title || service.name || 'Protocolo saude/encaminhamentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ENCAMINHAMENTOS_TFD',
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
    console.error('[saude/encaminhamentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /encaminhamentos/:id
 * Atualiza um registro existente
 */
router.put('/encaminhamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/encaminhamentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /encaminhamentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/encaminhamentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/encaminhamentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /encaminhamentos/:id/approve
 * Aprova um protocolo
 */
router.post('/encaminhamentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/encaminhamentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /encaminhamentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/encaminhamentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/encaminhamentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /encaminhamentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/encaminhamentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/encaminhamentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: cadastro-paciente (CADASTRO_PACIENTE)
// ==========================================================================

/**
 * GET /cadastro-paciente
 * Lista todos os registros deste módulo
 */
router.get('/cadastro-paciente', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_PACIENTE'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module cadastro-paciente'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CADASTRO_PACIENTE'
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
    console.error('[saude/cadastro-paciente] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /cadastro-paciente/:id
 * Busca um registro específico por ID
 */
router.get('/cadastro-paciente/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CADASTRO_PACIENTE') {
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
    console.error('[saude/cadastro-paciente] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /cadastro-paciente
 * Cria um novo registro
 */
router.post('/cadastro-paciente', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CADASTRO_PACIENTE'
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
        title: req.body.title || service.name || 'Protocolo saude/cadastro-paciente',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CADASTRO_PACIENTE',
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
    console.error('[saude/cadastro-paciente] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /cadastro-paciente/:id
 * Atualiza um registro existente
 */
router.put('/cadastro-paciente/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/cadastro-paciente] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /cadastro-paciente/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/cadastro-paciente/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/cadastro-paciente] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /cadastro-paciente/:id/approve
 * Aprova um protocolo
 */
router.post('/cadastro-paciente/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/cadastro-paciente] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /cadastro-paciente/:id/reject
 * Rejeita um protocolo
 */
router.post('/cadastro-paciente/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/cadastro-paciente] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /cadastro-paciente/:id/history
 * Histórico de mudanças de status
 */
router.get('/cadastro-paciente/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/cadastro-paciente] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: gestao-acs (GESTAO_ACS)
// ==========================================================================

/**
 * GET /gestao-acs
 * Lista todos os registros deste módulo
 */
router.get('/gestao-acs', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_ACS'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module gestao-acs'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'GESTAO_ACS'
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
    console.error('[saude/gestao-acs] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /gestao-acs/:id
 * Busca um registro específico por ID
 */
router.get('/gestao-acs/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'GESTAO_ACS') {
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
    console.error('[saude/gestao-acs] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /gestao-acs
 * Cria um novo registro
 */
router.post('/gestao-acs', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_ACS'
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
        title: req.body.title || service.name || 'Protocolo saude/gestao-acs',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'GESTAO_ACS',
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
    console.error('[saude/gestao-acs] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /gestao-acs/:id
 * Atualiza um registro existente
 */
router.put('/gestao-acs/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/gestao-acs] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /gestao-acs/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/gestao-acs/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/gestao-acs] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-acs/:id/approve
 * Aprova um protocolo
 */
router.post('/gestao-acs/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/gestao-acs] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-acs/:id/reject
 * Rejeita um protocolo
 */
router.post('/gestao-acs/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[saude/gestao-acs] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /gestao-acs/:id/history
 * Histórico de mudanças de status
 */
router.get('/gestao-acs/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[saude/gestao-acs] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: servicos (ATENDIMENTOS_SAUDE)
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_SAUDE'
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
      moduleType: 'ATENDIMENTOS_SAUDE'
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
    console.error('[saude/servicos] Error listing:', error);
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
    if (protocol.moduleType !== 'ATENDIMENTOS_SAUDE') {
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
    console.error('[saude/servicos] Error getting by ID:', error);
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
      where: { id: 'saude' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_SAUDE'
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
        title: req.body.title || service.name || 'Protocolo saude/servicos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_SAUDE',
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
    console.error('[saude/servicos] Error creating:', error);
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
    console.error('[saude/servicos] Error updating:', error);
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
    console.error('[saude/servicos] Error deleting:', error);
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
    console.error('[saude/servicos] Error approving:', error);
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
    console.error('[saude/servicos] Error rejecting:', error);
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
    console.error('[saude/servicos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// ============================================================================
// EXPORT
// ============================================================================

export default router;
