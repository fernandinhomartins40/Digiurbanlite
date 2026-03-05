import { getFullApiUrl } from '@/lib/api-config';

export type CentralCalendarEventStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export type CentralCalendarSourceType =
  | 'MANUAL'
  | 'GABINETE'
  | 'HEALTH_SCHEDULE'
  | 'TFD_EXTERNAL'
  | 'PROTOCOL_STAGE'
  | 'SYSTEM_INTEGRATION';

export interface CentralAgendaCalendar {
  id: string;
  name: string;
  type: string;
}

export interface CentralAgendaEventParticipant {
  id: string;
  targetType: 'USER' | 'DEPARTMENT' | 'ORGANIZATIONAL_UNIT';
  role: string;
  status: string;
  isRequired: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  organizationalUnit?: {
    id: string;
    nome: string;
    sigla?: string | null;
    tipo?: string | null;
  } | null;
}

export interface CentralAgendaEvent {
  id: string;
  calendarId: string;
  ownerUserId: string;
  title: string;
  description?: string | null;
  eventType?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: CentralCalendarEventStatus;
  priority: number;
  notes?: string | null;
  metadata?: unknown;
  isPrivate: boolean;
  sourceType: CentralCalendarSourceType;
  sourceReferenceId?: string | null;
  createdAt: string;
  updatedAt: string;
  calendar?: CentralAgendaCalendar;
  ownerUser?: {
    id: string;
    name: string;
    email: string;
  };
  participants?: CentralAgendaEventParticipant[];
}

export interface CentralAgendaEventInput {
  title: string;
  description?: string;
  eventType?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  status?: CentralCalendarEventStatus;
  isPrivate?: boolean;
  calendarId?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

class ApiRequestError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

type AgendaApiMode = 'unknown' | 'central' | 'legacy';
type AgendaApiModePreference = 'auto' | 'central' | 'legacy';

const AGENDA_API_MODE_STORAGE_KEY = 'digiurban:agenda-api-mode';
const agendaApiModeFromEnv = (process.env.NEXT_PUBLIC_AGENDA_API_MODE || 'legacy').toLowerCase();
const agendaApiModePreference: AgendaApiModePreference =
  agendaApiModeFromEnv === 'central' || agendaApiModeFromEnv === 'legacy' || agendaApiModeFromEnv === 'auto'
    ? (agendaApiModeFromEnv as AgendaApiModePreference)
    : 'legacy';

function readPersistedAgendaApiMode(): AgendaApiMode {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  try {
    const saved = window.localStorage.getItem(AGENDA_API_MODE_STORAGE_KEY);
    if (saved === 'central' || saved === 'legacy') {
      return saved;
    }
  } catch {
    // no-op
  }

  return 'unknown';
}

function persistAgendaApiMode(mode: AgendaApiMode) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (mode === 'unknown') {
      window.localStorage.removeItem(AGENDA_API_MODE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AGENDA_API_MODE_STORAGE_KEY, mode);
  } catch {
    // no-op
  }
}

function resolveInitialAgendaApiMode(): AgendaApiMode {
  if (agendaApiModePreference === 'central') {
    return 'central';
  }

  if (agendaApiModePreference === 'legacy') {
    return 'legacy';
  }

  return readPersistedAgendaApiMode();
}

let agendaApiMode: AgendaApiMode = resolveInitialAgendaApiMode();

function setAgendaApiMode(mode: AgendaApiMode) {
  agendaApiMode = mode;
  persistAgendaApiMode(mode);
}

interface ListEventsFilters {
  startAt?: string;
  endAt?: string;
  status?: CentralCalendarEventStatus[] | string[];
  sourceType?: CentralCalendarSourceType[] | string[];
  calendarId?: string;
  includeAll?: boolean;
}

function buildQueryParams(filters?: ListEventsFilters) {
  const params = new URLSearchParams();

  if (!filters) {
    return params;
  }

  if (filters.startAt) {
    params.set('startAt', filters.startAt);
  }

  if (filters.endAt) {
    params.set('endAt', filters.endAt);
  }

  if (filters.status && filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }

  if (filters.sourceType && filters.sourceType.length > 0) {
    params.set('sourceType', filters.sourceType.join(','));
  }

  if (filters.calendarId) {
    params.set('calendarId', filters.calendarId);
  }

  if (filters.includeAll) {
    params.set('includeAll', 'true');
  }

  return params;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getFullApiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.details || body?.error || body?.message || `Falha na requisição (${response.status})`;
    throw new ApiRequestError(message, response.status, body);
  }

  return body as T;
}

function is404(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}

function is405(error: unknown) {
  return error instanceof ApiRequestError && error.status === 405;
}

function isLegacyRestrictionError(error: unknown) {
  if (!(error instanceof ApiRequestError) || error.status !== 403) {
    return false;
  }

  const message = `${error.message || ''} ${error.payload?.error || ''} ${error.payload?.details || ''}`;
  return message.includes('Gabinete do Prefeito') || message.includes('Acesso restrito');
}

function canFallbackToLegacy(error: unknown) {
  return is404(error) || is405(error);
}

function canFallbackToCentral(error: unknown) {
  return is404(error) || is405(error) || isLegacyRestrictionError(error);
}

interface LegacyAgendaEvent {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  dataHoraInicio: string;
  dataHoraFim: string;
  local?: string | null;
  status?: string | null;
  observacoes?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const LEGACY_STATUS_TO_CENTRAL: Record<string, CentralCalendarEventStatus> = {
  AGENDADO: 'SCHEDULED',
  CONFIRMADO: 'CONFIRMED',
  REALIZADO: 'COMPLETED',
  CANCELADO: 'CANCELED',
};

const CENTRAL_STATUS_TO_LEGACY: Partial<Record<CentralCalendarEventStatus, string>> = {
  SCHEDULED: 'AGENDADO',
  CONFIRMED: 'CONFIRMADO',
  IN_PROGRESS: 'CONFIRMADO',
  COMPLETED: 'REALIZADO',
  CANCELED: 'CANCELADO',
  NO_SHOW: 'CANCELADO',
};

function mapLegacyToCentralEvent(item: LegacyAgendaEvent): CentralAgendaEvent {
  return {
    id: item.id,
    calendarId: 'legacy-gabinete',
    ownerUserId: item.createdBy?.id || 'legacy-owner',
    title: item.titulo,
    description: item.descricao || null,
    eventType: item.tipo || null,
    location: item.local || null,
    startAt: item.dataHoraInicio,
    endAt: item.dataHoraFim,
    allDay: false,
    status: LEGACY_STATUS_TO_CENTRAL[item.status || ''] || 'SCHEDULED',
    priority: 3,
    notes: item.observacoes || null,
    isPrivate: false,
    sourceType: 'GABINETE',
    sourceReferenceId: item.id,
    createdAt: item.dataHoraInicio,
    updatedAt: item.dataHoraFim,
    calendar: {
      id: 'legacy-gabinete',
      name: 'Agenda Executiva',
      type: 'LEGACY',
    },
    ownerUser: item.createdBy
      ? {
          id: item.createdBy.id,
          name: item.createdBy.name,
          email: item.createdBy.email,
        }
      : undefined,
  };
}

function mapCentralToLegacyPayload(data: Partial<CentralAgendaEventInput>) {
  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload.titulo = data.title;
  if (data.description !== undefined) payload.descricao = data.description;
  if (data.eventType !== undefined) payload.tipo = data.eventType || 'OUTRO';
  if (data.location !== undefined) payload.local = data.location;
  if (data.startAt !== undefined) payload.dataHoraInicio = data.startAt;
  if (data.endAt !== undefined) payload.dataHoraFim = data.endAt;
  if (data.status !== undefined) payload.status = CENTRAL_STATUS_TO_LEGACY[data.status] || 'AGENDADO';

  return payload;
}

async function listLegacyEvents(filters?: ListEventsFilters): Promise<CentralAgendaEvent[]> {
  const params = new URLSearchParams();

  if (filters?.startAt) params.set('startDate', filters.startAt);
  if (filters?.endAt) params.set('endDate', filters.endAt);

  if (filters?.status && filters.status.length > 0) {
    const mapped = filters.status
      .map((status) => CENTRAL_STATUS_TO_LEGACY[status as CentralCalendarEventStatus])
      .filter(Boolean) as string[];
    if (mapped.length > 0) {
      params.set('status', mapped[0]);
    }
  }

  const qs = params.toString();
  const legacy = await request<ApiEnvelope<LegacyAgendaEvent[]>>(
    `/api/admin/gabinete/agenda${qs ? `?${qs}` : ''}`
  );

  return (legacy.data || []).map(mapLegacyToCentralEvent);
}

async function withCentralFallback<T>(centralCall: () => Promise<T>, legacyCall: () => Promise<T>) {
  const tryCentral = async () => {
    try {
      const result = await centralCall();
      setAgendaApiMode('central');
      return result;
    } catch (error) {
      if (canFallbackToLegacy(error)) {
        const result = await legacyCall();
        setAgendaApiMode('legacy');
        return result;
      }
      throw error;
    }
  };

  const tryLegacy = async () => {
    try {
      const result = await legacyCall();
      setAgendaApiMode('legacy');
      return result;
    } catch (error) {
      if (canFallbackToCentral(error)) {
        const result = await centralCall();
        setAgendaApiMode('central');
        return result;
      }
      throw error;
    }
  };

  if (agendaApiMode === 'central') {
    return tryCentral();
  }

  if (agendaApiMode === 'legacy') {
    return tryLegacy();
  }

  if (agendaApiModePreference === 'central') {
    return tryCentral();
  }

  if (agendaApiModePreference === 'legacy') {
    return tryLegacy();
  }

  const persistedMode = readPersistedAgendaApiMode();
  if (persistedMode === 'central') {
    setAgendaApiMode('central');
    return tryCentral();
  }

  if (persistedMode === 'legacy') {
    setAgendaApiMode('legacy');
    return tryLegacy();
  }

  return tryLegacy();
}

export const centralAgendaService = {
  async listEvents(filters?: ListEventsFilters): Promise<CentralAgendaEvent[]> {
    return withCentralFallback(
      async () => {
        const query = buildQueryParams(filters);
        const qs = query.toString();
        const payload = await request<ApiEnvelope<CentralAgendaEvent[]>>(
          `/api/agenda${qs ? `?${qs}` : ''}`
        );
        return payload.data || [];
      },
      async () => listLegacyEvents(filters)
    );
  },

  async listMyCalendars(): Promise<CentralAgendaCalendar[]> {
    return withCentralFallback(
      async () => {
        const payload = await request<ApiEnvelope<CentralAgendaCalendar[]>>('/api/agenda/calendars/mine');
        return payload.data || [];
      },
      async () => [
        {
          id: 'legacy-gabinete',
          name: 'Agenda Executiva',
          type: 'LEGACY',
        },
      ]
    );
  },

  async createEvent(data: CentralAgendaEventInput): Promise<CentralAgendaEvent> {
    return withCentralFallback(
      async () => {
        const payload = await request<ApiEnvelope<CentralAgendaEvent>>('/api/agenda', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return payload.data;
      },
      async () => {
        const payload = await request<ApiEnvelope<LegacyAgendaEvent>>('/api/admin/gabinete/agenda', {
          method: 'POST',
          body: JSON.stringify(mapCentralToLegacyPayload(data)),
        });
        return mapLegacyToCentralEvent(payload.data);
      }
    );
  },

  async updateEvent(id: string, data: Partial<CentralAgendaEventInput>): Promise<CentralAgendaEvent> {
    return withCentralFallback(
      async () => {
        const payload = await request<ApiEnvelope<CentralAgendaEvent>>(`/api/agenda/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return payload.data;
      },
      async () => {
        const payload = await request<ApiEnvelope<LegacyAgendaEvent>>(`/api/admin/gabinete/agenda/${id}`, {
          method: 'PUT',
          body: JSON.stringify(mapCentralToLegacyPayload(data)),
        });
        return mapLegacyToCentralEvent(payload.data);
      }
    );
  },

  async deleteEvent(id: string): Promise<void> {
    await withCentralFallback(
      async () => {
        await request(`/api/agenda/${id}`, {
          method: 'DELETE',
        });
      },
      async () => {
        await request(`/api/admin/gabinete/agenda/${id}`, {
          method: 'DELETE',
        });
      }
    );
  },

  async markEventCompleted(id: string): Promise<CentralAgendaEvent> {
    return withCentralFallback(
      async () => {
        const payload = await request<ApiEnvelope<CentralAgendaEvent>>(`/api/agenda/${id}/complete`, {
          method: 'PATCH',
        });
        return payload.data;
      },
      async () => {
        const payload = await request<ApiEnvelope<LegacyAgendaEvent>>(
          `/api/admin/gabinete/agenda/${id}/realize`,
          {
            method: 'PATCH',
            body: JSON.stringify({}),
          }
        );
        return mapLegacyToCentralEvent(payload.data);
      }
    );
  },
};
