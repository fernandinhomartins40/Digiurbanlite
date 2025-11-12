import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Helper para rotas async
function handleAsync(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// ====================== ROTAS PÚBLICAS ======================
// Não requerem autenticação - acessíveis para cadastro de cidadãos

// DIA 3: DISABLED - JSON de municípios é LEGADO do sistema multi-tenant
// Este JSON era usado para criar tenants automaticamente
// Em single-tenant, não precisamos mais disso
const municipiosBrasil: any[] = [];
console.log('⚠️  JSON de municípios DESABILITADO - Single-tenant mode');

// Função para remover acentos e normalizar texto
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// GET /api/public/municipio-config - Retornar configuração do município (Single Tenant)
router.get(
  '/municipio-config',
  handleAsync(async (req, res) => {
    try {
      const config = await prisma.municipioConfig.findFirst();

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configuração do município não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        config: {
          nomeMunicipio: config.nomeMunicipio,
          ufMunicipio: config.ufMunicipio,
          codigoIbge: config.codigoIbge,
          brasao: config.brasao,
          corPrimaria: config.corPrimaria,
        }
      });
    } catch (error) {
      console.error('Erro ao buscar configuração do município:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar configuração do município'
      });
    }
  })
);

// GET /api/public/municipios-brasil - Listar todos os municípios brasileiros
router.get(
  '/municipios-brasil',
  handleAsync(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const uf = typeof req.query.uf === 'string' ? req.query.uf.toUpperCase() : '';

    let resultados = municipiosBrasil;

    // Filtrar por UF se fornecido
    if (uf) {
      resultados = resultados.filter(m => m.uf === uf);
    }

    // Busca inteligente por nome (sem acentos)
    if (search && search.length >= 2) {
      const searchNormalized = normalizeString(search);
      resultados = resultados.filter(m => {
        const nomeNormalized = normalizeString(m.nome);
        return nomeNormalized.includes(searchNormalized);
      });
    }

    // Ordenar por população (maiores primeiro) e limitar a 50
    resultados = resultados
      .sort((a, b) => (b.populacao || 0) - (a.populacao || 0))
      .slice(0, 50);

    // DIA 3: DISABLED - tenant model removed - mock
    const tenantsAtivos: any[] = []; // Mock - tenant não existe mais

    // Criar um mapa de código IBGE -> tenant
    const tenantMap = new Map<string, any>();
    tenantsAtivos.forEach(tenant => {
      if (tenant.codigoIbge) {
        tenantMap.set(tenant.codigoIbge, tenant);
      }
    });

    // Enriquecer resultados com informação de tenant existente
    const resultadosEnriquecidos = resultados.map(municipio => {
      const tenant = tenantMap.get(municipio.codigo_ibge);
      if (tenant) {
        // Tenant já existe - retornar com id do tenant
        return {
          ...municipio,
          id: tenant.id,
          domain: tenant.name?.toLowerCase().replace(/\s+/g, '-'),
          hasTenant: true
        };
      }
      // Tenant não existe - será criado automaticamente
      return {
        ...municipio,
        hasTenant: false
        };
    });

    res.json({
      success: true,
      data: {
        municipios: resultadosEnriquecidos,
        total: resultadosEnriquecidos.length
        }
        });
  })
);

// GET /api/public/municipios-disponiveis - Municípios com DigiUrban ativo
router.get(
  '/municipios-disponiveis',
  handleAsync(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : '';

    const whereClause: any = {
      status: { in: ['ACTIVE', 'TRIAL'] }
        };

    if (search && search.length >= 2) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // DIA 3: DISABLED - tenant model removed - mock
    const tenantsAtivos: any[] = []; // Mock - tenant não existe mais

    res.json({
      success: true,
      data: {
        municipios: tenantsAtivos,
        total: tenantsAtivos.length
        }
        });
  })
);

// GET /api/public/municipio/:id - Verificar se município está disponível
router.get(
  '/municipio/:id',
  handleAsync(async (req, res) => {
    const { id } = req.params;

    // DIA 3: DISABLED - tenant model removed - mock
    const municipio = null; // Mock - tenant não existe mais

    if (!municipio) {
      res.status(404).json({
        success: false,
        error: 'MUNICIPIO_NAO_ENCONTRADO',
        message: 'Município não encontrado ou não disponível'
        });
      return;
    }

    res.json({
      success: true,
      data: { municipio }
        });
  })
);

export default router;

