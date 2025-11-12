/**
 * ============================================================================
 * TESTES DE INTEGRAÇÃO: ATIVAR TEMPLATE → CUSTOMIZAR → TESTAR
 * ============================================================================
 *
 * Testa o fluxo completo de ativação de templates:
 * 1. Admin visualiza catálogo de templates
 * 2. Admin ativa template com customizações
 * 3. Serviço é criado baseado no template
 * 4. Cidadão utiliza o serviço
 * 5. Dados fluem corretamente para o módulo especializado
 */

import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma');

describe('Integração: Template → Ativação → Uso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FLUXO COMPLETO: Template de Matrícula', () => {
    it('deve ativar template, customizar e processar solicitação', async () => {
      // 1. ADMIN: Visualizar catálogo de templates
      const mockTemplates = [
        {
          id: 'template-edu-001',
          code: 'EDU_MATRICULA_001',
          name: 'Matrícula Escolar',
          category: 'Educação',
          moduleType: 'education',
          moduleEntity: 'StudentEnrollment',
          defaultFields: [
            { id: 'studentName', label: 'Nome do Aluno', type: 'text', required: true },
            { id: 'birthDate', label: 'Data de Nascimento', type: 'date', required: true },
            { id: 'desiredGrade', label: 'Série', type: 'select', required: true },
          ],
          fieldMapping: {
            studentName: 'studentName',
            birthDate: 'birthDate',
            desiredGrade: 'desiredGrade',
          },
          isActive: true,
        },
      ];

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(1);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const catalogResponse = await request(app)
        .get('/api/admin/templates?category=Educação')
        .expect(200);

      expect(catalogResponse.body.templates).toHaveLength(1);
      expect(catalogResponse.body.templates[0].code).toBe('EDU_MATRICULA_001');

      // 2. ADMIN: Ativar template com customizações
      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplates[0]);
      (prisma.service.create as jest.Mock).mockResolvedValue({
        id: 'service-123',
        templateId: 'template-edu-001',
        name: 'Matrícula Escolar - Ensino Fundamental',
        description: 'Customizado para nossa cidade',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
        fieldMapping: mockTemplates[0].fieldMapping,
        isActive: true,
      });

      const activationResponse = await request(app)
        .post('/api/admin/templates/template-edu-001/activate')
        .send({
          departmentId: 'dept-education',
          customizations: {
            name: 'Matrícula Escolar - Ensino Fundamental',
            description: 'Customizado para nossa cidade',
            additionalFields: [
              { id: 'neighborhood', label: 'Bairro', type: 'text' },
            ],
          },
          priority: 1,
        })
        .expect(200);

      expect(activationResponse.body.service.id).toBe('service-123');
      expect(activationResponse.body.service.name).toBe('Matrícula Escolar - Ensino Fundamental');

      // 3. CIDADÃO: Utilizar o serviço ativado
      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'service-123',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
      });

      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback({
          protocol: {
            create: jest.fn().mockResolvedValue({
              id: 'protocol-123',
              number: '2025/000001',
              status: 'VINCULADO',
            }),
          },
          studentEnrollment: {
            create: jest.fn().mockResolvedValue({
              id: 'enrollment-123',
              protocol: '2025/000001',
              studentName: 'Ana Silva',
              status: 'PENDING',
            }),
          },
        })
      );

      const requestResponse = await request(app)
        .post('/api/citizen/services/service-123/request')
        .send({
          studentName: 'Ana Silva',
          birthDate: '2015-03-20',
          desiredGrade: '1º ano',
          parentName: 'Maria Silva',
          parentPhone: '11999999999',
          neighborhood: 'Centro', // Campo customizado
        })
        .expect(201);

      expect(requestResponse.body.protocol.number).toBe('2025/000001');

      // 4. Verificar que dados fluíram corretamente para StudentEnrollment
      const txCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      const mockTx = {
        protocol: {
          create: jest.fn().mockResolvedValue({
            number: '2025/000001',
          }),
        },
        studentEnrollment: {
          create: jest.fn(),
        },
      };

      await txCallback(mockTx);

      expect(mockTx.studentEnrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentName: 'Ana Silva',
            desiredGrade: '1º ano',
          }),
        })
      );
    });
  });

  describe('FLUXO: Template de Consulta Médica', () => {
    it('deve ativar template de saúde e processar agendamento', async () => {
      const mockTemplate = {
        id: 'template-health-001',
        code: 'SAU_CONSULTA_001',
        name: 'Agendar Consulta Médica',
        category: 'Saúde',
        moduleType: 'health',
        moduleEntity: 'Appointment',
        defaultFields: [
          { id: 'patientName', label: 'Nome do Paciente', type: 'text' },
          { id: 'specialty', label: 'Especialidade', type: 'select' },
          { id: 'preferredDate', label: 'Data Preferida', type: 'date' },
        ],
      };

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.create as jest.Mock).mockResolvedValue({
        id: 'service-health-123',
        templateId: 'template-health-001',
        moduleType: 'health',
        moduleEntity: 'Appointment',
      });

      // Ativar template
      await request(app)
        .post('/api/admin/templates/template-health-001/activate')
        .send({
          departmentId: 'dept-health',
          customizations: {
            specialties: ['Cardiologia', 'Dermatologia', 'Clínico Geral'],
          },
        })
        .expect(200);

      // Usar serviço
      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'service-health-123',
        moduleType: 'health',
        moduleEntity: 'Appointment',
      });

      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback({
          protocol: {
            create: jest.fn().mockResolvedValue({ number: '2025/000002' }),
          },
          healthAppointment: {
            create: jest.fn().mockResolvedValue({
              id: 'appointment-123',
              patientName: 'Pedro Santos',
            }),
          },
        })
      );

      const response = await request(app)
        .post('/api/citizen/services/service-health-123/request')
        .send({
          patientName: 'Pedro Santos',
          specialty: 'Cardiologia',
          preferredDate: '2025-02-25',
          urgency: 'NORMAL',
        })
        .expect(201);

      expect(response.body.protocol).toBeDefined();
    });
  });

  describe('Customizações Avançadas', () => {
    it('deve permitir customização de campos do template', async () => {
      const baseTemplate = {
        id: 'template-001',
        defaultFields: [
          { id: 'field1', label: 'Campo 1', type: 'text' },
        ],
      };

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(baseTemplate);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/admin/templates/template-001/activate')
        .send({
          departmentId: 'dept-001',
          customizations: {
            fields: [
              { id: 'field1', label: 'Campo 1 Customizado', required: true },
              { id: 'customField', label: 'Novo Campo', type: 'number' },
            ],
          },
        })
        .expect(200);

      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customizations: expect.any(Object),
          }),
        })
      );
    });

    it('deve permitir fieldMapping customizado', async () => {
      const template = {
        id: 'template-001',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
        fieldMapping: {
          defaultField: 'entity.field',
        },
      };

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(template);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.create as jest.Mock).mockResolvedValue({});

      await request(app)
        .post('/api/admin/templates/template-001/activate')
        .send({
          departmentId: 'dept-001',
          customizations: {
            fieldMapping: {
              defaultField: 'entity.field',
              customField: 'entity.customField',
            },
          },
        })
        .expect(200);

      expect(prisma.service.create).toHaveBeenCalled();
    });
  });

  describe('Validações', () => {
    it('deve impedir ativação duplicada de template', async () => {
      const template = { id: 'template-001' };
      const existingService = { id: 'service-001', templateId: 'template-001' };

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(template);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(existingService);

      const response = await request(app)
        .post('/api/admin/templates/template-001/activate')
        .send({ departmentId: 'dept-001' })
        .expect(400);

      expect(response.body.error).toContain('já foi ativado');
    });

    it('deve validar departmentId obrigatório', async () => {
      const response = await request(app)
        .post('/api/admin/templates/template-001/activate')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('departmentId');
    });

    it('deve validar existência do template', async () => {
      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/templates/nonexistent/activate')
        .send({ departmentId: 'dept-001' })
        .expect(404);

      expect(response.body.error).toBe('Template não encontrado');
    });
  });

  describe('Verificação de Status', () => {
    it('deve indicar template ativado ao listar catálogo', async () => {
      const template = { id: 'template-001', name: 'Template 1' };
      const activeService = { id: 'service-001', templateId: 'template-001', isActive: true };

      (prisma.serviceTemplate.findMany as jest.Mock).mockResolvedValue([template]);
      (prisma.serviceTemplate.count as jest.Mock).mockResolvedValue(1);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(activeService);

      const response = await request(app)
        .get('/api/admin/templates')
        .expect(200);

      expect(response.body.templates[0].isActivated).toBe(true);
      expect(response.body.templates[0].activeServiceId).toBe('service-001');
    });

    it('deve listar instâncias do template no tenant', async () => {
      const template = {
        id: 'template-001',
        instances: [
          { id: 'service-001'},
          { id: 'service-002'},
        ],
      };

      (prisma.serviceTemplate.findUnique as jest.Mock).mockResolvedValue(template);

      const response = await request(app)
        .get('/api/admin/templates/template-001')
        .expect(200);

      expect(response.body.template.instances).toHaveLength(2);
    });
  });
});
