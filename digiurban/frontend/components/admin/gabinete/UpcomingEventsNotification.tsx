'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  centralAgendaService,
  type CentralAgendaEvent,
} from '@/lib/services/central-agenda.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type UpcomingEvent = CentralAgendaEvent;

export function UpcomingEventsNotification() {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const events = await centralAgendaService.listEvents({
        startAt: now.toISOString(),
        endAt: next24Hours.toISOString(),
        status: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
      });
      setUpcomingEvents(events);

      if (events.length > 0) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos próximos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingEvents();
    const interval = setInterval(loadUpcomingEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || upcomingEvents.length === 0) {
    return null;
  }

  return (
    <>
      {!isOpen && upcomingEvents.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full h-14 w-14 shadow-lg relative"
            variant="default"
          >
            <Bell className="h-6 w-6" />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center"
            >
              {upcomingEvents.length}
            </Badge>
          </Button>
        </div>
      )}

      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-lg">Eventos Próximos</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Você tem {upcomingEvents.length} evento(s) nas próximas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingEvents.map((event) => {
              const startTime = new Date(event.startAt);
              const timeUntil = formatDistanceToNow(startTime, {
                locale: ptBR,
                addSuffix: true,
              });

              return (
                <div
                  key={event.id}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {(event.eventType || event.sourceType).replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-blue-600">{timeUntil}</span>
                    <span>
                      ({startTime.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })})
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}
