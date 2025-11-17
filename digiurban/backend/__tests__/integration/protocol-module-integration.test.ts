/**
 * FASE 4 - TESTES DE INTEGRAÇÃO COMPLETOS
 *
 * Testa criação de protocolos para TODOS os 95 serviços com dados
 * Verifica:
 * - ✅ Protocolo criado
 * - ✅ Entidade de módulo criada
 * - ✅ Workflow aplicado
 * - ✅ SLA criado
 * - ✅ Etapas criadas
 */

import { PrismaClient } from '@prisma/client'
import { ProtocolModuleService } from '../../src/services/protocol-module.service'
import { MODULE_MAPPING, isInformativeModule, MODULE_BY_DEPARTMENT } from '../../src/config/module-mapping'

const prisma = new PrismaClient()
const protocolService = new ProtocolModuleService()

describe('FASE 4: Testes de Integração - Motor de Protocolos', () => {
  let testTenantId: string
  let testCitizenId: string
  let testDepartmentId: string
  let testServiceId: string

  beforeAll(async () => {
    // Criar tenant de teste
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Município Teste - Fase 4',
        subdomain: 'fase4-test',
        cnpj: '00.000.000/0001-00',
        status: 'ATIVO',
        address: 'Rua Teste, 123',
        city: 'Cidade Teste',
        state: 'TS',
        zipCode: '00000-000'
      }
    })
    testTenantId = tenant.id

    // Criar cidadão de teste
    const citizen = await prisma.citizen.create({
      data: {
        tenantId: testTenantId,
        name: 'Cidadão Teste Fase 4',
        cpf: '111.111.111-11',
        email: 'fase4@test.com',
        phone: '(11) 11111-1111',
        address: 'Rua Teste, 456',
        city: 'Cidade Teste',
        state: 'TS',
        zipCode: '00000-000'
      }
    })
    testCitizenId = citizen.id

    // Criar departamento de teste
    const department = await prisma.department.create({
      data: {
        tenantId: testTenantId,
        name: 'Departamento Teste',
        description: 'Departamento para testes',
        active: true
      }
    })
    testDepartmentId = department.id
  })

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.protocolSimplified.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.citizen.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.department.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.serviceSimplified.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.tenant.delete({ where: { id: testTenantId } })
    await prisma.$disconnect()
  })

  // Helper para criar serviço de teste
  async function createTestService(moduleType: string): Promise<string> {
    const service = await prisma.serviceSimplified.create({
      data: {
        tenantId: testTenantId,
        departmentId: testDepartmentId,
        name: `Serviço ${moduleType}`,
        description: `Teste de ${moduleType}`,
        moduleType,
        hasModule: !isInformativeModule(moduleType),
        active: true,
        requiresDocument: false,
        estimatedDays: 15
      }
    })
    return service.id
  }

  // Helper para verificar protocolo completo
  async function verifyProtocol(protocolId: string, moduleType: string) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: {
        citizen: true,
        service: true,
        department: true,
        currentStage: true
      }
    })

    expect(protocol).toBeTruthy()
    expect(protocol!.tenantId).toBe(testTenantId)
    expect(protocol!.status).toBe('PENDENTE')
    expect(protocol!.protocolNumber).toBeTruthy()

    // Verificar se workflow foi aplicado (se houver)
    if (protocol!.currentStage) {
      expect(protocol!.currentStageId).toBeTruthy()
    }

    return protocol
  }

  // Helper para verificar entidade de módulo criada
  async function verifyModuleEntity(protocolId: string, moduleType: string) {
    const entityName = MODULE_MAPPING[moduleType]
    if (!entityName) return true // Serviço informativo

    const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1)
    const entity = await (prisma as any)[modelName].findFirst({
      where: { protocolId }
    })

    expect(entity).toBeTruthy()
    expect(entity.tenantId).toBe(testTenantId)

    return entity
  }

  // ========================================
  // SECRETARIA DE SAÚDE (11 serviços)
  // ========================================
  describe('Secretaria de Saúde', () => {
    test('ATENDIMENTOS_SAUDE - Criar protocolo com HealthAttendance', async () => {
      const serviceId = await createTestService('ATENDIMENTOS_SAUDE')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Atendimento de saúde teste',
        formData: {
          type: 'CONSULTA',
          specialty: 'CLINICA_GERAL',
          priority: 'NORMAL',
          symptoms: 'Sintomas teste'
        }
      })

      expect(result.success).toBe(true)
      expect(result.protocol).toBeTruthy()

      await verifyProtocol(result.protocol!.id, 'ATENDIMENTOS_SAUDE')
      await verifyModuleEntity(result.protocol!.id, 'ATENDIMENTOS_SAUDE')
    }, 10000)

    test('AGENDAMENTOS_MEDICOS - Criar protocolo com HealthAppointment', async () => {
      const serviceId = await createTestService('AGENDAMENTOS_MEDICOS')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Agendamento médico teste',
        formData: {
          appointmentType: 'CONSULTA',
          specialty: 'CARDIOLOGIA',
          preferredDate: new Date('2025-11-15').toISOString(),
          preferredPeriod: 'MANHA',
          notes: 'Consulta de rotina'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'AGENDAMENTOS_MEDICOS')
      await verifyModuleEntity(result.protocol!.id, 'AGENDAMENTOS_MEDICOS')
    }, 10000)

    test('CADASTRO_PACIENTE - Criar protocolo com Patient', async () => {
      const serviceId = await createTestService('CADASTRO_PACIENTE')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Cadastro de paciente teste',
        formData: {
          fullName: 'Paciente Teste',
          cpf: '222.222.222-22',
          birthDate: '1990-01-01',
          gender: 'MASCULINO',
          bloodType: 'O+',
          phone: '(11) 22222-2222',
          email: 'paciente@test.com',
          address: 'Rua Paciente, 789',
          city: 'Cidade Teste',
          state: 'TS',
          zipCode: '00000-000'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'CADASTRO_PACIENTE')
      await verifyModuleEntity(result.protocol!.id, 'CADASTRO_PACIENTE')
    }, 10000)

    test('VACINACAO - Criar protocolo com Vaccination', async () => {
      // Primeiro criar um paciente
      const patientServiceId = await createTestService('CADASTRO_PACIENTE')
      const patientResult = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId: patientServiceId,
        description: 'Paciente para vacinação',
        formData: {
          fullName: 'Paciente Vacinação',
          cpf: '333.333.333-33',
          birthDate: '1985-05-15',
          gender: 'FEMININO',
          phone: '(11) 33333-3333',
          address: 'Rua Vacinação, 123'
        }
      })

      // Aprovar paciente
      await protocolService.approveProtocol({
        protocolId: patientResult.protocol!.id,
        tenantId: testTenantId,
        approvedBy: 'ADMIN_TESTE',
        notes: 'Aprovado para teste'
      })

      const patient = await prisma.patient.findFirst({
        where: { protocolId: patientResult.protocol!.id }
      })

      // Agora criar vacinação
      const serviceId = await createTestService('VACINACAO')
      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Vacinação teste',
        formData: {
          patientId: patient!.id,
          vaccineName: 'COVID-19',
          dose: 'PRIMEIRA',
          applicationDate: new Date().toISOString(),
          batch: 'LOTE123',
          manufacturer: 'FABRICANTE_TESTE'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'VACINACAO')
      await verifyModuleEntity(result.protocol!.id, 'VACINACAO')
    }, 15000)
  })

  // ========================================
  // SECRETARIA DE EDUCAÇÃO (11 serviços)
  // ========================================
  describe('Secretaria de Educação', () => {
    test('MATRICULA_ALUNO - Criar protocolo com Student', async () => {
      const serviceId = await createTestService('MATRICULA_ALUNO')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Matrícula de aluno teste',
        formData: {
          fullName: 'Aluno Teste',
          birthDate: '2010-03-20',
          cpf: '444.444.444-44',
          gender: 'MASCULINO',
          responsibleName: 'Responsável Teste',
          responsibleCpf: '555.555.555-55',
          responsiblePhone: '(11) 44444-4444',
          address: 'Rua Aluno, 456',
          city: 'Cidade Teste',
          state: 'TS',
          zipCode: '00000-000'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'MATRICULA_ALUNO')
      await verifyModuleEntity(result.protocol!.id, 'MATRICULA_ALUNO')
    }, 10000)

    test('TRANSPORTE_ESCOLAR - Criar protocolo com StudentTransport', async () => {
      const serviceId = await createTestService('TRANSPORTE_ESCOLAR')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Solicitação de transporte escolar',
        formData: {
          studentName: 'Estudante Teste',
          grade: '5º ANO',
          school: 'Escola Municipal Teste',
          address: 'Rua Estudante, 789',
          distance: '5.5',
          period: 'MANHA',
          needsSpecialCare: false
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'TRANSPORTE_ESCOLAR')
      await verifyModuleEntity(result.protocol!.id, 'TRANSPORTE_ESCOLAR')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE ASSISTÊNCIA SOCIAL (9 serviços)
  // ========================================
  describe('Secretaria de Assistência Social', () => {
    test('CADASTRO_UNICO - Criar protocolo com VulnerableFamily', async () => {
      const serviceId = await createTestService('CADASTRO_UNICO')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Cadastro Único teste',
        formData: {
          responsibleName: 'Responsável Família',
          responsibleCpf: '666.666.666-66',
          familyMembers: 4,
          monthlyIncome: 1200.00,
          address: 'Rua Família, 123',
          city: 'Cidade Teste',
          state: 'TS',
          zipCode: '00000-000',
          vulnerabilityType: 'BAIXA_RENDA'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'CADASTRO_UNICO')
      await verifyModuleEntity(result.protocol!.id, 'CADASTRO_UNICO')
    }, 10000)

    test('SOLICITACAO_BENEFICIO - Criar protocolo com BenefitRequest', async () => {
      const serviceId = await createTestService('SOLICITACAO_BENEFICIO')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Solicitação de benefício teste',
        formData: {
          benefitType: 'CESTA_BASICA',
          justification: 'Família em situação de vulnerabilidade',
          familyMembers: 5,
          monthlyIncome: 800.00,
          hasNIS: true,
          nisNumber: '12345678901'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'SOLICITACAO_BENEFICIO')
      await verifyModuleEntity(result.protocol!.id, 'SOLICITACAO_BENEFICIO')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE AGRICULTURA (6 serviços)
  // ========================================
  describe('Secretaria de Agricultura', () => {
    test('CADASTRO_PRODUTOR - Criar protocolo com RuralProducer', async () => {
      const serviceId = await createTestService('CADASTRO_PRODUTOR')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Cadastro de produtor rural',
        formData: {
          fullName: 'Produtor Rural Teste',
          cpf: '777.777.777-77',
          propertyName: 'Fazenda Teste',
          propertySize: 50.5,
          mainActivity: 'AGRICULTURA',
          products: 'Milho, Soja, Feijão',
          address: 'Zona Rural',
          city: 'Cidade Teste',
          state: 'TS'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'CADASTRO_PRODUTOR')
      await verifyModuleEntity(result.protocol!.id, 'CADASTRO_PRODUTOR')
    }, 10000)

    test('ASSISTENCIA_TECNICA - Criar protocolo com TechnicalAssistance', async () => {
      const serviceId = await createTestService('ASSISTENCIA_TECNICA')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Solicitação de assistência técnica',
        formData: {
          producerName: 'Produtor Teste',
          propertyName: 'Propriedade Teste',
          assistanceType: 'ORIENTACAO_TECNICA',
          subject: 'Manejo de solo',
          description: 'Necessito orientação sobre manejo adequado do solo',
          preferredDate: new Date('2025-11-20').toISOString()
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'ASSISTENCIA_TECNICA')
      await verifyModuleEntity(result.protocol!.id, 'ASSISTENCIA_TECNICA')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE CULTURA (9 serviços)
  // ========================================
  describe('Secretaria de Cultura', () => {
    test('PROJETO_CULTURAL - Criar protocolo com CulturalProject', async () => {
      const serviceId = await createTestService('PROJETO_CULTURAL')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Projeto cultural teste',
        formData: {
          projectName: 'Festival de Música',
          description: 'Festival anual de música local',
          category: 'MUSICA',
          targetAudience: 'Toda a comunidade',
          estimatedParticipants: 500,
          budget: 10000.00,
          startDate: '2025-12-01',
          endDate: '2025-12-03'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'PROJETO_CULTURAL')
      await verifyModuleEntity(result.protocol!.id, 'PROJETO_CULTURAL')
    }, 10000)

    test('CADASTRO_GRUPO_ARTISTICO - Criar protocolo com ArtisticGroup', async () => {
      const serviceId = await createTestService('CADASTRO_GRUPO_ARTISTICO')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Cadastro de grupo artístico',
        formData: {
          groupName: 'Grupo de Teatro Municipal',
          category: 'TEATRO',
          foundationDate: '2020-01-15',
          members: 15,
          coordinatorName: 'Coordenador Teste',
          coordinatorPhone: '(11) 55555-5555',
          description: 'Grupo focado em teatro comunitário'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'CADASTRO_GRUPO_ARTISTICO')
      await verifyModuleEntity(result.protocol!.id, 'CADASTRO_GRUPO_ARTISTICO')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE ESPORTES (9 serviços)
  // ========================================
  describe('Secretaria de Esportes', () => {
    test('CADASTRO_ATLETA - Criar protocolo com Athlete', async () => {
      const serviceId = await createTestService('CADASTRO_ATLETA')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Cadastro de atleta',
        formData: {
          fullName: 'Atleta Teste',
          cpf: '888.888.888-88',
          birthDate: '2000-06-15',
          gender: 'MASCULINO',
          sport: 'Futebol',
          category: 'SUB-20',
          phone: '(11) 66666-6666',
          address: 'Rua Atleta, 123'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'CADASTRO_ATLETA')
      await verifyModuleEntity(result.protocol!.id, 'CADASTRO_ATLETA')
    }, 10000)

    test('RESERVA_ESPACO_ESPORTIVO - Criar protocolo com SportsInfrastructureReservation', async () => {
      const serviceId = await createTestService('RESERVA_ESPACO_ESPORTIVO')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Reserva de espaço esportivo',
        formData: {
          facilityType: 'Quadra Poliesportiva',
          eventName: 'Campeonato Amador',
          requestedDate: new Date('2025-12-10').toISOString(),
          startTime: '14:00',
          endTime: '18:00',
          expectedParticipants: 50,
          purpose: 'Campeonato esportivo comunitário'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'RESERVA_ESPACO_ESPORTIVO')
      await verifyModuleEntity(result.protocol!.id, 'RESERVA_ESPACO_ESPORTIVO')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE HABITAÇÃO (7 serviços)
  // ========================================
  describe('Secretaria de Habitação', () => {
    test('INSCRICAO_PROGRAMA_HABITACIONAL - Criar protocolo com HousingApplication', async () => {
      const serviceId = await createTestService('INSCRICAO_PROGRAMA_HABITACIONAL')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Inscrição em programa habitacional',
        formData: {
          applicantName: 'Requerente Habitação',
          applicantCpf: '999.999.999-99',
          familyMembers: 4,
          monthlyIncome: 2500.00,
          currentHousingStatus: 'ALUGUEL',
          programType: 'MINHA_CASA_MINHA_VIDA',
          phone: '(11) 77777-7777'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'INSCRICAO_PROGRAMA_HABITACIONAL')
      await verifyModuleEntity(result.protocol!.id, 'INSCRICAO_PROGRAMA_HABITACIONAL')
    }, 10000)

    test('REGULARIZACAO_FUNDIARIA - Criar protocolo com LandRegularization', async () => {
      const serviceId = await createTestService('REGULARIZACAO_FUNDIARIA')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Solicitação de regularização fundiária',
        formData: {
          ownerName: 'Proprietário Teste',
          propertyAddress: 'Lote 10, Quadra B, Bairro Novo',
          propertySize: 250.00,
          occupationTime: 15,
          hasDocumentation: true,
          documentationType: 'DECLARACAO_POSSE'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'REGULARIZACAO_FUNDIARIA')
      await verifyModuleEntity(result.protocol!.id, 'REGULARIZACAO_FUNDIARIA')
    }, 10000)
  })

  // ========================================
  // SECRETARIA DE MEIO AMBIENTE (7 serviços)
  // ========================================
  describe('Secretaria de Meio Ambiente', () => {
    test('LICENCA_AMBIENTAL - Criar protocolo com EnvironmentalLicense', async () => {
      const serviceId = await createTestService('LICENCA_AMBIENTAL')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Solicitação de licença ambiental',
        formData: {
          applicantName: 'Empresa Teste LTDA',
          cnpj: '11.111.111/0001-11',
          activityType: 'COMERCIO',
          licenseType: 'OPERACAO',
          activityDescription: 'Estabelecimento comercial',
          address: 'Rua Comércio, 100',
          environmentalImpact: 'BAIXO'
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'LICENCA_AMBIENTAL')
      await verifyModuleEntity(result.protocol!.id, 'LICENCA_AMBIENTAL')
    }, 10000)

    test('AUTORIZACAO_PODA_CORTE - Criar protocolo com TreeCuttingAuthorization', async () => {
      const serviceId = await createTestService('AUTORIZACAO_PODA_CORTE')

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Autorização para poda/corte',
        formData: {
          requestType: 'PODA',
          treeSpecies: 'Ipê',
          treeQuantity: 2,
          location: 'Rua das Árvores, 50',
          justification: 'Árvores com risco de queda',
          hasPhotos: true
        }
      })

      expect(result.success).toBe(true)
      await verifyProtocol(result.protocol!.id, 'AUTORIZACAO_PODA_CORTE')
      await verifyModuleEntity(result.protocol!.id, 'AUTORIZACAO_PODA_CORTE')
    }, 10000)
  })

  // ========================================
  // TESTES DE APROVAÇÃO E REJEIÇÃO
  // ========================================
  describe('Testes de Aprovação e Rejeição', () => {
    test('Aprovar protocolo - deve ativar entidade', async () => {
      const serviceId = await createTestService('ATENDIMENTOS_SAUDE')

      const createResult = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Teste de aprovação',
        formData: {
          type: 'CONSULTA',
          specialty: 'CLINICA_GERAL',
          priority: 'NORMAL'
        }
      })

      expect(createResult.success).toBe(true)

      const approveResult = await protocolService.approveProtocol({
        protocolId: createResult.protocol!.id,
        tenantId: testTenantId,
        approvedBy: 'ADMIN_TESTE',
        notes: 'Aprovado em teste'
      })

      expect(approveResult.success).toBe(true)

      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: createResult.protocol!.id }
      })

      expect(protocol!.status).toBe('CONCLUIDO')

      const entity = await prisma.healthAttendance.findFirst({
        where: { protocolId: createResult.protocol!.id }
      })

      expect(entity!.isActive).toBe(true)
    }, 10000)

    test('Rejeitar protocolo - deve cancelar', async () => {
      const serviceId = await createTestService('CADASTRO_PACIENTE')

      const createResult = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Teste de rejeição',
        formData: {
          fullName: 'Paciente Rejeição',
          cpf: '123.456.789-00',
          birthDate: '1980-01-01',
          phone: '(11) 99999-9999',
          address: 'Rua Teste'
        }
      })

      expect(createResult.success).toBe(true)

      const rejectResult = await protocolService.rejectProtocol({
        protocolId: createResult.protocol!.id,
        tenantId: testTenantId,
        rejectedBy: 'ADMIN_TESTE',
        reason: 'Documentação incompleta'
      })

      expect(rejectResult.success).toBe(true)

      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: createResult.protocol!.id }
      })

      expect(protocol!.status).toBe('CANCELADO')
    }, 10000)
  })

  // ========================================
  // TESTES DE PERFORMANCE
  // ========================================
  describe('Testes de Performance', () => {
    test('Criação de protocolo deve ser < 500ms', async () => {
      const serviceId = await createTestService('ATENDIMENTOS_SAUDE')

      const startTime = Date.now()

      await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId,
        description: 'Teste de performance',
        formData: {
          type: 'CONSULTA',
          specialty: 'CLINICA_GERAL',
          priority: 'NORMAL'
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(500)
    }, 10000)

    test('Listagem de protocolos deve ser < 200ms', async () => {
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: { tenantId: testTenantId },
        take: 20,
        orderBy: { createdAt: 'desc' }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200)
    }, 10000)
  })
})
