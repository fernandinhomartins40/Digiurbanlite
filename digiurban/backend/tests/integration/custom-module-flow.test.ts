/**
 * ============================================================================
 * TESTES DE INTEGRAÇÃO: MÓDULO CUSTOMIZADO → DADOS → CONSULTA
 * ============================================================================
 *
 * Testa o fluxo completo de módulos customizados:
 * 1. Admin cria tabela customizada
 * 2. Admin define schema de campos
 * 3. Cidadão cria solicitação que persiste na tabela customizada
 * 4. Admin consulta e gerencia dados
 */

import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma');

describe('Integração: Módulos Customizados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FLUXO COMPLETO: Criar Módulo → Usar → Consultar', () => {
    it('deve criar tabela customizada e processar dados', async () => {
      // 1. ADMIN: Criar tabela customizada
      const mockTable = {
        id: 'table-custom-001',
        tableName: 'custom_business_permits',
        displayName: 'Alvarás de Funcionamento',
        moduleType: 'custom',
        schema: {
          fields: [
            { id: 'businessName', label: 'Nome do Negócio', type: 'text', required: true },
            { id: 'cnpj', label: 'CNPJ', type: 'text', mask: '99.999.999/9999-99' },
            { id: 'address', label: 'Endereço', type: 'textarea', required: true },
            { id: 'businessType', label: 'Tipo de Negócio', type: 'select', options: ['Comércio', 'Serviços', 'Indústria'] },
            { id: 'area', label: 'Área (m²)', type: 'number' },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customDataTable.create as jest.Mock).mockResolvedValue(mockTable);

      const createTableResponse = await request(app)
        .post('/api/admin/custom-modules/tables')
        .send({
          tableName: 'custom_business_permits',
          displayName: 'Alvarás de Funcionamento',
          moduleType: 'custom',
          schema: mockTable.schema,
        })
        .expect(201);

      expect(createTableResponse.body.table.id).toBe('table-custom-001');
      expect(createTableResponse.body.table.schema.fields).toHaveLength(5);

      // 2. ADMIN: Criar serviço vinculado à tabela customizada
      (prisma.service.create as jest.Mock).mockResolvedValue({
        id: 'service-custom-001',
        name: 'Solicitar Alvará',
        moduleType: 'custom',
        moduleEntity: 'custom_business_permits',
        isActive: true,
      });

      const createServiceResponse = await request(app)
        .post('/api/admin/services')
        .send({
          name: 'Solicitar Alvará de Funcionamento',
          description: 'Serviço para solicitar alvará',
          moduleType: 'custom',
          moduleEntity: 'custom_business_permits',
          customDataTableId: 'table-custom-001',
        })
        .expect(201);

      expect(createServiceResponse.body.service.moduleType).toBe('custom');

      // 3. CIDADÃO: Fazer solicitação usando o serviço customizado
      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'service-custom-001',
        moduleType: 'custom',
        moduleEntity: 'custom_business_permits',
      });

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue(mockTable);

      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback({
          protocol: {
            create: jest.fn().mockResolvedValue({
              id: 'protocol-123',
              number: '2025/000001',
              status: 'VINCULADO',
            }),
          },
          customDataRecord: {
            create: jest.fn().mockResolvedValue({
              id: 'record-123',
              tableId: 'table-custom-001',
              protocol: '2025/000001',
              data: {
                businessName: 'Padaria do João',
                cnpj: '12.345.678/0001-99',
                address: 'Rua Principal, 123',
                businessType: 'Comércio',
                area: 50,
              },
            }),
          },
        })
      );

      const requestResponse = await request(app)
        .post('/api/citizen/services/service-custom-001/request')
        .send({
          businessName: 'Padaria do João',
          cnpj: '12.345.678/0001-99',
          address: 'Rua Principal, 123',
          businessType: 'Comércio',
          area: 50,
        })
        .expect(201);

      expect(requestResponse.body.protocol.number).toBe('2025/000001');

      // 4. ADMIN: Consultar dados da tabela customizada
      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'record-123',
          tableId: 'table-custom-001',
          protocol: '2025/000001',
          serviceId: 'service-custom-001',
          data: {
            businessName: 'Padaria do João',
            cnpj: '12.345.678/0001-99',
            address: 'Rua Principal, 123',
            businessType: 'Comércio',
            area: 50,
          },
          createdAt: new Date(),
        },
      ]);

      (prisma.customDataRecord.count as jest.Mock).mockResolvedValue(1);

      const queryResponse = await request(app)
        .get('/api/admin/custom-modules/tables/table-custom-001/records')
        .expect(200);

      expect(queryResponse.body.records).toHaveLength(1);
      expect(queryResponse.body.records[0].data.businessName).toBe('Padaria do João');
      expect(queryResponse.body.records[0].protocol).toBe('2025/000001');
    });
  });

  describe('Criação de Tabelas Customizadas', () => {
    it('deve criar tabela com schema complexo', async () => {
      const complexSchema = {
        fields: [
          { id: 'text_field', type: 'text', label: 'Texto' },
          { id: 'number_field', type: 'number', label: 'Número' },
          { id: 'date_field', type: 'date', label: 'Data' },
          { id: 'select_field', type: 'select', label: 'Seleção', options: ['A', 'B', 'C'] },
          { id: 'checkbox_field', type: 'checkbox', label: 'Checkbox' },
          { id: 'file_field', type: 'file', label: 'Arquivo' },
        ],
        validations: {
          text_field: { maxLength: 100 },
          number_field: { min: 0, max: 1000 },
        },
      };

      (prisma.customDataTable.create as jest.Mock).mockResolvedValue({
        id: 'table-001',
        schema: complexSchema,
      });

      const response = await request(app)
        .post('/api/admin/custom-modules/tables')
        .send({
          tableName: 'complex_table',
          displayName: 'Tabela Complexa',
          moduleType: 'custom',
          schema: complexSchema,
        })
        .expect(201);

      expect(response.body.table.schema.fields).toHaveLength(6);
      expect(response.body.table.schema.validations).toBeDefined();
    });

    it('deve validar unicidade de tableName no tenant', async () => {
      (prisma.customDataTable.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on tableName')
      );

      const response = await request(app)
        .post('/api/admin/custom-modules/tables')
        .send({
          tableName: 'existing_table',
          displayName: 'Já Existe',
          moduleType: 'custom',
          schema: {},
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('deve listar todas as tabelas do tenant com contadores', async () => {
      (prisma.customDataTable.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'table-1',
          tableName: 'table_1',
          displayName: 'Tabela 1',
          _count: { records: 15 },
        },
        {
          id: 'table-2',
          tableName: 'table_2',
          displayName: 'Tabela 2',
          _count: { records: 8 },
        },
      ]);

      const response = await request(app)
        .get('/api/admin/custom-modules/tables')
        .expect(200);

      expect(response.body.tables).toHaveLength(2);
      expect(response.body.tables[0]._count.records).toBe(15);
    });
  });

  describe('Gerenciamento de Registros', () => {
    it('deve criar registro manualmente (sem protocolo)', async () => {
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue({
        id: 'record-manual-001',
        tableId: 'table-001',
        protocol: null,
        data: { field1: 'value1' },
      });

      const response = await request(app)
        .post('/api/admin/custom-modules/tables/table-001/records')
        .send({
          data: { field1: 'value1', field2: 'value2' },
        })
        .expect(201);

      expect(response.body.record.protocol).toBeNull();
    });

    it('deve atualizar registro existente', async () => {
      (prisma.customDataRecord.findUnique as jest.Mock).mockResolvedValue({
        id: 'record-001',
        data: { status: 'pending' },
      });

      (prisma.customDataRecord.update as jest.Mock).mockResolvedValue({
        id: 'record-001',
        data: { status: 'approved', approvedBy: 'admin-123' },
      });

      const response = await request(app)
        .put('/api/admin/custom-modules/records/record-001')
        .send({
          data: { status: 'approved', approvedBy: 'admin-123' },
        })
        .expect(200);

      expect(response.body.record.data.status).toBe('approved');
    });

    it('deve deletar registro', async () => {
      (prisma.customDataRecord.delete as jest.Mock).mockResolvedValue({
        id: 'record-001',
      });

      await request(app)
        .delete('/api/admin/custom-modules/records/record-001')
        .expect(200);

      expect(prisma.customDataRecord.delete).toHaveBeenCalledWith({
        where: { id: 'record-001' },
      });
    });

    it('deve buscar registros por protocolo', async () => {
      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'record-001',
          protocol: '2025/000123',
          data: {},
        },
      ]);

      const response = await request(app)
        .get('/api/admin/custom-modules/records?protocol=2025/000123')
        .expect(200);

      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0].protocol).toBe('2025/000123');
    });
  });

  describe('Validações de Dados', () => {
    it('deve validar dados conforme schema da tabela', async () => {
      const schema = {
        fields: [
          { id: 'required_field', type: 'text', required: true },
          { id: 'email_field', type: 'email', required: true },
          { id: 'number_field', type: 'number', min: 0, max: 100 },
        ],
      };

      (prisma.customDataTable.findUnique as jest.Mock).mockResolvedValue({
        id: 'table-001',
        schema,
      });

      // Dados inválidos (campo obrigatório faltando)
      const response = await request(app)
        .post('/api/admin/custom-modules/tables/table-001/records')
        .send({
          data: {
            email_field: 'invalid-email', // Email inválido
            number_field: 150, // Acima do máximo
          },
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve aceitar dados JSON flexíveis', async () => {
      (prisma.customDataRecord.create as jest.Mock).mockResolvedValue({
        id: 'record-001',
        data: {
          nested: {
            deep: {
              value: 'test',
            },
          },
          array: [1, 2, 3],
        },
      });

      const response = await request(app)
        .post('/api/admin/custom-modules/tables/table-001/records')
        .send({
          data: {
            nested: { deep: { value: 'test' } },
            array: [1, 2, 3],
          },
        })
        .expect(201);

      expect(response.body.record.data.nested.deep.value).toBe('test');
    });
  });

  describe('Integração com Protocolos', () => {
    it('deve vincular automaticamente registro ao protocolo', async () => {
      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        moduleType: 'custom',
        moduleEntity: 'custom_table',
      });

      (prisma.customDataTable.findFirst as jest.Mock).mockResolvedValue({
        id: 'table-001',
      });

      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback({
          protocol: {
            create: jest.fn().mockResolvedValue({ number: '2025/000555' }),
          },
          customDataRecord: {
            create: jest.fn().mockImplementation((args) => {
              expect(args.data.protocol).toBe('2025/000555');
              return Promise.resolve({
                id: 'record-001',
                protocol: '2025/000555',
              });
            }),
          },
        })
      );

      await request(app)
        .post('/api/citizen/services/service-001/request')
        .send({ data: 'test' })
        .expect(201);
    });

    it('deve consultar todos os registros vinculados a um protocolo', async () => {
      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue([
        { id: '1', protocol: '2025/000100', tableId: 'table-1' },
        { id: '2', protocol: '2025/000100', tableId: 'table-2' },
      ]);

      const response = await request(app)
        .get('/api/admin/protocols/2025/000100/custom-data')
        .expect(200);

      expect(response.body.records).toHaveLength(2);
    });
  });

  describe('Exportação de Dados', () => {
    it('deve exportar dados da tabela customizada', async () => {
      (prisma.customDataRecord.findMany as jest.Mock).mockResolvedValue([
        { id: '1', data: { field1: 'value1' }, createdAt: new Date() },
        { id: '2', data: { field1: 'value2' }, createdAt: new Date() },
      ]);

      const response = await request(app)
        .get('/api/admin/custom-modules/tables/table-001/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });
});
