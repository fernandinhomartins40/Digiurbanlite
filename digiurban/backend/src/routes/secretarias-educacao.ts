// ============================================================================
// SECRETARIA: SECRETARIA DE EDUCAÇÃO - GERADO AUTOMATICAMENTE
// ============================================================================
// ⚠️  ATENÇÃO: Este arquivo foi gerado automaticamente pelo sistema de templates.
// ⚠️  NÃO EDITE MANUALMENTE! Qualquer alteração será sobrescrita na próxima geração.
//
// Para fazer alterações:
// 1. Edite a configuração em: generator/configs/secretarias/educacao.config.ts
// 2. Regenere o código: npm run generate -- --secretaria=educacao --force
//
// Secretaria: Secretaria de Educação
// Total de módulos: 10
// Gerado em: 2025-11-13T12:09:03.553Z
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
      where: { id: 'educacao' }
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
    moduleStats['matriculas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'MATRICULA_ALUNO' }
    });
    moduleStats['transporte'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'TRANSPORTE_ESCOLAR' }
    });
    moduleStats['ocorrencias'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR' }
    });
    moduleStats['documentos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR' }
    });
    moduleStats['transferencias'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'TRANSFERENCIA_ESCOLAR' }
    });
    moduleStats['frequencia'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CONSULTA_FREQUENCIA' }
    });
    moduleStats['notas'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'CONSULTA_NOTAS' }
    });
    moduleStats['gestao-escolar'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'GESTAO_ESCOLAR' }
    });
    moduleStats['merenda'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'GESTAO_MERENDA' }
    });
    moduleStats['servicos'] = await prisma.protocolSimplified.count({
      where: { departmentId: department.id, moduleType: 'ATENDIMENTOS_EDUCACAO' }
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
    console.error('[educacao] Error in stats:', error);
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
      where: { id: 'educacao' }
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
    console.error('[educacao] Error listing services:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// ROTAS DOS MÓDULOS (CRUD GENÉRICO)
// ============================================================================

// ==========================================================================
// MÓDULO: matriculas (MATRICULA_ALUNO)
// ==========================================================================

/**
 * GET /matriculas
 * Lista todos os registros deste módulo
 */
router.get('/matriculas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'MATRICULA_ALUNO'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module matriculas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'MATRICULA_ALUNO'
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
    console.error('[educacao/matriculas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /matriculas/:id
 * Busca um registro específico por ID
 */
router.get('/matriculas/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'MATRICULA_ALUNO') {
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
    console.error('[educacao/matriculas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /matriculas
 * Cria um novo registro
 */
router.post('/matriculas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'MATRICULA_ALUNO'
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
        title: req.body.title || service.name || 'Protocolo educacao/matriculas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'MATRICULA_ALUNO',
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
    console.error('[educacao/matriculas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /matriculas/:id
 * Atualiza um registro existente
 */
router.put('/matriculas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/matriculas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /matriculas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/matriculas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/matriculas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /matriculas/:id/approve
 * Aprova um protocolo
 */
router.post('/matriculas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/matriculas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /matriculas/:id/reject
 * Rejeita um protocolo
 */
router.post('/matriculas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/matriculas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /matriculas/:id/history
 * Histórico de mudanças de status
 */
router.get('/matriculas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/matriculas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: transporte (TRANSPORTE_ESCOLAR)
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
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSPORTE_ESCOLAR'
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
      moduleType: 'TRANSPORTE_ESCOLAR'
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
    console.error('[educacao/transporte] Error listing:', error);
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
    if (protocol.moduleType !== 'TRANSPORTE_ESCOLAR') {
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
    console.error('[educacao/transporte] Error getting by ID:', error);
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
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSPORTE_ESCOLAR'
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
        title: req.body.title || service.name || 'Protocolo educacao/transporte',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'TRANSPORTE_ESCOLAR',
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
    console.error('[educacao/transporte] Error creating:', error);
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
    console.error('[educacao/transporte] Error updating:', error);
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
    console.error('[educacao/transporte] Error deleting:', error);
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
    console.error('[educacao/transporte] Error approving:', error);
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
    console.error('[educacao/transporte] Error rejecting:', error);
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
    console.error('[educacao/transporte] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: ocorrencias (REGISTRO_OCORRENCIA_ESCOLAR)
// ==========================================================================

/**
 * GET /ocorrencias
 * Lista todos os registros deste módulo
 */
router.get('/ocorrencias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module ocorrencias'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR'
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
    console.error('[educacao/ocorrencias] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /ocorrencias/:id
 * Busca um registro específico por ID
 */
router.get('/ocorrencias/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'REGISTRO_OCORRENCIA_ESCOLAR') {
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
    console.error('[educacao/ocorrencias] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /ocorrencias
 * Cria um novo registro
 */
router.post('/ocorrencias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR'
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
        title: req.body.title || service.name || 'Protocolo educacao/ocorrencias',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
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
    console.error('[educacao/ocorrencias] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /ocorrencias/:id
 * Atualiza um registro existente
 */
router.put('/ocorrencias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/ocorrencias] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /ocorrencias/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/ocorrencias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/ocorrencias] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /ocorrencias/:id/approve
 * Aprova um protocolo
 */
router.post('/ocorrencias/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/ocorrencias] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /ocorrencias/:id/reject
 * Rejeita um protocolo
 */
router.post('/ocorrencias/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/ocorrencias] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /ocorrencias/:id/history
 * Histórico de mudanças de status
 */
router.get('/ocorrencias/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/ocorrencias] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: documentos (SOLICITACAO_DOCUMENTO_ESCOLAR)
// ==========================================================================

/**
 * GET /documentos
 * Lista todos os registros deste módulo
 */
router.get('/documentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module documentos'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR'
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
    console.error('[educacao/documentos] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /documentos/:id
 * Busca um registro específico por ID
 */
router.get('/documentos/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'SOLICITACAO_DOCUMENTO_ESCOLAR') {
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
    console.error('[educacao/documentos] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /documentos
 * Cria um novo registro
 */
router.post('/documentos', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR'
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
        title: req.body.title || service.name || 'Protocolo educacao/documentos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
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
    console.error('[educacao/documentos] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /documentos/:id
 * Atualiza um registro existente
 */
router.put('/documentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/documentos] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /documentos/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/documentos/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/documentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /documentos/:id/approve
 * Aprova um protocolo
 */
router.post('/documentos/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/documentos] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /documentos/:id/reject
 * Rejeita um protocolo
 */
router.post('/documentos/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/documentos] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /documentos/:id/history
 * Histórico de mudanças de status
 */
router.get('/documentos/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/documentos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: transferencias (TRANSFERENCIA_ESCOLAR)
// ==========================================================================

/**
 * GET /transferencias
 * Lista todos os registros deste módulo
 */
router.get('/transferencias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSFERENCIA_ESCOLAR'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module transferencias'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'TRANSFERENCIA_ESCOLAR'
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
    console.error('[educacao/transferencias] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /transferencias/:id
 * Busca um registro específico por ID
 */
router.get('/transferencias/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'TRANSFERENCIA_ESCOLAR') {
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
    console.error('[educacao/transferencias] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /transferencias
 * Cria um novo registro
 */
router.post('/transferencias', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'TRANSFERENCIA_ESCOLAR'
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
        title: req.body.title || service.name || 'Protocolo educacao/transferencias',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'TRANSFERENCIA_ESCOLAR',
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
    console.error('[educacao/transferencias] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /transferencias/:id
 * Atualiza um registro existente
 */
router.put('/transferencias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/transferencias] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /transferencias/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/transferencias/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/transferencias] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /transferencias/:id/approve
 * Aprova um protocolo
 */
router.post('/transferencias/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/transferencias] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /transferencias/:id/reject
 * Rejeita um protocolo
 */
router.post('/transferencias/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/transferencias] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /transferencias/:id/history
 * Histórico de mudanças de status
 */
router.get('/transferencias/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/transferencias] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: frequencia (CONSULTA_FREQUENCIA)
// ==========================================================================

/**
 * GET /frequencia
 * Lista todos os registros deste módulo
 */
router.get('/frequencia', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONSULTA_FREQUENCIA'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module frequencia'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CONSULTA_FREQUENCIA'
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
    console.error('[educacao/frequencia] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /frequencia/:id
 * Busca um registro específico por ID
 */
router.get('/frequencia/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CONSULTA_FREQUENCIA') {
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
    console.error('[educacao/frequencia] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /frequencia
 * Cria um novo registro
 */
router.post('/frequencia', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONSULTA_FREQUENCIA'
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
        title: req.body.title || service.name || 'Protocolo educacao/frequencia',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CONSULTA_FREQUENCIA',
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
    console.error('[educacao/frequencia] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /frequencia/:id
 * Atualiza um registro existente
 */
router.put('/frequencia/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/frequencia] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /frequencia/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/frequencia/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/frequencia] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /frequencia/:id/approve
 * Aprova um protocolo
 */
router.post('/frequencia/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/frequencia] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /frequencia/:id/reject
 * Rejeita um protocolo
 */
router.post('/frequencia/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/frequencia] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /frequencia/:id/history
 * Histórico de mudanças de status
 */
router.get('/frequencia/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/frequencia] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: notas (CONSULTA_NOTAS)
// ==========================================================================

/**
 * GET /notas
 * Lista todos os registros deste módulo
 */
router.get('/notas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONSULTA_NOTAS'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module notas'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'CONSULTA_NOTAS'
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
    console.error('[educacao/notas] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /notas/:id
 * Busca um registro específico por ID
 */
router.get('/notas/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'CONSULTA_NOTAS') {
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
    console.error('[educacao/notas] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /notas
 * Cria um novo registro
 */
router.post('/notas', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'CONSULTA_NOTAS'
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
        title: req.body.title || service.name || 'Protocolo educacao/notas',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'CONSULTA_NOTAS',
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
    console.error('[educacao/notas] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /notas/:id
 * Atualiza um registro existente
 */
router.put('/notas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/notas] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /notas/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/notas/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/notas] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /notas/:id/approve
 * Aprova um protocolo
 */
router.post('/notas/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/notas] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /notas/:id/reject
 * Rejeita um protocolo
 */
router.post('/notas/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/notas] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /notas/:id/history
 * Histórico de mudanças de status
 */
router.get('/notas/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/notas] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: gestao-escolar (GESTAO_ESCOLAR)
// ==========================================================================

/**
 * GET /gestao-escolar
 * Lista todos os registros deste módulo
 */
router.get('/gestao-escolar', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_ESCOLAR'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module gestao-escolar'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'GESTAO_ESCOLAR'
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
    console.error('[educacao/gestao-escolar] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /gestao-escolar/:id
 * Busca um registro específico por ID
 */
router.get('/gestao-escolar/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'GESTAO_ESCOLAR') {
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
    console.error('[educacao/gestao-escolar] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /gestao-escolar
 * Cria um novo registro
 */
router.post('/gestao-escolar', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_ESCOLAR'
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
        title: req.body.title || service.name || 'Protocolo educacao/gestao-escolar',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'GESTAO_ESCOLAR',
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
    console.error('[educacao/gestao-escolar] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /gestao-escolar/:id
 * Atualiza um registro existente
 */
router.put('/gestao-escolar/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/gestao-escolar] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /gestao-escolar/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/gestao-escolar/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/gestao-escolar] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-escolar/:id/approve
 * Aprova um protocolo
 */
router.post('/gestao-escolar/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/gestao-escolar] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /gestao-escolar/:id/reject
 * Rejeita um protocolo
 */
router.post('/gestao-escolar/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/gestao-escolar] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /gestao-escolar/:id/history
 * Histórico de mudanças de status
 */
router.get('/gestao-escolar/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/gestao-escolar] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: merenda (GESTAO_MERENDA)
// ==========================================================================

/**
 * GET /merenda
 * Lista todos os registros deste módulo
 */
router.get('/merenda', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_MERENDA'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found for module merenda'
      });
    }

    // 3. Construir filtros
    const where: any = {
      serviceId: service.id,
      moduleType: 'GESTAO_MERENDA'
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
    console.error('[educacao/merenda] Error listing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /merenda/:id
 * Busca um registro específico por ID
 */
router.get('/merenda/:id', requireMinRole(UserRole.USER), async (req, res) => {
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
    if (protocol.moduleType !== 'GESTAO_MERENDA') {
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
    console.error('[educacao/merenda] Error getting by ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /merenda
 * Cria um novo registro
 */
router.post('/merenda', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // 1. Buscar department
    const department = await prisma.department.findFirst({
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'GESTAO_MERENDA'
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
        title: req.body.title || service.name || 'Protocolo educacao/merenda',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'GESTAO_MERENDA',
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
    console.error('[educacao/merenda] Error creating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /merenda/:id
 * Atualiza um registro existente
 */
router.put('/merenda/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/merenda] Error updating:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /merenda/:id
 * Cancela um protocolo (soft delete via status)
 */
router.delete('/merenda/:id', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/merenda] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /merenda/:id/approve
 * Aprova um protocolo
 */
router.post('/merenda/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/merenda] Error approving:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /merenda/:id/reject
 * Rejeita um protocolo
 */
router.post('/merenda/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
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
    console.error('[educacao/merenda] Error rejecting:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /merenda/:id/history
 * Histórico de mudanças de status
 */
router.get('/merenda/:id/history', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const history = await protocolStatusEngine.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[educacao/merenda] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================================================
// MÓDULO: servicos (ATENDIMENTOS_EDUCACAO)
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
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_EDUCACAO'
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
      moduleType: 'ATENDIMENTOS_EDUCACAO'
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
    console.error('[educacao/servicos] Error listing:', error);
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
    if (protocol.moduleType !== 'ATENDIMENTOS_EDUCACAO') {
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
    console.error('[educacao/servicos] Error getting by ID:', error);
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
      where: { id: 'educacao' }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // 2. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_EDUCACAO'
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
        title: req.body.title || service.name || 'Protocolo educacao/servicos',
        description: req.body.description || service.description || undefined,
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: department.id,
        moduleType: 'ATENDIMENTOS_EDUCACAO',
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
    console.error('[educacao/servicos] Error creating:', error);
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
    console.error('[educacao/servicos] Error updating:', error);
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
    console.error('[educacao/servicos] Error deleting:', error);
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
    console.error('[educacao/servicos] Error approving:', error);
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
    console.error('[educacao/servicos] Error rejecting:', error);
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
    console.error('[educacao/servicos] Error getting history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// ============================================================================
// EXPORT
// ============================================================================

export default router;
