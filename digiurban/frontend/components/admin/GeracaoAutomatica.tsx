'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  Brain,
  Rocket,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Calendar,
  DollarSign
} from 'lucide-react'
import {
  geradorAutomatico,
  SugestaoNovoServico,
  AnaliseOportunidades,
  PadraoServico,
  MetricasIA
} from '@/lib/geracao-automatica'

export default function GeracaoAutomatica() {
  const [loading, setLoading] = useState(false)
  const [sugestoes, setSugestoes] = useState<SugestaoNovoServico[]>([])
  const [analiseOportunidades, setAnaliseOportunidades] = useState<AnaliseOportunidades | null>(null)
  const [padroes, setPadroes] = useState<PadraoServico[]>([])
  const [metricas, setMetricas] = useState<MetricasIA | null>(null)
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<SugestaoNovoServico | null>(null)
  const [implementandoId, setImplementandoId] = useState<string | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [sugestoesData, oportunidadesData, padroesData, metricasData] = await Promise.all([
        geradorAutomatico.gerarSugestoesInteligentes(),
        geradorAutomatico.analisarOportunidades(),
        geradorAutomatico.analisarPadroesExistentes(),
        Promise.resolve(geradorAutomatico.getMetricas())
      ])

      setSugestoes(sugestoesData)
      setAnaliseOportunidades(oportunidadesData)
      setPadroes(padroesData)
      setMetricas(metricasData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const implementarSugestao = async (sugestaoId: string) => {
    setImplementandoId(sugestaoId)
    try {
      const resultado = await geradorAutomatico.implementarSugestao(sugestaoId)
      if (resultado.sucesso) {
        alert('Serviço implementado com sucesso!')
        await carregarDados()
      } else {
        alert(`Erro ao implementar: ${resultado.erro}`)
      }
    } catch (error) {
      alert('Erro ao implementar sugestão')
    } finally {
      setImplementandoId(null)
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplexidadeColor = (complexidade: string) => {
    switch (complexidade) {
      case 'simples': return 'bg-green-100 text-green-800'
      case 'moderada': return 'bg-yellow-100 text-yellow-800'
      case 'complexa': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatarPorcentagem = (valor: number) => `${valor.toFixed(1)}%`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Analisando dados e gerando sugestões inteligentes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geração Automática de Serviços</h1>
          <p className="text-gray-600">IA para identificar oportunidades e sugerir novos serviços</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={carregarDados} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            Analisar Novamente
          </Button>
        </div>
      </div>

      {/* Métricas da IA */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisão das Sugestões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarPorcentagem(metricas.precisaoSugestoes)}</div>
              <Progress value={metricas.precisaoSugestoes} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impacto Positivo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarPorcentagem(metricas.impactoPositivo)}</div>
              <p className="text-xs text-muted-foreground">Melhoria nos serviços</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia de Tempo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.economia.tempo}h</div>
              <p className="text-xs text-muted-foreground">Economizadas mensalmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarPorcentagem(metricas.satisfacaoUsuarios)}</div>
              <p className="text-xs text-muted-foreground">Aprovação dos usuários</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sugestoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sugestoes">Sugestões IA</TabsTrigger>
          <TabsTrigger value="oportunidades">Análise Oportunidades</TabsTrigger>
          <TabsTrigger value="padroes">Padrões Identificados</TabsTrigger>
        </TabsList>

        <TabsContent value="sugestoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Sugestões de Novos Serviços</h3>
            <Badge variant="secondary">{sugestoes.length} sugestões geradas</Badge>
          </div>

          <div className="grid gap-6">
            {sugestoes.map((sugestao) => (
              <Card key={sugestao.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                        {sugestao.nome}
                      </CardTitle>
                      <CardDescription>{sugestao.descricao}</CardDescription>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Badge className={getPrioridadeColor(sugestao.prioridade)}>
                        {sugestao.prioridade.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {sugestao.secretaria.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Métricas da Sugestão */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{sugestao.demandaEstimada}</div>
                      <div className="text-sm text-gray-600">Demanda Estimada</div>
                    </div>
                    <div className="text-center">
                      <Badge className={getComplexidadeColor(sugestao.implementacao.complexidade)}>
                        {sugestao.implementacao.complexidade}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">Complexidade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{sugestao.implementacao.tempoEstimado}</div>
                      <div className="text-sm text-gray-600">Tempo Estimado</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Detalhes da Implementação */}
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium mb-2">Justificativa:</h5>
                      <p className="text-sm text-gray-600">{sugestao.justificativa}</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Recursos Necessários:</h5>
                      <div className="flex flex-wrap gap-2">
                        {sugestao.implementacao.recursosNecessarios.map((recurso, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {recurso}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Baseado em:</h5>
                      <div className="text-sm text-gray-600">
                        <div>• Dados: {sugestao.baseadoEm.dadosAnalisados.join(', ')}</div>
                        <div>• Serviços: {sugestao.baseadoEm.servicosExistentes.join(', ')}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Ações */}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Gerado em: {new Date(sugestao.geradoEm).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSugestaoSelecionada(sugestao)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => implementarSugestao(sugestao.id)}
                        disabled={implementandoId === sugestao.id}
                      >
                        {implementandoId === sugestao.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Rocket className="w-4 h-4 mr-1" />
                        )}
                        Implementar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          {analiseOportunidades && (
            <div className="space-y-6">
              {/* Lacunas Identificadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                    Lacunas Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analiseOportunidades.lacunasIdentificadas.map((lacuna, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium">{lacuna.area}</div>
                          <div className="text-sm text-gray-600">{lacuna.descricao}</div>
                        </div>
                        <Badge className={lacuna.impacto === 'alto' ? 'bg-red-100 text-red-800' :
                                        lacuna.impacto === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'}>
                          {lacuna.impacto.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Serviços Subutilizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Serviços Subutilizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analiseOportunidades.servicosSubutilizados.map((servico, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium">{servico.nome}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Possíveis motivos: {servico.motivosIdentificados.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Oportunidades de Digitalização */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-500" />
                    Oportunidades de Digitalização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analiseOportunidades.oportunidadesDigitalizacao.map((oportunidade, index) => (
                      <div key={index} className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium">{oportunidade.nome}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Benefícios: {oportunidade.beneficiosEstimados.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tendências Emergentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Tendências Emergentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analiseOportunidades.tendenciasEmergentes.map((tendencia, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{tendencia.tendencia}</div>
                          <Badge variant="secondary">{tendencia.relevancia}% relevância</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Serviços potenciais: {tendencia.servicosPotenciais.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="padroes" className="space-y-4">
          <div className="grid gap-4">
            {padroes.map((padrao, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {padrao.categoria} - {padrao.secretaria.replace('-', ' ').toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Frequência de Acesso</div>
                      <div className="text-lg font-bold">{padrao.frequenciaAcesso}/mês</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Tempo Médio</div>
                      <div className="text-lg font-bold">{padrao.tempoMedioAtendimento} dias</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Documentos Comuns</div>
                      <div className="text-sm">{padrao.documentosComuns.slice(0, 3).join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Palavras-chave</div>
                      <div className="text-sm">{padrao.palavrasChave.slice(0, 3).join(', ')}</div>
                    </div>
                  </div>

                  {padrao.sazonalidade && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-600 mb-2">Sazonalidade</div>
                      <div className="flex space-x-4">
                        <div>
                          <span className="text-xs text-red-600">Pico: </span>
                          <span className="text-xs">{padrao.sazonalidade.pico.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-xs text-blue-600">Baixa: </span>
                          <span className="text-xs">{padrao.sazonalidade.baixa.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}