"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Activity, Heart, Baby } from 'lucide-react'

interface ConsultaPreNatal {
  id: string
  dataConsulta: Date
  idadeGestacional: number // semanas
  peso: number
  pressaoArterialSistolica: number
  pressaoArterialDiastolica: number
  alturaUterina?: number
  bcf?: number
  edema?: string
}

interface GraficosPreNatalProps {
  consultas: ConsultaPreNatal[]
  pesoInicial: number
  alturaInicial: number
  dum: Date
}

export function GraficosPreNatal({ consultas, pesoInicial, alturaInicial, dum }: GraficosPreNatalProps) {
  // Ordenar consultas por data
  const consultasOrdenadas = [...consultas].sort(
    (a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime()
  )

  // Calcular ganho de peso esperado por semana
  const calcularPesoEsperado = (ig: number, pesoInicial: number) => {
    const imc = pesoInicial / ((alturaInicial / 100) ** 2)

    // Ganho de peso recomendado pelo IOM (Institute of Medicine)
    let ganhoTotal = 0
    if (imc < 18.5) ganhoTotal = 12.5 + 18 // Baixo peso
    else if (imc < 25) ganhoTotal = 11.5 + 16 // Peso normal
    else if (imc < 30) ganhoTotal = 7 + 11.5 // Sobrepeso
    else ganhoTotal = 5 + 9 // Obesidade

    // Ganho progressivo (maior no 2º e 3º trimestre)
    if (ig < 13) return pesoInicial + (ganhoTotal * 0.1 * (ig / 13))
    else if (ig < 27) return pesoInicial + (ganhoTotal * 0.1) + (ganhoTotal * 0.4 * ((ig - 13) / 14))
    else return pesoInicial + (ganhoTotal * 0.5) + (ganhoTotal * 0.5 * ((ig - 27) / 13))
  }

  // Calcular altura uterina esperada (após 20 semanas)
  const calcularAlturaUterinaEsperada = (ig: number) => {
    if (ig < 20) return null
    // Regra aproximada: AU = IG ± 2cm
    return ig
  }

  const maxIG = 42
  const semanas = Array.from({ length: maxIG }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="peso">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="peso">
            <TrendingUp className="h-4 w-4 mr-2" />
            Peso
          </TabsTrigger>
          <TabsTrigger value="pressao">
            <Heart className="h-4 w-4 mr-2" />
            Pressão Arterial
          </TabsTrigger>
          <TabsTrigger value="altura-uterina">
            <Baby className="h-4 w-4 mr-2" />
            Altura Uterina
          </TabsTrigger>
          <TabsTrigger value="bcf">
            <Activity className="h-4 w-4 mr-2" />
            BCF
          </TabsTrigger>
        </TabsList>

        {/* Gráfico de Peso */}
        <TabsContent value="peso">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Peso Gestacional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-80 w-full">
                <svg viewBox="0 0 800 320" className="w-full h-full">
                  {/* Eixos */}
                  <line x1="50" y1="270" x2="750" y2="270" stroke="#ccc" strokeWidth="2" />
                  <line x1="50" y1="30" x2="50" y2="270" stroke="#ccc" strokeWidth="2" />

                  {/* Labels do eixo X (semanas) */}
                  {[0, 10, 20, 30, 40].map((semana) => (
                    <g key={semana}>
                      <line
                        x1={50 + (semana / 40) * 700}
                        y1="270"
                        x2={50 + (semana / 40) * 700}
                        y2="275"
                        stroke="#999"
                        strokeWidth="1"
                      />
                      <text
                        x={50 + (semana / 40) * 700}
                        y="290"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#666"
                      >
                        {semana}
                      </text>
                    </g>
                  ))}

                  {/* Labels do eixo Y (peso) */}
                  {[0, 5, 10, 15, 20].map((kg, i) => (
                    <g key={kg}>
                      <line
                        x1="45"
                        y1={270 - (kg / 20) * 240}
                        x2="50"
                        y2={270 - (kg / 20) * 240}
                        stroke="#999"
                        strokeWidth="1"
                      />
                      <text
                        x="40"
                        y={270 - (kg / 20) * 240 + 5}
                        textAnchor="end"
                        fontSize="12"
                        fill="#666"
                      >
                        +{kg}kg
                      </text>
                    </g>
                  ))}

                  {/* Linha de peso esperado (verde claro) */}
                  <path
                    d={semanas.map((s, i) => {
                      const pesoEsperado = calcularPesoEsperado(s, pesoInicial)
                      const ganho = pesoEsperado - pesoInicial
                      const x = 50 + (s / 40) * 700
                      const y = 270 - (ganho / 20) * 240
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Linha de peso real (azul) */}
                  {consultasOrdenadas.length > 0 && (
                    <path
                      d={consultasOrdenadas.map((c, i) => {
                        const ganho = c.peso - pesoInicial
                        const x = 50 + (c.idadeGestacional / 40) * 700
                        const y = 270 - (ganho / 20) * 240
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                  )}

                  {/* Pontos de consulta */}
                  {consultasOrdenadas.map((c) => {
                    const ganho = c.peso - pesoInicial
                    const x = 50 + (c.idadeGestacional / 40) * 700
                    const y = 270 - (ganho / 20) * 240
                    return (
                      <g key={c.id}>
                        <circle cx={x} cy={y} r="5" fill="#3b82f6" />
                        <title>{`${c.idadeGestacional} sem: ${c.peso}kg (+${ganho.toFixed(1)}kg)`}</title>
                      </g>
                    )
                  })}
                </svg>

                {/* Legenda */}
                <div className="flex gap-4 mt-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500" />
                    <span>Peso Real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-300 border-dashed border border-green-300" />
                    <span>Peso Esperado</span>
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-gray-600">Peso Inicial</div>
                    <div className="text-lg font-bold text-blue-600">{pesoInicial.toFixed(1)} kg</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-gray-600">Peso Atual</div>
                    <div className="text-lg font-bold text-green-600">
                      {consultasOrdenadas.length > 0
                        ? consultasOrdenadas[consultasOrdenadas.length - 1].peso.toFixed(1)
                        : pesoInicial.toFixed(1)} kg
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-gray-600">Ganho Total</div>
                    <div className="text-lg font-bold text-purple-600">
                      {consultasOrdenadas.length > 0
                        ? `+${(consultasOrdenadas[consultasOrdenadas.length - 1].peso - pesoInicial).toFixed(1)} kg`
                        : '0.0 kg'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de Pressão Arterial */}
        <TabsContent value="pressao">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Pressão Arterial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-80 w-full">
                <svg viewBox="0 0 800 320" className="w-full h-full">
                  {/* Eixos */}
                  <line x1="50" y1="270" x2="750" y2="270" stroke="#ccc" strokeWidth="2" />
                  <line x1="50" y1="30" x2="50" y2="270" stroke="#ccc" strokeWidth="2" />

                  {/* Zona de alerta (PA > 140/90) */}
                  <rect x="50" y="30" width="700" height="60" fill="#fee2e2" opacity="0.5" />
                  <text x="400" y="55" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">
                    Zona de Risco (PA {'>'} 140/90)
                  </text>

                  {/* Linha de referência 120/80 */}
                  <line x1="50" y1="150" x2="750" y2="150" stroke="#86efac" strokeWidth="1" strokeDasharray="5,5" />
                  <text x="760" y="155" fontSize="10" fill="#16a34a">120</text>

                  <line x1="50" y1="210" x2="750" y2="210" stroke="#86efac" strokeWidth="1" strokeDasharray="5,5" />
                  <text x="760" y="215" fontSize="10" fill="#16a34a">80</text>

                  {/* Linha de Sistólica (vermelho) */}
                  {consultasOrdenadas.length > 1 && (
                    <path
                      d={consultasOrdenadas.map((c, i) => {
                        const x = 50 + (c.idadeGestacional / 40) * 700
                        const y = 270 - ((c.pressaoArterialSistolica - 80) / 100) * 240
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                  )}

                  {/* Linha de Diastólica (azul) */}
                  {consultasOrdenadas.length > 1 && (
                    <path
                      d={consultasOrdenadas.map((c, i) => {
                        const x = 50 + (c.idadeGestacional / 40) * 700
                        const y = 270 - ((c.pressaoArterialDiastolica - 40) / 100) * 240
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  )}

                  {/* Pontos */}
                  {consultasOrdenadas.map((c) => (
                    <g key={c.id}>
                      <circle
                        cx={50 + (c.idadeGestacional / 40) * 700}
                        cy={270 - ((c.pressaoArterialSistolica - 80) / 100) * 240}
                        r="4"
                        fill="#ef4444"
                      />
                      <circle
                        cx={50 + (c.idadeGestacional / 40) * 700}
                        cy={270 - ((c.pressaoArterialDiastolica - 40) / 100) * 240}
                        r="4"
                        fill="#3b82f6"
                      />
                    </g>
                  ))}
                </svg>

                {/* Legenda */}
                <div className="flex gap-4 mt-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-red-500" />
                    <span>Sistólica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500" />
                    <span>Diastólica</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de Altura Uterina */}
        <TabsContent value="altura-uterina">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Altura Uterina</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-80 w-full">
                <svg viewBox="0 0 800 320" className="w-full h-full">
                  {/* Eixos */}
                  <line x1="50" y1="270" x2="750" y2="270" stroke="#ccc" strokeWidth="2" />
                  <line x1="50" y1="30" x2="50" y2="270" stroke="#ccc" strokeWidth="2" />

                  {/* Linha de referência AU = IG */}
                  <path
                    d={semanas.filter(s => s >= 20).map((s, i) => {
                      const x = 50 + (s / 40) * 700
                      const y = 270 - (s / 40) * 240
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Linha de AU real */}
                  {consultasOrdenadas.filter(c => c.alturaUterina).length > 1 && (
                    <path
                      d={consultasOrdenadas.filter(c => c.alturaUterina).map((c, i) => {
                        const x = 50 + (c.idadeGestacional / 40) * 700
                        const y = 270 - ((c.alturaUterina || 0) / 40) * 240
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                    />
                  )}

                  {/* Pontos */}
                  {consultasOrdenadas.filter(c => c.alturaUterina).map((c) => (
                    <circle
                      key={c.id}
                      cx={50 + (c.idadeGestacional / 40) * 700}
                      cy={270 - ((c.alturaUterina || 0) / 40) * 240}
                      r="5"
                      fill="#8b5cf6"
                    >
                      <title>{`${c.idadeGestacional} sem: AU ${c.alturaUterina}cm`}</title>
                    </circle>
                  ))}
                </svg>

                <div className="text-center text-sm text-gray-600 mt-4">
                  Relação esperada: AU (cm) ≈ IG (semanas) ± 2cm (após 20 semanas)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de BCF */}
        <TabsContent value="bcf">
          <Card>
            <CardHeader>
              <CardTitle>Batimentos Cardíacos Fetais (BCF)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-80 w-full">
                <svg viewBox="0 0 800 320" className="w-full h-full">
                  {/* Zona normal (120-160 bpm) */}
                  <rect x="50" y="90" width="700" height="120" fill="#d1fae5" opacity="0.3" />
                  <text x="400" y="145" textAnchor="middle" fontSize="12" fill="#059669">
                    Zona Normal (120-160 bpm)
                  </text>

                  {/* Linha de BCF */}
                  {consultasOrdenadas.filter(c => c.bcf).length > 1 && (
                    <path
                      d={consultasOrdenadas.filter(c => c.bcf).map((c, i) => {
                        const x = 50 + (c.idadeGestacional / 40) * 700
                        const y = 270 - ((c.bcf! - 100) / 80) * 240
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />
                  )}

                  {/* Pontos */}
                  {consultasOrdenadas.filter(c => c.bcf).map((c) => (
                    <circle
                      key={c.id}
                      cx={50 + (c.idadeGestacional / 40) * 700}
                      cy={270 - ((c.bcf! - 100) / 80) * 240}
                      r="6"
                      fill="#f59e0b"
                    >
                      <title>{`${c.idadeGestacional} sem: ${c.bcf} bpm`}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
