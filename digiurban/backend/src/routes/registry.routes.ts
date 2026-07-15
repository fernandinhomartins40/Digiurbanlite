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
import { generateDashboard } from '../services/registry/registry-dashboard.service';
import {
  createEntityType,
  updateEntityType,
  deleteEntityType,
  reindexEntityType,
  RegistryAdminError,
  type EntityTypeInput,
} from '../services/registry/registry-admin.service';

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

/**
 * GET /api/registry/entity-types/:code/dashboard
 * Dashboard automático (KPIs/charts/trends) derivado dos metadados. Aceita
 * ?dateFrom & ?dateTo (ISO). Genérico — vale para qualquer EntityType.
 */
router.get('/entity-types/:code/dashboard', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;
    const dashboard = await generateDashboard(req.params.code, { dateFrom, dateTo });
    return res.json(dashboard);
  } catch (error) {
    console.error('Erro em /registry/entity-types/:code/dashboard:', error);
    return res.status(500).json({ error: 'Erro ao gerar dashboard do tipo de entidade' });
  }
});

/**
 * GET /api/registry/records/:id/relations
 * Grafo de relações de um EntityRecord (F5): "todos os imóveis do cidadão",
 * "empresas de um sócio", etc. Retorna relações de saída e de entrada.
 */
router.get('/records/:id/relations', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const recordId = req.params.id;
    const [outgoing, incoming] = await Promise.all([
      prisma.entityRelation.findMany({
        where: { fromRecordId: recordId },
        select: {
          relType: true,
          metadata: true,
          toRecord: { select: { id: true, data: true, entityType: { select: { code: true, name: true } } } },
        },
      }),
      prisma.entityRelation.findMany({
        where: { toRecordId: recordId },
        select: {
          relType: true,
          metadata: true,
          fromRecord: { select: { id: true, data: true, entityType: { select: { code: true, name: true } } } },
        },
      }),
    ]);
    return res.json({ recordId, outgoing, incoming });
  } catch (error) {
    console.error('Erro em /registry/records/:id/relations:', error);
    return res.status(500).json({ error: 'Erro ao obter relações do registro' });
  }
});

// ============================================================================
// F6 — CRUD do editor no-code (define a estrutura de dados sem deploy).
// Exige ADMIN: cria/edita tipos e campos que dirigem busca/dashboard.
// ============================================================================

/** POST /api/registry/entity-types — cria um tipo (+ campos). */
router.post('/entity-types', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const created = await createEntityType(req.body as EntityTypeInput);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof RegistryAdminError) return res.status(error.status).json({ error: error.message });
    console.error('Erro ao criar EntityType:', error);
    return res.status(500).json({ error: 'Erro ao criar tipo de entidade' });
  }
});

/** PUT /api/registry/entity-types/:code — atualiza tipo e campos (dispara reindex se preciso). */
router.put('/entity-types/:code', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const updated = await updateEntityType(req.params.code, req.body as EntityTypeInput);
    return res.json(updated);
  } catch (error) {
    if (error instanceof RegistryAdminError) return res.status(error.status).json({ error: error.message });
    console.error('Erro ao atualizar EntityType:', error);
    return res.status(500).json({ error: 'Erro ao atualizar tipo de entidade' });
  }
});

/** DELETE /api/registry/entity-types/:code[?hard=true] — desativa (ou exclui se sem registros). */
router.delete('/entity-types/:code', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const hard = String(req.query.hard) === 'true';
    const result = await deleteEntityType(req.params.code, hard);
    return res.json(result);
  } catch (error) {
    if (error instanceof RegistryAdminError) return res.status(error.status).json({ error: error.message });
    console.error('Erro ao excluir EntityType:', error);
    return res.status(500).json({ error: 'Erro ao excluir tipo de entidade' });
  }
});

/** POST /api/registry/entity-types/:code/reindex — reprojeta índices dos registros. */
router.post('/entity-types/:code/reindex', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const entityType = await prisma.entityType.findFirst({ where: { code: req.params.code }, select: { id: true } });
    if (!entityType) return res.status(404).json({ error: `Tipo não encontrado: ${req.params.code}` });
    const result = await reindexEntityType(entityType.id);
    return res.json(result);
  } catch (error) {
    console.error('Erro ao reindexar EntityType:', error);
    return res.status(500).json({ error: 'Erro ao reindexar tipo de entidade' });
  }
});

export default router;
