'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Check, Download, Filter, X, Grid, List, AlertTriangle } from 'lucide-react'
import { agendaService } from '@/lib/services/gabinete.service'
import { useToast } from '@/hooks/use-toast'
import { EventModal } from '@/components/admin/gabinete/EventModal'
import { Calendar, dateFnsLocalizer, View, Event as CalendarEvent } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const locales = {
  'pt-BR': ptBR
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

interface AgendaEvent {
  id: string
  tipo: string
  titulo: string
  descricao?: string
  dataHoraInicio: string
  dataHoraFim: string
  local?: string
  participantes?: string
  status: string
  observacoes?: string
  createdBy?: {
    name: string
  }
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

const TIPO_COLORS: Record<string, string> = {
  REUNIAO_INTERNA: '#3b82f6',
  REUNIAO_EXTERNA: '#8b5cf6',
  AUDIENCIA_PUBLICA: '#f59e0b',
  EVENTO_OFICIAL: '#10b981',
  VISITA_TECNICA: '#06b6d4',
  COMPROMISSO_PESSOAL: '#ec4899',
  OUTRO: '#6b7280'
}

const STATUS_OPTIONS = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

export default function AgendaPage() {
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<View>('month')
  const [showFilters, setShowFilters] = useState(false)

  // Filtros
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)

  const { toast } = useToast()

  const loadEvents = async () => {
    try {
      setLoading(true)
      const filters: any = {}

      if (dateRange) {
        filters.startDate = dateRange.start.toISOString()
        filters.endDate = dateRange.end.toISOString()
      }
      if (filterTipo !== 'all') filters.tipo = filterTipo
      if (filterStatus !== 'all') filters.status = filterStatus

      const response = await agendaService.getEvents(filters)
      setEvents(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [filterTipo, filterStatus, dateRange])

  // Converter eventos para formato do calendário
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events
      .filter(event => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            event.titulo.toLowerCase().includes(query) ||
            event.descricao?.toLowerCase().includes(query) ||
            event.local?.toLowerCase().includes(query) ||
            event.participantes?.toLowerCase().includes(query)
          )
        }
        return true
      })
      .map(event => ({
        title: event.titulo,
        start: new Date(event.dataHoraInicio),
        end: new Date(event.dataHoraFim),
        resource: event
      }))
  }, [events, searchQuery])

  // Detectar conflitos de horários
  const conflicts = useMemo(() => {
    const conflictPairs: string[] = []

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]

        // Ignorar eventos cancelados
        if (event1.status === 'CANCELADO' || event2.status === 'CANCELADO') continue

        const start1 = new Date(event1.dataHoraInicio)
        const end1 = new Date(event1.dataHoraFim)
        const start2 = new Date(event2.dataHoraInicio)
        const end2 = new Date(event2.dataHoraFim)

        // Verificar sobreposição
        if (start1 < end2 && start2 < end1) {
          conflictPairs.push(`${event1.id}-${event2.id}`)
        }
      }
    }

    return conflictPairs
  }, [events])

  // Estatísticas
  const stats = useMemo(() => {
    const total = events.length
    const porTipo = events.reduce((acc, event) => {
      acc[event.tipo] = (acc[event.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const porStatus = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const proximosEventos = events
      .filter(e => new Date(e.dataHoraInicio) > new Date() && e.status !== 'CANCELADO')
      .length

    return { total, porTipo, porStatus, proximosEventos, conflitos: conflicts.length }
  }, [events, conflicts])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento?')) return

    try {
      await agendaService.deleteEvent(id)
      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso'
      })
      loadEvents()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir evento',
        variant: 'destructive'
      })
    }
  }

  const handleMarkRealized = async (id: string) => {
    try {
      await agendaService.markAsRealized(id)
      toast({
        title: 'Sucesso',
        description: 'Evento marcado como realizado'
      })
      loadEvents()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar evento',
        variant: 'destructive'
      })
    }
  }

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent?.id) {
        await agendaService.updateEvent(selectedEvent.id, eventData)
        toast({
          title: 'Sucesso',
          description: 'Evento atualizado com sucesso'
        })
      } else {
        await agendaService.createEvent(eventData)
        toast({
          title: 'Sucesso',
          description: 'Evento criado com sucesso'
        })
      }
      setModalOpen(false)
      setSelectedEvent(null)
      loadEvents()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar evento',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource as AgendaEvent)
    setModalOpen(true)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({
      id: '',
      tipo: 'REUNIAO_INTERNA',
      titulo: '',
      dataHoraInicio: start.toISOString(),
      dataHoraFim: end.toISOString(),
      status: 'AGENDADO'
    } as AgendaEvent)
    setModalOpen(true)
  }

  const exportToICS = () => {
    const icsEvents = events.map(event => {
      const start = new Date(event.dataHoraInicio)
      const end = new Date(event.dataHoraFim)

      return [
        'BEGIN:VEVENT',
        `UID:${event.id}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART:${format(start, "yyyyMMdd'T'HHmmss")}`,
        `DTEND:${format(end, "yyyyMMdd'T'HHmmss")}`,
        `SUMMARY:${event.titulo}`,
        event.descricao ? `DESCRIPTION:${event.descricao}` : '',
        event.local ? `LOCATION:${event.local}` : '',
        `STATUS:${event.status}`,
        'END:VEVENT'
      ].filter(Boolean).join('\n')
    }).join('\n')

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DigiUrban//Agenda Executiva//PT',
      'CALSCALE:GREGORIAN',
      icsEvents,
      'END:VCALENDAR'
    ].join('\n')

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agenda-executiva-${format(new Date(), 'yyyy-MM-dd')}.ics`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Exportado',
      description: 'Agenda exportada com sucesso'
    })
  }

  const clearFilters = () => {
    setFilterTipo('all')
    setFilterStatus('all')
    setSearchQuery('')
    setDateRange(null)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda Executiva</h1>
          <p className="text-gray-600 mt-1">Gerencie compromissos oficiais e eventos do gabinete</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToICS}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => { setSelectedEvent(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Eventos</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos Eventos</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.proximosEventos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Realizados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.porStatus.REALIZADO || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmados</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.porStatus.CONFIRMADO || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={conflicts.length > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              {conflicts.length > 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
              Conflitos
            </CardDescription>
            <CardTitle className={`text-3xl ${conflicts.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {conflicts.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Calendário
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>

            <div className="flex-1">
              <Input
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(filterTipo !== 'all' || filterStatus !== 'all') && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {TIPOS_EVENTO.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPOS_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Evento */}
      <EventModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEvent(null)
        }}
        onSave={handleSaveEvent}
        event={selectedEvent}
      />

      {/* Visualização de Calendário */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="pt-6">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              view={calendarView}
              onView={setCalendarView}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              culture="pt-BR"
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período',
                showMore: (total: number) => `+ ${total} mais`
              }}
              eventPropGetter={(event: CalendarEvent) => {
                const agendaEvent = event.resource as AgendaEvent
                const backgroundColor = TIPO_COLORS[agendaEvent.tipo] || '#6b7280'
                const opacity = agendaEvent.status === 'CANCELADO' ? 0.5 : 1

                return {
                  style: {
                    backgroundColor,
                    opacity,
                    border: 'none',
                    borderRadius: '4px'
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Visualização em Lista */
        events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum evento cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {calendarEvents
              .sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0))
              .map((calEvent) => {
                const event = calEvent.resource as AgendaEvent
                const hasConflict = conflicts.some(c => c.includes(event.id))

                return (
                  <Card key={event.id} className={hasConflict ? 'border-orange-500' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: TIPO_COLORS[event.tipo] }}
                            />
                            <CardTitle>{event.titulo}</CardTitle>
                            {hasConflict && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Conflito
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {format(new Date(event.dataHoraInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {' - '}
                            {format(new Date(event.dataHoraFim), "HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {event.status !== 'REALIZADO' && event.status !== 'CANCELADO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkRealized(event.id)}
                              title="Marcar como realizado"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => { setSelectedEvent(event); setModalOpen(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Tipo:</span>
                          <Badge variant="outline">{TIPOS_LABELS[event.tipo]}</Badge>
                        </div>
                        {event.descricao && (
                          <p className="text-sm"><strong>Descrição:</strong> {event.descricao}</p>
                        )}
                        {event.local && (
                          <p className="text-sm"><strong>Local:</strong> {event.local}</p>
                        )}
                        {event.participantes && (
                          <p className="text-sm"><strong>Participantes:</strong> {event.participantes}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge className={
                            event.status === 'REALIZADO' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            event.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                            event.status === 'CANCELADO' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                            'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }>
                            {event.status}
                          </Badge>
                        </div>
                        {event.createdBy && (
                          <p className="text-xs text-gray-500">Criado por: {event.createdBy.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )
      )}
    </div>
  )
}
