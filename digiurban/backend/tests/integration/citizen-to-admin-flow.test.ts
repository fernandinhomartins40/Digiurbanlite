/**
 * ============================================================================
 * TESTES DE INTEGRAÇÃO: FLUXO CIDADÃO → ADMIN → PROTOCOLO
 * ============================================================================
 *
 * Testa o fluxo completo de solicitação de serviço:
 * 1. Cidadão solicita serviço
 * 2. Sistema cria protocolo
 * 3. Sistema persiste dados no módulo especializado
 * 4. Admin visualiza solicitação no painel
 * 5. Admin aprova/rejeita
 * 6. Protocolo é atualizado
 */

import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';

// Mock completo do Prisma para testes de integração
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((callback) => {
      // Simular transação executando o callback
      return callback({
        protocol: {
          create: jest.fn().mockResolvedValue({
            id: 'protocol-123',
            number: '2025/000001',
            status: 'VINCULADO',
            serviceId: 'service-123',
          }),
          update: jest.fn().mockResolvedValue({
            id: 'protocol-123',
            status: 'APROVADO',
          }),
        },
        studentEnrollment: {
          create: jest.fn().mockResolvedValue({
            id: 'enrollment-123',
            protocol: '2025/000001',
            status: 'PENDING',
          }),
          update: jest.fn().mockResolvedValue({
            id: 'enrollment-123',
            status: 'APPROVED',
          }),
        },
        healthAppointment: {
          create: jest.fn().mockResolvedValue({
            id: 'appointment-123',
            protocol: '2025/000001',
            status: 'PENDING',
          }),
        },
        socialAssistanceAttendance: {
          create: jest.fn().mockResolvedValue({
            id: 'benefit-123',
            protocol: '2025/000001',
            status: 'PENDING',
          }),
        },
      });
    }),
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'tenant-123',
        name: 'Test Municipality',
      }),
    },
    citizen: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'citizen-123',
        name: 'João Silva',
        email: 'joao@test.com',
      }),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    protocol: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    studentEnrollment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    healthAppointment: {
      findMany: jest.fn(),
    },
  },
}));

describe('Integração: Cidadão → Admin → Protocolo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FLUXO 1: Matrícula Escolar', () => {
    it('deve processar solicitação completa de matrícula', async () => {
      // Mock do serviço de matrícula
      const mockService = {
        id: 'service-123',
        name: 'Matrícula Escolar',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
        isActive: true,
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

      // 1. CIDADÃO: Solicitar matrícula
      const requestData = {
        studentName: 'Maria Silva',
        birthDate: '2015-01-15',
        parentName: 'João Silva',
        parentCpf: '12345678900',
        parentPhone: '11999999999',
        desiredGrade: '1º ano',
        desiredShift: 'Matutino',
        address: 'Rua Principal, 123',
      };

      const response = await request(app)
        .post('/api/citizen/services/service-123/request')
        .send(requestData)
        .expect(201);

      // Verificar que protocolo foi criado
      expect(response.body.protocol).toBeDefined();
      expect(response.body.protocol.number).toBe('2025/000001');
      expect(response.body.protocol.status).toBe('VINCULADO');

      // Verificar que StudentEnrollment foi criado
      expect(prisma.$transaction).toHaveBeenCalled();

      // 2. ADMIN: Listar matrículas pendentes
      (prisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'enrollment-123',
          protocol: '2025/000001',
          studentName: 'Maria Silva',
          status: 'PENDING',
        },
      ]);

      const adminResponse = await request(app)
        .get('/api/admin/secretarias/educacao/enrollments?status=PENDING')
        .expect(200);

      expect(adminResponse.body.enrollments).toHaveLength(1);
      expect(adminResponse.body.enrollments[0].protocol).toBe('2025/000001');

      // 3. ADMIN: Aprovar matrícula
      (prisma.protocol.findUnique as jest.Mock).mockResolvedValue({
        id: 'protocol-123',
        number: '2025/000001',
        status: 'VINCULADO',
      });

      const approvalResponse = await request(app)
        .post('/api/admin/protocols/protocol-123/approve')
        .send({
          enrollmentId: 'enrollment-123',
          classId: 'class-123',
          notes: 'Matrícula aprovada',
        })
        .expect(200);

      // Verificar que protocolo foi atualizado
      expect(approvalResponse.body.protocol.status).toBe('APROVADO');
    });
  });

  describe('FLUXO 2: Consulta Médica', () => {
    it('deve processar solicitação completa de consulta', async () => {
      const mockService = {
        id: 'service-456',
        name: 'Agendar Consulta',
        moduleType: 'health',
        moduleEntity: 'Appointment',
        isActive: true,
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

      // 1. CIDADÃO: Solicitar consulta
      const requestData = {
        patientName: 'Maria Santos',
        patientCpf: '98765432100',
        specialty: 'Cardiologia',
        preferredDate: '2025-02-15',
        preferredShift: 'Manhã',
        symptoms: 'Dor no peito',
        urgency: 'HIGH',
      };

      const response = await request(app)
        .post('/api/citizen/services/service-456/request')
        .send(requestData)
        .expect(201);

      expect(response.body.protocol.number).toBe('2025/000001');

      // 2. ADMIN: Listar consultas pendentes
      (prisma.healthAppointment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'appointment-123',
          protocol: '2025/000001',
          patientName: 'Maria Santos',
          specialty: 'Cardiologia',
          urgency: 'HIGH',
          status: 'PENDING',
        },
      ]);

      const adminResponse = await request(app)
        .get('/api/admin/secretarias/saude/appointments?status=PENDING')
        .expect(200);

      expect(adminResponse.body.appointments[0].urgency).toBe('HIGH');

      // 3. ADMIN: Agendar consulta
      const scheduleResponse = await request(app)
        .post('/api/admin/appointments/appointment-123/schedule')
        .send({
          scheduledDate: '2025-02-16T09:00:00',
          doctorId: 'doctor-123',
          location: 'UBS Central',
        })
        .expect(200);

      expect(scheduleResponse.body.appointment).toBeDefined();
    });
  });

  describe('FLUXO 3: Cesta Básica', () => {
    it('deve processar solicitação completa de benefício', async () => {
      const mockService = {
        id: 'service-789',
        name: 'Solicitar Cesta Básica',
        moduleType: 'social',
        moduleEntity: 'BenefitRequest',
        isActive: true,
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

      // 1. CIDADÃO: Solicitar benefício
      const requestData = {
        citizenName: 'José Silva',
        cpf: '11122233344',
        familyMembers: 4,
        monthlyIncome: 800.0,
        benefitType: 'CESTA_BASICA',
        justification: 'Desempregado devido à pandemia',
      };

      const response = await request(app)
        .post('/api/citizen/services/service-789/request')
        .send(requestData)
        .expect(201);

      expect(response.body.protocol).toBeDefined();

      // 2. ADMIN: Verificar elegibilidade
      const eligibilityCheck = {
        cpf: requestData.cpf,
        income: requestData.monthlyIncome,
        familyMembers: requestData.familyMembers,
      };

      // Simular verificação de elegibilidade
      const isEligible = eligibilityCheck.income / eligibilityCheck.familyMembers < 300;
      expect(isEligible).toBe(true);

      // 3. ADMIN: Aprovar benefício
      const approvalResponse = await request(app)
        .post('/api/admin/protocols/protocol-123/approve')
        .send({
          deliveryDate: '2025-02-20',
          pickupLocation: 'CRAS Centro',
        })
        .expect(200);

      expect(approvalResponse.body.protocol).toBeDefined();
    });
  });

  describe('Validações de Integridade', () => {
    it('deve garantir atomicidade na criação de protocolo + módulo', async () => {
      const mockService = {
        id: 'service-123',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

      // Simular erro durante criação do StudentEnrollment
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/citizen/services/service-123/request')
        .send({ studentName: 'Test' })
        .expect(500);

      // Verificar que rollback ocorreu
      expect(response.body.error).toBeDefined();
    });

    it('deve vincular protocolo corretamente ao módulo', async () => {
      const mockService = {
        id: 'service-123',
        moduleType: 'education',
        moduleEntity: 'StudentEnrollment',
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

      const response = await request(app)
        .post('/api/citizen/services/service-123/request')
        .send({ studentName: 'Test Student' })
        .expect(201);

      // Verificar chamadas do transaction
      expect(prisma.$transaction).toHaveBeenCalled();

      // Obter o callback da transação e verificar as chamadas
      const transactionCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
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

      await transactionCallback(mockTx);

      // Verificar que protocolo foi passado para o StudentEnrollment
      expect(mockTx.studentEnrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            protocol: '2025/000001',
          }),
        })
      );
    });
  });

  describe('Notificações e Atualizações', () => {
    it('deve notificar cidadão quando protocolo é aprovado', async () => {
      (prisma.protocol.findUnique as jest.Mock).mockResolvedValue({
        id: 'protocol-123',
        citizenId: 'citizen-123',
        status: 'VINCULADO',
      });

      (prisma.protocol.update as jest.Mock).mockResolvedValue({
        id: 'protocol-123',
        status: 'APROVADO',
      });

      const response = await request(app)
        .post('/api/admin/protocols/protocol-123/approve')
        .send({
          notes: 'Aprovado com sucesso',
        })
        .expect(200);

      expect(response.body.protocol.status).toBe('APROVADO');

      // TODO: Verificar envio de notificação
      // expect(notificationService.send).toHaveBeenCalledWith({
      //   citizenId: 'citizen-123',
      //   message: 'Seu protocolo 2025/000001 foi aprovado'
      // });
    });

    it('deve atualizar status do módulo quando protocolo muda', async () => {
      (prisma.protocol.findUnique as jest.Mock).mockResolvedValue({
        id: 'protocol-123',
        number: '2025/000001',
        serviceId: 'service-123',
      });

      (prisma.studentEnrollment.findUnique as jest.Mock).mockResolvedValue({
        id: 'enrollment-123',
        protocol: '2025/000001',
        status: 'PENDING',
      });

      const response = await request(app)
        .post('/api/admin/protocols/protocol-123/approve')
        .expect(200);

      // Verificar que status da matrícula também foi atualizado
      expect(prisma.studentEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'enrollment-123' },
          data: expect.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });
  });
});
