"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Baby, Activity, FileText, AlertTriangle, CheckCircle } from "lucide-react"

interface PreNatal {
  id: string
  dum: Date
  dpp: Date
  idadeGestacional: string
  gravidez: number
  partos: number
  abortos: number
  cesarianas: number
  riscoGestacional: 'HABITUAL' | 'ALTO_RISCO'
  status: 'EM_ANDAMENTO' | 'FINALIZADO' | 'INTERROMPIDO'
  grupoSanguineo?: string
  fatorRh?: string
  pesoInicial?: number
  alturaInicial?: number
  imcInicial?: number
}

interface ConsultaPreNatal {
  id: string
  dataConsulta: Date
  idadeGestacional: string
  peso?: number
  pressaoArterial?: string
  alturaUterina?: number
  bcf?: number
  movimentosFetais?: boolean
  queixas?: string
  proximaConsulta?: Date
}

interface AcompanhamentoPreNatalCardProps {
  citizenId: string
}

export default function AcompanhamentoPreNatalCard({ citizenId }: AcompanhamentoPreNatalCardProps) {
  const [preNatal, setPreNatal] = useState<PreNatal | null>(null)
  const [consultas, setConsultas] = useState<ConsultaPreNatal[]>([])
  const [loading, setLoading] = useState(true)
  const [iniciando, setIniciando] = useState(false)

  const [novoPreNatal, setNovoPreNatal] = useState({
    dum: '',
    gravidez: 1,
    partos: 0,
    abortos: 0,
    cesarianas: 0,
    grupoSanguineo: '',
    fatorRh: 'Positivo',
    pesoInicial: '',
    alturaInicial: ''
  })

  useEffect(() => {
    carregarPreNatal()
  }, [citizenId])

  const carregarPreNatal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/apps/saude/prenatal/${citizenId}`)
      if (response.ok) {
        const data = await response.json()
        setPreNatal(data.preNatal)
        setConsultas(data.consultas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pré-natal:', error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarPreNatal = async () => {
    try {
      setIniciando(true)

      const dum = new Date(novoPreNatal.dum)
      const dpp = new Date(dum)
      dpp.setDate(dpp.getDate() + 280) // 40 semanas

      const response = await fetch(`/api/apps/saude/prenatal/${citizenId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...novoPreNatal,
          dum,
          dpp,
          citizenId,
        }),
      })

      if (response.ok) {
        await carregarPreNatal()
      }
    } catch (error) {
      console.error('Erro ao iniciar pré-natal:', error)
    } finally {
      setIniciando(false)
    }
  }

  const calcularIG = (dum: Date): { semanas: number; dias: number; texto: string } => {
    const hoje = new Date()
    const diffMs = hoje.getTime() - new Date(dum).getTime()
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const semanas = Math.floor(diffDias / 7)
    const dias = diffDias % 7
    return {
      semanas,
      dias,
      texto: `${semanas}s ${dias}d`
    }
  }

  const calcularProgressoGestacao = (dum: Date): number => {
    const ig = calcularIG(dum)
    const totalSemanas = ig.semanas + (ig.dias / 7)
    return Math.min((totalSemanas / 40) * 100, 100)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  // Se não há pré-natal ativo, mostrar formulário de início
  if (!preNatal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Iniciar Acompanhamento Pré-Natal
          </CardTitle>
          <CardDescription>
            Registre a gestação para iniciar o acompanhamento pré-natal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dum">Data da Última Menstruação (DUM) *</Label>
                <Input
                  id="dum"
                  type="date"
                  value={novoPreNatal.dum}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, dum: e.target.value }))}
                />
              </div>

              {novoPreNatal.dum && (
                <div className="space-y-2">
                  <Label>Data Provável do Parto (DPP)</Label>
                  <Input
                    type="date"
                    value={new Date(new Date(novoPreNatal.dum).getTime() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gravidez">Gesta</Label>
                <Input
                  id="gravidez"
                  type="number"
                  min="1"
                  value={novoPreNatal.gravidez}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, gravidez: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partos">Para</Label>
                <Input
                  id="partos"
                  type="number"
                  min="0"
                  value={novoPreNatal.partos}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, partos: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abortos">Abortos</Label>
                <Input
                  id="abortos"
                  type="number"
                  min="0"
                  value={novoPreNatal.abortos}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, abortos: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cesarianas">Cesáreas</Label>
                <Input
                  id="cesarianas"
                  type="number"
                  min="0"
                  value={novoPreNatal.cesarianas}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, cesarianas: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupoSanguineo">Grupo Sanguíneo</Label>
                <select
                  id="grupoSanguineo"
                  className="w-full p-2 border rounded-md"
                  value={novoPreNatal.grupoSanguineo}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, grupoSanguineo: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatorRh">Fator Rh</Label>
                <select
                  id="fatorRh"
                  className="w-full p-2 border rounded-md"
                  value={novoPreNatal.fatorRh}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, fatorRh: e.target.value }))}
                >
                  <option value="Positivo">Positivo</option>
                  <option value="Negativo">Negativo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pesoInicial">Peso Inicial (kg)</Label>
                <Input
                  id="pesoInicial"
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={novoPreNatal.pesoInicial}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, pesoInicial: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alturaInicial">Altura (m)</Label>
                <Input
                  id="alturaInicial"
                  type="number"
                  step="0.01"
                  placeholder="1.65"
                  value={novoPreNatal.alturaInicial}
                  onChange={(e) => setNovoPreNatal(prev => ({ ...prev, alturaInicial: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={iniciarPreNatal} disabled={!novoPreNatal.dum || iniciando} className="w-full">
              {iniciando ? 'Iniciando...' : 'Iniciar Pré-Natal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se há pré-natal ativo, mostrar dashboard
  const ig = calcularIG(preNatal.dum)
  const progresso = calcularProgressoGestacao(preNatal.dum)

  return (
    <div className="space-y-6">
      {/* Card Resumo */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Acompanhamento Pré-Natal
              </CardTitle>
              <CardDescription>
                Gestação em andamento • IG: {ig.texto}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={preNatal.riscoGestacional === 'ALTO_RISCO' ? 'destructive' : 'default'}>
                {preNatal.riscoGestacional === 'ALTO_RISCO' ? (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alto Risco
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Risco Habitual
                  </>
                )}
              </Badge>
              <Badge variant="outline">
                G{preNatal.gravidez} P{preNatal.partos} A{preNatal.abortos} C{preNatal.cesarianas}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progresso da Gestação */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso da Gestação</span>
              <span className="font-medium">{ig.semanas} semanas de 40</span>
            </div>
            <Progress value={progresso} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>DUM: {new Date(preNatal.dum).toLocaleDateString('pt-BR')}</span>
              <span>DPP: {new Date(preNatal.dpp).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Dados Clínicos Iniciais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {preNatal.grupoSanguineo && (
              <div>
                <p className="text-xs text-muted-foreground">Sangue</p>
                <p className="text-sm font-medium">{preNatal.grupoSanguineo} {preNatal.fatorRh}</p>
              </div>
            )}
            {preNatal.pesoInicial && (
              <div>
                <p className="text-xs text-muted-foreground">Peso Inicial</p>
                <p className="text-sm font-medium">{preNatal.pesoInicial} kg</p>
              </div>
            )}
            {preNatal.alturaInicial && (
              <div>
                <p className="text-xs text-muted-foreground">Altura</p>
                <p className="text-sm font-medium">{preNatal.alturaInicial} m</p>
              </div>
            )}
            {preNatal.imcInicial && (
              <div>
                <p className="text-xs text-muted-foreground">IMC Inicial</p>
                <p className="text-sm font-medium">{preNatal.imcInicial.toFixed(1)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consultas">
            <Calendar className="h-4 w-4 mr-2" />
            Consultas
          </TabsTrigger>
          <TabsTrigger value="exames">
            <FileText className="h-4 w-4 mr-2" />
            Exames
          </TabsTrigger>
          <TabsTrigger value="graficos">
            <Activity className="h-4 w-4 mr-2" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultas">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Consultas de Pré-Natal</CardTitle>
                <Button>Nova Consulta</Button>
              </div>
            </CardHeader>
            <CardContent>
              {consultas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma consulta registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {consultas.map((consulta, index) => (
                    <Card key={consulta.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>Consulta #{index + 1}</Badge>
                              <Badge variant="outline">{consulta.idadeGestacional}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              {consulta.peso && (
                                <div>
                                  <span className="text-muted-foreground">Peso:</span> {consulta.peso} kg
                                </div>
                              )}
                              {consulta.pressaoArterial && (
                                <div>
                                  <span className="text-muted-foreground">PA:</span> {consulta.pressaoArterial}
                                </div>
                              )}
                              {consulta.alturaUterina && (
                                <div>
                                  <span className="text-muted-foreground">AU:</span> {consulta.alturaUterina} cm
                                </div>
                              )}
                              {consulta.bcf && (
                                <div>
                                  <span className="text-muted-foreground">BCF:</span> {consulta.bcf} bpm
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Ver Detalhes</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exames">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Exames Pré-Natais</CardTitle>
                <Button>Solicitar Exame</Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Funcionalidade de exames em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graficos">
          <Card>
            <CardHeader>
              <CardTitle>Gráficos de Evolução</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Gráficos de peso, PA e altura uterina em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
