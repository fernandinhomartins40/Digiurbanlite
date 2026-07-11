import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { TenantService } from '../services/tenant.service';
import { runAsPlatform } from '../lib/tenant-context';
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

// GET /api/public/municipios — lista os municípios (tenants) ATIVOS para o
// seletor do portal do cidadão. Sem autenticação. Operação de plataforma
// (runAsPlatform) porque precisa ver todos os tenants, não só o do host.
router.get(
  '/municipios',
  handleAsync(async (req, res) => {
    const municipios = await runAsPlatform(async () =>
      prisma.tenant.findMany({
        // exclui o tenant genérico "default" (não é um município real selecionável)
        where: { status: 'ACTIVE', slug: { not: 'default' } },
        select: {
          id: true,
          slug: true,
          nome: true,
          nomeMunicipio: true,
          ufMunicipio: true,
          codigoIbge: true,
        },
        orderBy: [{ ufMunicipio: 'asc' }, { nomeMunicipio: 'asc' }],
      })
    );
    res.set('Cache-Control', 'public, max-age=300'); // catálogo muda raramente
    res.json({ success: true, municipios });
  })
);

// GET /api/public/tenant-config — configuração pública do tenant resolvido pelo
// HOST da requisição (Fase 7 Multi-Tenant: base do white-label runtime).
// Sem autenticação; consumido pelo frontend no primeiro paint (SSR/layout).
router.get(
  '/tenant-config',
  handleAsync(async (req, res) => {
    const tenant = (req as any).tenant || (await TenantService.getByHost(req.hostname));

    if (!tenant) {
      res.status(404).json({ success: false, error: 'Município não configurado' });
      return;
    }

    // Cache curto: branding muda raramente; chave de cache DEVE incluir o host
    // (CDN/proxy) — nunca compartilhar entre tenants.
    res.set('Cache-Control', 'public, max-age=60');
    res.set('Vary', 'Host');
    res.json({
      success: true,
      tenant: {
        slug: tenant.slug,
        nome: tenant.nome,
        nomeMunicipio: tenant.nomeMunicipio,
        ufMunicipio: tenant.ufMunicipio,
        codigoIbge: tenant.codigoIbge ?? null,
        status: tenant.status,
        branding: tenant.branding ?? null,
        features: tenant.features ?? null,
      },
    });
  })
);

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

// POST /api/public/leads — captação de lead (landing / demo / contato).
// Público e sem autenticação; alimenta o funil do painel super-admin.
router.post(
  '/leads',
  handleAsync(async (req, res) => {
    const { name, email, phone, company, position, source, message } = req.body || {};
    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
      return;
    }
    const { createLead } = await import('../services/platform-billing.service');
    const lead = await createLead({
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : undefined,
      company: company ? String(company) : undefined,
      position: position ? String(position) : undefined,
      source: source ? String(source) : 'CONTACT_FORM',
      message: message ? String(message) : undefined,
    });
    res.status(201).json({ success: true, leadId: lead.id });
  })
);

export default router;

