"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Plus, Save, Tooth, X } from "lucide-react"

interface Procedimento {
  id: string
  codigoSIGTAP: string
  descricao: string
  dente?: string
  face?: string
  quantidade: number
}

interface AtendimentoOdontologicoFormProps {
  atendimentoId: string
  onSave: (data: any) => Promise<void>
}

export default function AtendimentoOdontologicoForm({
  atendimentoId,
  onSave
}: AtendimentoOdontologicoFormProps) {
  const [loading, setLoading] = useState(false)
  const [denteSelecionado, setDenteSelecionado] = useState<string | null>(null)
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])

  const [formData, setFormData] = useState({
    queixaPrincipal: '',
    exameBucal: '',
    diagnostico: '',
    planoTratamento: '',
    orientacoes: '',
    observacoes: '',
    odontograma: {} as Record<string, any>
  })

  const [novoProcedimento, setNovoProcedimento] = useState({
    codigoSIGTAP: '',
    descricao: '',
    dente: '',
    face: '',
    quantidade: 1
  })

  // Dentes permanentes (FDI)
  const dentesSuperiores = [
    ['18', '17', '16', '15', '14', '13', '12', '11'],
    ['21', '22', '23', '24', '25', '26', '27', '28']
  ]
  const dentesInferiores = [
    ['48', '47', '46', '45', '44', '43', '42', '41'],
    ['31', '32', '33', '34', '35', '36', '37', '38']
  ]

  const condicoesDente = [
    { value: 'HIGIDO', label: 'Hígido', color: 'bg-green-100 border-green-400' },
    { value: 'CARIADO', label: 'Cariado', color: 'bg-red-100 border-red-400' },
    { value: 'OBTURADO', label: 'Obturado', color: 'bg-blue-100 border-blue-400' },
    { value: 'AUSENTE', label: 'Ausente', color: 'bg-gray-100 border-gray-400' },
    { value: 'PROTESE', label: 'Prótese', color: 'bg-purple-100 border-purple-400' },
    { value: 'IMPLANTE', label: 'Implante', color: 'bg-indigo-100 border-indigo-400' },
  ]

  const faces = ['Oclusal', 'Mesial', 'Distal', 'Vestibular', 'Lingual/Palatina']

  const handleDenteClick = (dente: string) => {
    setDenteSelecionado(dente === denteSelecionado ? null : dente)
    setNovoProcedimento(prev => ({ ...prev, dente }))
  }

  const handleCondicaoDente = (dente: string, condicao: string) => {
    setFormData(prev => ({
      ...prev,
      odontograma: {
        ...prev.odontograma,
        [dente]: {
          ...prev.odontograma[dente],
          condicao
        }
      }
    }))
  }

  const adicionarProcedimento = () => {
    if (!novoProcedimento.codigoSIGTAP || !novoProcedimento.descricao) {
      alert('Preencha o código SIGTAP e a descrição')
      return
    }

    const procedimento: Procedimento = {
      id: `proc-${Date.now()}`,
      ...novoProcedimento
    }

    setProcedimentos(prev => [...prev, procedimento])
    setNovoProcedimento({
      codigoSIGTAP: '',
      descricao: '',
      dente: denteSelecionado || '',
      face: '',
      quantidade: 1
    })
  }

  const removerProcedimento = (id: string) => {
    setProcedimentos(prev => prev.filter(p => p.id !== id))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await onSave({
        ...formData,
        procedimentos,
        atendimentoId
      })
    } catch (error) {
      console.error('Erro ao salvar atendimento odontológico:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCondicaoColor = (condicao?: string) => {
    const cond = condicoesDente.find(c => c.value === condicao)
    return cond?.color || 'bg-white border-gray-300'
  }

  return (
    <div className="space-y-6">
      {/* Odontograma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tooth className="h-5 w-5" />
            Odontograma
          </CardTitle>
          <CardDescription>
            Clique nos dentes para selecionar e definir condições
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legenda */}
          <div className="flex flex-wrap gap-2 mb-6">
            {condicoesDente.map(cond => (
              <Badge key={cond.value} className={`${cond.color} border`}>
                {cond.label}
              </Badge>
            ))}
          </div>

          {/* Odontograma Visual */}
          <div className="space-y-4">
            {/* Arcada Superior */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-center text-muted-foreground mb-2">ARCADA SUPERIOR</p>
              <div className="flex justify-center gap-4">
                {/* Lado Direito */}
                <div className="flex gap-1">
                  {dentesSuperiores[0].map(dente => (
                    <div
                      key={dente}
                      onClick={() => handleDenteClick(dente)}
                      className={`
                        w-12 h-16 border-2 rounded cursor-pointer flex flex-col items-center justify-center
                        transition-all hover:scale-110
                        ${getCondicaoColor(formData.odontograma[dente]?.condicao)}
                        ${denteSelecionado === dente ? 'ring-2 ring-blue-500 scale-110' : ''}
                      `}
                    >
                      <span className="text-xs font-bold">{dente}</span>
                      {formData.odontograma[dente]?.condicao === 'AUSENTE' && (
                        <span className="text-xl">✕</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Linha Central */}
                <div className="w-px bg-gray-400" />
                {/* Lado Esquerdo */}
                <div className="flex gap-1">
                  {dentesSuperiores[1].map(dente => (
                    <div
                      key={dente}
                      onClick={() => handleDenteClick(dente)}
                      className={`
                        w-12 h-16 border-2 rounded cursor-pointer flex flex-col items-center justify-center
                        transition-all hover:scale-110
                        ${getCondicaoColor(formData.odontograma[dente]?.condicao)}
                        ${denteSelecionado === dente ? 'ring-2 ring-blue-500 scale-110' : ''}
                      `}
                    >
                      <span className="text-xs font-bold">{dente}</span>
                      {formData.odontograma[dente]?.condicao === 'AUSENTE' && (
                        <span className="text-xl">✕</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arcada Inferior */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-center gap-4">
                {/* Lado Direito */}
                <div className="flex gap-1">
                  {dentesInferiores[0].map(dente => (
                    <div
                      key={dente}
                      onClick={() => handleDenteClick(dente)}
                      className={`
                        w-12 h-16 border-2 rounded cursor-pointer flex flex-col items-center justify-center
                        transition-all hover:scale-110
                        ${getCondicaoColor(formData.odontograma[dente]?.condicao)}
                        ${denteSelecionado === dente ? 'ring-2 ring-blue-500 scale-110' : ''}
                      `}
                    >
                      <span className="text-xs font-bold">{dente}</span>
                      {formData.odontograma[dente]?.condicao === 'AUSENTE' && (
                        <span className="text-xl">✕</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Linha Central */}
                <div className="w-px bg-gray-400" />
                {/* Lado Esquerdo */}
                <div className="flex gap-1">
                  {dentesInferiores[1].map(dente => (
                    <div
                      key={dente}
                      onClick={() => handleDenteClick(dente)}
                      className={`
                        w-12 h-16 border-2 rounded cursor-pointer flex flex-col items-center justify-center
                        transition-all hover:scale-110
                        ${getCondicaoColor(formData.odontograma[dente]?.condicao)}
                        ${denteSelecionado === dente ? 'ring-2 ring-blue-500 scale-110' : ''}
                      `}
                    >
                      <span className="text-xs font-bold">{dente}</span>
                      {formData.odontograma[dente]?.condicao === 'AUSENTE' && (
                        <span className="text-xl">✕</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">ARCADA INFERIOR</p>
            </div>
          </div>

          {/* Condição do Dente Selecionado */}
          {denteSelecionado && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium mb-2">Dente {denteSelecionado} selecionado</p>
              <div className="flex gap-2">
                {condicoesDente.map(cond => (
                  <Button
                    key={cond.value}
                    size="sm"
                    variant="outline"
                    className={formData.odontograma[denteSelecionado]?.condicao === cond.value ? cond.color : ''}
                    onClick={() => handleCondicaoDente(denteSelecionado, cond.value)}
                  >
                    {cond.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avaliação Clínica */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliação Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queixaPrincipal">Queixa Principal</Label>
            <Textarea
              id="queixaPrincipal"
              placeholder="Motivo da consulta odontológica..."
              value={formData.queixaPrincipal}
              onChange={(e) => setFormData(prev => ({ ...prev, queixaPrincipal: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exameBucal">Exame Bucal</Label>
            <Textarea
              id="exameBucal"
              placeholder="Descrição do exame clínico bucal..."
              value={formData.exameBucal}
              onChange={(e) => setFormData(prev => ({ ...prev, exameBucal: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              placeholder="Diagnóstico odontológico..."
              value={formData.diagnostico}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="planoTratamento">Plano de Tratamento</Label>
            <Textarea
              id="planoTratamento"
              placeholder="Plano de tratamento proposto..."
              value={formData.planoTratamento}
              onChange={(e) => setFormData(prev => ({ ...prev, planoTratamento: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Procedimentos Realizados */}
      <Card>
        <CardHeader>
          <CardTitle>Procedimentos Realizados (SIGTAP)</CardTitle>
          <CardDescription>
            Registre os procedimentos odontológicos com códigos SIGTAP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Novo Procedimento */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="codigoSIGTAP" className="text-xs">Código SIGTAP</Label>
              <Input
                id="codigoSIGTAP"
                placeholder="Ex: 0101020038"
                value={novoProcedimento.codigoSIGTAP}
                onChange={(e) => setNovoProcedimento(prev => ({ ...prev, codigoSIGTAP: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="descProcedimento" className="text-xs">Descrição</Label>
              <Input
                id="descProcedimento"
                placeholder="Ex: Restauração"
                value={novoProcedimento.descricao}
                onChange={(e) => setNovoProcedimento(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="face" className="text-xs">Face</Label>
              <Select
                value={novoProcedimento.face}
                onValueChange={(value) => setNovoProcedimento(prev => ({ ...prev, face: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {faces.map(face => (
                    <SelectItem key={face} value={face}>{face}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={adicionarProcedimento} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de Procedimentos */}
          {procedimentos.length > 0 && (
            <div className="space-y-2">
              {procedimentos.map(proc => (
                <div key={proc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{proc.codigoSIGTAP}</Badge>
                      <span className="font-medium">{proc.descricao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {proc.dente && `Dente: ${proc.dente}`}
                      {proc.face && ` • Face: ${proc.face}`}
                      {` • Qtd: ${proc.quantidade}`}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removerProcedimento(proc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orientações e Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Orientações e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orientacoes">Orientações ao Paciente</Label>
            <Textarea
              id="orientacoes"
              placeholder="Orientações sobre higiene bucal, cuidados pós-procedimento..."
              value={formData.orientacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, orientacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Atendimento
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
