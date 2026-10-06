/**
 * Etiquetas do cidadão — tela do servidor (Cidadãos › Etiquetas) e ficha.
 * Quem cria escolhe os serviços numa lista; nada de código técnico.
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requirePermission } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/express-helpers';
import type { AuthenticatedRequest } from '../types';
import { assignTag, removeTag, tagCodeFromName } from '../services/citizen-tags.service';

const router = Router();
router.use(adminAuthMiddleware);

const COLORS = ['blue', 'green', 'amber', 'red', 'purple', 'teal', 'pink', 'gray'];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

/** só serviços do próprio município (a extension escopa a consulta) */
async function validServiceIds(ids: unknown): Promise<string[]> {
  const list = Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && id).slice(0, 200) : [];
  if (list.length === 0) return [];
  const found = await prisma.serviceSimplified.findMany({ where: { id: { in: list as string[] } }, select: { id: true } });
  return found.map((service) => service.id);
}

async function uniqueCode(name: string, ignoreId?: string): Promise<string> {
  const base = tagCodeFromName(name);
  let code = base;
  for (let n = 2; n < 50; n++) {
    const taken = await prisma.citizenCategory.findFirst({ where: { code, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } });
    if (!taken) return code;
    code = `${base}_${n}`;
  }
  return `${base}_${Date.now()}`;
}

// GET /api/admin/citizen-tags — etiquetas do município, com quantos cidadãos têm cada uma
router.get(
  '/',
  requirePermission('citizens:read'),
  asyncHandler(async (_req, res: Response): Promise<void> => {
    const tags = await prisma.citizenCategory.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, description: true, color: true, active: true, triggerServiceIds: true, triggerServices: true },
    });
    const counts = await prisma.citizenCategoryAssignment.groupBy({
      by: ['categoryId'],
      where: { active: true },
      _count: { _all: true },
    });
    const countByTag = new Map(counts.map((item) => [item.categoryId, item._count._all]));

    const serviceIds = [...new Set(tags.flatMap((tag) => tag.triggerServiceIds))];
    const legacyCodes = [...new Set(tags.flatMap((tag) => tag.triggerServices))];
    const services = serviceIds.length || legacyCodes.length
      ? await prisma.serviceSimplified.findMany({
          where: { OR: [{ id: { in: serviceIds } }, { moduleType: { in: legacyCodes } }] },
          select: { id: true, name: true, moduleType: true },
        })
      : [];

    res.json({
      success: true,
      data: {
        tags: tags.map((tag) => {
          const linked = services.filter(
            (service) => tag.triggerServiceIds.includes(service.id) || (service.moduleType && tag.triggerServices.includes(service.moduleType))
          );
          return {
            id: tag.id,
            name: tag.name,
            description: tag.description,
            color: tag.color,
            active: tag.active,
            citizens: countByTag.get(tag.id) || 0,
            services: linked.map((service) => ({ id: service.id, name: service.name })),
          };
        }),
      },
    });
  })
);

// POST /api/admin/citizen-tags — criar etiqueta
router.post(
  '/',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const name = clean(req.body?.name, 60);
    if (name.length < 2) {
      res.status(400).json({ success: false, error: 'Dê um nome para a etiqueta.' });
      return;
    }
    const sameName = await prisma.citizenCategory.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (sameName) {
      res.status(400).json({ success: false, error: 'Já existe uma etiqueta com esse nome.' });
      return;
    }
    const tag = await prisma.citizenCategory.create({
      data: {
        name,
        code: await uniqueCode(name),
        description: clean(req.body?.description, 300) || null,
        color: COLORS.includes(req.body?.color) ? req.body.color : 'blue',
        department: 'GERAL',
        triggerServiceIds: await validServiceIds(req.body?.serviceIds),
      },
      select: { id: true, name: true },
    });
    res.status(201).json({ success: true, data: { tag } });
  })
);

// PUT /api/admin/citizen-tags/:id — alterar nome, cor, serviços ou desligar
router.put(
  '/:id',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const { id } = req.params;
    const tag = await prisma.citizenCategory.findFirst({ where: { id }, select: { id: true, name: true } });
    if (!tag) {
      res.status(404).json({ success: false, error: 'Etiqueta não encontrada' });
      return;
    }
    const data: Record<string, unknown> = {};
    if (req.body?.name !== undefined) {
      const name = clean(req.body.name, 60);
      if (name.length < 2) {
        res.status(400).json({ success: false, error: 'Dê um nome para a etiqueta.' });
        return;
      }
      const sameName = await prisma.citizenCategory.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } },
        select: { id: true },
      });
      if (sameName) {
        res.status(400).json({ success: false, error: 'Já existe uma etiqueta com esse nome.' });
        return;
      }
      data.name = name;
    }
    if (req.body?.description !== undefined) data.description = clean(req.body.description, 300) || null;
    if (COLORS.includes(req.body?.color)) data.color = req.body.color;
    if (typeof req.body?.active === 'boolean') data.active = req.body.active;
    if (req.body?.serviceIds !== undefined) {
      data.triggerServiceIds = await validServiceIds(req.body.serviceIds);
      // a escolha da tela passa a valer sozinha (sai o gatilho antigo por código técnico)
      data.triggerServices = [];
    }
    await prisma.citizenCategory.update({ where: { id }, data });
    res.json({ success: true });
  })
);

// DELETE /api/admin/citizen-tags/:id — apaga se ninguém tem; senão só desliga
router.delete(
  '/:id',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const { id } = req.params;
    const tag = await prisma.citizenCategory.findFirst({ where: { id }, select: { id: true } });
    if (!tag) {
      res.status(404).json({ success: false, error: 'Etiqueta não encontrada' });
      return;
    }
    const used = await prisma.citizenCategoryAssignment.count({ where: { categoryId: id } });
    if (used > 0) {
      await prisma.citizenCategory.update({ where: { id }, data: { active: false } });
      res.json({ success: true, message: 'A etiqueta foi desligada (há cidadãos com ela no histórico).' });
      return;
    }
    await prisma.citizenCategory.delete({ where: { id } });
    res.json({ success: true, message: 'Etiqueta apagada.' });
  })
);

// GET /api/admin/citizen-tags/citizen/:citizenId — etiquetas de um cidadão
router.get(
  '/citizen/:citizenId',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const assignments = await prisma.citizenCategoryAssignment.findMany({
      where: { citizenId: req.params.citizenId, active: true },
      orderBy: { assignedAt: 'desc' },
      select: {
        assignedAt: true,
        assignedBy: true,
        category: { select: { id: true, name: true, color: true } },
        protocol: { select: { id: true, number: true } },
      },
    });
    res.json({
      success: true,
      data: {
        tags: assignments.map((item) => ({
          id: item.category.id,
          name: item.category.name,
          color: item.category.color,
          since: item.assignedAt,
          source: item.assignedBy ? 'MANUAL' : 'AUTO',
          protocol: item.protocol,
        })),
      },
    });
  })
);

// POST /api/admin/citizen-tags/citizen/:citizenId — colocar etiqueta à mão
router.post(
  '/citizen/:citizenId',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { citizenId } = req.params;
    const tagId = clean(req.body?.tagId, 40);
    const [citizen, tag] = await Promise.all([
      prisma.citizen.findFirst({ where: { id: citizenId }, select: { id: true } }),
      prisma.citizenCategory.findFirst({ where: { id: tagId, active: true }, select: { id: true } }),
    ]);
    if (!citizen || !tag) {
      res.status(404).json({ success: false, error: 'Cidadão ou etiqueta não encontrado' });
      return;
    }
    await assignTag({ citizenId, categoryId: tag.id, assignedBy: authReq.user.id, source: 'MANUAL' });
    res.status(201).json({ success: true });
  })
);

// DELETE /api/admin/citizen-tags/citizen/:citizenId/:tagId — tirar etiqueta
router.delete(
  '/citizen/:citizenId/:tagId',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const removed = await removeTag(req.params.citizenId, req.params.tagId, authReq.user.id, clean(req.body?.reason, 300));
    if (!removed) {
      res.status(404).json({ success: false, error: 'O cidadão não tem essa etiqueta' });
      return;
    }
    res.json({ success: true });
  })
);

export default router;
