'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Brain,
  Zap,
  Settings,
  Eye,
  Rocket,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Users,
  Building,
  Sparkles,
  Play,
  Download
} from 'lucide-react'
import { geradorAutomatico, SugestaoNovoServico } from '@/lib/geracao-automatica'

interface PaginaEspecializada {
  id: string
  nome: string
  secretaria: string
  tipo: string
  configuracao: any
  funcionalidades: string[]
  ultimaAtualizacao: string
  status: 'ativa' | 'configuracao' | 'manutencao'
  metricas: {
    acessos: number
    protocolos: number
    servicosGerados: number
    satisfacao: number
  }
  servicosAssociados: Array<{
    id: string
    nome: string
    status: 'ativo' | 'inativo'
    geradoPorIA: boolean
  }>
}

interface IntegradorState {
  paginasEspecializadas: PaginaEspecializada[]
  loading: boolean
  analisandoIA: boolean
  progresso: number
  ultimaAnalise: string | null
  sugestoesGeradas: SugestaoNovoServico[]
}

export default function IntegradorPaginasEspecializadas() {
  const [state, setState] = useState<IntegradorState>({
    paginasEspecializadas: [],
    loading: true,
    analisandoIA: false,
    progresso: 0,
    ultimaAnalise: null,
    sugestoesGeradas: []
  })

  useEffect(() => {
    carregarPaginasEspecializadas()
  }, [])

  const carregarPaginasEspecializadas = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      // Simular carregamento das páginas especializadas
      const mockPaginas: PaginaEspecializada[] = [
        {
          id: 'saude-atendimentos',
          nome: 'Atendimentos Médicos',
          secretaria: 'saude',
          tipo: 'atendimentos',
          configuracao: {
            especialidades: ['Cardiologia', 'Pediatria', 'Ortopedia'],
            horarioFuncionamento: '07:00-18:00',
            agendamentoOnline: true
          },
          funcionalidades: [
            'Agendamento de consultas',
            'Triagem digital',
            'Prescrição eletrônica',
            'Prontuário digital'
          ],
          ultimaAtualizacao: '2024-01-23T10:30:00',
          status: 'ativa',
          metricas: {
            acessos: 2450,
            protocolos: 127,
            servicosGerados: 8,
            satisfacao: 4.2
          },
          servicosAssociados: [
            { id: 's1', nome: 'Agendamento de Consulta', status: 'ativo', geradoPorIA: false },
            { id: 's2', nome: 'Triagem Digital Sintomas', status: 'ativo', geradoPorIA: true },
            { id: 's3', nome: 'Receita Digital', status: 'ativo', geradoPorIA: true }
          ]
        },
        {
          id: 'educacao-matriculas',
          nome: 'Sistema de Matrículas',
          secretaria: 'educacao',
          tipo: 'matriculas',
          configuracao: {
            seriesAtendidas: ['Berçário', 'Pré-escola', 'Fundamental'],
            periodoMatriculas: '2024-01-15 a 2024-02-15',
            validacaoAutomatica: true
          },
          funcionalidades: [
            'Matrícula online',
            'Transferência entre escolas',
            'Lista de espera',
            'Documentação digital'
          ],
          ultimaAtualizacao: '2024-01-22T14:15:00',
          status: 'ativa',
          metricas: {
            acessos: 1890,
            protocolos: 89,
            servicosGerados: 5,
            satisfacao: 4.5
          },
          servicosAssociados: [
            { id: 's4', nome: 'Matrícula Escolar Online', status: 'ativo', geradoPorIA: false },
            { id: 's5', nome: 'Transferência Digital', status: 'ativo', geradoPorIA: true }
          ]
        },
        {
          id: 'social-familias-vulneraveis',
          nome: 'Famílias Vulneráveis',
          secretaria: 'assistencia-social',
          tipo: 'familias-vulneraveis',
          configuracao: {
            niveisRisco: ['Baixo', 'Médio', 'Alto', 'Crítico'],
            acompanhamentoPeriodico: true,
            integracaoCRAS: true
          },
          funcionalidades: [
            'Cadastro familiar',
            'Avaliação de risco',
            'Agendamento visitas',
            'Programa Bolsa Família'
          ],
          ultimaAtualizacao: '2024-01-21T09:45:00',
          status: 'ativa',
          metricas: {
            acessos: 1234,
            protocolos: 156,
            servicosGerados: 12,
            satisfacao: 4.1
          },
          servicosAssociados: [
            { id: 's6', nome: 'Cadastro Único Digital', status: 'ativo', geradoPorIA: true },
            { id: 's7', nome: 'Avaliação Socioeconômica', status: 'ativo', geradoPorIA: true }
          ]
        }
      ]

      setState(prev => ({
        ...prev,
        paginasEspecializadas: mockPaginas,
        loading: false
      }))

    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const executarAnaliseCompleta = async () => {
    setState(prev => ({ ...prev, analisandoIA: true, progresso: 0 }))

    try {
      // Simular progresso da análise
      const etapas = [
        'Analisando padrões de uso...',
        'Identificando oportunidades...',
        'Gerando sugestões de serviços...',
        'Priorizando implementações...',
        'Finalizando análise...'
      ]

      for (let i = 0; i < etapas.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setState(prev => ({ ...prev, progresso: ((i + 1) / etapas.length) * 100 }))
      }

      // Executar análise real da IA
      const sugestoes = await geradorAutomatico.gerarSugestoesInteligentes()

      setState(prev => ({
        ...prev,
        analisandoIA: false,
        progresso: 100,
        ultimaAnalise: new Date().toISOString(),
        sugestoesGeradas: sugestoes
      }))

    } catch (error) {
      console.error('Erro na análise:', error)
      setState(prev => ({ ...prev, analisandoIA: false, progresso: 0 }))
    }
  }

  const implementarSugestao = async (sugestaoId: string) => {
    try {
      const resultado = await geradorAutomatico.implementarSugestao(sugestaoId)

      if (resultado.sucesso) {
        alert('Serviço implementado com sucesso!')
        await carregarPaginasEspecializadas()

        // Remover sugestão implementada
        setState(prev => ({
          ...prev,
          sugestoesGeradas: prev.sugestoesGeradas.filter(s => s.id !== sugestaoId)
        }))
      } else {
        alert(`Erro ao implementar: ${resultado.erro}`)
      }
    } catch (error) {
      alert('Erro ao implementar sugestão')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'configuracao': return 'bg-yellow-100 text-yellow-800'
      case 'manutencao': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSecretariaIcon = (secretaria: string) => {
    switch (secretaria) {
      case 'saude': return '🏥'
      case 'educacao': return '🎓'
      case 'assistencia-social': return '🤝'
      default: return '🏛️'
    }
  }

  const exportarRelatorio = () => {
    const dados = {
      dataGeracao: new Date().toISOString(),
      totalPaginas: state.paginasEspecializadas.length,
      totalServicos: state.paginasEspecializadas.reduce((acc, p) => acc + ((p as any).servicosGerados || 0), 0),
      sugestoesIA: state.sugestoesGeradas.length,
      paginas: state.paginasEspecializadas,
      ultimaAnalise: state.ultimaAnalise
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-paginas-especializadas-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando páginas especializadas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
            Integração IA - Páginas Especializadas
          </h1>
          <p className="text-gray-600">
            Gestão inteligente das 95 páginas especializadas com geração automática de serviços
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportarRelatorio}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button onClick={executarAnaliseCompleta} disabled={state.analisandoIA}>
            {state.analisandoIA ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Análise IA Completa
          </Button>
        </div>
      </div>

      {/* Estatísticas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Páginas Ativas</p>
                <p className="text-2xl font-bold">
                  {state.paginasEspecializadas.filter(p => p.status === 'ativa').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Serviços Gerados</p>
                <p className="text-2xl font-bold">
                  {state.paginasEspecializadas.reduce((acc, p) => acc + p.metricas.servicosGerados, 0)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Protocolos Ativos</p>
                <p className="text-2xl font-bold">
                  {state.paginasEspecializadas.reduce((acc, p) => acc + p.metricas.protocolos, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfação Média</p>
                <p className="text-2xl font-bold">
                  {(state.paginasEspecializadas.reduce((acc, p) => acc + p.metricas.satisfacao, 0) /
                    state.paginasEspecializadas.length).toFixed(1)}⭐
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso da Análise IA */}
      {state.analisandoIA && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Análise IA em progresso...</span>
                <span className="text-sm text-gray-500">{Math.round(state.progresso)}%</span>
              </div>
              <Progress value={state.progresso} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Última Análise */}
      {state.ultimaAnalise && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Última análise IA realizada em: {new Date(state.ultimaAnalise).toLocaleString('pt-BR')}
            {state.sugestoesGeradas.length > 0 && (
              <span className="ml-2">• {state.sugestoesGeradas.length} novas sugestões geradas</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="paginas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="paginas">Páginas Especializadas</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões IA ({state.sugestoesGeradas.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="paginas" className="space-y-4">
          <div className="grid gap-4">
            {state.paginasEspecializadas.map((pagina) => (
              <Card key={pagina.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getSecretariaIcon(pagina.secretaria)}</div>
                      <div>
                        <h3 className="text-lg font-medium">{pagina.nome}</h3>
                        <p className="text-sm text-gray-600">
                          {pagina.secretaria.replace('-', ' ').toUpperCase()} • {pagina.tipo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(pagina.status)}>
                        {pagina.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {pagina.servicosAssociados.filter(s => s.geradoPorIA).length} serviços IA
                      </Badge>
                    </div>
                  </div>

                  {/* Métricas da Página */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{pagina.metricas.acessos}</div>
                      <div className="text-xs text-gray-600">Acessos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{pagina.metricas.protocolos}</div>
                      <div className="text-xs text-gray-600">Protocolos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{pagina.metricas.servicosGerados}</div>
                      <div className="text-xs text-gray-600">Serviços</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{pagina.metricas.satisfacao}⭐</div>
                      <div className="text-xs text-gray-600">Satisfação</div>
                    </div>
                  </div>

                  {/* Funcionalidades */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Funcionalidades:</h4>
                    <div className="flex flex-wrap gap-1">
                      {pagina.funcionalidades.map((func, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {func}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Serviços Associados */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Serviços Associados:</h4>
                    <div className="space-y-1">
                      {pagina.servicosAssociados.map((servico) => (
                        <div key={servico.id} className="flex items-center justify-between text-sm">
                          <span className={servico.status === 'ativo' ? 'text-gray-900' : 'text-gray-500'}>
                            {servico.nome}
                          </span>
                          <div className="flex items-center space-x-2">
                            {servico.geradoPorIA && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                <Brain className="w-3 h-3 mr-1" />
                                IA
                              </Badge>
                            )}
                            <Badge variant={servico.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                              {servico.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      Última atualização: {new Date(pagina.ultimaAtualizacao).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Configurar
                      </Button>
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Gerar Serviços
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sugestoes" className="space-y-4">
          {state.sugestoesGeradas.length > 0 ? (
            <div className="space-y-4">
              {state.sugestoesGeradas.map((sugestao) => (
                <Card key={sugestao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{sugestao.nome}</h3>
                        <p className="text-sm text-gray-600">{sugestao.descricao}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={sugestao.prioridade === 'alta' ? 'destructive' : 'secondary'}>
                          {sugestao.prioridade.toUpperCase()}
                        </Badge>
                        <Button size="sm" onClick={() => implementarSugestao(sugestao.id)}>
                          <Rocket className="w-4 h-4 mr-1" />
                          Implementar
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Demanda estimada:</strong> {sugestao.demandaEstimada} usuários/mês
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sugestão disponível</h3>
                <p className="text-gray-600 mb-4">
                  Execute uma análise IA completa para gerar novas sugestões de serviços
                </p>
                <Button onClick={executarAnaliseCompleta}>
                  <Brain className="w-4 h-4 mr-2" />
                  Executar Análise IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Páginas por Secretaria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    state.paginasEspecializadas.reduce((acc, p) => {
                      acc[p.secretaria] = (acc[p.secretaria] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([secretaria, count]) => (
                    <div key={secretaria} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSecretariaIcon(secretaria)}</span>
                        <span className="capitalize">{secretaria.replace('-', ' ')}</span>
                      </div>
                      <Badge variant="outline">{count} páginas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Taxa de Conversão (Acesso → Protocolo)</span>
                      <span>
                        {(
                          (state.paginasEspecializadas.reduce((acc, p) => acc + p.metricas.protocolos, 0) /
                           state.paginasEspecializadas.reduce((acc, p) => acc + p.metricas.acessos, 0)) * 100
                        ).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={15.2} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Eficiência IA (Serviços Gerados)</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Satisfação Média</span>
                      <span>4.3/5.0</span>
                    </div>
                    <Progress value={86} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}