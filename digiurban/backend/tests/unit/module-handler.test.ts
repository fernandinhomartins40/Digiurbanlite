/**
 * ============================================================================
 * TESTES UNITÁRIOS: MODULE HANDLER
 * ============================================================================
 * Cobertura: 100% dos módulos e métodos do ModuleHandler
 */

import { ModuleHandler, ModuleExecutionContext } from '../../src/modules/module-handler';
import { prisma } from '../../src/lib/prisma';
import {
  createMockTenant,
  createMockCitizen,
  createMockService,
  createMockProtocol,
} from '../helpers/test-helpers';

// Mock do Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    studentEnrollment: {
      create: jest.fn(),
    },
    schoolTransport: {
      create: jest.fn(),
    },
    studentAttendance: {
      create: jest.fn(),
    },
    healthAppointment: {
      create: jest.fn(),
    },
    medicationDispensing: {
      create: jest.fn(),
    },
    healthAttendance: {
      create: jest.fn(),
    },
    socialAssistanceAttendance: {
      create: jest.fn(),
    },
    customDataTable: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    customDataRecord: {
      create: jest.fn(),
    },
  },
}));

describe('ModuleHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('deve retornar sucesso para serviço genérico sem moduleType', async () => {
      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({ moduleType: null }),
        requestData: {},
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('generic');
    });

    it('deve lançar erro para módulo desconhecido', async () => {
      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({ moduleType: 'unknown_module' }),
        requestData: {},
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('desconhecido');
    });
  });

  describe('EDUCAÇÃO - handleEducation()', () => {
    it('deve criar StudentEnrollment corretamente', async () => {
      const mockEnrollment = {
        id: 'enrollment-id',
        protocol: '2025/000001',
        studentName: 'João Silva',
        status: 'PENDING',
      };

      (prisma.studentEnrollment.create as jest.Mock).mockResolvedValue(mockEnrollment);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'education',
          moduleEntity: 'StudentEnrollment',
        }),
        requestData: {
          studentName: 'João Silva',
          birthDate: '2015-01-01',
          parentName: 'Maria Silva',
          parentCpf: '12345678900',
          parentPhone: '11999999999',
          desiredGrade: '1º ano',
          desiredShift: 'Matutino',
          address: 'Rua Teste, 123',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('StudentEnrollment');
      expect(result.entityId).toBe('enrollment-id');
      expect(prisma.studentEnrollment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({,
          studentName: 'João Silva',
          desiredGrade: '1º ano',
          status: 'PENDING',
        }),
      });
    });

    it('deve criar SchoolTransport corretamente', async () => {
      const mockTransport = {
        id: 'transport-id',
        protocol: '2025/000001',
        studentName: 'João Silva',
        status: 'PENDING',
      };

      (prisma.schoolTransport.create as jest.Mock).mockResolvedValue(mockTransport);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'education',
          moduleEntity: 'SchoolTransport',
        }),
        requestData: {
          studentName: 'João Silva',
          schoolName: 'Escola Municipal',
          address: 'Rua Teste, 123',
          route: 'Rota A',
          shift: 'Matutino',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('SchoolTransport');
      expect(result.entityId).toBe('transport-id');
      expect(prisma.schoolTransport.create).toHaveBeenCalled();
    });

    it('deve criar registro genérico de educação para moduleEntity desconhecido', async () => {
      const mockGeneric = {
        id: 'generic-id',
        protocol: '2025/000001',
        status: 'PENDING',
      };

      (prisma.studentAttendance.create as jest.Mock).mockResolvedValue(mockGeneric);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'education',
          moduleEntity: 'UnknownEntity',
        }),
        requestData: {
          studentName: 'João Silva',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('StudentAttendance');
      expect(prisma.studentAttendance.create).toHaveBeenCalled();
    });
  });

  describe('SAÚDE - handleHealth()', () => {
    it('deve criar HealthAppointment (consulta) corretamente', async () => {
      const mockAppointment = {
        id: 'appointment-id',
        protocol: '2025/000001',
        patientName: 'Maria Silva',
        status: 'PENDING',
      };

      (prisma.healthAppointment.create as jest.Mock).mockResolvedValue(mockAppointment);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'health',
          moduleEntity: 'Appointment',
        }),
        requestData: {
          patientName: 'Maria Silva',
          patientCpf: '12345678900',
          specialty: 'Cardiologia',
          preferredDate: '2025-02-01',
          preferredShift: 'Manhã',
          symptoms: 'Dor no peito',
          urgency: 'HIGH',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('HealthAppointment');
      expect(result.entityId).toBe('appointment-id');
      expect(prisma.healthAppointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          patientName: 'Maria Silva',
          specialty: 'Cardiologia',
          urgency: 'HIGH',
        }),
      });
    });

    it('deve criar MedicineRequest corretamente', async () => {
      const mockMedicine = {
        id: 'medicine-id',
        protocol: '2025/000001',
        status: 'PENDING',
      };

      (prisma.medicationDispensing.create as jest.Mock).mockResolvedValue(mockMedicine);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'health',
          moduleEntity: 'MedicineRequest',
        }),
        requestData: {
          patientName: 'Maria Silva',
          patientCpf: '12345678900',
          medication: 'Losartana 50mg',
          prescription: 'PRE-123',
          quantity: 60,
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('MedicineRequest');
      expect(prisma.medicationDispensing.create).toHaveBeenCalled();
    });

    it('deve criar HealthAttendance genérico para entidade desconhecida', async () => {
      const mockGeneric = {
        id: 'generic-id',
        status: 'PENDING',
      };

      (prisma.healthAttendance.create as jest.Mock).mockResolvedValue(mockGeneric);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'health',
          moduleEntity: 'UnknownEntity',
        }),
        requestData: {
          patientName: 'Maria Silva',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('HealthAttendance');
      expect(prisma.healthAttendance.create).toHaveBeenCalled();
    });
  });

  describe('ASSISTÊNCIA SOCIAL - handleSocial()', () => {
    it('deve criar SocialAssistanceAttendance corretamente', async () => {
      const mockBenefit = {
        id: 'benefit-id',
        protocol: '2025/000001',
        status: 'PENDING',
      };

      (prisma.socialAssistanceAttendance.create as jest.Mock).mockResolvedValue(mockBenefit);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'social',
          moduleEntity: 'BenefitRequest',
        }),
        requestData: {
          citizenName: 'José Silva',
          benefitType: 'CESTA_BASICA',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('SocialAssistance');
      expect(prisma.socialAssistanceAttendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          citizenName: 'José Silva',
          benefitType: 'CESTA_BASICA',
          status: 'PENDING',
        }),
      });
    });
  });

  describe('MÓDULOS CUSTOMIZADOS - handleCustomModule()', () => {
    it('deve criar registro em tabela customizada existente', async () => {
      const mockTable = {
        id: 'table-id',
        tableName: 'custom_generic',
        moduleType: 'generic',
      };

      const mockRecord = {
        id: 'record-id',
        tableId: 'table-id',
        protocol: '2025/000001',
      };

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'custom',
          moduleEntity: 'generic',
        }),
        requestData: {
          field1: 'value1',
          field2: 'value2',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('CustomDataRecord');
      expect(prisma.customDataRecord.create).toHaveBeenCalled();
    });

    it('deve criar nova tabela customizada se não existir', async () => {
      const mockNewTable = {
        id: 'new-table-id',
        tableName: 'custom_generic',
      };

      const mockRecord = {
        id: 'record-id',
        tableId: 'new-table-id',
      };

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customDataTable.create as jest.Mock).mockResolvedValue(mockNewTable);
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'custom',
          moduleEntity: 'generic',
          name: 'Custom Service',
          fieldMapping: { field1: 'text' },
        }),
        requestData: {
          field1: 'value1',
        },
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(true);
      expect(prisma.customDataTable.create).toHaveBeenCalledWith({
        data: expect.objectContaining({,
          tableName: 'custom_generic',
          displayName: 'Custom Service',
        }),
      });
      expect(prisma.customDataRecord.create).toHaveBeenCalled();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve capturar e retornar erro quando Prisma falhar', async () => {
      (prisma.studentEnrollment.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const context: ModuleExecutionContext = {,
        protocol: createMockProtocol(),
        service: createMockService({
          moduleType: 'education',
          moduleEntity: 'StudentEnrollment',
        }),
        requestData: {},
        citizenId: 'test-citizen',
      };

      const result = await ModuleHandler.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
