"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Odontograma, CondicaoDente, FaceDente } from '@/types/saude'

interface OdontogramaInterativoProps {
  odontograma: Odontograma
  onChange: (odontograma: Odontograma) => void
  readOnly?: boolean
}

// Numeração FDI para adultos (32 dentes)
const DENTES_SUPERIORES_DIREITO = ['18', '17', '16', '15', '14', '13', '12', '11']
const DENTES_SUPERIORES_ESQUERDO = ['21', '22', '23', '24', '25', '26', '27', '28']
const DENTES_INFERIORES_DIREITO = ['48', '47', '46', '45', '44', '43', '42', '41']
const DENTES_INFERIORES_ESQUERDO = ['31', '32', '33', '34', '35', '36', '37', '38']

const CONDICOES: { valor: CondicaoDente; label: string; cor: string }[] = [
  { valor: 'HIGIDO', label: 'Hígido', cor: 'bg-white border-gray-300' },
  { valor: 'CARIADO', label: 'Cariado', cor: 'bg-red-200 border-red-400' },
  { valor: 'OBTURADO', label: 'Obturado', cor: 'bg-blue-200 border-blue-400' },
  { valor: 'AUSENTE', label: 'Ausente', cor: 'bg-gray-400 border-gray-600' },
  { valor: 'PROTESE', label: 'Prótese', cor: 'bg-yellow-200 border-yellow-400' },
  { valor: 'IMPLANTE', label: 'Implante', cor: 'bg-green-200 border-green-400' },
]

const FACES: FaceDente[] = ['Oclusal', 'Mesial', 'Distal', 'Vestibular', 'Lingual/Palatina']

export function OdontogramaInterativo({ odontograma, onChange, readOnly = false }: OdontogramaInterativoProps) {
  const [denteDialog, setDenteDialog] = useState<string | null>(null)
  const [condicaoSelecionada, setCondicaoSelecionada] = useState<CondicaoDente>('HIGIDO')
  const [facesSelecionadas, setFacesSelecionadas] = useState<string[]>([])
  const [observacao, setObservacao] = useState('')

  const getCorDente = (dente: string): string => {
    const info = odontograma[dente]
    if (!info || !info.condicao) return 'bg-white border-gray-300'

    const condicao = CONDICOES.find(c => c.valor === info.condicao)
    return condicao?.cor || 'bg-white border-gray-300'
  }

  const handleDenteClick = (dente: string) => {
    if (readOnly) return

    const info = odontograma[dente]
    setCondicaoSelecionada(info?.condicao || 'HIGIDO')
    setDenteDialog(dente)
  }

  const handleSalvarDente = () => {
    if (!denteDialog) return

    const novoOdontograma = {
      ...odontograma,
      [denteDialog]: {
        ...odontograma[denteDialog],
        condicao: condicaoSelecionada,
      }
    }

    onChange(novoOdontograma)
    setDenteDialog(null)
    setCondicaoSelecionada('HIGIDO')
  }

  const renderDente = (numero: string) => {
    const info = odontograma[numero]
    const cor = getCorDente(numero)

    return (
      <div
        key={numero}
        className="relative"
        onClick={() => handleDenteClick(numero)}
      >
        <div
          className={`
            w-10 h-14 border-2 rounded-sm cursor-pointer
            flex flex-col items-center justify-center
            transition-all hover:scale-110 hover:shadow-lg
            ${cor}
            ${!readOnly && 'hover:border-blue-500'}
          `}
        >
          <span className="text-xs font-bold text-gray-700">{numero}</span>
          {info?.condicao && info.condicao !== 'HIGIDO' && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 mt-1">
              {CONDICOES.find(c => c.valor === info.condicao)?.label[0]}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Odontograma</CardTitle>
          {!readOnly && (
            <div className="flex gap-2 flex-wrap">
              {CONDICOES.map((cond) => (
                <div key={cond.valor} className="flex items-center gap-1">
                  <div className={`w-4 h-4 border-2 rounded ${cond.cor}`} />
                  <span className="text-xs">{cond.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Arcada Superior */}
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-gray-600">
              ARCADA SUPERIOR
            </div>
            <div className="flex justify-center gap-1">
              {/* Direito */}
              <div className="flex gap-1">
                {DENTES_SUPERIORES_DIREITO.map(renderDente)}
              </div>
              {/* Linha divisória */}
              <div className="w-px bg-gray-400 mx-2" />
              {/* Esquerdo */}
              <div className="flex gap-1">
                {DENTES_SUPERIORES_ESQUERDO.map(renderDente)}
              </div>
            </div>
          </div>

          {/* Linha horizontal central */}
          <div className="border-t-2 border-gray-400" />

          {/* Arcada Inferior */}
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-gray-600">
              ARCADA INFERIOR
            </div>
            <div className="flex justify-center gap-1">
              {/* Direito */}
              <div className="flex gap-1">
                {DENTES_INFERIORES_DIREITO.map(renderDente)}
              </div>
              {/* Linha divisória */}
              <div className="w-px bg-gray-400 mx-2" />
              {/* Esquerdo */}
              <div className="flex gap-1">
                {DENTES_INFERIORES_ESQUERDO.map(renderDente)}
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de condições */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold mb-2">Resumo do Odontograma:</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {CONDICOES.map((cond) => {
              const count = Object.values(odontograma).filter(
                (d) => d.condicao === cond.valor
              ).length
              if (count === 0 && cond.valor === 'HIGIDO') return null
              return (
                <div key={cond.valor} className="flex items-center gap-2">
                  <div className={`w-3 h-3 border rounded ${cond.cor}`} />
                  <span>{cond.label}: {count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dialog de edição */}
        <Dialog open={!!denteDialog} onOpenChange={(open) => !open && setDenteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Dente {denteDialog}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Condição</Label>
                <Select value={condicaoSelecionada} onValueChange={(v) => setCondicaoSelecionada(v as CondicaoDente)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDICOES.map((cond) => (
                      <SelectItem key={cond.valor} value={cond.valor}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 border rounded ${cond.cor}`} />
                          {cond.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview do dente */}
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <div
                  className={`
                    w-16 h-24 border-4 rounded-md
                    flex flex-col items-center justify-center
                    ${CONDICOES.find(c => c.valor === condicaoSelecionada)?.cor}
                  `}
                >
                  <span className="text-xl font-bold">{denteDialog}</span>
                  <span className="text-xs mt-2">
                    {CONDICOES.find(c => c.valor === condicaoSelecionada)?.label}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDenteDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarDente}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
