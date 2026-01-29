"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Save, FileText, Stethoscope, Activity, ClipboardList, Pill } from "lucide-react"
import type { ConsultaSOAP } from "@/types/saude"

interface ConsultaMedicaSOAPFormProps {
  atendimentoId: string
  onSave: (data: ConsultaSOAP) => Promise<void>
  initialData?: Partial<ConsultaSOAP>
}

export default function ConsultaMedicaSOAPForm({
  atendimentoId,
  onSave,
  initialData
}: ConsultaMedicaSOAPFormProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConsultaSOAP>({
    sinaisVitais: {},
    antropometria: {},
    retornoNecessario: false,
    ...initialData
  })

  const calcularIMC = () => {
    const peso = data.antropometria?.peso
    const altura = data.antropometria?.altura

    if (peso && altura && altura > 0) {
      const imc = peso / (altura * altura)
      setData(prev => ({
        ...prev,
        antropometria: {
          ...prev.antropometria,
          imc: parseFloat(imc.toFixed(2))
        }
      }))
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await onSave(data)
    } catch (error) {
      console.error('Erro ao salvar consulta:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Consulta Médica - Método SOAP</CardTitle>
          <CardDescription>
            Documentação estruturada: Subjetivo, Objetivo, Avaliação e Plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subjetivo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subjetivo">
                <FileText className="h-4 w-4 mr-2" />
                S - Subjetivo
              </TabsTrigger>
              <TabsTrigger value="objetivo">
                <Stethoscope className="h-4 w-4 mr-2" />
                O - Objetivo
              </TabsTrigger>
              <TabsTrigger value="avaliacao">
                <Activity className="h-4 w-4 mr-2" />
                A - Avaliação
              </TabsTrigger>
              <TabsTrigger value="plano">
                <ClipboardList className="h-4 w-4 mr-2" />
                P - Plano
              </TabsTrigger>
            </TabsList>

            {/* S - SUBJETIVO */}
            <TabsContent value="subjetivo" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">S - SUBJETIVO</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Informações relatadas pelo paciente sobre sua condição
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivoConsulta">Motivo da Consulta / Queixa Principal *</Label>
                  <Textarea
                    id="motivoConsulta"
                    placeholder="Ex: Dor abdominal há 3 dias"
                    value={data.motivoConsulta || ''}
                    onChange={(e) => setData(prev => ({ ...prev, motivoConsulta: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historiaAtual">História da Doença Atual (HDA)</Label>
                  <Textarea
                    id="historiaAtual"
                    placeholder="Descreva a evolução dos sintomas, características, fatores de melhora/piora..."
                    value={data.historiaAtual || ''}
                    onChange={(e) => setData(prev => ({ ...prev, historiaAtual: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historiaPregressa">História Pregressa / Antecedentes Pessoais</Label>
                  <Textarea
                    id="historiaPregressa"
                    placeholder="Doenças anteriores, cirurgias, internações, alergias, medicamentos em uso..."
                    value={data.historiaPregressa || ''}
                    onChange={(e) => setData(prev => ({ ...prev, historiaPregressa: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historiaFamiliar">História Familiar</Label>
                  <Textarea
                    id="historiaFamiliar"
                    placeholder="Doenças na família (hipertensão, diabetes, câncer, etc)"
                    value={data.historiaFamiliar || ''}
                    onChange={(e) => setData(prev => ({ ...prev, historiaFamiliar: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historiaSocial">História Social</Label>
                  <Textarea
                    id="historiaSocial"
                    placeholder="Ocupação, hábitos (tabagismo, etilismo), condições sociais, moradia..."
                    value={data.historiaSocial || ''}
                    onChange={(e) => setData(prev => ({ ...prev, historiaSocial: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* O - OBJETIVO */}
            <TabsContent value="objetivo" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">O - OBJETIVO</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dados objetivos obtidos através do exame físico e medições
                  </p>
                </div>

                {/* Sinais Vitais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sinais Vitais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pressaoArterial">Pressão Arterial (mmHg)</Label>
                        <Input
                          id="pressaoArterial"
                          placeholder="120/80"
                          value={data.sinaisVitais?.pressaoArterial || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            sinaisVitais: { ...prev.sinaisVitais, pressaoArterial: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="temperatura">Temperatura (°C)</Label>
                        <Input
                          id="temperatura"
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          value={data.sinaisVitais?.temperatura || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            sinaisVitais: { ...prev.sinaisVitais, temperatura: parseFloat(e.target.value) }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fc">Frequência Cardíaca (bpm)</Label>
                        <Input
                          id="fc"
                          type="number"
                          placeholder="80"
                          value={data.sinaisVitais?.frequenciaCardiaca || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            sinaisVitais: { ...prev.sinaisVitais, frequenciaCardiaca: parseInt(e.target.value) }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fr">Frequência Respiratória (ipm)</Label>
                        <Input
                          id="fr"
                          type="number"
                          placeholder="16"
                          value={data.sinaisVitais?.frequenciaRespiratoria || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            sinaisVitais: { ...prev.sinaisVitais, frequenciaRespiratoria: parseInt(e.target.value) }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="satO2">Saturação O2 (%)</Label>
                        <Input
                          id="satO2"
                          type="number"
                          placeholder="98"
                          value={data.sinaisVitais?.saturacaoO2 || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            sinaisVitais: { ...prev.sinaisVitais, saturacaoO2: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Antropometria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Antropometria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="peso">Peso (kg)</Label>
                        <Input
                          id="peso"
                          type="number"
                          step="0.1"
                          placeholder="70.5"
                          value={data.antropometria?.peso || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            antropometria: { ...prev.antropometria, peso: parseFloat(e.target.value) }
                          }))}
                          onBlur={calcularIMC}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="altura">Altura (m)</Label>
                        <Input
                          id="altura"
                          type="number"
                          step="0.01"
                          placeholder="1.75"
                          value={data.antropometria?.altura || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            antropometria: { ...prev.antropometria, altura: parseFloat(e.target.value) }
                          }))}
                          onBlur={calcularIMC}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imc">IMC</Label>
                        <Input
                          id="imc"
                          type="number"
                          step="0.01"
                          placeholder="Calculado"
                          value={data.antropometria?.imc || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={calcularIMC}>
                          Calcular IMC
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Exame Físico */}
                <div className="space-y-2">
                  <Label htmlFor="exameFisicoGeral">Exame Físico Geral</Label>
                  <Textarea
                    id="exameFisicoGeral"
                    placeholder="Estado geral, nível de consciência, hidratação, coloração, fácies..."
                    value={data.exameFisicoGeral || ''}
                    onChange={(e) => setData(prev => ({ ...prev, exameFisicoGeral: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* A - AVALIAÇÃO */}
            <TabsContent value="avaliacao" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">A - AVALIAÇÃO</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Impressão diagnóstica baseada nos dados coletados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hipoteseDiagnostica">Hipótese Diagnóstica / Raciocínio Clínico</Label>
                  <Textarea
                    id="hipoteseDiagnostica"
                    placeholder="Descrição do raciocínio clínico e hipóteses consideradas..."
                    value={data.hipoteseDiagnostica || ''}
                    onChange={(e) => setData(prev => ({ ...prev, hipoteseDiagnostica: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosticoPrincipal">Diagnóstico Principal (CID-10 ou CIAP-2)</Label>
                  <Input
                    id="diagnosticoPrincipal"
                    placeholder="Ex: K30 (Dispepsia) ou D07 (Dor epigástrica)"
                    value={data.diagnosticoPrincipal || ''}
                    onChange={(e) => setData(prev => ({ ...prev, diagnosticoPrincipal: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use CID-10 (ex: K30) ou CIAP-2 (ex: D07) conforme padrão e-SUS
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> A lista de problemas/condições será gerenciada em seção separada,
                    permitindo acompanhamento longitudinal dos problemas ativos, latentes e resolvidos do paciente.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* P - PLANO */}
            <TabsContent value="plano" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">P - PLANO</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Conduta terapêutica e orientações ao paciente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condutaTerapeutica">Conduta Terapêutica</Label>
                  <Textarea
                    id="condutaTerapeutica"
                    placeholder="Tratamento proposto, procedimentos realizados..."
                    value={data.condutaTerapeutica || ''}
                    onChange={(e) => setData(prev => ({ ...prev, condutaTerapeutica: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientacoes">Orientações ao Paciente</Label>
                  <Textarea
                    id="orientacoes"
                    placeholder="Orientações sobre medicação, dieta, repouso, sinais de alerta..."
                    value={data.orientacoes || ''}
                    onChange={(e) => setData(prev => ({ ...prev, orientacoes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="retornoNecessario"
                      checked={data.retornoNecessario}
                      onChange={(e) => setData(prev => ({ ...prev, retornoNecessario: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="retornoNecessario">Retorno Necessário</Label>
                  </div>

                  {data.retornoNecessario && (
                    <div className="space-y-2">
                      <Label htmlFor="prazoRetorno">Prazo para Retorno (dias)</Label>
                      <Input
                        id="prazoRetorno"
                        type="number"
                        placeholder="30"
                        value={data.prazoRetornoDias || ''}
                        onChange={(e) => setData(prev => ({ ...prev, prazoRetornoDias: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-2">
                    <Pill className="h-4 w-4 inline mr-1" />
                    <strong>Prescrições, Exames, Encaminhamentos e Atestados</strong>
                  </p>
                  <p className="text-xs text-green-700">
                    Serão registrados em seções específicas após salvar a consulta.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações adicionais..."
                    value={data.observacoes || ''}
                    onChange={(e) => setData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Consulta SOAP
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
