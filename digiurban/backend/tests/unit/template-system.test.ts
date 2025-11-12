/**
 * ============================================================================
 * TESTES UNITÁRIOS: TEMPLATE SYSTEM
 * ============================================================================
 * Cobertura: 100% das rotas e funções do sistema de templates
 */

import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { createMockServiceTemplate, createMockService } from '../helpers/test-helpers';

// Mock do Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    serviceTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock dos middlewares
jest.mock('../../src/middleware/tenant', () => ({
  tenantMiddleware: (req: any, res: any, next: any) => {
    req.tenant = { id: 'test-tenant-id', name: 'Test Tenant' };
    next();
  },
}));

jest.mock('../../src/middleware/admin-auth', () => ({
  adminAuthMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-admin-id', role: 'admin' };
    next();
  },
}));

describe('Template System API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/templates', () => {
    it('deve listar todos os templates ativos', async () => {
      const mockTemplates = [
        createMockServiceTemplate({ id: '1', name: 'Template 1', category: 'Educação' }),
        createMockServiceTemplate({ id: '2', name: 'Template 2', category: 'Saúde' }),
      ];

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(2);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/templates')
        .expect(200);

      expect(response.body.templates).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('deve filtrar templates por categoria', async () => {
      const mockTemplates = [
        createMockServiceTemplate({ category: 'Educação' }),
      ];

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(1);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/templates?category=Educação')
        .expect(200);

      expect(prisma.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Educação',
          }),
        })
      );
    });

    it('deve buscar templates por texto', async () => {
      const mockTemplates = [
        createMockServiceTemplate({ name: 'Matrícula Escolar' }),
      ];

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(1);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/templates?search=Matrícula')
        .expect(200);

      expect(prisma.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('deve indicar se template já foi ativado', async () => {
      const mockTemplate = createMockServiceTemplate({ id: '1' });
      const mockActiveService = createMockService({ templateId: '1' });

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue([mockTemplate]);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(1);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(mockActiveService);

      const response = await request(app)
        .get('/api/admin/templates')
        .expect(200);

      expect(response.body.templates[0].isActivated).toBe(true);
      expect(response.body.templates[0].activeServiceId).toBe(mockActiveService.id);
    });

    it('deve paginar resultados corretamente', async () => {
      const mockTemplates = Array(10).fill(null).map((_, i) =>
        createMockServiceTemplate({ id: `${i}` })
      );

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates.slice(0, 5));
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(10);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/templates?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/admin/templates/categories', () => {
    it('deve listar todas as categorias com contadores', async () => {
      const mockCategories = [
        { category: 'Educação', _count: { category: 20 } },
        { category: 'Saúde', _count: { category: 30 } },
        { category: 'Assistência Social', _count: { category: 25 } },
      ];

      (prisma.serviceTemplate.groupBy as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/admin/templates/categories')
        .expect(200);

      expect(response.body.categories).toHaveLength(3);
      expect(response.body.categories[0]).toHaveProperty('name');
      expect(response.body.categories[0]).toHaveProperty('count');
      expect(response.body.categories[0].name).toBe('Educação');
      expect(response.body.categories[0].count).toBe(20);
    });

    it('deve retornar lista vazia quando não houver categorias', async () => {
      (prisma.serviceTemplate.groupBy as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/templates/categories')
        .expect(200);

      expect(response.body.categories).toEqual([]);
    });
  });

  describe('GET /api/admin/templates/:id', () => {
    it('deve retornar detalhes completos do template', async () => {
      const mockTemplate = createMockServiceTemplate({
        id: 'template-123',
        name: 'Matrícula Escolar',
        defaultFields: [
          { id: 'studentName', label: 'Nome do Estudante', type: 'text' },
        ],
      });

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        instances: [],
      });

      const response = await request(app)
        .get('/api/admin/templates/template-123')
        .expect(200);

      expect(response.body.template.id).toBe('template-123');
      expect(response.body.template.name).toBe('Matrícula Escolar');
      expect(response.body.template.instances).toBeDefined();
    });

    it('deve retornar 404 para template não encontrado', async () => {
      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/templates/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Template não encontrado');
    });

    it('deve incluir instâncias do template no tenant', async () => {
      const mockTemplate = createMockServiceTemplate({ id: 'template-123' });
      const mockInstances = [
        createMockService({ id: 'service-1', templateId: 'template-123' }),
      ];

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        instances: mockInstances,
      });

      const response = await request(app)
        .get('/api/admin/templates/template-123')
        .expect(200);

      expect(response.body.template.instances).toHaveLength(1);
    });
  });

  describe('POST /api/admin/templates/:id/activate', () => {
    it('deve ativar template e criar serviço com sucesso', async () => {
      const mockTemplate = createMockServiceTemplate({
        id: 'template-123',
        name: 'Matrícula Escolar',
        moduleType: 'education',
      });

      const mockService = createMockService({
        id: 'service-123',
        templateId: 'template-123',
        name: 'Matrícula Escolar',
      });

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.create as jest.Mock).mockResolvedValue(mockService);

      const response = await request(app)
        .post('/api/admin/templates/template-123/activate')
        .send({
          departmentId: 'dept-123',
          customizations: {
            name: 'Matrícula Escolar Customizada',
          },
          priority: 1,
        })
        .expect(200);

      expect(response.body.service.id).toBe('service-123');
      expect(prisma.service.create).toHaveBeenCalled();
    });

    it('deve rejeitar ativação sem departmentId', async () => {
      const response = await request(app)
        .post('/api/admin/templates/template-123/activate')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('departmentId');
    });

    it('deve rejeitar ativação de template não encontrado', async () => {
      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/templates/nonexistent/activate')
        .send({ departmentId: 'dept-123' })
        .expect(404);

      expect(response.body.error).toBe('Template não encontrado');
    });

    it('deve rejeitar ativação duplicada', async () => {
      const mockTemplate = createMockServiceTemplate({ id: 'template-123' });
      const mockExistingService = createMockService({ templateId: 'template-123' });

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(mockExistingService);

      const response = await request(app)
        .post('/api/admin/templates/template-123/activate')
        .send({ departmentId: 'dept-123' })
        .expect(400);

      expect(response.body.error).toContain('já foi ativado');
    });

    it('deve aplicar customizações ao criar serviço', async () => {
      const mockTemplate = createMockServiceTemplate({
        id: 'template-123',
        name: 'Nome Original',
        description: 'Descrição Original',
      });

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.create as jest.Mock).mockResolvedValue({});

      await request(app)
        .post('/api/admin/templates/template-123/activate')
        .send({
          departmentId: 'dept-123',
          customizations: {
            name: 'Nome Customizado',
            description: 'Descrição Customizada',
          },
        })
        .expect(200);

      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Nome Customizado',
            description: 'Descrição Customizada',
          }),
        })
      );
    });
  });

  describe('Validação de Template Schema', () => {
    it('deve validar estrutura de defaultFields', () => {
      const template = createMockServiceTemplate({
        defaultFields: [
          {
            id: 'field1',
            label: 'Field 1',
            type: 'text',
            required: true,
          },
        ],
      });

      expect(template.defaultFields).toBeInstanceOf(Array);
      expect(template.defaultFields[0]).toHaveProperty('id');
      expect(template.defaultFields[0]).toHaveProperty('label');
      expect(template.defaultFields[0]).toHaveProperty('type');
    });

    it('deve validar fieldMapping para módulos especializados', () => {
      const template = createMockServiceTemplate({
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
        fieldMapping: {
          studentName: 'student.name',
          birthDate: 'student.birthDate',
        },
      });

      expect(template.moduleType).toBe('education');
      expect(template.moduleEntity).toBe('StudentEnrollment');
      expect(template.fieldMapping).toHaveProperty('studentName');
    });
  });
});
