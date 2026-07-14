/**
 * ============================================================================
 * REGISTRY F2 — Rotas do motor de dados orientado a metadados
 * ============================================================================
 * Endpoints genéricos, dirigidos por metadados. Nesta fase são somente-leitura
 * (consulta e schema); a escrita/materialização entra na F5.
 *
 *   POST /api/registry/query                     — busca genérica (filtros/facets)
 *   GET  /api/registry/entity-types              — lista tipos do tenant
 *   GET  /api/registry/entity-types/:code/schema — metadados dos campos
 *
 * Auth admin (cookie digiurban_admin_token). A tenant extension escopa tudo.
 * ============================================================================
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import {
  runRegistryQuery,
  RegistryQueryError,
  type RegistryQueryInput,
} from '../services/registry/registry-query.service';

const router = Router();

router.use(adminAuthMiddleware);

/**
 * POST /api/registry/query
 * Body: RegistryQueryInput { entityType, filters?, search?, facets?, sort?, page?, pageSize? }
 */
router.post('/query', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const input = req.body as RegistryQueryInput;
    const result = await runRegistryQuery(input);
    return res.json(result);
  } catch (error) {
    if (error instanceof RegistryQueryError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Erro em /registry/query:', error);
    return res.status(500).json({ error: 'Erro ao executar consulta do Registry' });
  }
});

/**
 * GET /api/registry/entity-types
 * Lista os tipos de entidade do tenant (para menus/dashboards genéricos).
 */
router.get('/entity-types', requireMinRole(UserRole.USER), async (_req, res) => {
  try {
    const types = await prisma.entityType.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
        kind: true,
        department: true,
        icon: true,
        color: true,
        _count: { select: { records: true, fields: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ entityTypes: types });
  } catch (error) {
    console.error('Erro em /registry/entity-types:', error);
    return res.status(500).json({ error: 'Erro ao listar tipos de entidade' });
  }
});

/**
 * GET /api/registry/entity-types/:code/schema
 * Retorna os FieldDefinitions do tipo — a UI usa para montar filtros/colunas.
 */
router.get('/entity-types/:code/schema', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const entityType = await prisma.entityType.findFirst({
      where: { code: req.params.code },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!entityType) {
      return res.status(404).json({ error: `EntityType não encontrado: ${req.params.code}` });
    }
    return res.json({
      code: entityType.code,
      name: entityType.name,
      kind: entityType.kind,
      fields: entityType.fields.map((f) => ({
        key: f.key,
        label: f.label,
        dataType: f.dataType,
        required: f.required,
        indexable: f.indexable,
        filterable: f.filterable,
        facetable: f.facetable,
        searchable: f.searchable,
        isMetric: f.isMetric,
        aggregation: f.aggregation,
        isPII: f.isPII,
        displayInTable: f.displayInTable,
        displayInCard: f.displayInCard,
        order: f.order,
      })),
    });
  } catch (error) {
    console.error('Erro em /registry/entity-types/:code/schema:', error);
    return res.status(500).json({ error: 'Erro ao obter schema do tipo de entidade' });
  }
});

export default router;
