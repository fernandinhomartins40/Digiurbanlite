'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  CentralAgendaEvent,
  CentralAgendaEventInput,
  CentralCalendarEventStatus,
} from '@/lib/services/central-agenda.service';

export interface CentralAgendaEventFormInput extends CentralAgendaEventInput {
  startAt: string;
  endAt: string;
}

interface CentralAgendaEventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: CentralAgendaEventFormInput) => Promise<void>;
  event?: CentralAgendaEvent | null;
  presetStartAt?: string;
  presetEndAt?: string;
}

const STATUS_OPTIONS: Array<{ value: CentralCalendarEventStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não compareceu' },
];

function toDateTimeLocal(value?: string | Date | null) {
  if (!value) {
    return '';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CentralAgendaEventModal({
  open,
  onClose,
  onSave,
  event,
  presetStartAt,
  presetEndAt,
}: CentralAgendaEventModalProps) {
  const [formData, setFormData] = useState<CentralAgendaEventFormInput>({
    title: '',
    description: '',
    eventType: '',
    location: '',
    startAt: '',
    endAt: '',
    allDay: false,
    status: 'SCHEDULED',
    isPrivate: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || '',
        location: event.location || '',
        startAt: toDateTimeLocal(event.startAt),
        endAt: toDateTimeLocal(event.endAt),
        allDay: Boolean(event.allDay),
        status: event.status,
        isPrivate: Boolean(event.isPrivate),
      });
      setError(null);
      return;
    }

    const presetStartDate = presetStartAt ? new Date(presetStartAt) : null;
    const presetEndDate = presetEndAt ? new Date(presetEndAt) : null;
    const now = presetStartDate && !Number.isNaN(presetStartDate.getTime()) ? presetStartDate : new Date();
    const oneHourLater =
      presetEndDate && !Number.isNaN(presetEndDate.getTime())
        ? presetEndDate
        : new Date(now.getTime() + 60 * 60 * 1000);

    setFormData({
      title: '',
      description: '',
      eventType: '',
      location: '',
      startAt: toDateTimeLocal(now),
      endAt: toDateTimeLocal(oneHourLater),
      allDay: false,
      status: 'SCHEDULED',
      isPrivate: true,
    });
    setError(null);
  }, [open, event, presetStartAt, presetEndAt]);

  const durationLabel = useMemo(() => {
    if (!formData.startAt || !formData.endAt) {
      return null;
    }

    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }

    const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours === 0) {
      return `${minutes}min`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}min`;
  }, [formData.startAt, formData.endAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startAt || !formData.endAt) {
      setError('Preencha os campos obrigatórios: título, início e fim.');
      return;
    }

    const startAt = new Date(formData.startAt);
    const endAt = new Date(formData.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setError('Data/hora inválida.');
      return;
    }

    if (endAt <= startAt) {
      setError('O término precisa ser posterior ao início.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await onSave({
        ...formData,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar evento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            Evento da agenda centralizada. Disponível conforme regras de visibilidade e participantes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Input
                id="eventType"
                value={formData.eventType || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventType: e.target.value }))}
                placeholder="Ex: REUNIÃO, VISITA, DILIGÊNCIA"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startAt">Início *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, startAt: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endAt">Fim *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, endAt: e.target.value }))}
                required
              />
            </div>
          </div>

          {durationLabel && (
            <p className="text-sm text-muted-foreground">
              Duração estimada: <strong>{durationLabel}</strong>
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: CentralCalendarEventStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allDay">Dia inteiro</Label>
                <Switch
                  id="allDay"
                  checked={Boolean(formData.allDay)}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, allDay: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isPrivate">Privado</Label>
                <Switch
                  id="isPrivate"
                  checked={Boolean(formData.isPrivate)}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPrivate: checked }))
                  }
                />
              </div>
            </div>
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
  );
}
