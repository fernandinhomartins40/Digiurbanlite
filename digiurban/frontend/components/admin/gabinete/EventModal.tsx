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
  }, [event, open])

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
      alert('Preencha os campos obrigatórios: Título, Data/Hora Início e Data/Hora Fim')
      return
    }

    try {
      setIsLoading(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      alert('Erro ao salvar evento')
    } finally {
      setIsLoading(false)
    }
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
              <Label htmlFor="dataHoraInicio">Data/Hora Início *</Label>
              <Input
                id="dataHoraInicio"
                type="datetime-local"
                value={formData.dataHoraInicio}
                onChange={(e) => setFormData({ ...formData, dataHoraInicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dataHoraFim">Data/Hora Fim *</Label>
              <Input
                id="dataHoraFim"
                type="datetime-local"
                value={formData.dataHoraFim}
                onChange={(e) => setFormData({ ...formData, dataHoraFim: e.target.value })}
                required
              />
            </div>
          </div>

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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : event?.id ? 'Salvar Alterações' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
