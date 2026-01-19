import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Configuração de upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, WEBP)'));
    }
  },
});

// POST /api/avatar/upload - Upload de avatar
router.post('/upload', citizenAuthMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const citizenId = req.citizen!.id;
    const originalPath = req.file.path;
    const processedFilename = `processed-${req.file.filename}`;
    const processedPath = path.join(req.file.destination, processedFilename);

    // Processar imagem com Sharp (redimensionar, otimizar)
    await sharp(originalPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Remover arquivo original
    fs.unlinkSync(originalPath);

    // Construir URL pública
    const avatarUrl = `/uploads/avatars/${processedFilename}`;

    // Buscar avatar anterior do cidadão
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { avatar: true },
    });

    // Se tinha avatar anterior, deletar arquivo antigo
    if (citizen?.avatar) {
      const oldFilename = citizen.avatar.split('/').pop();
      if (oldFilename) {
        const oldPath = path.join(__dirname, '../../uploads/avatars', oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Atualizar avatar do cidadão
    await prisma.citizen.update({
      where: { id: citizenId },
      data: { avatar: avatarUrl },
    });

    res.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error('Erro ao fazer upload de avatar:', error);

    // Se erro, tentar limpar arquivo
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Erro ao processar imagem' });
  }
});

// DELETE /api/avatar - Remover avatar
router.delete('/', citizenAuthMiddleware, async (req, res) => {
  try {
    const citizenId = req.citizen!.id;

    // Buscar avatar atual
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { avatar: true },
    });

    if (citizen?.avatar) {
      // Deletar arquivo físico
      const filename = citizen.avatar.split('/').pop();
      if (filename) {
        const filePath = path.join(__dirname, '../../uploads/avatars', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remover do banco
      await prisma.citizen.update({
        where: { id: citizenId },
        data: { avatar: null },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    res.status(500).json({ error: 'Erro ao remover avatar' });
  }
});

export default router;
