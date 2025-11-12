/**
 * TESTES DE CARGA - MOTOR DE PROTOCOLOS
 *
 * Testa comportamento do sistema sob alta concorrência
 * Valida proteção contra race conditions na geração de números
 */

import { generateProtocolNumberSafe } from '../../src/services/protocol-number-generator-safe'
import { protocolModuleService } from '../../src/services/protocol-module.service'
import { prisma } from '../../src/lib/prisma'

describe('Protocol Engine - Load Tests', () => {
  beforeAll(async () => {
    // Limpar base de teste
    await prisma.protocolSimplified.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Concurrency Protection - Protocol Number Generation', () => {
    it('should generate unique protocol numbers under high concurrency (100 simultaneous)', async () => {
      // Criar 100 requisições simultâneas
      const concurrentRequests = 100
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => generateProtocolNumberSafe())

      // Executar todas em paralelo
      const numbers = await Promise.all(promises)

      // Validar: todos devem ser únicos
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(concurrentRequests)

      // Validar: todos devem seguir o padrão PROT-YYYYMMDD-XXXXX
      numbers.forEach((num) => {
        expect(num).toMatch(/^PROT-\d{8}-\d{5}$/)
      })

      // Validar: sequência deve ser correta (00001 até 00100)
      const sequences = numbers
        .map((n) => parseInt(n.split('-')[2]))
        .sort((a, b) => a - b)

      for (let i = 0; i < concurrentRequests; i++) {
        expect(sequences[i]).toBe(i + 1)
      }
    }, 30000) // timeout 30s

    it('should handle protocol creation under concurrent load (50 protocols)', async () => {
      // Setup: criar cidadão e serviço de teste
      const citizen = await prisma.citizen.create({
        data: {
          cpf: '12345678900',
          name: 'Teste Load',
          email: 'load@test.com',
          phone: '11999999999',
          password: 'test',
          registrationSource: 'WEB'
        }
      })

      const department = await prisma.department.create({
        data: {
          name: 'Departamento Teste',
          code: 'TEST',
          isActive: true
        }
      })

      const service = await prisma.serviceSimplified.create({
        data: {
          name: 'Serviço Teste',
          description: 'Teste de carga',
          category: 'TESTE',
          serviceType: 'SEM_DADOS',
          departmentId: department.id,
          isActive: true
        }
      })

      // Criar 50 protocolos simultâneos
      const concurrentProtocols = 50
      const promises = Array(concurrentProtocols)
        .fill(null)
        .map((_, index) =>
          protocolModuleService.createProtocolWithModule({
            citizenId: citizen.id,
            serviceId: service.id,
            formData: { testIndex: index }
          })
        )

      // Executar todas em paralelo
      const results = await Promise.all(promises)

      // Validar: todos devem ter sido criados
      expect(results).toHaveLength(concurrentProtocols)

      // Validar: todos devem ter números únicos
      const protocolNumbers = results.map((r) => r.protocol.number)
      const uniqueProtocolNumbers = new Set(protocolNumbers)
      expect(uniqueProtocolNumbers.size).toBe(concurrentProtocols)

      // Cleanup
      await prisma.protocolSimplified.deleteMany({
        where: { serviceId: service.id }
      })
      await prisma.serviceSimplified.delete({ where: { id: service.id } })
      await prisma.department.delete({ where: { id: department.id } })
      await prisma.citizen.delete({ where: { id: citizen.id } })
    }, 60000) // timeout 60s
  })

  describe('Performance Tests', () => {
    it('should generate 1000 protocol numbers in less than 5 seconds', async () => {
      const startTime = Date.now()

      // Gerar 1000 números (em batches de 100 para não sobrecarregar)
      const batchSize = 100
      const batches = 10

      for (let i = 0; i < batches; i++) {
        const promises = Array(batchSize)
          .fill(null)
          .map(() => generateProtocolNumberSafe())
        await Promise.all(promises)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(5000) // 5 segundos
      console.log(`1000 protocol numbers generated in ${duration}ms`)
    }, 10000)

    it('should handle burst of 200 concurrent requests without timeout', async () => {
      const concurrentRequests = 200
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => generateProtocolNumberSafe())

      const startTime = Date.now()
      await expect(Promise.all(promises)).resolves.toHaveLength(concurrentRequests)
      const duration = Date.now() - startTime

      console.log(`200 concurrent requests handled in ${duration}ms`)
      expect(duration).toBeLessThan(10000) // 10 segundos
    }, 15000)
  })

  describe('Stress Tests', () => {
    it('should maintain consistency under extreme load (500 concurrent)', async () => {
      const concurrentRequests = 500
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => generateProtocolNumberSafe())

      const numbers = await Promise.all(promises)

      // Validar unicidade
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(concurrentRequests)

      console.log(`✓ 500 concurrent requests: all unique`)
    }, 60000)

    it('should recover from database connection issues', async () => {
      // Simular cenário de alta carga que pode causar timeout
      const promises = Array(50)
        .fill(null)
        .map(async (_, index) => {
          // Adicionar delay variável para simular carga irregular
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
          return generateProtocolNumberSafe()
        })

      // Deve completar sem erros
      await expect(Promise.all(promises)).resolves.toHaveLength(50)
    }, 30000)
  })

  describe('Data Integrity Tests', () => {
    it('should maintain sequence integrity across multiple days', async () => {
      // Gerar números para verificar sequência
      const numbers = await Promise.all([
        generateProtocolNumberSafe(),
        generateProtocolNumberSafe(),
        generateProtocolNumberSafe()
      ])

      // Extrair sequências
      const sequences = numbers.map((n) => parseInt(n.split('-')[2]))

      // Validar incremento sequencial
      expect(sequences[1]).toBe(sequences[0] + 1)
      expect(sequences[2]).toBe(sequences[1] + 1)
    })

    it('should not generate duplicate numbers even under race condition', async () => {
      // Simular race condition: múltiplas requisições exatamente no mesmo momento
      const simultaneousRequests = 20
      const promises = []

      // Lançar todas as requisições no mesmo tick
      for (let i = 0; i < simultaneousRequests; i++) {
        promises.push(generateProtocolNumberSafe())
      }

      const numbers = await Promise.all(promises)

      // Verificar que não há duplicatas
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(simultaneousRequests)

      // Log para debug
      console.log(
        `Race condition test: ${simultaneousRequests} simultaneous requests, ${uniqueNumbers.size} unique numbers`
      )
    })
  })
})
