'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  BarChart3,
  Database,
  Clock,
  TrendingUp
} from 'lucide-react'
import {
  sincronizadorServicos,
  useSincronizacaoServicos,
  ResultadoSincronizacao,
  EstatisticasSincronizacao
} from '@/lib/sincronizacao-servicos'
import { geradorServicos } from '@/lib/servicos-automaticos'

export default function SincronizacaoServicos() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoSincronizacao | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasSincronizacao | null>(null)
  const [autoSyncAtivo, setAutoSyncAtivo] = useState(false)
  const { sincronizar, obterEstatisticas, iniciarAutomatica, pararAutomatica } = useSincronizacaoServicos()

  // Carregar estatísticas iniciais
  useEffect(() => {
    carregarEstatisticas()
    verificarStatusAutoSync()
  }, [])

  const carregarEstatisticas = async () => {
    try {
      const stats = await obterEstatisticas()
      setEstatisticas(stats)
      setAutoSyncAtivo(stats.sincronizacaoAutomaticaAtiva)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const verificarStatusAutoSync = () => {
    // Verificar se a sincronização automática está ativa
    const status = sincronizadorServicos
    // Esta verificação pode ser melhorada com um método específico
  }

  const executarSincronizacao = async () => {
    setLoading(true)
    try {
      const resultado = await sincronizar()
      setResultado(resultado)
      await carregarEstatisticas()
    } catch (error) {
      console.error('Erro na sincronização:', error)
      setResultado({
        sucesso: false,
        novosServicos: 0,
        servicosAtualizados: 0,
        servicosDesativados: 0,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido'],
        detalhes: { adicionados: [], atualizados: [], desativados: [] }
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSincronizacaoAutomatica = () => {
    if (autoSyncAtivo) {
      pararAutomatica()
      setAutoSyncAtivo(false)
    } else {
      iniciarAutomatica(30) // 30 minutos
      setAutoSyncAtivo(true)
    }
  }

  const resetarSincronizacao = () => {
    sincronizadorServicos.resetarSincronizacao()
    setResultado(null)
    setAutoSyncAtivo(false)
    carregarEstatisticas()
  }

  const formatarDataHora = (isoString: string | null | undefined) => {
    if (!isoString) return 'Nunca'
    return new Date(isoString).toLocaleString('pt-BR')
  }

  const estatisticasLocais = geradorServicos.getEstatisticas()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sincronização de Serviços</h1>
          <p className="text-gray-600">Gerencie a sincronização entre serviços locais e backend</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={toggleSincronizacaoAutomatica}
            variant={autoSyncAtivo ? "destructive" : "default"}
            size="sm"
          >
            {autoSyncAtivo ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Sinc. Automática
          </Button>
          <Button onClick={executarSincronizacao} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sincronizar Agora
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Locais</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasLocais.total}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticasLocais.digitais} digitais ({estatisticasLocais.taxa_digitalizacao.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Backend</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalServicosBackend || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sincronizados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflitos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.servicosEmConflito || 0}</div>
            <p className="text-xs text-muted-foreground">
              Serviços com diferenças
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatarDataHora(estatisticas?.ultimaSincronizacao)}
            </div>
            <p className="text-xs text-muted-foreground">
              {autoSyncAtivo ? 'Auto-sync ativo' : 'Auto-sync inativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status da Sincronização Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Status da Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={autoSyncAtivo ? "default" : "secondary"}>
                {autoSyncAtivo ? 'Ativa' : 'Inativa'}
              </Badge>
              <span className="text-sm text-gray-600">
                Sincronização automática a cada 30 minutos
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={resetarSincronizacao}>
              Resetar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Última Sincronização */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {resultado.sucesso ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
              )}
              Resultado da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estatísticas do Resultado */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{resultado.novosServicos}</div>
                <div className="text-sm text-gray-600">Novos Serviços</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{resultado.servicosAtualizados}</div>
                <div className="text-sm text-gray-600">Atualizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{resultado.servicosDesativados}</div>
                <div className="text-sm text-gray-600">Desativados</div>
              </div>
            </div>

            <Separator />

            {/* Erros */}
            {resultado.erros.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Erros durante a sincronização:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {resultado.erros.map((erro, index) => (
                      <li key={index} className="text-sm">{erro}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Detalhes dos Serviços Adicionados */}
            {resultado.detalhes.adicionados.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-700">Serviços Adicionados:</h4>
                <div className="space-y-1">
                  {resultado.detalhes.adicionados.map((servico, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      <span className="font-medium">{servico.name}</span>
                      {servico.department && (
                        <span className="text-green-700 ml-2">({servico.department.name})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes dos Serviços Atualizados */}
            {resultado.detalhes.atualizados.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-blue-700">Serviços Atualizados:</h4>
                <div className="space-y-1">
                  {resultado.detalhes.atualizados.map((servico, index) => (
                    <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                      <span className="font-medium">{servico.name}</span>
                      {servico.department && (
                        <span className="text-blue-700 ml-2">({servico.department.name})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Detalhadas do Sistema Local */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Estatísticas Detalhadas
          </CardTitle>
          <CardDescription>
            Análise completa dos serviços no sistema local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Secretaria */}
            <div>
              <h4 className="font-medium mb-3">Distribuição por Secretaria</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Saúde:</span>
                  <Badge variant="outline">{estatisticasLocais.por_secretaria.saude} serviços</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Educação:</span>
                  <Badge variant="outline">{estatisticasLocais.por_secretaria.educacao} serviços</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Serviços Públicos:</span>
                  <Badge variant="outline">{estatisticasLocais.por_secretaria.servicos_publicos} serviços</Badge>
                </div>
              </div>
            </div>

            {/* Métricas de Uso */}
            <div>
              <h4 className="font-medium mb-3">Métricas de Demanda</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Acessos/Mês:</span>
                  <Badge variant="secondary">{estatisticasLocais.acessos_total.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Demanda Estimada:</span>
                  <Badge variant="secondary">{estatisticasLocais.demanda_total.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Taxa Digitalização:</span>
                  <Badge variant="secondary">{estatisticasLocais.taxa_digitalizacao.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Taxa Gratuidade:</span>
                  <Badge variant="secondary">{estatisticasLocais.taxa_gratuidade.toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}