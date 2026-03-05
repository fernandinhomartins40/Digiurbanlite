'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type Event as CalendarEvent, type View } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Check,
  Download,
  Edit,
  Filter,
  Grid,
  List,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  centralAgendaService,
  type CentralAgendaCalendar,
  type CentralAgendaEvent,
  type CentralCalendarEventStatus,
  type CentralCalendarSourceType,
} from '@/lib/services/central-agenda.service';
import {
  CentralAgendaEventModal,
  type CentralAgendaEventFormInput,
} from '@/components/admin/agenda/CentralAgendaEventModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const STATUS_OPTIONS: Array<{ value: CentralCalendarEventStatus; label: string; colorClass: string }> = [
  { value: 'SCHEDULED', label: 'Agendado', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  { value: 'CONFIRMED', label: 'Confirmado', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  { value: 'IN_PROGRESS', label: 'Em andamento', colorClass: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
  { value: 'COMPLETED', label: 'Concluído', colorClass: 'bg-green-100 text-green-800 hover:bg-green-100' },
  { value: 'CANCELED', label: 'Cancelado', colorClass: 'bg-red-100 text-red-800 hover:bg-red-100' },
  { value: 'NO_SHOW', label: 'Não compareceu', colorClass: 'bg-zinc-200 text-zinc-700 hover:bg-zinc-200' },
];

const SOURCE_LABELS: Record<CentralCalendarSourceType, string> = {
  MANUAL: 'Manual',
  GABINETE: 'Gabinete',
  HEALTH_SCHEDULE: 'Saúde',
  TFD_EXTERNAL: 'TFD',
  PROTOCOL_STAGE: 'Etapa de Protocolo',
  SYSTEM_INTEGRATION: 'Integração',
};

const SOURCE_COLORS: Record<CentralCalendarSourceType, string> = {
  MANUAL: '#2563eb',
  GABINETE: '#7c3aed',
  HEALTH_SCHEDULE: '#059669',
  TFD_EXTERNAL: '#db2777',
  PROTOCOL_STAGE: '#ea580c',
  SYSTEM_INTEGRATION: '#4b5563',
};

function mapStatusLabel(status: CentralCalendarEventStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

function mapStatusColor(status: CentralCalendarEventStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.colorClass ||
    'bg-zinc-100 text-zinc-800 hover:bg-zinc-100'
  );
}

function participantLabel(event: CentralAgendaEvent) {
  const participants = event.participants || [];
  const labels = participants
    .map((participant) => {
      if (participant.user?.name) {
        return participant.user.name;
      }
      if (participant.department?.name) {
        return participant.department.name;
      }
      if (participant.organizationalUnit?.nome) {
        return participant.organizationalUnit.nome;
      }
      return null;
    })
    .filter(Boolean) as string[];

  if (labels.length === 0) {
    return null;
  }

  return labels.join(', ');
}

export default function AdminCentralAgendaPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [events, setEvents] = useState<CentralAgendaEvent[]>([]);
  const [calendars, setCalendars] = useState<CentralAgendaCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState<View>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CentralCalendarEventStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | CentralCalendarSourceType>('all');
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [includeAll, setIncludeAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CentralAgendaEvent | null>(null);
  const [presetStartAt, setPresetStartAt] = useState<string | undefined>(undefined);
  const [presetEndAt, setPresetEndAt] = useState<string | undefined>(undefined);

  const loadAgenda = async () => {
    try {
      setLoading(true);

      const [eventsData, calendarsData] = await Promise.all([
        centralAgendaService.listEvents({
          startAt: startDateFilter ? new Date(`${startDateFilter}T00:00:00`).toISOString() : undefined,
          endAt: endDateFilter ? new Date(`${endDateFilter}T23:59:59`).toISOString() : undefined,
          status: statusFilter !== 'all' ? [statusFilter] : undefined,
          sourceType: sourceFilter !== 'all' ? [sourceFilter] : undefined,
          calendarId: calendarFilter !== 'all' ? calendarFilter : undefined,
          includeAll: includeAll && isAdmin,
        }),
        centralAgendaService.listMyCalendars(),
      ]);

      setEvents(eventsData);
      setCalendars(calendarsData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar agenda',
        description: error instanceof Error ? error.message : 'Falha ao carregar eventos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, [statusFilter, sourceFilter, calendarFilter, startDateFilter, endDateFilter, includeAll]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return events;
    }

    return events.filter((event) => {
      const participants = participantLabel(event);
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description || '').toLowerCase().includes(query) ||
        (event.eventType || '').toLowerCase().includes(query) ||
        (event.location || '').toLowerCase().includes(query) ||
        (event.calendar?.name || '').toLowerCase().includes(query) ||
        (event.ownerUser?.name || '').toLowerCase().includes(query) ||
        (participants || '').toLowerCase().includes(query)
      );
    });
  }, [events, searchQuery]);

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      filteredEvents.map((event) => ({
        title: event.title,
        start: new Date(event.startAt),
        end: new Date(event.endAt),
        resource: event,
      })),
    [filteredEvents]
  );

  const stats = useMemo(() => {
    const byStatus = filteredEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {});

    const upcoming = filteredEvents.filter(
      (event) => new Date(event.startAt).getTime() > Date.now() && event.status !== 'CANCELED'
    ).length;

    return {
      total: filteredEvents.length,
      upcoming,
      completed: byStatus.COMPLETED || 0,
      inProgress: byStatus.IN_PROGRESS || 0,
      canceled: byStatus.CANCELED || 0,
    };
  }, [filteredEvents]);

  const clearFilters = () => {
    setStatusFilter('all');
    setSourceFilter('all');
    setCalendarFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setIncludeAll(false);
    setSearchQuery('');
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setPresetStartAt(undefined);
    setPresetEndAt(undefined);
    setModalOpen(true);
  };

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setPresetStartAt(slot.start.toISOString());
    setPresetEndAt(slot.end.toISOString());
    setModalOpen(true);
  };

  const handleEditEvent = (event: CentralAgendaEvent) => {
    setSelectedEvent(event);
    setPresetStartAt(undefined);
    setPresetEndAt(undefined);
    setModalOpen(true);
  };

  const handleSaveEvent = async (input: CentralAgendaEventFormInput) => {
    if (selectedEvent?.id) {
      await centralAgendaService.updateEvent(selectedEvent.id, input);
      toast({
        title: 'Evento atualizado',
        description: 'As alterações foram salvas na agenda centralizada.',
      });
    } else {
      await centralAgendaService.createEvent(input);
      toast({
        title: 'Evento criado',
        description: 'Novo evento cadastrado na agenda centralizada.',
      });
    }

    setModalOpen(false);
    setSelectedEvent(null);
    setPresetStartAt(undefined);
    setPresetEndAt(undefined);
    await loadAgenda();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deseja realmente excluir este evento?')) {
      return;
    }

    try {
      await centralAgendaService.deleteEvent(eventId);
      toast({
        title: 'Evento removido',
        description: 'O evento foi excluído com sucesso.',
      });
      await loadAgenda();
    } catch (error) {
      toast({
        title: 'Falha ao excluir',
        description: error instanceof Error ? error.message : 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkCompleted = async (eventId: string) => {
    try {
      await centralAgendaService.markEventCompleted(eventId);
      toast({
        title: 'Evento concluído',
        description: 'Status atualizado para concluído.',
      });
      await loadAgenda();
    } catch (error) {
      toast({
        title: 'Falha ao atualizar status',
        description: error instanceof Error ? error.message : 'Não foi possível concluir o evento.',
        variant: 'destructive',
      });
    }
  };

  const exportToICS = () => {
    const icsEvents = filteredEvents
      .map((event) => {
        const start = new Date(event.startAt);
        const end = new Date(event.endAt);

        return [
          'BEGIN:VEVENT',
          `UID:${event.id}`,
          `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
          `DTSTART:${format(start, "yyyyMMdd'T'HHmmss")}`,
          `DTEND:${format(end, "yyyyMMdd'T'HHmmss")}`,
          `SUMMARY:${event.title}`,
          event.description ? `DESCRIPTION:${event.description}` : '',
          event.location ? `LOCATION:${event.location}` : '',
          `STATUS:${event.status}`,
          'END:VEVENT',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DigiUrban//Agenda Centralizada//PT',
      'CALSCALE:GREGORIAN',
      icsEvents,
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-centralizada-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo ICS gerado com os eventos filtrados.',
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Carregando agenda...</div>;
  }

  return (
    <div className="relative space-y-6 pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 rounded-3xl bg-gradient-to-r from-sky-100/70 via-cyan-50/30 to-emerald-100/70 blur-3xl" />
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-5 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Agenda Centralizada</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Visão única de compromissos manuais e integrações de protocolos, saúde e TFD.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white/80 hover:bg-white" onClick={exportToICS}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="shadow-sm" onClick={handleNewEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide text-slate-500">Total</CardDescription>
            <CardTitle className="text-2xl text-slate-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.upcoming}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Concluídos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em andamento</CardDescription>
            <CardTitle className="text-2xl text-indigo-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelados</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.canceled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
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

              <Input
                placeholder="Buscar por título, descrição, calendário, responsável..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:max-w-md rounded-lg border-slate-300 bg-white/90"
              />

              {isAdmin && (
                <div className="flex items-center gap-2 ml-auto rounded-md border border-slate-200 bg-white/90 px-3 py-1.5">
                  <span className="text-sm text-muted-foreground">Ver todos</span>
                  <Switch checked={includeAll} onCheckedChange={setIncludeAll} />
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => setShowFilters((prev) => !prev)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-200/80">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | CentralCalendarEventStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Origem</label>
                  <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as 'all' | CentralCalendarSourceType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Calendário</label>
                  <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {calendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                  <Input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Data Final</label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CentralAgendaEventModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
          setPresetStartAt(undefined);
          setPresetEndAt(undefined);
        }}
        onSave={handleSaveEvent}
        event={selectedEvent}
        presetStartAt={presetStartAt}
        presetEndAt={presetEndAt}
      />

      {viewMode === 'calendar' ? (
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="central-agenda-calendar pt-6 overflow-x-auto">
            <div className="min-w-[640px] rounded-xl border border-slate-200/80 bg-white p-3 shadow-inner sm:p-4">
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="pt-BR"
                view={calendarView}
                onView={setCalendarView}
                onSelectEvent={(event) => handleEditEvent(event.resource as CentralAgendaEvent)}
                onSelectSlot={handleSelectSlot}
                selectable
                style={{ height: 680 }}
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
                  noEventsInRange: 'Sem eventos neste intervalo',
                  showMore: (total: number) => `+ ${total} mais`,
                }}
                eventPropGetter={(event: CalendarEvent) => {
                  const current = event.resource as CentralAgendaEvent;
                  const color = SOURCE_COLORS[current.sourceType] || '#2563eb';
                  const opacity = current.status === 'CANCELED' ? 0.55 : 1;

                  return {
                    style: {
                      backgroundColor: color,
                      opacity,
                      border: 'none',
                      borderRadius: '4px',
                    },
                  };
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.length === 0 ? (
            <Card className="border-slate-200/80 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum evento encontrado com os filtros atuais.</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents
              .slice()
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .map((event) => (
                <Card key={event.id} className="border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: SOURCE_COLORS[event.sourceType] || '#2563eb' }}
                          />
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge className={mapStatusColor(event.status)}>{mapStatusLabel(event.status)}</Badge>
                          <Badge variant="outline">{SOURCE_LABELS[event.sourceType]}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {format(new Date(event.startAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {' - '}
                          {format(new Date(event.endAt), 'HH:mm', { locale: ptBR })}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        {event.status !== 'COMPLETED' && event.status !== 'CANCELED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Marcar como concluído"
                            onClick={() => handleMarkCompleted(event.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.description && (
                      <p className="text-sm">
                        <strong>Descrição:</strong> {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm">
                        <strong>Local:</strong> {event.location}
                      </p>
                    )}
                    {event.calendar && (
                      <p className="text-sm">
                        <strong>Calendário:</strong> {event.calendar.name}
                      </p>
                    )}
                    {event.ownerUser?.name && (
                      <p className="text-sm">
                        <strong>Responsável:</strong> {event.ownerUser.name}
                      </p>
                    )}
                    {participantLabel(event) && (
                      <p className="text-sm">
                        <strong>Participantes:</strong> {participantLabel(event)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}
    </div>
  );
}
