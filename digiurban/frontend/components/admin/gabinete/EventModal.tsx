'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Calendar, Clock } from 'lucide-react'

interface AgendaEvent {
  id?: string
  tipo: string
  titulo: string
  descricao?: string
  dataHoraInicio: string
  dataHoraFim: string
  local?: string
  participantes?: string
  status?: string
  observacoes?: string
}

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSave: (event: AgendaEvent) => Promise<void>
  event?: AgendaEvent | null
}

const TIPOS_EVENTO = [
  'REUNIAO_INTERNA',
  'REUNIAO_EXTERNA',
  'AUDIENCIA_PUBLICA',
  'EVENTO_OFICIAL',
  'VISITA_TECNICA',
  'COMPROMISSO_PESSOAL',
  'OUTRO'
]

const TIPOS_LABELS: Record<string, string> = {
  REUNIAO_INTERNA: 'Reunião Interna',
  REUNIAO_EXTERNA: 'Reunião Externa',
  AUDIENCIA_PUBLICA: 'Audiência Pública',
  EVENTO_OFICIAL: 'Evento Oficial',
  VISITA_TECNICA: 'Visita Técnica',
  COMPROMISSO_PESSOAL: 'Compromisso Pessoal',
  OUTRO: 'Outro'
}

export function EventModal({ open, onClose, onSave, event }: EventModalProps) {
  const [formData, setFormData] = useState<AgendaEvent>({
    tipo: 'REUNIAO_INTERNA',
    titulo: '',
    descricao: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    local: '',
    participantes: '',
    observacoes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        dataHoraInicio: event.dataHoraInicio ? formatDateTimeLocal(event.dataHoraInicio) : '',
        dataHoraFim: event.dataHoraFim ? formatDateTimeLocal(event.dataHoraFim) : ''
      })
    } else {
      // Reset para novo evento
      setFormData({
        tipo: 'REUNIAO_INTERNA',
        titulo: '',
        descricao: '',
        dataHoraInicio: '',
        dataHoraFim: '',
        local: '',
        participantes: '',
        observacoes: ''
      })
    }
    setValidationErrors([])
    setWarnings([])
  }, [event, open])

  // Validação em tempo real
  useEffect(() => {
    const errors: string[] = []
    const warns: string[] = []

    if (formData.dataHoraInicio && formData.dataHoraFim) {
      const start = new Date(formData.dataHoraInicio)
      const end = new Date(formData.dataHoraFim)
      const now = new Date()

      // Validar ordem das datas
      if (end <= start) {
        errors.push('A data/hora de término deve ser posterior à de início')
      }

      // Validar evento no passado
      if (start < now && !event?.id) {
        warns.push('Você está criando um evento no passado')
      }

      // Validar duração muito longa
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      if (durationHours > 8) {
        warns.push(`Evento com duração muito longa (${durationHours.toFixed(1)}h)`)
      }

      // Validar horário comercial para reuniões internas
      if (formData.tipo === 'REUNIAO_INTERNA') {
        const hour = start.getHours()
        if (hour < 8 || hour >= 18) {
          warns.push('Reunião interna fora do horário comercial (8h-18h)')
        }
      }
    }

    setValidationErrors(errors)
    setWarnings(warns)
  }, [formData.dataHoraInicio, formData.dataHoraFim, formData.tipo, event])

  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo || !formData.dataHoraInicio || !formData.dataHoraFim) {
      return
    }

    if (validationErrors.length > 0) {
      return
    }

    try {
      setIsLoading(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDuration = () => {
    if (!formData.dataHoraInicio || !formData.dataHoraFim) return null

    const start = new Date(formData.dataHoraInicio)
    const end = new Date(formData.dataHoraFim)
    const diffMs = end.getTime() - start.getTime()

    if (diffMs <= 0) return null

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours === 0) return `${minutes}min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do evento da agenda executiva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alertas de Validação */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPOS_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Reunião com..."
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Detalhe do evento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataHoraInicio" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data/Hora Início *
              </Label>
              <Input
                id="dataHoraInicio"
                type="datetime-local"
                value={formData.dataHoraInicio}
                onChange={(e) => setFormData({ ...formData, dataHoraInicio: e.target.value })}
                required
                className={validationErrors.length > 0 ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <Label htmlFor="dataHoraFim" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Data/Hora Fim *
              </Label>
              <Input
                id="dataHoraFim"
                type="datetime-local"
                value={formData.dataHoraFim}
                onChange={(e) => setFormData({ ...formData, dataHoraFim: e.target.value })}
                required
                className={validationErrors.length > 0 ? 'border-red-500' : ''}
              />
            </div>
          </div>

          {calculateDuration() && (
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              Duração: <strong>{calculateDuration()}</strong>
            </div>
          )}

          <div>
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              placeholder="Gabinete do Prefeito, Sala de Reuniões..."
            />
          </div>

          <div>
            <Label htmlFor="participantes">Participantes</Label>
            <Input
              id="participantes"
              value={formData.participantes}
              onChange={(e) => setFormData({ ...formData, participantes: e.target.value })}
              placeholder="Secretários, Vereadores, Cidadãos..."
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || validationErrors.length > 0 || !formData.titulo || !formData.dataHoraInicio || !formData.dataHoraFim}
            >
              {isLoading ? 'Salvando...' : event?.id ? 'Salvar Alterações' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
