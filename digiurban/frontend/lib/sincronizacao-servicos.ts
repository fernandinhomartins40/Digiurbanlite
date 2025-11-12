// Sistema de Sincronização Bidirecional de Serviços
// Sincroniza automaticamente entre sistema local (frontend) e centralizado (backend)

import { geradorServicos, ServicoAutomatico } from './servicos-automaticos'

export interface ServicoBackend {
  id: string
  name: string
  description: string | null
  category: string | null
  departmentId: string
  department?: {
    id: string
    name: string
    description?: string
  }
  requiresDocuments: boolean
  estimatedDays: number | null
  priority: number
  isActive: boolean
  requirements?: string[]
  requiredDocuments?: string[]
  createdAt: string
  updatedAt: string
}

export interface ResultadoSincronizacao {
  sucesso: boolean
  novosServicos: number
  servicosAtualizados: number
  servicosDesativados: number
  erros: string[]
  detalhes: {
    adicionados: ServicoBackend[]
    atualizados: ServicoBackend[]
    desativados: ServicoBackend[]
  }
}

export interface EstatisticasSincronizacao {
  ultimaSincronizacao: string | null
  totalServicosLocal: number
  totalServicosBackend: number
  servicosEmConflito: number
  sincronizacaoAutomaticaAtiva: boolean
}

export class SincronizadorServicos {
  private static instance: SincronizadorServicos
  private apiBaseUrl: string
  private intervalId: NodeJS.Timeout | null = null
  private sincronizacaoAtiva = false

  private constructor() {
    this.apiBaseUrl = 'http://localhost:3001/api'
  }

  static getInstance(): SincronizadorServicos {
    if (!this.instance) {
      this.instance = new SincronizadorServicos()
    }
    return this.instance
  }

  // Função para obter o tenant atual
  private getTenant(): string {
    if (typeof window !== 'undefined') {
      const subdomain = window.location.hostname.split('.')[0]
      return subdomain !== 'localhost' && subdomain !== '127' ? subdomain : 'demo'
    }
    return 'demo'
  }

  // Requisição autenticada para o backend
  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('digiurban_admin_token') : null
    const tenant = this.getTenant()

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Buscar todos os serviços do backend
  async buscarServicosBackend(): Promise<ServicoBackend[]> {
    try {
      const response = await this.apiRequest('/services')
      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar serviços do backend:', error)
      throw error
    }
  }

  // Buscar serviços por departamento
  async buscarServicosPorDepartamento(departmentId: string): Promise<ServicoBackend[]> {
    try {
      const response = await this.apiRequest(`/services/department/${departmentId}`)
      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar serviços por departamento:', error)
      throw error
    }
  }

  // Criar novo serviço no backend
  async criarServicoBackend(servico: Partial<ServicoBackend>): Promise<ServicoBackend> {
    try {
      const response = await this.apiRequest('/services', {
        method: 'POST',
        body: JSON.stringify(servico)
      })
      return response.service
    } catch (error) {
      console.error('Erro ao criar serviço no backend:', error)
      throw error
    }
  }

  // Atualizar serviço no backend
  async atualizarServicoBackend(id: string, dados: Partial<ServicoBackend>): Promise<ServicoBackend> {
    try {
      const response = await this.apiRequest(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      })
      return response.service
    } catch (error) {
      console.error('Erro ao atualizar serviço no backend:', error)
      throw error
    }
  }

  // Mapear serviço automático para formato do backend
  private mapearServicoParaBackend(servicoLocal: ServicoAutomatico, departmentId: string): Partial<ServicoBackend> {
    return {
      name: servicoLocal.nome,
      description: servicoLocal.descricao,
      category: servicoLocal.categoria,
      departmentId,
      requiresDocuments: servicoLocal.documentos.length > 0,
      estimatedDays: this.extrairDiasDoTexto(servicoLocal.prazo),
      priority: this.calcularPrioridade(servicoLocal),
      requirements: [servicoLocal.descricao],
      requiredDocuments: servicoLocal.documentos
    }
  }

  // Extrair número de dias do texto do prazo
  private extrairDiasDoTexto(prazoTexto: string): number | null {
    const matches = prazoTexto.match(/(\d+)\s*dias?\s*úteis?/i)
    if (matches) {
      return parseInt(matches[1])
    }

    if (prazoTexto.toLowerCase().includes('imediato')) {
      return 0
    }

    if (prazoTexto.toLowerCase().includes('24 horas')) {
      return 1
    }

    return null
  }

  // Calcular prioridade baseada nos acessos e demanda
  private calcularPrioridade(servico: ServicoAutomatico): number {
    const score = (servico.acessos_mes * 0.3) + (servico.demanda_estimada * 0.7)

    if (score > 1000) return 5
    if (score > 500) return 4
    if (score > 200) return 3
    if (score > 50) return 2
    return 1
  }

  // Buscar ou criar departamento por código
  async buscarOuCriarDepartamento(codigoSecretaria: string): Promise<string> {
    const mapeamentoDepartamentos: Record<string, { nome: string; codigo: string }> = {
      'saude': { nome: 'Secretaria de Saúde', codigo: 'SAUDE' },
      'educacao': { nome: 'Secretaria de Educação', codigo: 'EDUCACAO' },
      'servicos-publicos': { nome: 'Secretaria de Serviços Públicos', codigo: 'SERVICOS_PUBLICOS' }
    }

    const dept = mapeamentoDepartamentos[codigoSecretaria]
    if (!dept) {
      throw new Error(`Departamento não mapeado: ${codigoSecretaria}`)
    }

    try {
      // Buscar todos os departamentos do tenant
      const response = await this.apiRequest('/admin/management/departments')
      const departamentos = response.departments || []

      // Procurar departamento por nome
      const departamentoExistente = departamentos.find((d: any) =>
        d.name.toLowerCase().includes(dept.nome.toLowerCase()) ||
        d.code?.toLowerCase() === dept.codigo.toLowerCase()
      )

      if (departamentoExistente) {
        return departamentoExistente.id
      }

      // Se não encontrou, usar o primeiro departamento disponível ou retornar erro
      if (departamentos.length > 0) {
        console.warn(`Departamento "${dept.nome}" não encontrado, usando primeiro disponível`)
        return departamentos[0].id
      }

      throw new Error(`Nenhum departamento disponível para ${dept.nome}`)
    } catch (error) {
      console.error('Erro ao buscar departamento:', error)
      // Fallback: retornar ID fixo baseado no código
      return `dept_${dept.codigo.toLowerCase()}`
    }
  }

  // Sincronização completa: Local -> Backend
  async sincronizarLocalParaBackend(): Promise<ResultadoSincronizacao> {
    const resultado: ResultadoSincronizacao = {
      sucesso: false,
      novosServicos: 0,
      servicosAtualizados: 0,
      servicosDesativados: 0,
      erros: [],
      detalhes: {
        adicionados: [],
        atualizados: [],
        desativados: []
      }
    }

    try {
      // Obter serviços locais
      const servicosLocais = geradorServicos.getTodosServicos()

      // Obter serviços do backend
      const servicosBackend = await this.buscarServicosBackend()

      // Mapear serviços do backend por nome para comparação
      const servicosBackendMap = new Map<string, ServicoBackend>()
      servicosBackend.forEach(s => servicosBackendMap.set(s.name.toLowerCase(), s))

      // Processar cada serviço local
      for (const servicoLocal of servicosLocais) {
        try {
          const departmentId = await this.buscarOuCriarDepartamento(servicoLocal.secretaria)
          const servicoBackendExistente = servicosBackendMap.get(servicoLocal.nome.toLowerCase())

          if (servicoBackendExistente) {
            // Verificar se precisa atualizar
            const precisaAtualizar = this.verificarSeNecessarioAtualizacao(servicoLocal, servicoBackendExistente)

            if (precisaAtualizar) {
              const dadosAtualizacao = this.mapearServicoParaBackend(servicoLocal, departmentId)
              const servicoAtualizado = await this.atualizarServicoBackend(
                servicoBackendExistente.id,
                dadosAtualizacao
              )

              resultado.servicosAtualizados++
              resultado.detalhes.atualizados.push(servicoAtualizado)
            }
          } else {
            // Criar novo serviço
            const novoServico = this.mapearServicoParaBackend(servicoLocal, departmentId)
            const servicoCriado = await this.criarServicoBackend(novoServico)

            resultado.novosServicos++
            resultado.detalhes.adicionados.push(servicoCriado)
          }
        } catch (error) {
          const mensagemErro = `Erro ao processar serviço "${servicoLocal.nome}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          resultado.erros.push(mensagemErro)
          console.error(mensagemErro)
        }
      }

      resultado.sucesso = resultado.erros.length === 0 || resultado.erros.length < servicosLocais.length / 2

      // Salvar timestamp da sincronização
      if (typeof window !== 'undefined') {
        localStorage.setItem('ultima_sincronizacao_servicos', new Date().toISOString())
      }

    } catch (error) {
      const mensagemErro = `Erro geral na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      resultado.erros.push(mensagemErro)
      console.error(mensagemErro)
    }

    return resultado
  }

  // Verificar se serviço precisa ser atualizado
  private verificarSeNecessarioAtualizacao(local: ServicoAutomatico, backend: ServicoBackend): boolean {
    return (
      local.descricao !== backend.description ||
      local.categoria !== backend.category ||
      local.documentos.join(',') !== (backend.requiredDocuments || []).join(',')
    )
  }

  // Sincronização automática periódica
  iniciarSincronizacaoAutomatica(intervalMinutos = 30): void {
    if (this.intervalId) {
      this.pararSincronizacaoAutomatica()
    }

    this.sincronizacaoAtiva = true
    this.intervalId = setInterval(async () => {
      try {
        console.log('Iniciando sincronização automática de serviços...')
        const resultado = await this.sincronizarLocalParaBackend()
        console.log('Sincronização automática concluída:', resultado)
      } catch (error) {
        console.error('Erro na sincronização automática:', error)
      }
    }, intervalMinutos * 60 * 1000)

    console.log(`Sincronização automática iniciada (intervalo: ${intervalMinutos} minutos)`)
  }

  pararSincronizacaoAutomatica(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.sincronizacaoAtiva = false
    console.log('Sincronização automática parada')
  }

  // Obter estatísticas da sincronização
  async obterEstatisticas(): Promise<EstatisticasSincronizacao> {
    try {
      const servicosLocais = geradorServicos.getTodosServicos()
      const servicosBackend = await this.buscarServicosBackend()

      // Contar conflitos (serviços com mesmo nome mas dados diferentes)
      let servicosEmConflito = 0
      const servicosBackendMap = new Map<string, ServicoBackend>()
      servicosBackend.forEach(s => servicosBackendMap.set(s.name.toLowerCase(), s))

      for (const servicoLocal of servicosLocais) {
        const servicoBackend = servicosBackendMap.get(servicoLocal.nome.toLowerCase())
        if (servicoBackend && this.verificarSeNecessarioAtualizacao(servicoLocal, servicoBackend)) {
          servicosEmConflito++
        }
      }

      return {
        ultimaSincronizacao: typeof window !== 'undefined'
          ? localStorage.getItem('ultima_sincronizacao_servicos')
          : null,
        totalServicosLocal: servicosLocais.length,
        totalServicosBackend: servicosBackend.length,
        servicosEmConflito,
        sincronizacaoAutomaticaAtiva: this.sincronizacaoAtiva
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }

  // Resetar dados de sincronização
  resetarSincronizacao(): void {
    this.pararSincronizacaoAutomatica()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ultima_sincronizacao_servicos')
    }
    console.log('Dados de sincronização resetados')
  }
}

// Instância singleton
export const sincronizadorServicos = SincronizadorServicos.getInstance()

// Hooks para React (opcional)
export function useSincronizacaoServicos() {
  const sincronizar = async () => {
    return await sincronizadorServicos.sincronizarLocalParaBackend()
  }

  const obterEstatisticas = async () => {
    return await sincronizadorServicos.obterEstatisticas()
  }

  const iniciarAutomatica = (intervalMinutos = 30) => {
    sincronizadorServicos.iniciarSincronizacaoAutomatica(intervalMinutos)
  }

  const pararAutomatica = () => {
    sincronizadorServicos.pararSincronizacaoAutomatica()
  }

  return {
    sincronizar,
    obterEstatisticas,
    iniciarAutomatica,
    pararAutomatica
  }
}

// Auto-inicialização em produção
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Iniciar sincronização automática após 5 segundos
  setTimeout(() => {
    sincronizadorServicos.iniciarSincronizacaoAutomatica(60) // 1 hora em produção
  }, 5000)
}