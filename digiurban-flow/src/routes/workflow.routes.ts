/**
 * Workflow template/instance routes.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as workflowService from '../services/workflow.service';

const router = Router();
router.use(authMiddleware);

const stepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  departmentId: z.string().optional(),
  organizationalUnitId: z.string().min(1),
  organizationalUnitName: z.string().min(1),
  slaHours: z.number().int().positive().optional(),
  documentRequired: z.string().optional(),
  order: z.number().int().min(0),
  actions: z.array(z.string().min(1)).min(1),
});

const transitionSchema = z.object({
  fromStepId: z.string().min(1),
  toStepId: z.string().min(1),
  condition: z.string().optional(),
  label: z.string().min(1),
});

const createTemplateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1),
  transitions: z.array(transitionSchema),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const advanceSchema = z.object({
  action: z.string().min(1),
  note: z.string().optional(),
});

router.post('/templates', async (req: Request, res: Response) => {
  try {
    const body = createTemplateSchema.parse(req.body);
    const template = await workflowService.createWorkflowTemplate(body);
    res.status(201).json(template);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await workflowService.listWorkflowTemplates();
    res.json(templates);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await workflowService.getWorkflowTemplate(req.params.id as string);
    res.json(template);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const body = updateTemplateSchema.parse(req.body);
    const template = await workflowService.updateWorkflowTemplate(req.params.id as string, body);
    res.json(template);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    await workflowService.deleteWorkflowTemplate(req.params.id as string);
    res.json({ message: 'Template desativado com sucesso' });
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/instances', async (req: Request, res: Response) => {
  try {
    const { processId, templateId } = req.body as { processId?: string; templateId?: string };
    if (!processId || !templateId) {
      res.status(400).json({ error: 'processId e templateId sao obrigatorios' });
      return;
    }

    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const instance = await workflowService.instantiateWorkflow(
      processId,
      templateId,
      auth.userId,
      auth.userName,
    );

    res.status(201).json(instance);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/instances/:id/advance', async (req: Request, res: Response) => {
  try {
    const body = advanceSchema.parse(req.body);
    const auth = toFlowAuthContext(req as AuthenticatedRequest);

    const instance = await workflowService.advanceWorkflow({
      instanceId: req.params.id as string,
      action: body.action,
      note: body.note,
      userId: auth.userId,
      userName: auth.userName,
    });

    res.json(instance);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
