/**
 * ============================================================================
 * AUXILIARY DATA ROUTES
 * ============================================================================
 * Rotas para acessar tabelas auxiliares e popular campos select-table
 */

import { Router } from 'express';
import { auxiliaryTablesService } from '../services/auxiliary-tables.service';

const router = Router();

// ========================================
// LISTAR TABELAS DISPONÍVEIS
// ========================================

/**
 * GET /api/auxiliary-data/tables
 * Lista todas as tabelas auxiliares disponíveis
 */
router.get('/tables', async (req, res) => {
  try {
    const tables = auxiliaryTablesService.listTables();

    return res.json({
      success: true,
      data: tables,
      count: tables.length,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] List tables error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar tabelas',
    });
  }
});

// ========================================
// METADADOS DE UMA TABELA
// ========================================

/**
 * GET /api/auxiliary-data/tables/:tableName/metadata
 * Obtém metadados de uma tabela específica
 */
router.get('/tables/:tableName/metadata', async (req, res) => {
  try {
    const { tableName } = req.params;

    const metadata = auxiliaryTablesService.getTableMetadata(tableName);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: `Tabela não encontrada: ${tableName}`,
      });
    }

    return res.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] Get metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar metadados',
    });
  }
});

// ========================================
// BUSCAR OPÇÕES DE UMA TABELA
// ========================================

/**
 * GET /api/auxiliary-data/:tableName
 * Busca opções de uma tabela auxiliar
 *
 * Query params:
 * - filters: JSON string com filtros (ex: {"tipo":"UBS","isActive":true})
 * - orderBy: campo para ordenação
 * - limit: limite de resultados (default: 100)
 * - offset: offset para paginação
 * - search: termo de busca
 * - searchFields: campos para buscar (separados por vírgula)
 */
router.get('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const {
      filters,
      orderBy,
      limit = '100',
      offset = '0',
      search,
      searchFields,
    } = req.query;

    // Verificar se tabela existe
    if (!auxiliaryTablesService.tableExists(tableName)) {
      return res.status(404).json({
        success: false,
        error: `Tabela não encontrada: ${tableName}`,
      });
    }

    // Se há busca, usar método search
    if (search) {
      const fields = searchFields
        ? (searchFields as string).split(',').map((f) => f.trim())
        : [];

      const options = await auxiliaryTablesService.search(
        tableName,
        search as string,
        fields,
        parseInt(limit as string)
      );

      return res.json({
        success: true,
        data: options,
        count: options.length,
      });
    }

    // Caso contrário, buscar com filtros
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Filtros inválidos (deve ser JSON)',
        });
      }
    }

    const options = await auxiliaryTablesService.getOptions({
      table: tableName,
      filters: parsedFilters,
      orderBy: orderBy as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      success: true,
      data: options,
      count: options.length,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] Get options error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar opções',
    });
  }
});

// ========================================
// BUSCAR UMA OPÇÃO ESPECÍFICA
// ========================================

/**
 * GET /api/auxiliary-data/:tableName/:id
 * Busca uma opção específica por ID
 */
router.get('/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;

    if (!auxiliaryTablesService.tableExists(tableName)) {
      return res.status(404).json({
        success: false,
        error: `Tabela não encontrada: ${tableName}`,
      });
    }

    const option = await auxiliaryTablesService.getOption(tableName, id);

    if (!option) {
      return res.status(404).json({
        success: false,
        error: `Registro não encontrado: ${id}`,
      });
    }

    return res.json({
      success: true,
      data: option,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] Get option error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar opção',
    });
  }
});

// ========================================
// VALIDAR VALOR
// ========================================

/**
 * POST /api/auxiliary-data/:tableName/validate
 * Valida se um ID existe na tabela
 *
 * Body: { id: string }
 */
router.post('/:tableName/validate', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID é obrigatório',
      });
    }

    if (!auxiliaryTablesService.tableExists(tableName)) {
      return res.status(404).json({
        success: false,
        error: `Tabela não encontrada: ${tableName}`,
      });
    }

    const isValid = await auxiliaryTablesService.validateValue(tableName, id);

    return res.json({
      success: true,
      valid: isValid,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] Validate error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao validar valor',
    });
  }
});

// ========================================
// CONTAR REGISTROS
// ========================================

/**
 * GET /api/auxiliary-data/:tableName/count
 * Conta registros em uma tabela
 *
 * Query params:
 * - filters: JSON string com filtros
 */
router.get('/:tableName/count', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { filters } = req.query;

    if (!auxiliaryTablesService.tableExists(tableName)) {
      return res.status(404).json({
        success: false,
        error: `Tabela não encontrada: ${tableName}`,
      });
    }

    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Filtros inválidos (deve ser JSON)',
        });
      }
    }

    const count = await auxiliaryTablesService.count(tableName, parsedFilters);

    return res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('[auxiliary-data] Count error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao contar registros',
    });
  }
});

export default router;
