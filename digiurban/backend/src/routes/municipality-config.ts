import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/municipality/config
 * Retorna a configuração do município
 */
router.get('/config', authenticateAdmin, async (_req, res) => {
  try {
    const config = await prisma.municipioConfig.findFirst();

    if (!config) {
      return res.status(404).json({
        error: 'Configuração do município não encontrada. Execute o seed do banco de dados.'
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração do município:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração do município' });
  }
});

/**
 * PUT /api/municipality/config
 * Atualiza a configuração do município
 */
router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    const {
      nome,
      cnpj,
      codigoIbge,
      nomeMunicipio,
      ufMunicipio,
      brasao,
      corPrimaria,
      configuracoes
    } = req.body;

    // Busca a configuração existente
    const existingConfig = await prisma.municipioConfig.findFirst();

    if (!existingConfig) {
      return res.status(404).json({
        error: 'Configuração do município não encontrada. Execute o seed do banco de dados.'
      });
    }

    // Atualiza a configuração
    const updatedConfig = await prisma.municipioConfig.update({
      where: { id: existingConfig.id },
      data: {
        ...(nome && { nome }),
        ...(cnpj && { cnpj }),
        ...(codigoIbge !== undefined && { codigoIbge }),
        ...(nomeMunicipio && { nomeMunicipio }),
        ...(ufMunicipio && { ufMunicipio }),
        ...(brasao !== undefined && { brasao }),
        ...(corPrimaria !== undefined && { corPrimaria }),
        ...(configuracoes !== undefined && { configuracoes }),
        updatedAt: new Date()
      }
    });

    res.json(updatedConfig);
  } catch (error) {
    console.error('Erro ao atualizar configuração do município:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração do município' });
  }
});

export default router;
