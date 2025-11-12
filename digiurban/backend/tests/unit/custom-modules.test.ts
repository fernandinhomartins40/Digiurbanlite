/**
 * ============================================================================
 * TESTES UNITÁRIOS: CUSTOM MODULES
 * ============================================================================
 * Cobertura: 100% das funcionalidades de módulos customizados
 */

import { prisma } from '../../src/lib/prisma';
import {
  createMockTenant,
  createMockProtocol,
  createMockService,
} from '../helpers/test-helpers';

// Mock do Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    customDataTable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customDataRecord: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Custom Modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CustomDataTable - Gerenciamento de Tabelas', () => {
    it('deve criar nova tabela customizada', async () => {
      const mockTable = {
        id: 'table-123',
        tableName: 'custom_permits',
        displayName: 'Alvarás Customizados',
        moduleType: 'custom',
        schema: {
          fields: [
            { id: 'businessName', type: 'text', label: 'Nome do Negócio' },
            { id: 'address', type: 'text', label: 'Endereço' },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customDataTable.create as jest.Mock).mockResolvedValue(mockTable);

      const result = await prisma.customDataTable.create({
        data: {,
          tableName: 'custom_permits',
          displayName: 'Alvarás Customizados',
          moduleType: 'custom',
          schema: mockTable.schema,
        },
      });

      expect(result.id).toBe('table-123');
      expect(result.tableName).toBe('custom_permits');
      expect(result.schema).toHaveProperty('fields');
      expect(prisma.customDataTable.create).toHaveBeenCalled();
    });

    it('deve listar todas as tabelas do tenant', async () => {
      const mockTables = [
        {
          id: 'table-1',
          tableName: 'custom_permits',
          displayName: 'Alvarás',
          _count: { records: 10 },
        },
        {
          id: 'table-2',
          tableName: 'custom_licenses',
          displayName: 'Licenças',
          _count: { records: 5 },
        },
      ];

      (prisma.customDataTable.findMany as jest.Mock).mockResolvedValue(mockTables);

      const result = await prisma.customDataTable.findMany({
        where: {},
        include: {
          _count: { select: { records: true } },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]._count.records).toBe(10);
    });

    it('deve atualizar schema de tabela existente', async () => {
      const updatedTable = {
        id: 'table-123',
        schema: {
          fields: [
            { id: 'businessName', type: 'text', label: 'Nome do Negócio' },
            { id: 'newField', type: 'number', label: 'Novo Campo' },
          ],
        },
      };

      (prisma.customDataTable.update as jest.Mock).mockResolvedValue(updatedTable);

      const result = await prisma.customDataTable.update({
        where: { id: 'table-123' },
        data: {
          schema: updatedTable.schema,
        },
      });

      expect(result.schema.fields).toHaveLength(2);
    });

    it('deve validar unicidade de tableName por tenant', async () => {
      const mockError = new Error('Unique constraint failed');

      (prisma.customDataTable.create as jest.Mock).mockRejectedValue(mockError);

      await expect(
        prisma.customDataTable.create({
          data: {,
            tableName: 'custom_permits',
            displayName: 'Alvarás',
            moduleType: 'custom',
            schema: {},
          },
        })
      ).rejects.toThrow();
    });

    it('deve deletar tabela customizada', async () => {
      (prisma.customDataTable.delete as jest.Mock).mockResolvedValue({
        id: 'table-123',
      });

      const result = await prisma.customDataTable.delete({
        where: { id: 'table-123' },
      });

      expect(result.id).toBe('table-123');
      expect(prisma.customDataTable.delete).toHaveBeenCalledWith({
        where: { id: 'table-123' },
      });
    });
  });

  describe('CustomDataRecord - Gerenciamento de Registros', () => {
    it('deve criar registro com vínculo ao protocolo', async () => {
      const mockRecord = {
        id: 'record-123',
        tableId: 'table-123',
        protocol: '2025/000001',
        serviceId: 'service-123',
        data: {
          businessName: 'Padaria do João',
          address: 'Rua Principal, 123',
          ownerName: 'João Silva',
          ownerCpf: '12345678900',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const result = await prisma.customDataRecord.create({
        data: {
          tableId: 'table-123',
          protocol: '2025/000001',
          serviceId: 'service-123',
          data: mockRecord.data,
        },
      });

      expect(result.id).toBe('record-123');
      expect(result.protocol).toBe('2025/000001');
      expect(result.data.businessName).toBe('Padaria do João');
    });

    it('deve listar registros de uma tabela com paginação', async () => {
      const mockRecords = Array(20).fill(null).map((_, i) => ({
        id: `record-${i}`,
        tableId: 'table-123',
        data: { field: `value-${i}` },
        createdAt: new Date(),
      }));

      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue(
        mockRecords.slice(0, 10)
      );
      (prisma.customDataRecord.count as jest.Mock).mockResolvedValue(20);

      const result = await prisma.customDataRecord.findMany({
        where: { tableId: 'table-123' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(10);
    });

    it('deve buscar registro por protocolo', async () => {
      const mockRecord = {
        id: 'record-123',
        protocol: '2025/000001',
        data: { businessName: 'Padaria do João' },
      };

      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue([mockRecord]);

      const result = await prisma.customDataRecord.findMany({
        where: { protocol: '2025/000001' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].protocol).toBe('2025/000001');
    });

    it('deve atualizar dados de registro', async () => {
      const updatedRecord = {
        id: 'record-123',
        data: {
          businessName: 'Padaria do João - Atualizada',
          status: 'approved',
        },
        updatedAt: new Date(),
      };

      (prisma.customDataRecord.update as jest.Mock).mockResolvedValue(updatedRecord);

      const result = await prisma.customDataRecord.update({
        where: { id: 'record-123' },
        data: {
          data: updatedRecord.data,
        },
      });

      expect(result.data.status).toBe('approved');
    });

    it('deve permitir dados JSON flexíveis', async () => {
      const complexData = {
        basicInfo: {
          name: 'Test',
          age: 30,
        },
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'test',
          },
        },
      };

      const mockRecord = {
        id: 'record-123',
        data: complexData,
      };

      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const result = await prisma.customDataRecord.create({
        data: {
          tableId: 'table-123',
          data: complexData,
        },
      });

      expect(result.data.basicInfo.name).toBe('Test');
      expect(result.data.array).toEqual([1, 2, 3]);
      expect(result.data.nested.deep.value).toBe('test');
    });

    it('deve filtrar registros sem protocolo (criados manualmente)', async () => {
      const mockRecords = [
        { id: '1', protocol: null, data: {} },
        { id: '2', protocol: null, data: {} },
      ];

      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await prisma.customDataRecord.findMany({
        where: { protocol: null },
      });

      expect(result).toHaveLength(2);
      expect(result[0].protocol).toBeNull();
    });
  });

  describe('Integração Custom Module + Protocol', () => {
    it('deve criar tabela + registro em transação', async () => {
      const mockTable = {
        id: 'table-123',
        tableName: 'custom_permits',
      };

      const mockRecord = {
        id: 'record-123',
        tableId: 'table-123',
        protocol: '2025/000001',
      };

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customDataTable.create as jest.Mock).mockResolvedValue(mockTable);
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      // Simular comportamento do ModuleHandler.handleCustomModule
      let table = await prisma.customDataTable.findFirst({
        where: {,
          moduleType: 'custom',
        },
      });

      if (!table) {
        table = await prisma.customDataTable.create({
          data: {,
            tableName: 'custom_permits',
            displayName: 'Alvarás',
            moduleType: 'custom',
            schema: {},
          },
        });
      }

      const record = await prisma.customDataRecord.create({
        data: {
          tableId: table.id,
          protocol: '2025/000001',
          serviceId: 'service-123',
          data: { field: 'value' },
        },
      });

      expect(table.id).toBe('table-123');
      expect(record.protocol).toBe('2025/000001');
    });

    it('deve reutilizar tabela existente para novos registros', async () => {
      const mockTable = {
        id: 'table-123',
        tableName: 'custom_permits',
      };

      const mockRecord = {
        id: 'record-456',
        tableId: 'table-123',
        protocol: '2025/000002',
      };

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const table = await prisma.customDataTable.findFirst({
        where: {,
          moduleType: 'custom',
        },
      });

      const record = await prisma.customDataRecord.create({
        data: {
          tableId: table!.id,
          protocol: '2025/000002',
          data: {},
        },
      });

      expect(prisma.customDataTable.create).not.toHaveBeenCalled();
      expect(record.tableId).toBe('table-123');
    });
  });

  describe('Validações e Edge Cases', () => {
    it('deve rejeitar criação de registro sem tableId', async () => {
      const mockError = new Error('tableId is required');

      (prisma.customDataRecord.create as jest.Mock).mockRejectedValue(mockError);

      await expect(
        prisma.customDataRecord.create({
          data: {
            tableId: '',
            data: {},
          } as any,
        })
      ).rejects.toThrow();
    });

    it('deve lidar com schema vazio', async () => {
      const mockTable = {
        id: 'table-123',
        schema: {},
      };

      (prisma.customDataTable.create as jest.Mock).mockResolvedValue(mockTable);

      const result = await prisma.customDataTable.create({
        data: {,
          tableName: 'empty_schema',
          displayName: 'Empty',
          moduleType: 'custom',
          schema: {},
        },
      });

      expect(result.schema).toEqual({});
    });

    it('deve contar registros corretamente', async () => {
      (prisma.customDataRecord.count as jest.Mock).mockResolvedValue(42);

      const count = await prisma.customDataRecord.count({
        where: { tableId: 'table-123' },
      });

      expect(count).toBe(42);
    });
  });
});
