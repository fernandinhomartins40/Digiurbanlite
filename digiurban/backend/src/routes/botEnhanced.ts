import express from 'express';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import BotServiceEnhanced from '../services/bot/BotServiceEnhanced';
import ProactiveNotificationService from '../services/bot/ProactiveNotificationService';
import FlowManager from '../services/bot/FlowManager';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const botService = BotServiceEnhanced.getInstance();
const notificationService = ProactiveNotificationService.getInstance();
const flowManager = FlowManager.getInstance();

// Configuração de upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bot');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// POST /api/bot/message - Enviar mensagem ao bot
router.post('/message', citizenAuthMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const citizenId = req.citizen!.id;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    const response = await botService.processMessage(citizenId, message);

    console.log('📤 [botEnhanced route] Resposta sendo enviada:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Erro ao processar mensagem do bot:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});

// GET /api/bot/history - Obter histórico de conversas
router.get('/history', citizenAuthMiddleware, async (req, res) => {
  try {
    const citizenId = req.citizen!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const conversation = await prisma.botConversation.findFirst({
      where: { citizenId, isActive: true },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: limit,
        },
      },
    });

    const messages = conversation?.messages || [];

    res.json({ messages });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// POST /api/bot/upload - Upload de arquivo
router.post('/upload', citizenAuthMiddleware, upload.array('files', 3), async (req, res) => {
  try {
    const citizenId = req.citizen!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const uploadedFiles = await Promise.all(
      files.map(async file => {
        const botUpload = await prisma.botUpload.create({
          data: {
            citizenId,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileUrl: `/uploads/bot/${file.filename}`,
          },
        });

        return {
          id: botUpload.id,
          fileName: botUpload.fileName,
          fileSize: botUpload.fileSize,
          mimeType: botUpload.mimeType,
          fileUrl: botUpload.fileUrl,
        };
      })
    );

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// POST /api/bot/start-flow - Iniciar fluxo
router.post('/start-flow', citizenAuthMiddleware, async (req, res) => {
  try {
    const { flowName } = req.body;
    const citizenId = req.citizen!.id;

    const response = await flowManager.startFlow(citizenId, flowName);

    res.json(response);
  } catch (error) {
    console.error('Erro ao iniciar fluxo:', error);
    res.status(500).json({ error: 'Erro ao iniciar fluxo' });
  }
});

// POST /api/bot/cancel-flow - Cancelar fluxo
router.post('/cancel-flow', citizenAuthMiddleware, async (req, res) => {
  try {
    const citizenId = req.citizen!.id;

    await flowManager.cancelFlow(citizenId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar fluxo:', error);
    res.status(500).json({ error: 'Erro ao cancelar fluxo' });
  }
});

// GET /api/bot/notifications - Notificações proativas
router.get('/notifications', citizenAuthMiddleware, async (req, res) => {
  try {
    const citizenId = req.citizen!.id;

    const notifications = await notificationService.getUnreadNotifications(citizenId);

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// POST /api/bot/notifications/:id/read - Marcar como lida
router.post('/notifications/:id/read', citizenAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await notificationService.markAsRead(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

// POST /api/bot/rate - Avaliar atendimento
router.post('/rate', citizenAuthMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const citizenId = req.citizen!.id;

    const conversation = await prisma.botConversation.findFirst({
      where: { citizenId, isActive: true },
    });

    if (conversation) {
      await prisma.botConversation.update({
        where: { id: conversation.id },
        data: { rating, ratingComment: comment },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao avaliar:', error);
    res.status(500).json({ error: 'Erro ao avaliar' });
  }
});

// GET /api/bot/analytics - Analytics do bot (admin)
router.get('/analytics', citizenAuthMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.botAnalytics.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const totalConversations = await prisma.botConversation.count();
    const activeConversations = await prisma.botConversation.count({
      where: { isActive: true },
    });

    const avgRating = await prisma.botConversation.aggregate({
      _avg: { rating: true },
      where: { rating: { not: null } },
    });

    const stats = {
      totalConversations,
      activeConversations,
      avgRating: avgRating._avg.rating || 0,
      analytics,
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

export default router;
