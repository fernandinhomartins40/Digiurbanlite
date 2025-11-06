/**
 * FASE 4 - TESTES DE PERFORMANCE
 *
 * Métricas esperadas:
 * - Tempo de criação de protocolo < 500ms
 * - Query de listagem < 200ms
 * - Query de analytics < 1s
 */

import { PrismaClient } from '@prisma/client'
import { ProtocolModuleService } from '../../src/services/protocol-module.service'
import { ProtocolAnalyticsService } from '../../src/services/protocol-analytics.service'

const prisma = new PrismaClient()
const protocolService = new ProtocolModuleService()
const analyticsService = new ProtocolAnalyticsService()

describe('FASE 4: Testes de Performance', () => {
  let testTenantId: string
  let testCitizenId: string
  let testServiceId: string

  beforeAll(async () => {
    // Criar tenant de teste
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Performance Test Tenant',
        subdomain: 'perf-test',
        cnpj: '99.999.999/0001-99',
        status: 'ATIVO',
        address: 'Test Address',
        city: 'Test City',
        state: 'TS',
        zipCode: '99999-999'
      }
    })
    testTenantId = tenant.id

    // Criar cidadão
    const citizen = await prisma.citizen.create({
      data: {
        tenantId: testTenantId,
        name: 'Performance Test Citizen',
        cpf: '000.000.000-01',
        email: 'perf@test.com',
        phone: '(99) 99999-9999',
        address: 'Test Address',
        city: 'Test City',
        state: 'TS',
        zipCode: '99999-999'
      }
    })
    testCitizenId = citizen.id

    // Criar departamento
    const department = await prisma.department.create({
      data: {
        tenantId: testTenantId,
        name: 'Test Department',
        description: 'Performance testing',
        active: true
      }
    })

    // Criar serviço
    const service = await prisma.serviceSimplified.create({
      data: {
        tenantId: testTenantId,
        departmentId: department.id,
        name: 'Performance Test Service',
        description: 'Testing performance',
        moduleType: 'ATENDIMENTOS_SAUDE',
        hasModule: true,
        active: true,
        requiresDocument: false,
        estimatedDays: 15
      }
    })
    testServiceId = service.id
  })

  afterAll(async () => {
    await prisma.protocolSimplified.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.citizen.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.serviceSimplified.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.department.deleteMany({ where: { tenantId: testTenantId } })
    await prisma.tenant.delete({ where: { id: testTenantId } })
    await prisma.$disconnect()
  })

  // ========================================
  // PERFORMANCE: CRIAÇÃO DE PROTOCOLO
  // ========================================
  describe('Performance: Criação de Protocolo', () => {
    test('Criar protocolo simples < 500ms', async () => {
      const startTime = Date.now()

      const result = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId: testServiceId,
        description: 'Performance test',
        formData: {
          type: 'CONSULTA',
          specialty: 'CLINICA_GERAL',
          priority: 'NORMAL'
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(500)

      console.log(`✅ Criação de protocolo: ${duration}ms (esperado < 500ms)`)
    }, 10000)

    test('Criar 10 protocolos em sequência < 3s', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 10; i++) {
        await protocolService.createProtocolWithModule({
          tenantId: testTenantId,
          citizenId: testCitizenId,
          serviceId: testServiceId,
          description: `Bulk test ${i}`,
          formData: {
            type: 'CONSULTA',
            specialty: 'CLINICA_GERAL',
            priority: 'NORMAL'
          }
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime
      const avgPerProtocol = duration / 10

      expect(duration).toBeLessThan(3000)
      expect(avgPerProtocol).toBeLessThan(500)

      console.log(`✅ 10 protocolos: ${duration}ms (média ${avgPerProtocol.toFixed(0)}ms cada)`)
    }, 30000)
  })

  // ========================================
  // PERFORMANCE: LISTAGEM
  // ========================================
  describe('Performance: Listagem de Protocolos', () => {
    beforeAll(async () => {
      // Criar 50 protocolos para teste
      for (let i = 0; i < 50; i++) {
        await protocolService.createProtocolWithModule({
          tenantId: testTenantId,
          citizenId: testCitizenId,
          serviceId: testServiceId,
          description: `List test ${i}`,
          formData: {
            type: 'CONSULTA',
            specialty: 'CLINICA_GERAL',
            priority: i % 3 === 0 ? 'ALTA' : 'NORMAL'
          }
        })
      }
    })

    test('Listar 20 protocolos paginados < 200ms', async () => {
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: { tenantId: testTenantId },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: true,
          service: true
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200)

      console.log(`✅ Listagem paginada (20 itens): ${duration}ms (esperado < 200ms)`)
    })

    test('Buscar protocolos por status < 150ms', async () => {
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: {
          tenantId: testTenantId,
          status: 'PENDENTE'
        },
        take: 20
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(150)

      console.log(`✅ Busca por status: ${duration}ms (esperado < 150ms)`)
    })

    test('Buscar protocolos por cidadão < 150ms', async () => {
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: {
          tenantId: testTenantId,
          citizenId: testCitizenId
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(150)

      console.log(`✅ Busca por cidadão: ${duration}ms (esperado < 150ms)`)
    })
  })

  // ========================================
  // PERFORMANCE: ANALYTICS
  // ========================================
  describe('Performance: Analytics e Relatórios', () => {
    test('Gerar estatísticas gerais < 1s', async () => {
      const startTime = Date.now()

      const stats = await analyticsService.getGeneralStats(testTenantId)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(stats).toBeTruthy()
      expect(duration).toBeLessThan(1000)

      console.log(`✅ Estatísticas gerais: ${duration}ms (esperado < 1000ms)`)
    }, 15000)

    test('Análise por módulo < 800ms', async () => {
      const startTime = Date.now()

      const analysis = await analyticsService.getModuleAnalytics(
        testTenantId,
        'ATENDIMENTOS_SAUDE'
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(analysis).toBeTruthy()
      expect(duration).toBeLessThan(800)

      console.log(`✅ Análise por módulo: ${duration}ms (esperado < 800ms)`)
    }, 15000)

    test('Análise de SLA < 600ms', async () => {
      const startTime = Date.now()

      const slaAnalysis = await analyticsService.getSLACompliance(testTenantId)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(slaAnalysis).toBeTruthy()
      expect(duration).toBeLessThan(600)

      console.log(`✅ Análise de SLA: ${duration}ms (esperado < 600ms)`)
    }, 15000)
  })

  // ========================================
  // PERFORMANCE: OPERAÇÕES COMPOSTAS
  // ========================================
  describe('Performance: Operações Compostas', () => {
    test('Criar + Aprovar protocolo < 700ms', async () => {
      const startTime = Date.now()

      const createResult = await protocolService.createProtocolWithModule({
        tenantId: testTenantId,
        citizenId: testCitizenId,
        serviceId: testServiceId,
        description: 'Approval performance test',
        formData: {
          type: 'CONSULTA',
          specialty: 'CLINICA_GERAL',
          priority: 'NORMAL'
        }
      })

      await protocolService.approveProtocol({
        protocolId: createResult.protocol!.id,
        tenantId: testTenantId,
        approvedBy: 'ADMIN_TEST',
        notes: 'Performance test approval'
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(700)

      console.log(`✅ Criar + Aprovar: ${duration}ms (esperado < 700ms)`)
    }, 10000)

    test('Buscar protocolo completo com relacionamentos < 100ms', async () => {
      const protocols = await prisma.protocolSimplified.findMany({
        where: { tenantId: testTenantId },
        take: 1
      })

      const startTime = Date.now()

      await prisma.protocolSimplified.findUnique({
        where: { id: protocols[0].id },
        include: {
          citizen: true,
          service: {
            include: {
              department: true
            }
          },
          currentStage: true
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)

      console.log(`✅ Busca completa com joins: ${duration}ms (esperado < 100ms)`)
    })
  })

  // ========================================
  // PERFORMANCE: STRESS TEST
  // ========================================
  describe('Performance: Stress Tests', () => {
    test('Criar 100 protocolos em lote < 30s', async () => {
      const startTime = Date.now()

      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          protocolService.createProtocolWithModule({
            tenantId: testTenantId,
            citizenId: testCitizenId,
            serviceId: testServiceId,
            description: `Stress test ${i}`,
            formData: {
              type: 'CONSULTA',
              specialty: 'CLINICA_GERAL',
              priority: 'NORMAL'
            }
          })
        )

        // Criar em batches de 10 para não sobrecarregar
        if (promises.length === 10) {
          await Promise.all(promises)
          promises.length = 0
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises)
      }

      const endTime = Date.now()
      const duration = endTime - startTime
      const avgPerProtocol = duration / 100

      expect(duration).toBeLessThan(30000)

      console.log(`✅ 100 protocolos em lote: ${duration}ms (média ${avgPerProtocol.toFixed(0)}ms cada)`)
    }, 60000)
  })

  // ========================================
  // PERFORMANCE: ÍNDICES
  // ========================================
  describe('Performance: Verificação de Índices', () => {
    test('Query por tenantId deve usar índice', async () => {
      // Este teste verifica indiretamente se os índices estão funcionando
      // através da performance da query
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: { tenantId: testTenantId },
        take: 50
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Com índice adequado, deve ser muito rápido mesmo com muitos registros
      expect(duration).toBeLessThan(100)

      console.log(`✅ Query indexada por tenantId: ${duration}ms`)
    })

    test('Query composta (tenantId + status) deve usar índice', async () => {
      const startTime = Date.now()

      await prisma.protocolSimplified.findMany({
        where: {
          tenantId: testTenantId,
          status: 'PENDENTE'
        },
        take: 50
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)

      console.log(`✅ Query indexada composta: ${duration}ms`)
    })
  })
})
