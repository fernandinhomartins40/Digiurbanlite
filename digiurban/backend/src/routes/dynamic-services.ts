// ============================================================
// DYNAMIC SERVICES API - Sistema Híbrido (Runtime + Cache)
// ============================================================
// API para buscar definições de serviços dinamicamente com cache Redis
// Suporta WebSocket para atualizações em tempo real

import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { authenticateToken } from '../middleware/auth';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

// ============================================================
// REDIS CONFIGURATION
// ============================================================
let redis: Redis | null = null;

try {
  // Tenta conectar ao Redis (opcional - sistema funciona sem Redis)
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️  Redis não disponível - continuando sem cache');
        return null; // Para de tentar reconectar
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true
  });

  redis.connect().then(() => {
    console.log('✅ Redis conectado - cache habilitado');
  }).catch(() => {
    console.warn('⚠️  Redis não disponível - sistema funcionará sem cache');
    redis = null;
  });

  redis.on('error', (err) => {
    console.warn('⚠️  Redis error (não crítico):', err.message);
  });
} catch (error) {
  console.warn('⚠️  Redis não configurado - sistema funcionará sem cache');
  redis = null;
}

// ============================================================
// HELPER: Cache com fallback
// ============================================================
async function getCached(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    console.warn('⚠️  Erro ao ler cache:', error);
    return null;
  }
}

async function setCache(key: string, value: string, ttl: number = 86400): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, value);
  } catch (error) {
    console.warn('⚠️  Erro ao escrever cache:', error);
  }
}

async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('⚠️  Erro ao deletar cache:', error);
  }
}

// ============================================================
// HELPER: Convert slug to Department name
// ============================================================
function slugToDepartmentName(slug: string): string {
  const mapping: Record<string, string> = {
    // Secretarias originais
    'agricultura': 'Secretaria de Agricultura',
    'saude': 'Secretaria de Saúde',
    'educacao': 'Secretaria de Educação',
    'assistencia-social': 'Secretaria de Assistência Social',
    'cultura': 'Secretaria de Cultura',
    'esportes': 'Secretaria de Esportes',
    'habitacao': 'Secretaria de Habitação',
    'meio-ambiente': 'Secretaria de Meio Ambiente',
    'obras-publicas': 'Secretaria de Obras Públicas',
    'planejamento-urbano': 'Secretaria de Planejamento Urbano',
    'seguranca-publica': 'Secretaria de Segurança Pública',
    'servicos-publicos': 'Secretaria de Serviços Públicos',
    'turismo': 'Secretaria de Turismo',
    // Novas secretarias
    'administracao': 'Secretaria de Administração',
    'defesa-civil': 'Defesa Civil',
    'desenvolvimento-economico': 'Secretaria de Desenvolvimento Econômico',
    'financas': 'Secretaria de Fazenda',
    'mobilidade-urbana': 'Secretaria de Mobilidade Urbana',
    'politicas-mulheres': 'Secretaria de Políticas para Mulheres',
    'tecnologia-inovacao': 'Secretaria de Tecnologia e Inovação',
    'transportes-transito': 'Secretaria de Transportes e Trânsito'
  };
  return mapping[slug] || slug;
}

// ============================================================
// GET /api/services/:department/:module
// Retorna service com formSchema (com cache Redis)
// ============================================================
router.get('/services/:department/:module', authenticateToken, async (req: Request, res: Response) => {
  const { department, module } = req.params;
  const cacheKey = `service:${department}:${module}`;

  try {
    // 1️⃣ Tenta buscar do cache Redis
    const cached = await getCached(cacheKey);

    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        service: JSON.parse(cached),
        cached: true
      });
    }

    console.log(`❌ Cache MISS: ${cacheKey}`);

    // 2️⃣ Busca do PostgreSQL
    const departmentName = slugToDepartmentName(department);
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        department: { name: departmentName },
        moduleType: module
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado',
        department,
        module
      });
    }

    // 3️⃣ Armazena no cache (24h = 86400 segundos)
    const serviceJson = JSON.stringify(service);
    await setCache(cacheKey, serviceJson, 86400);
    console.log(`💾 Service armazenado no cache: ${cacheKey}`);

    return res.json({
      success: true,
      service,
      cached: false
    });

  } catch (error) {
    console.error('❌ Erro ao buscar service:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ============================================================
// GET /api/services/list
// Lista todos os serviços disponíveis (para navegação)
// ============================================================
router.get('/services/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const services = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { department: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return res.json({
      success: true,
      services,
      total: services.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar services:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================
// HELPER: Invalidar cache (usado internamente)
// ============================================================
export async function invalidateServiceCache(department: string, module: string): Promise<void> {
  const cacheKey = `service:${department}:${module}`;
  await deleteCache(cacheKey);
  console.log(`🗑️  Cache invalidado: ${cacheKey}`);
}

export default router;
