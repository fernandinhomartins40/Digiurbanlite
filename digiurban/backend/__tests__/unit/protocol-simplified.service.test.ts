import { PrismaClient } from '@prisma/client'
import { ProtocolService } from '../../src/services/protocol-simplified.service'

// Mock do Prisma Client
jest.mock('@prisma/client')

describe('ProtocolService - Testes Unitários', () => {
  let prisma: jest.Mocked<PrismaClient>
  let protocolService: ProtocolService

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>
    protocolService = new ProtocolService(prisma)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ========================================
  // 1. TESTES DE CRIAÇÃO DE PROTOCOLO
  // ========================================

  describe('createProtocol', () => {
    it('deve criar protocolo COM_DADOS e rotear para módulo', async () => {
      const mockService = {
        id: 'service-1',
        name: 'Matrícula de Aluno',
        serviceType: 'COM_DADOS',
        moduleType: 'MATRICULA_ALUNO',
        formSchema: {
          type: 'object',
          properties: {
            nomeAluno: { type: 'string' }
          }
        }
      }

      const mockProtocol = {
        id: 'protocol-1',
        number: 'PROT-20251029-00001',
        status: 'VINCULADO',
        moduleType: 'MATRICULA_ALUNO',
        customData: { nomeAluno: 'João Silva' }
      }

      prisma.service.findUnique = jest.fn().mockResolvedValue(mockService)
      prisma.protocol.create = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolHistory.create = jest.fn()

      const result = await protocolService.createProtocol({
        citizenId: 'citizen-1',
        serviceId: 'service-1',
        departmentId: 'dept-1',
        tenantId: 'tenant-1',
        title: 'Matrícula Escolar',
        description: 'Matrícula do aluno João',
        formData: { nomeAluno: 'João Silva' }
      })

      expect(result.status).toBe('VINCULADO')
      expect(result.moduleType).toBe('MATRICULA_ALUNO')
      expect(prisma.protocolHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CRIACAO'
          })
        })
      )
    })

    it('deve criar protocolo INFORMATIVO sem roteamento', async () => {
      const mockService = {
        id: 'service-2',
        name: 'Calendário Escolar',
        serviceType: 'INFORMATIVO',
        moduleType: null
      }

      const mockProtocol = {
        id: 'protocol-2',
        number: 'PROT-20251029-00002',
        status: 'VINCULADO',
        moduleType: null
      }

      prisma.service.findUnique = jest.fn().mockResolvedValue(mockService)
      prisma.protocol.create = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolHistory.create = jest.fn()

      const result = await protocolService.createProtocol({
        citizenId: 'citizen-1',
        serviceId: 'service-2',
        departmentId: 'dept-1',
        tenantId: 'tenant-1',
        title: 'Consulta de Calendário',
        description: 'Ver calendário escolar'
      })

      expect(result.moduleType).toBeNull()
      expect(result.status).toBe('VINCULADO')
    })

    it('deve gerar número de protocolo no formato correto', async () => {
      const mockService = { id: 'service-1', serviceType: 'COM_DADOS' }
      const mockProtocol = {
        id: 'protocol-1',
        number: 'PROT-20251029-00001'
      }

      prisma.service.findUnique = jest.fn().mockResolvedValue(mockService)
      prisma.protocol.create = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolHistory.create = jest.fn()

      const result = await protocolService.createProtocol({
        citizenId: 'citizen-1',
        serviceId: 'service-1',
        departmentId: 'dept-1',
        tenantId: 'tenant-1',
        title: 'Test'
      })

      expect(result.number).toMatch(/^PROT-\d{8}-\d{5}$/)
    })
  })

  // ========================================
  // 2. TESTES DE ATUALIZAÇÃO DE STATUS
  // ========================================

  describe('updateStatus', () => {
    it('deve atualizar status e criar histórico', async () => {
      const mockProtocol = {
        id: 'protocol-1',
        status: 'VINCULADO'
      }

      const mockUpdated = {
        ...mockProtocol,
        status: 'PROGRESSO'
      }

      prisma.protocol.findUnique = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocol.update = jest.fn().mockResolvedValue(mockUpdated)
      prisma.protocolHistory.create = jest.fn()

      await protocolService.updateStatus(
        'protocol-1',
        'PROGRESSO',
        'user-1',
        'Iniciando atendimento'
      )

      expect(prisma.protocol.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'protocol-1' },
          data: { status: 'PROGRESSO' }
        })
      )

      expect(prisma.protocolHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ALTERACAO_STATUS',
            oldStatus: 'VINCULADO',
            newStatus: 'PROGRESSO'
          })
        })
      )
    })

    it('deve lançar erro se protocolo não existir', async () => {
      prisma.protocol.findUnique = jest.fn().mockResolvedValue(null)

      await expect(
        protocolService.updateStatus('invalid-id', 'PROGRESSO')
      ).rejects.toThrow('Protocolo não encontrado')
    })
  })

  // ========================================
  // 3. TESTES DE ROTEAMENTO
  // ========================================

  describe('routeToModule', () => {
    it('deve rotear protocolo para módulo específico', async () => {
      const mockProtocol = {
        id: 'protocol-1',
        moduleType: 'ATENDIMENTOS_SAUDE',
        customData: { sintomas: 'Febre alta' }
      }

      prisma.protocol.findUnique = jest.fn().mockResolvedValue(mockProtocol)

      // Mock do módulo HealthAttendance
      const mockHealthAttendance = jest.fn().mockResolvedValue({
        id: 'attendance-1',
        protocolId: 'protocol-1'
      })

      const result = await protocolService.routeToModule('protocol-1')

      expect(result.moduleType).toBe('ATENDIMENTOS_SAUDE')
      expect(result.customData).toHaveProperty('sintomas')
    })

    it('deve retornar null para serviço INFORMATIVO', async () => {
      const mockProtocol = {
        id: 'protocol-1',
        moduleType: null,
        service: { serviceType: 'INFORMATIVO' }
      }

      prisma.protocol.findUnique = jest.fn().mockResolvedValue(mockProtocol)

      const result = await protocolService.routeToModule('protocol-1')

      expect(result.moduleType).toBeNull()
    })
  })

  // ========================================
  // 4. TESTES DE LISTAGEM
  // ========================================

  describe('listByDepartment', () => {
    it('deve listar protocolos de um departamento', async () => {
      const mockProtocols = [
        { id: 'p1', departmentId: 'dept-1', number: 'PROT-001' },
        { id: 'p2', departmentId: 'dept-1', number: 'PROT-002' }
      ]

      prisma.protocol.findMany = jest.fn().mockResolvedValue(mockProtocols)

      const result = await protocolService.listByDepartment('dept-1')

      expect(result).toHaveLength(2)
      expect(prisma.protocol.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { departmentId: 'dept-1' }
        })
      )
    })

    it('deve filtrar por status', async () => {
      const mockProtocols = [
        { id: 'p1', status: 'PROGRESSO' }
      ]

      prisma.protocol.findMany = jest.fn().mockResolvedValue(mockProtocols)

      await protocolService.listByDepartment('dept-1', 'PROGRESSO')

      expect(prisma.protocol.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            departmentId: 'dept-1',
            status: 'PROGRESSO'
          }
        })
      )
    })
  })

  describe('listByCitizen', () => {
    it('deve listar protocolos de um cidadão', async () => {
      const mockProtocols = [
        { id: 'p1', citizenId: 'citizen-1' },
        { id: 'p2', citizenId: 'citizen-1' }
      ]

      prisma.protocol.findMany = jest.fn().mockResolvedValue(mockProtocols)

      const result = await protocolService.listByCitizen('citizen-1')

      expect(result).toHaveLength(2)
      expect(prisma.protocol.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { citizenId: 'citizen-1' }
        })
      )
    })
  })

  // ========================================
  // 5. TESTES DE AVALIAÇÃO
  // ========================================

  describe('evaluateProtocol', () => {
    it('deve criar avaliação do protocolo', async () => {
      const mockProtocol = { id: 'protocol-1', status: 'CONCLUIDO' }
      const mockEvaluation = {
        id: 'eval-1',
        protocolId: 'protocol-1',
        rating: 5,
        comment: 'Ótimo atendimento'
      }

      prisma.protocol.findUnique = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolEvaluation.create = jest.fn().mockResolvedValue(mockEvaluation)

      const result = await protocolService.evaluateProtocol('protocol-1', {
        rating: 5,
        comment: 'Ótimo atendimento',
        wouldRecommend: true
      })

      expect(result.rating).toBe(5)
      expect(prisma.protocolEvaluation.create).toHaveBeenCalled()
    })

    it('deve validar rating entre 1 e 5', async () => {
      await expect(
        protocolService.evaluateProtocol('protocol-1', {
          rating: 6,
          comment: 'Test'
        })
      ).rejects.toThrow('Rating deve estar entre 1 e 5')
    })
  })

  // ========================================
  // 6. TESTES DE ESTATÍSTICAS
  // ========================================

  describe('getDepartmentStats', () => {
    it('deve retornar estatísticas do departamento', async () => {
      prisma.protocol.count = jest.fn()
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // vinculado
        .mockResolvedValueOnce(30)  // progresso
        .mockResolvedValueOnce(50)  // concluido

      prisma.protocol.aggregate = jest.fn().mockResolvedValue({
        _avg: { priority: 2.5 }
      })

      const stats = await protocolService.getDepartmentStats('dept-1')

      expect(stats.total).toBe(100)
      expect(stats.byStatus.VINCULADO).toBe(20)
      expect(stats.byStatus.PROGRESSO).toBe(30)
      expect(stats.byStatus.CONCLUIDO).toBe(50)
      expect(stats.avgPriority).toBe(2.5)
    })
  })

  // ========================================
  // 7. TESTES DE GERAÇÃO DE NÚMERO
  // ========================================

  describe('generateProtocolNumber', () => {
    it('deve gerar número único no formato PROT-YYYYMMDD-XXXXX', () => {
      const number = protocolService.generateProtocolNumber()

      expect(number).toMatch(/^PROT-\d{8}-\d{5}$/)

      const date = number.split('-')[1]
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

      expect(date).toBe(today)
    })

    it('deve gerar números diferentes em sequência', () => {
      const numbers = [
        protocolService.generateProtocolNumber(),
        protocolService.generateProtocolNumber(),
        protocolService.generateProtocolNumber()
      ]

      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(3)
    })
  })

  // ========================================
  // 8. TESTES DE VALIDAÇÃO
  // ========================================

  describe('Validações', () => {
    it('deve validar dados obrigatórios na criação', async () => {
      await expect(
        protocolService.createProtocol({
          citizenId: '',
          serviceId: 'service-1',
          departmentId: 'dept-1',
          tenantId: 'tenant-1',
          title: ''
        })
      ).rejects.toThrow()
    })

    it('deve validar formData contra formSchema', async () => {
      const mockService = {
        id: 'service-1',
        serviceType: 'COM_DADOS',
        formSchema: {
          type: 'object',
          required: ['nomeAluno', 'dataNascimento'],
          properties: {
            nomeAluno: { type: 'string' },
            dataNascimento: { type: 'string' }
          }
        }
      }

      prisma.service.findUnique = jest.fn().mockResolvedValue(mockService)

      await expect(
        protocolService.createProtocol({
          citizenId: 'citizen-1',
          serviceId: 'service-1',
          departmentId: 'dept-1',
          tenantId: 'tenant-1',
          title: 'Matrícula',
          formData: { nomeAluno: 'João' } // falta dataNascimento
        })
      ).rejects.toThrow()
    })
  })

  // ========================================
  // 9. TESTES DE COMENTÁRIOS
  // ========================================

  describe('addComment', () => {
    it('deve adicionar comentário ao protocolo', async () => {
      const mockProtocol = { id: 'protocol-1' }

      prisma.protocol.findUnique = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolHistory.create = jest.fn()

      await protocolService.addComment(
        'protocol-1',
        'Cidadão retornou com documentos',
        'user-1'
      )

      expect(prisma.protocolHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'COMENTARIO',
            comment: 'Cidadão retornou com documentos'
          })
        })
      )
    })
  })

  // ========================================
  // 10. TESTES DE PERFORMANCE
  // ========================================

  describe('Performance', () => {
    it('deve criar protocolo em menos de 500ms', async () => {
      const mockService = { id: 'service-1', serviceType: 'COM_DADOS' }
      const mockProtocol = { id: 'protocol-1', number: 'PROT-001' }

      prisma.service.findUnique = jest.fn().mockResolvedValue(mockService)
      prisma.protocol.create = jest.fn().mockResolvedValue(mockProtocol)
      prisma.protocolHistory.create = jest.fn()

      const start = Date.now()

      await protocolService.createProtocol({
        citizenId: 'citizen-1',
        serviceId: 'service-1',
        departmentId: 'dept-1',
        tenantId: 'tenant-1',
        title: 'Test'
      })

      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })
  })
})
