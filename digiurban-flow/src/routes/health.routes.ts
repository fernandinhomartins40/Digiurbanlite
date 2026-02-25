import { Router } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'digiurban-flow', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', service: 'digiurban-flow' });
  }
});

router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
