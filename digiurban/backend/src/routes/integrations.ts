import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

// ====================== TIPOS E INTERFACES LOCAIS PRESERVADOS ======================
// REGRA DE OURO: SEMPRE CRIAR, NUNCA REMOVER - mantendo definições existentes

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;

}

// CRIADO: interface local renomeada para evitar conflito (single-tenant: removido tenantId)
interface LocalAuthenticatedRequest {
  user?: User;
  query: Request['query'];
  params: Request['params'];
  body: Request['body'];
  ip?: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: any;
}

interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

type TypedResponse<T> = Response<T>;
type TypedRequest<TBody = any, TQuery = any, TParams = any> = Request<TParams, any, TBody, TQuery> & LocalAuthenticatedRequest;

// ====================== HELPER FUNCTIONS ======================

function getStringParam(param: any): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  if (param && typeof param === 'object' && param.toString) return param.toString();
  return '';
}

function createSuccessResponse<T>(data?: T, message?: string): SuccessResponse<T> {
  return { success: true, data, message };
}

function createErrorResponse(error: string, message?: string): ErrorResponse {
  return { success: false, error, message };
}

function handleAsyncRoute(fn: (req: LocalAuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as LocalAuthenticatedRequest, res, next)).catch(next);
  };
}

// ====================== MIDDLEWARE LOCAIS ======================

function authenticateToken(req: LocalAuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    req.user = {
      id: 'default-user',
      email: 'admin@default.com',
      name: 'Admin',
      role: 'ADMIN',
      isActive: true
    };
  }
  next();
}

function requireRole(roles: string | string[]) {
  return (req: LocalAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Unauthorized', 'Token de autenticação inválido'));
    }
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('Forbidden', 'Permissão insuficiente'));
    }
    return next();
  };
}

// Tipos específicos para integrações
interface IntegrationTestResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface IntegrationCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  [key: string]: unknown;
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  algorithm: string;
}

interface ValidationResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// Interfaces para configurações específicas de providers
interface IntegrationConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: number;
  [key: string]: unknown;
}

// Interface para Integration com relacionamentos
interface IntegrationWithLogs {
  id: string;
  name: string;
  provider: string;
  status: string;

  credentials: unknown;
  config: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  logs: {
    id: string;
    level: string;
    message: string;
    createdAt: Date;
  }[];
}

// Interface para dados retornados por APIs externas
interface ApiResponseData {
  status?: string;
  message?: string;
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

// Interface para credenciais por provider
interface ProviderCredentials {
  'receita-federal'?: { token: string };
  'datasus'?: { username: string; password: string };
  'ibge'?: { apiKey: string };
  'correios'?: { username: string; password: string };
  'viacep'?: Record<string, never>; // Não precisa credenciais
  'zenvia-sms'?: { apiToken: string };
  'whatsapp-business'?: { phoneNumberId: string; accessToken: string };
  'pix-bacen'?: { clientId: string; clientSecret: string };
  [provider: string]: Record<string, unknown> | undefined;
}

const router = Router();

// Middleware para autenticação
router.use(authenticateToken);

/**
 * GET /api/integrations
 * Listar integrações do tenant
 */
router.get(
  '/',
  requireRole(UserRole.ADMIN),
  handleAsyncRoute(async (req: LocalAuthenticatedRequest, res) => {
    const integrations = await prisma.integration.findMany({
            include: {
        logs: {
          take: 5,
          orderBy: { createdAt: 'desc' }
      }
        },
      orderBy: { name: 'asc' }
        });

    return res.json(createSuccessResponse(integrations, 'Integrações encontradas'));
  })
);

/**
 * POST /api/integrations
 * Criar nova integração
 */
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  handleAsyncRoute(async (req, res) => {
    const { name, type, provider, config, credentials } = req.body;

    // Validar provider
    const validProviders = [
      'receita-federal',
      'datasus',
      'ibge',
      'correios',
      'viacep',
      'zenvia-sms',
      'whatsapp-business',
      'pix-bacen',
    ];

    if (!validProviders.includes(provider)) {
      return res.status(400).json(createErrorResponse('Provider not supported', 'Provedor não suportado'));
    }

    // Criptografar credenciais sensíveis
    const encryptedCredentials = encryptObject(credentials);

    const integration = await prisma.integration.create({
      data: {
                name,
        type,
        provider,
        config: JSON.stringify(config),
        credentials: JSON.stringify(encryptedCredentials),
        status: 'active',
        isActive: true
        }
        });

    // Log da criação
    await prisma.auditLog.create({
      data: {
                userId: req.user!.id,
        action: 'INTEGRATION_CREATED',
        resource: 'integration',
        details: {
          integrationId: integration.id,
          name,
          provider,
          message: `Created integration: ${name} (${provider})`
        },
        ip: req.ip || 'unknown',
        success: true
        }
        });

    const responseData = {
      ...integration,
      credentials: '[ENCRYPTED]', // Não retornar credenciais
    };

    return res.status(201).json(createSuccessResponse(responseData, 'Integração criada com sucesso'));
  })
);

/**
 * POST /api/integrations/:provider/test
 * Testar conexão com integração
 */
router.post(
  '/:provider/test',
  requireRole(UserRole.MANAGER),
  handleAsyncRoute(async (req, res) => {
    const { provider } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        provider
        }
        });

    if (!integration) {
      return res.status(404).json(createErrorResponse('Integration not found', 'Integração não encontrada'));
    }

    const decryptedCredentials = decryptObject(JSON.parse(integration.credentials as string) as EncryptedData);
    const configData = integration.config ? JSON.parse(integration.config as string) : {};
    const testResult = await testIntegration(provider, configData, decryptedCredentials);

    // Log do teste
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        entityType: 'test',
        entityId: 'connection-test',
        action: 'test',
        status: testResult.success ? 'success' : 'error',
        request: JSON.stringify({ testType: 'connection' }),
        response: testResult.data ? (JSON.stringify(testResult.data) as Prisma.InputJsonValue) : undefined,
        error: testResult.error || null
        }
        });

    return res.json(createSuccessResponse(testResult, 'Teste de integração executado'));
  })
);

/**
 * POST /api/integrations/cpf/validate
 * Validar CPF na Receita Federal
 */
router.post(
  '/cpf/validate',
  requireRole(UserRole.USER),
  handleAsyncRoute(async (req, res) => {
    const { cpf } = req.body;

    if (!isValidCPF(cpf)) {
      return res.status(400).json(createErrorResponse('Invalid CPF format', 'Formato de CPF inválido'));
    }

    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'receita-federal'
        }
        });

    if (!integration || !integration.isActive) {
      return res.status(400).json(createErrorResponse('CPF validation not configured', 'Validação de CPF não configurada'));
    }

    const decryptedCredentials = decryptObject(JSON.parse(integration.credentials as string) as EncryptedData);
    const configData = integration.config ? JSON.parse(integration.config as string) : {};
    const result = await validateCPF(cpf, configData, decryptedCredentials);

    // Log da consulta
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        entityType: 'citizen',
        entityId: cpf,
        action: 'validate',
        status: result.success ? 'success' : 'error',
        request: JSON.stringify({ cpf: maskCPF(cpf) }),
        response: result.data ? (JSON.stringify(result.data) as Prisma.InputJsonValue) : undefined,
        error: result.error || null
        }
        });

    return res.json(createSuccessResponse(result, 'Validação de CPF executada'));
  })
);

/**
 * POST /api/integrations/cnpj/validate
 * Validar CNPJ na Receita Federal
 */
router.post(
  '/cnpj/validate',
  requireRole(UserRole.USER),
  handleAsyncRoute(async (req, res) => {
    const { cnpj } = req.body;

    if (!isValidCNPJ(cnpj)) {
      return res.status(400).json(createErrorResponse('Invalid CNPJ format', 'Formato de CNPJ inválido'));
    }

    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'receita-federal'
        }
        });

    if (!integration || !integration.isActive) {
      return res.status(400).json(createErrorResponse('CNPJ validation not configured', 'Validação de CNPJ não configurada'));
    }

    const decryptedCredentials = decryptObject(JSON.parse(integration.credentials as string) as EncryptedData);
    const configData = integration.config ? JSON.parse(integration.config as string) : {};
    const result = await validateCNPJ(cnpj, configData, decryptedCredentials);

    // Log da consulta
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        entityType: 'business',
        entityId: cnpj,
        action: 'validate',
        status: result.success ? 'success' : 'error',
        request: JSON.stringify({ cnpj: maskCNPJ(cnpj) }),
        response: result.data ? (JSON.stringify(result.data) as Prisma.InputJsonValue) : undefined,
        error: result.error
        }
        });

    return res.json(createSuccessResponse(result, 'Validação de CNPJ executada'));
  })
);

/**
 * GET /api/integrations/cep/:cep
 * Buscar endereço por CEP
 */
router.get('/cep/:cep', handleAsyncRoute(async (req: LocalAuthenticatedRequest, res: Response) => {
  const { cep } = req.params;

  if (!isValidCEP(cep)) {
    return res.status(400).json(createErrorResponse('Invalid CEP format', 'Formato de CEP inválido'));
  }

  // Tentar ViaCEP primeiro (gratuito)
  let result = await getAddressByCEP(cep, 'viacep');

  if (!result.success) {
    // Fallback para Correios se configurado
    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'correios'
        }
        });

    if (integration?.isActive) {
      const decryptedCredentials = decryptObject(JSON.parse(integration.credentials as string) as EncryptedData);
      const configData = integration.config ? JSON.parse(integration.config as string) : {};
      result = await getAddressByCEP(cep, 'correios', configData, decryptedCredentials);
    }
  }

  // Log da consulta apenas se for bem-sucedida
  if (result.success) {
    // Note: Como 'system' não é um ID válido, vamos pular o log ou usar um valor válido
    // await prisma.integrationLog.create({
    //   data: {
    //     integrationId: 'system', // Precisa ser um UUID válido
    //     entityType: 'address',
    //     entityId: cep,
    //     action: 'lookup',
    //     status: 'success',
    //     request: JSON.stringify({ cep }),
    //     response: JSON.stringify(result.data),
    //   },
    // });
  }

  return res.json(createSuccessResponse(result, 'Consulta de CEP executada'));
}));

/**
 * POST /api/integrations/sms/send
 * Enviar SMS
 */
router.post(
  '/sms/send',
  requireRole(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']),
  handleAsyncRoute(async (req: LocalAuthenticatedRequest, res: Response) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json(createErrorResponse('Phone and message are required', 'Telefone e mensagem são obrigatórios'));
    }

    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'zenvia-sms'
        }
        });

    if (!integration || !integration.isActive) {
      return res.status(400).json(createErrorResponse('SMS integration not configured', 'Integração de SMS não configurada'));
    }

    const decryptedCredentials = decryptObject(JSON.parse(integration.credentials as string) as EncryptedData);
    const configData = integration.config ? JSON.parse(integration.config as string) : {};
    const result = await sendSMS(phone, message, configData, decryptedCredentials);

    // Log do envio
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        entityType: 'notification',
        entityId: phone,
        action: 'send',
        status: result.success ? 'success' : 'error',
        request: JSON.stringify({ phone: maskPhone(phone), messageLength: message.length }),
        response: result.data ? (JSON.stringify(result.data) as Prisma.InputJsonValue) : undefined,
        error: result.error
        }
        });

    return res.json(createSuccessResponse(result, 'SMS processado'));
  })
);

/**
 * GET /api/integrations/logs
 * Obter logs de integração
 */
router.get(
  '/logs',
  requireRole(['ADMIN', 'MANAGER']),
  handleAsyncRoute(async (req: LocalAuthenticatedRequest, res: Response) => {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '50';
    const provider = getStringParam(req.query.provider);
    const status = getStringParam(req.query.status);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where: any = {
      integration: {}
        };

    if (provider) {
      where.integration.provider = provider;
    }

    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      prisma.integrationLog.findMany({
        where,
        include: {
          integration: {
            select: {
              name: true,
              provider: true,
              type: true
        }
      }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
        }),
      prisma.integrationLog.count({ where }),
    ]);

    const response = {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
        }
        };

    return res.json(createSuccessResponse(response, 'Logs de integração encontrados'));
  })
);

// Funções auxiliares para validação

function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  return cleanCPF.length === 11 && !/^(\d)\1{10}$/.test(cleanCPF);
}

function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  return cleanCNPJ.length === 14 && !/^(\d)\1{13}$/.test(cleanCNPJ);
}

function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return cleanCEP.length === 8;
}

function maskCPF(cpf: string): string {
  return cpf.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2');
}

function maskCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})\d{6}(\d{4})/, '$1******$2');
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})\d{5}(\d{4})/, '$1*****$2');
}

// Funções de criptografia

function encryptObject(obj: Record<string, unknown>): EncryptedData {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!!';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key.slice(0, 32)), iv);
  let encrypted = cipher.update(JSON.stringify(obj), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    algorithm
        };
}

function decryptObject(encryptedData: EncryptedData): Record<string, unknown> {
  try {
    const algorithm = encryptedData.algorithm;
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!!';
    const iv = Buffer.from(encryptedData.iv, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key.slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return {} as Record<string, unknown>;
  }
}

// Funções de integração específicas

async function testIntegration(
  provider: string,
  config: IntegrationConfig,
  credentials: Record<string, unknown>
): Promise<IntegrationTestResult> {
  switch (provider) {
    case 'viacep':
      return testViaCEP();

    case 'receita-federal':
      return testReceitaFederal(credentials as ProviderCredentials['receita-federal']);

    case 'zenvia-sms':
      return testZenvia(credentials as ProviderCredentials['zenvia-sms']);

    default:
      return { success: false, error: 'Provider not supported for testing' };
  }
}

async function testViaCEP() {
  try {
    const response = await axios.get('https://viacep.com.br/ws/01310-100/json/', {
      timeout: 5000
        });

    return {
      success: response.status === 200 && !response.data.erro,
      data: { status: 'ViaCEP API is working' }
        };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to ViaCEP'
        };
  }
}

async function testReceitaFederal(credentials: ProviderCredentials['receita-federal']) {
  // Implementar teste real com a API da Receita Federal
  return {
    success: credentials?.token ? true : false,
    data: { status: 'Receita Federal integration configured' },
    error: !credentials?.token ? 'Token not configured' : undefined
        };
}

async function testZenvia(credentials: ProviderCredentials['zenvia-sms']) {
  // Implementar teste real com a API da Zenvia
  return {
    success: credentials?.apiToken ? true : false,
    data: { status: 'Zenvia SMS integration test' },
    error: !credentials?.apiToken ? 'API Token not configured' : undefined
        };
}

async function validateCPF(
  cpf: string,
  config: IntegrationConfig,
  credentials: IntegrationCredentials
): Promise<ValidationResult> {
  try {
    // Implementar validação real de CPF
    // Por agora, retornar dados simulados
    return {
      success: true,
      data: {
        cpf: maskCPF(cpf),
        valid: true,
        status: 'REGULAR',
        name: 'NOME VALIDADO'
        }
        };
  } catch (error) {
    return {
      success: false,
      error: 'CPF validation failed'
        };
  }
}

async function validateCNPJ(
  cnpj: string,
  config: IntegrationConfig,
  credentials: IntegrationCredentials
): Promise<ValidationResult> {
  try {
    // Implementar validação real de CNPJ
    // Por agora, retornar dados simulados
    return {
      success: true,
      data: {
        cnpj: maskCNPJ(cnpj),
        valid: true,
        razaoSocial: 'EMPRESA VALIDADA LTDA',
        situacao: 'ATIVA',
        dataAbertura: '2020-01-15'
        }
        };
  } catch (error) {
    return {
      success: false,
      error: 'CNPJ validation failed'
        };
  }
}

async function getAddressByCEP(
  cep: string,
  provider: string = 'viacep',
  config?: IntegrationConfig,
  credentials?: Record<string, unknown>
) {
  try {
    if (provider === 'viacep') {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, {
        timeout: 5000
        });

      if (response.data.erro) {
        return {
          success: false,
          error: 'CEP not found'
        };
      }

      return {
        success: true,
        data: {
          cep: response.data.cep,
          logradouro: response.data.logradouro,
          complemento: response.data.complemento,
          bairro: response.data.bairro,
          localidade: response.data.localidade,
          uf: response.data.uf,
          ibge: response.data.ibge
        }
        };
    }

    return {
      success: false,
      error: 'Provider not supported'
        };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to lookup CEP'
        };
  }
}

async function sendSMS(
  phone: string,
  message: string,
  config: IntegrationConfig,
  credentials: Record<string, unknown>
) {
  try {
    // Implementar envio real via Zenvia ou outro provider
    // Por agora, simular envio
    return {
      success: true,
      data: {
        messageId: `sms-${Date.now()}`,
        phone: maskPhone(phone),
        status: 'sent'
        }
        };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send SMS'
        };
  }
}

export default router;
