import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import facePlatformService from '../services/FacePlatformService';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  try {
    await Promise.all([
      prisma.faceRecognitionIdentity.count(),
      prisma.faceDevice.count(),
      prisma.faceZone.count(),
      prisma.faceRecognitionEvent.count(),
      prisma.schoolSecurityConfiguration.count(),
    ]);

    return res.json({
      available: true,
      schemaReady: true,
      service: 'ultrazend-face-server',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const missingSchema =
      error?.code === 'P2021' ||
      /relation .* does not exist/i.test(error?.message || '') ||
      /table .* does not exist/i.test(error?.message || '');

    return res.json({
      available: false,
      schemaReady: false,
      service: 'ultrazend-face-server',
      code: error?.code || null,
      message: missingSchema
        ? 'As tabelas do reconhecimento facial ainda não foram aplicadas no banco.'
        : 'O serviço facial está ativo, mas a base ainda não está pronta.',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = await facePlatformService.getDashboard();
    return res.json(data);
  } catch (error: any) {
    console.error('Erro ao carregar dashboard facial:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/schools', async (_req: Request, res: Response) => {
  try {
    const schools = await facePlatformService.listSchools();
    return res.json(schools);
  } catch (error: any) {
    console.error('Erro ao listar escolas para segurança escolar:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/schools/:schoolId/students', async (req: Request, res: Response) => {
  try {
    const data = await facePlatformService.listSchoolStudents(String(req.params.schoolId));
    return res.json(data);
  } catch (error: any) {
    console.error('Erro ao listar alunos da unidade escolar:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/devices', async (_req: Request, res: Response) => {
  try {
    const devices = await facePlatformService.listDevices();
    return res.json(devices);
  } catch (error: any) {
    console.error('Erro ao listar dispositivos faciais:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/devices', async (req: Request, res: Response) => {
  try {
    const device = await facePlatformService.createDevice(req.body);
    return res.status(201).json(device);
  } catch (error: any) {
    console.error('Erro ao criar dispositivo facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.put('/devices/:id', async (req: Request, res: Response) => {
  try {
    const device = await facePlatformService.updateDevice(String(req.params.id), req.body);
    return res.json(device);
  } catch (error: any) {
    console.error('Erro ao atualizar dispositivo facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.get('/zones', async (_req: Request, res: Response) => {
  try {
    const zones = await facePlatformService.listZones();
    return res.json(zones);
  } catch (error: any) {
    console.error('Erro ao listar zonas faciais:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/zones', async (req: Request, res: Response) => {
  try {
    const zone = await facePlatformService.createZone(req.body);
    return res.status(201).json(zone);
  } catch (error: any) {
    console.error('Erro ao criar zona facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.get('/configurations', async (_req: Request, res: Response) => {
  try {
    const configurations = await facePlatformService.listConfigurations();
    return res.json(configurations);
  } catch (error: any) {
    console.error('Erro ao listar configurações escolares:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.put('/configurations/:schoolId', async (req: Request, res: Response) => {
  try {
    const configuration = await facePlatformService.upsertSchoolConfiguration({
      ...req.body,
      unidadeEducacaoId: String(req.params.schoolId),
    });
    return res.json(configuration);
  } catch (error: any) {
    console.error('Erro ao salvar configuração escolar:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.get('/identities', async (_req: Request, res: Response) => {
  try {
    const identities = await facePlatformService.listIdentities();
    return res.json(identities);
  } catch (error: any) {
    console.error('Erro ao listar identidades faciais:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/identities/enrollments', async (req: any, res: Response) => {
  try {
    const identity = await facePlatformService.createEnrollment({
      ...req.body,
      approvedById: req.userId || null,
    });
    return res.status(201).json(identity);
  } catch (error: any) {
    console.error('Erro ao registrar enrollment facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await facePlatformService.listEvents({
      unidadeEducacaoId: req.query.unidadeEducacaoId as string | undefined,
      zoneId: req.query.zoneId as string | undefined,
      matchStatus: req.query.matchStatus as any,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return res.json(events);
  } catch (error: any) {
    console.error('Erro ao listar eventos faciais:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/events/ingest', async (req: Request, res: Response) => {
  try {
    const event = await facePlatformService.ingestRecognition(req.body);
    return res.status(201).json(event);
  } catch (error: any) {
    console.error('Erro ao ingerir evento facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.post('/events/:id/review', async (req: Request, res: Response) => {
  try {
    const event = await facePlatformService.reviewEvent(
      String(req.params.id),
      req.body.reviewedById,
      req.body.decision
    );
    return res.json(event);
  } catch (error: any) {
    console.error('Erro ao revisar evento facial:', error);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
