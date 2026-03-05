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

export const centralAgendaService = {
  async listEvents(filters?: ListEventsFilters): Promise<CentralAgendaEvent[]> {
    const query = buildQueryParams(filters);
    const qs = query.toString();
    const payload = await request<ApiEnvelope<CentralAgendaEvent[]>>(
      `/api/agenda${qs ? `?${qs}` : ''}`
    );
    return payload.data || [];
  },

  async listMyCalendars(): Promise<CentralAgendaCalendar[]> {
    const payload = await request<ApiEnvelope<CentralAgendaCalendar[]>>('/api/agenda/calendars/mine');
    return payload.data || [];
  },

  async createEvent(data: CentralAgendaEventInput): Promise<CentralAgendaEvent> {
    const payload = await request<ApiEnvelope<CentralAgendaEvent>>('/api/agenda', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return payload.data;
  },

  async updateEvent(id: string, data: Partial<CentralAgendaEventInput>): Promise<CentralAgendaEvent> {
    const payload = await request<ApiEnvelope<CentralAgendaEvent>>(`/api/agenda/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return payload.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await request(`/api/agenda/${id}`, {
      method: 'DELETE',
    });
  },

  async markEventCompleted(id: string): Promise<CentralAgendaEvent> {
    const payload = await request<ApiEnvelope<CentralAgendaEvent>>(`/api/agenda/${id}/complete`, {
      method: 'PATCH',
    });
    return payload.data;
  },
};

