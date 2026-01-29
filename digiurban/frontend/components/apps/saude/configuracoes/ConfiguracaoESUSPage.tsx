"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Save,
  TestTube,
  RefreshCcw,
  Link2,
  FileJson,
  FileCode,
  Server,
  Clock,
  Eye,
  EyeOff
} from "lucide-react"
import type { ConfiguracaoESUS, TipoIntegracaoESUS, FormatoLEDI } from "@/types/saude"

interface StatusConexao {
  status: 'success' | 'error' | 'warning' | 'info'
  mensagem: string
  detalhes?: string
}

export default function ConfiguracaoESUSPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [config, setConfig] = useState<ConfiguracaoESUS>({
    integracaoAtiva: false,
    tipoIntegracao: 'NENHUMA' as TipoIntegracaoESUS,
    sincronizacaoAutomatica: false,
    intervaloSincMinutos: 60,
    logTransmissoes: true,
    retentarEnviosFalhos: true,
    maxTentativas: 3
  })

  const [statusConexao, setStatusConexao] = useState<StatusConexao | null>(null)
  const [ultimoTeste, setUltimoTeste] = useState<Date | null>(null)

  // Carregar configuração existente
  useEffect(() => {
    carregarConfiguracao()
  }, [])

  const carregarConfiguracao = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/saude/configuracoes/esus')

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setConfig(data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvarConfiguracao = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/apps/saude/configuracoes/esus', {
        method: config.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setStatusConexao({
          status: 'success',
          mensagem: 'Configuração salva com sucesso!'
        })

        setTimeout(() => setStatusConexao(null), 5000)
      } else {
        throw new Error('Erro ao salvar configuração')
      }
    } catch (error) {
      setStatusConexao({
        status: 'error',
        mensagem: 'Erro ao salvar configuração',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setSaving(false)
    }
  }

  const testarConexao = async () => {
    try {
      setTesting(true)
      setStatusConexao(null)

      const response = await fetch('/api/apps/saude/configuracoes/esus/testar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlPEC: config.urlPEC,
          usuarioAPI: config.usuarioAPI,
          senhaAPI: config.senhaAPI,
          tipoIntegracao: config.tipoIntegracao
        }),
      })

      const result = await response.json()

      if (response.ok && result.sucesso) {
        setStatusConexao({
          status: 'success',
          mensagem: 'Conexão estabelecida com sucesso!',
          detalhes: result.detalhes || 'PEC e-SUS APS respondendo normalmente'
        })
        setUltimoTeste(new Date())
      } else {
        setStatusConexao({
          status: 'error',
          mensagem: 'Falha na conexão',
          detalhes: result.erro || 'Não foi possível conectar ao PEC e-SUS'
        })
      }
    } catch (error) {
      setStatusConexao({
        status: 'error',
        mensagem: 'Erro ao testar conexão',
        detalhes: error instanceof Error ? error.message : 'Erro de rede'
      })
    } finally {
      setTesting(false)
    }
  }

  const sincronizarAgora = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/apps/saude/configuracoes/esus/sincronizar', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        setStatusConexao({
          status: 'success',
          mensagem: 'Sincronização iniciada!',
          detalhes: `${result.registrosEnviados || 0} registros na fila de envio`
        })

        // Atualizar última sincronização
        setConfig(prev => ({
          ...prev,
          ultimaSincronizacao: new Date().toISOString()
        }))
      }
    } catch (error) {
      setStatusConexao({
        status: 'error',
        mensagem: 'Erro ao sincronizar',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Integração PEC e-SUS APS</h1>
          <p className="text-muted-foreground mt-1">
            Configure a integração com o Prontuário Eletrônico do Cidadão do Ministério da Saúde
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={config.integracaoAtiva ? "default" : "secondary"}>
            {config.integracaoAtiva ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </div>

      {/* Alert de Status */}
      {statusConexao && (
        <Alert variant={statusConexao.status === 'error' ? 'destructive' : 'default'}>
          {statusConexao.status === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {statusConexao.status === 'error' && <XCircle className="h-4 w-4" />}
          {statusConexao.status === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {statusConexao.status === 'info' && <Info className="h-4 w-4" />}
          <AlertTitle>{statusConexao.mensagem}</AlertTitle>
          {statusConexao.detalhes && (
            <AlertDescription>{statusConexao.detalhes}</AlertDescription>
          )}
        </Alert>
      )}

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">
            <Server className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="api">
            <Link2 className="h-4 w-4 mr-2" />
            API REST
          </TabsTrigger>
          <TabsTrigger value="ledi">
            <FileCode className="h-4 w-4 mr-2" />
            LEDI
          </TabsTrigger>
          <TabsTrigger value="sincronizacao">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Sincronização
          </TabsTrigger>
        </TabsList>

        {/* ABA: Geral */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Ative ou desative a integração e escolha o método de envio de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Integração Ativa */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="integracaoAtiva">Integração Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar envio de dados ao PEC e-SUS APS
                  </p>
                </div>
                <Switch
                  id="integracaoAtiva"
                  checked={config.integracaoAtiva}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, integracaoAtiva: checked }))
                  }
                />
              </div>

              <Separator />

              {/* Tipo de Integração */}
              <div className="space-y-2">
                <Label htmlFor="tipoIntegracao">Método de Integração</Label>
                <Select
                  value={config.tipoIntegracao}
                  onValueChange={(value: any) =>
                    setConfig(prev => ({ ...prev, tipoIntegracao: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUMA">
                      Nenhuma integração
                    </SelectItem>
                    <SelectItem value="API_REST">
                      API REST (PEC v5.3.19+) - Recomendado
                    </SelectItem>
                    <SelectItem value="LEDI_THRIFT">
                      LEDI Thrift (Arquivo Binário)
                    </SelectItem>
                    <SelectItem value="LEDI_XML">
                      LEDI XML (Arquivo XML)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {config.tipoIntegracao === 'API_REST' &&
                    "Envio em tempo real via API REST (requer PEC v5.3.19 ou superior)"}
                  {config.tipoIntegracao === 'LEDI_THRIFT' &&
                    "Geração de arquivos Thrift para importação manual"}
                  {config.tipoIntegracao === 'LEDI_XML' &&
                    "Geração de arquivos XML para importação manual"}
                  {config.tipoIntegracao === 'NENHUMA' &&
                    "Sistema funciona de forma independente"}
                </p>
              </div>

              <Separator />

              {/* CNES Unidade Principal */}
              <div className="space-y-2">
                <Label htmlFor="cnes">CNES da Unidade Principal</Label>
                <Input
                  id="cnes"
                  placeholder="1234567"
                  value={config.cnesUnidadePrincipal || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, cnesUnidadePrincipal: e.target.value }))
                  }
                  maxLength={7}
                />
                <p className="text-sm text-muted-foreground">
                  Código CNES (Cadastro Nacional de Estabelecimentos de Saúde) da sua unidade principal
                </p>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  placeholder="Anotações sobre a configuração..."
                  value={config.observacoes || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, observacoes: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: API REST */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração API REST</CardTitle>
              <CardDescription>
                Credenciais para conexão com o PEC e-SUS APS via API (versão 5.3.19+)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL do PEC */}
              <div className="space-y-2">
                <Label htmlFor="urlPEC">URL da Instalação PEC</Label>
                <Input
                  id="urlPEC"
                  type="url"
                  placeholder="https://esus.cidade.gov.br"
                  value={config.urlPEC || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, urlPEC: e.target.value }))
                  }
                  disabled={config.tipoIntegracao !== 'API_REST'}
                />
                <p className="text-sm text-muted-foreground">
                  URL completa da instalação do PEC e-SUS APS (deve usar HTTPS)
                </p>
              </div>

              {/* Usuário API */}
              <div className="space-y-2">
                <Label htmlFor="usuarioAPI">Usuário da API</Label>
                <Input
                  id="usuarioAPI"
                  placeholder="usuario_api"
                  value={config.usuarioAPI || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, usuarioAPI: e.target.value }))
                  }
                  disabled={config.tipoIntegracao !== 'API_REST'}
                />
                <p className="text-sm text-muted-foreground">
                  Usuário gerado no módulo "Transmissão de dados" pelo Administrador da Instalação PEC
                </p>
              </div>

              {/* Senha API */}
              <div className="space-y-2">
                <Label htmlFor="senhaAPI">Senha da API</Label>
                <div className="relative">
                  <Input
                    id="senhaAPI"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={config.senhaAPI || ''}
                    onChange={(e) =>
                      setConfig(prev => ({ ...prev, senhaAPI: e.target.value }))
                    }
                    disabled={config.tipoIntegracao !== 'API_REST'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Senha gerada junto com o usuário (exibida apenas uma vez no PEC)
                </p>
              </div>

              <Separator />

              {/* Teste de Conexão */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={testarConexao}
                  disabled={
                    testing ||
                    config.tipoIntegracao !== 'API_REST' ||
                    !config.urlPEC ||
                    !config.usuarioAPI ||
                    !config.senhaAPI
                  }
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {ultimoTeste && (
                  <span className="text-sm text-muted-foreground">
                    Último teste: {ultimoTeste.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              {/* Informações Adicionais */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Como obter as credenciais</AlertTitle>
                <AlertDescription className="space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acesse a instalação do PEC e-SUS APS como Administrador</li>
                    <li>Vá em: <strong>Transmissão de dados → Credenciais para API</strong></li>
                    <li>Clique em "Registrar novo integrador"</li>
                    <li>Preencha os dados (Nome, CPF/CNPJ, Email)</li>
                    <li>Copie o usuário e senha gerados (serão exibidos apenas uma vez)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: LEDI */}
        <TabsContent value="ledi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração LEDI</CardTitle>
              <CardDescription>
                Layout e-SUS APS de Dados e Interface para geração de arquivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formato LEDI */}
              <div className="space-y-2">
                <Label htmlFor="formatoLEDI">Formato do Arquivo</Label>
                <Select
                  value={config.formatoLEDI || ''}
                  onValueChange={(value: any) =>
                    setConfig(prev => ({ ...prev, formatoLEDI: value }))
                  }
                  disabled={!['LEDI_THRIFT', 'LEDI_XML'].includes(config.tipoIntegracao)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THRIFT">
                      Apache Thrift (Binário) - Mais performático
                    </SelectItem>
                    <SelectItem value="XML">
                      XML - Mais legível
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Versão LEDI */}
              <div className="space-y-2">
                <Label htmlFor="versaoLEDI">Versão do LEDI</Label>
                <Input
                  id="versaoLEDI"
                  placeholder="6.3.8"
                  value={config.versaoLEDI || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, versaoLEDI: e.target.value }))
                  }
                  disabled={!['LEDI_THRIFT', 'LEDI_XML'].includes(config.tipoIntegracao)}
                />
                <p className="text-sm text-muted-foreground">
                  Versão do LEDI compatível com sua instalação do PEC
                </p>
              </div>

              {/* Diretório de Exportação */}
              <div className="space-y-2">
                <Label htmlFor="diretorio">Diretório de Exportação</Label>
                <Input
                  id="diretorio"
                  placeholder="/var/esus/exportacao"
                  value={config.diretorioExportacao || ''}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, diretorioExportacao: e.target.value }))
                  }
                  disabled={!['LEDI_THRIFT', 'LEDI_XML'].includes(config.tipoIntegracao)}
                />
                <p className="text-sm text-muted-foreground">
                  Caminho completo onde os arquivos LEDI serão salvos
                </p>
              </div>

              <Separator />

              {/* Informações LEDI */}
              <Alert>
                <FileJson className="h-4 w-4" />
                <AlertTitle>Sobre o LEDI</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    O LEDI (Layout e-SUS APS de Dados e Interface) permite a integração
                    de sistemas próprios com o PEC através de arquivos estruturados.
                  </p>
                  <p className="mt-2">
                    <strong>Documentação oficial:</strong>{' '}
                    <a
                      href="https://integracao.esusaps.bridge.ufsc.tech/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      integracao.esusaps.bridge.ufsc.tech
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: Sincronização */}
        <TabsContent value="sincronizacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
              <CardDescription>
                Defina como e quando os dados serão enviados ao PEC e-SUS APS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sincronização Automática */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sincAuto">Sincronização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar dados automaticamente em intervalos regulares
                  </p>
                </div>
                <Switch
                  id="sincAuto"
                  checked={config.sincronizacaoAutomatica}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, sincronizacaoAutomatica: checked }))
                  }
                  disabled={!config.integracaoAtiva}
                />
              </div>

              {/* Intervalo */}
              <div className="space-y-2">
                <Label htmlFor="intervalo">Intervalo de Sincronização (minutos)</Label>
                <Input
                  id="intervalo"
                  type="number"
                  min="5"
                  max="1440"
                  value={config.intervaloSincMinutos}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      intervaloSincMinutos: parseInt(e.target.value) || 60
                    }))
                  }
                  disabled={!config.sincronizacaoAutomatica}
                />
                <p className="text-sm text-muted-foreground">
                  Frequência de envio automático (mínimo: 5 minutos, máximo: 24 horas)
                </p>
              </div>

              <Separator />

              {/* Logs */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="logs">Manter Log de Transmissões</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as tentativas de envio para auditoria
                  </p>
                </div>
                <Switch
                  id="logs"
                  checked={config.logTransmissoes}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, logTransmissoes: checked }))
                  }
                />
              </div>

              {/* Retry */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="retry">Retentar Envios Falhos</Label>
                  <p className="text-sm text-muted-foreground">
                    Tentar reenviar automaticamente registros com erro
                  </p>
                </div>
                <Switch
                  id="retry"
                  checked={config.retentarEnviosFalhos}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, retentarEnviosFalhos: checked }))
                  }
                />
              </div>

              {/* Máximo de Tentativas */}
              <div className="space-y-2">
                <Label htmlFor="maxTentativas">Máximo de Tentativas</Label>
                <Input
                  id="maxTentativas"
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxTentativas}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      maxTentativas: parseInt(e.target.value) || 3
                    }))
                  }
                  disabled={!config.retentarEnviosFalhos}
                />
                <p className="text-sm text-muted-foreground">
                  Número de tentativas antes de marcar o envio como falho definitivamente
                </p>
              </div>

              <Separator />

              {/* Última Sincronização */}
              {config.ultimaSincronizacao && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Última sincronização: {new Date(config.ultimaSincronizacao).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Sincronizar Agora */}
              <Button
                onClick={sincronizarAgora}
                disabled={!config.integracaoAtiva || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={carregarConfiguracao} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={salvarConfiguracao} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
