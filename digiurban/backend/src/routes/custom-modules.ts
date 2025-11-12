/**
 * ============================================================================
 * CUSTOM MODULES API - Sistema de Módulos Customizados
 * ============================================================================
 *
 * CRUD completo para módulos customizados dinâmicos.
 * Permite que municípios criem tabelas e fluxos personalizados.
 *
 * @author DigiUrban Team
 * @version 1.0
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

// =============================================================================
// CRUD DE TABELAS CUSTOMIZADAS
// =============================================================================

/**
 * GET /api/admin/custom-modules/tables
 * Listar todas as tabelas customizadas do tenant
 */
router.get('/tables', async (req, res) => {
  try {
    const { moduleType, search, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (moduleType) {
      where.moduleType = moduleType;
    }

    if (search) {
      where.OR = [
        { tableName: { contains: search as string } },
        { displayName: { contains: search as string } },
      ];
    }

    const [tables, total] = await Promise.all([
      prisma.customDataTable.findMany({
        where,
        include: {
          _count: {
            select: { records: true }
      }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
        }),
      prisma.customDataTable.count({ where }),
    ]);

    return res.json({
      tables,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
        }
        });
  } catch (error) {
    console.error('Erro ao listar tabelas customizadas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/custom-modules/tables/:id
 * Buscar detalhes de uma tabela customizada
 */
router.get('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const table = await prisma.customDataTable.findFirst({
      where: {
        id
        },
      include: {
        _count: {
          select: { records: true }
      }
        }
        });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    return res.json({ table });
  } catch (error) {
    console.error('Erro ao buscar tabela:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/admin/custom-modules/tables
 * Criar nova tabela customizada
 */
router.post('/tables', async (req, res) => {
  try {
    const { tableName, displayName, moduleType, schema } = req.body;

    // Validações
    if (!tableName || !displayName || !moduleType || !schema) {
      return res.status(400).json({
        error: 'Campos obrigatórios: tableName, displayName, moduleType, schema'
        });
    }

    // Validar formato do tableName (apenas alfanumérico e underscore)
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      return res.status(400).json({
        error: 'tableName deve conter apenas letras minúsculas, números e underscore'
        });
    }

    // Validar schema
    if (!schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
      return res.status(400).json({
        error: 'Schema deve conter array "fields" com pelo menos 1 campo'
        });
    }

    // Verificar se já existe
    const existing = await prisma.customDataTable.findFirst({
      where: {
        tableName
        }
        });

    if (existing) {
      return res.status(400).json({
        error: `Tabela "${tableName}" já existe`
        });
    }

    // Criar tabela
    const table = await prisma.customDataTable.create({
      data: {
        tableName,
        displayName,
        moduleType,
        schema,
        fields: schema, // Campo obrigatório - definição dos campos da tabela
      }
        });

    return res.status(201).json({
      success: true,
      message: `Tabela "${displayName}" criada com sucesso!`,
      table
        });
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/admin/custom-modules/tables/:id
 * Atualizar tabela customizada
 */
router.put('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, schema } = req.body;

    const table = await prisma.customDataTable.findFirst({
      where: {
        id
        }
        });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const updated = await prisma.customDataTable.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(schema && { schema })
        }
        });

    return res.json({
      success: true,
      message: 'Tabela atualizada com sucesso!',
      table: updated
        });
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/admin/custom-modules/tables/:id
 * Deletar tabela customizada
 */
router.delete('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const table = await prisma.customDataTable.findFirst({
      where: {
        id
        },
      include: {
        _count: {
          select: { records: true }
      }
        }
        });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    // Verificar se há registros
    if (table._count.records > 0) {
      return res.status(400).json({
        error: `Não é possível deletar tabela com ${table._count.records} registro(s). Delete os registros primeiro.`
        });
    }

    await prisma.customDataTable.delete({
      where: { id }
        });

    return res.json({
      success: true,
      message: 'Tabela deletada com sucesso!'
        });
  } catch (error) {
    console.error('Erro ao deletar tabela:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// CRUD DE REGISTROS
// =============================================================================

/**
 * GET /api/admin/custom-modules/tables/:tableId/records
 * Listar registros de uma tabela customizada
 */
router.get('/tables/:tableId/records', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { page = 1, limit = 20, search, protocol, serviceId } = req.query;

    // Verificar se tabela pertence ao tenant
    const table = await prisma.customDataTable.findFirst({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tableId
        };

    if (protocol) {
      where.protocol = protocol;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    // TODO: Implementar busca nos dados JSON (search)

    const [records, total] = await Promise.all([
      prisma.customDataRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
        }),
      prisma.customDataRecord.count({ where }),
    ]);

    return res.json({
      records,
      table: {
        id: table.id,
        displayName: table.displayName,
        schema: table.schema
        },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
        }
        });
  } catch (error) {
    console.error('Erro ao listar registros:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/custom-modules/tables/:tableId/records/:recordId
 * Buscar um registro específico
 */
router.get('/tables/:tableId/records/:recordId', async (req, res) => {
  try {
    const { tableId, recordId } = req.params;

    // Verificar se tabela pertence ao tenant
    const table = await prisma.customDataTable.findFirst({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const record = await prisma.customDataRecord.findFirst({
      where: {
        id: recordId,
        tableId
        }
        });

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    return res.json({
      record,
      table: {
        id: table.id,
        displayName: table.displayName,
        schema: table.schema
        }
        });
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/admin/custom-modules/tables/:tableId/records
 * Criar novo registro em tabela customizada
 */
router.post('/tables/:tableId/records', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { data, protocol, serviceId } = req.body;

    // Verificar se tabela pertence ao tenant
    const table = await prisma.customDataTable.findFirst({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Campo "data" é obrigatório' });
    }

    // Validar campos obrigatórios baseado no schema
    const schema = table.schema as any;
    if (schema.fields) {
      for (const field of schema.fields) {
        if (field.required && !data[field.id]) {
          return res.status(400).json({
            error: `Campo "${field.label || field.id}" é obrigatório`
        });
        }
      }
    }

    const record = await prisma.customDataRecord.create({
      data: {
        tableId,
        protocol,
        serviceId,
        data
        }
        });

    return res.status(201).json({
      success: true,
      message: 'Registro criado com sucesso!',
      record
        });
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/admin/custom-modules/tables/:tableId/records/:recordId
 * Atualizar registro
 */
router.put('/tables/:tableId/records/:recordId', async (req, res) => {
  try {
    const { tableId, recordId } = req.params;
    const { data } = req.body;

    // Verificar se tabela pertence ao tenant
    const table = await prisma.customDataTable.findFirst({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const record = await prisma.customDataRecord.findFirst({
      where: {
        id: recordId,
        tableId
        }
        });

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const updated = await prisma.customDataRecord.update({
      where: { id: recordId },
      data: { data }
        });

    return res.json({
      success: true,
      message: 'Registro atualizado com sucesso!',
      record: updated
        });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/admin/custom-modules/tables/:tableId/records/:recordId
 * Deletar registro
 */
router.delete('/tables/:tableId/records/:recordId', async (req, res) => {
  try {
    const { tableId, recordId } = req.params;

    // Verificar se tabela pertence ao tenant
    const table = await prisma.customDataTable.findFirst({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const record = await prisma.customDataRecord.findFirst({
      where: {
        id: recordId,
        tableId
        }
        });

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    await prisma.customDataRecord.delete({
      where: { id: recordId }
        });

    return res.json({
      success: true,
      message: 'Registro deletado com sucesso!'
        });
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// ESTATÍSTICAS
// =============================================================================

/**
 * GET /api/admin/custom-modules/stats
 * Estatísticas de módulos customizados
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalTables, totalRecords, tablesByModule] = await Promise.all([
      prisma.customDataTable.count(),
      prisma.customDataRecord.count(),
      prisma.customDataTable.groupBy({
        by: ['moduleType'],
        _count: { id: true }
        }),
    ]);

    return res.json({
      stats: {
        totalTables,
        totalRecords,
        byModule: tablesByModule.map((item) => ({
          moduleType: item.moduleType,
          count: item._count?.id || 0
        }))
        }
        });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
