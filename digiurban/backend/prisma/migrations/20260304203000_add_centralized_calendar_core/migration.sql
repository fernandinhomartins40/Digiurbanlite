-- ============================================================
-- CENTRALIZED CALENDAR CORE
-- ============================================================

CREATE TYPE "CentralCalendarType" AS ENUM (
  'PERSONAL',
  'SHARED',
  'DEPARTMENT',
  'ORGANIZATIONAL_UNIT',
  'SERVICE',
  'SYSTEM'
);

CREATE TYPE "CentralCalendarRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

CREATE TYPE "CentralCalendarEventStatus" AS ENUM (
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW'
);

CREATE TYPE "CentralCalendarParticipantRole" AS ENUM (
  'OWNER',
  'RESPONSIBLE',
  'ATTENDEE',
  'OBSERVER'
);

CREATE TYPE "CentralCalendarParticipantStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'TENTATIVE'
);

CREATE TYPE "CentralCalendarSourceType" AS ENUM (
  'MANUAL',
  'GABINETE',
  'HEALTH_SCHEDULE',
  'TFD_EXTERNAL',
  'PROTOCOL_STAGE',
  'SYSTEM_INTEGRATION'
);

CREATE TYPE "CentralCalendarVisibilityScope" AS ENUM (
  'OWNER_ONLY',
  'USER',
  'DEPARTMENT',
  'ORGANIZATIONAL_UNIT',
  'CALENDAR_MEMBERS'
);

CREATE TABLE "central_calendars" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "CentralCalendarType" NOT NULL DEFAULT 'PERSONAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerUserId" TEXT,
  "departmentId" TEXT,
  "organizationalUnitId" TEXT,
  "serviceId" TEXT,

  CONSTRAINT "central_calendars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "central_calendar_members" (
  "id" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CentralCalendarRole" NOT NULL DEFAULT 'VIEWER',
  "addedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "central_calendar_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "central_calendar_events" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  "status" "CentralCalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "priority" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "eventType" TEXT,
  "location" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "isPrivate" BOOLEAN NOT NULL DEFAULT true,
  "sourceType" "CentralCalendarSourceType" NOT NULL DEFAULT 'MANUAL',
  "sourceReferenceId" TEXT,
  "canceledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "calendarId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "protocolId" TEXT,
  "protocolStageId" TEXT,
  "serviceId" TEXT,
  "departmentId" TEXT,
  "organizationalUnitId" TEXT,

  CONSTRAINT "central_calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "central_calendar_event_participants" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "targetType" "WorkflowStageSupportTargetType" NOT NULL,
  "userId" TEXT,
  "departmentId" TEXT,
  "organizationalUnitId" TEXT,
  "role" "CentralCalendarParticipantRole" NOT NULL DEFAULT 'ATTENDEE',
  "status" "CentralCalendarParticipantStatus" NOT NULL DEFAULT 'PENDING',
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "central_calendar_event_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "central_calendar_event_visibility" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "scope" "CentralCalendarVisibilityScope" NOT NULL DEFAULT 'OWNER_ONLY',
  "userId" TEXT,
  "departmentId" TEXT,
  "organizationalUnitId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "central_calendar_event_visibility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "central_calendar_event_links" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "linkType" TEXT NOT NULL,
  "linkedId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "central_calendar_event_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "central_calendars_type_ownerUserId_key"
ON "central_calendars"("type", "ownerUserId");

CREATE UNIQUE INDEX "central_calendars_type_departmentId_key"
ON "central_calendars"("type", "departmentId");

CREATE UNIQUE INDEX "central_calendars_type_organizationalUnitId_key"
ON "central_calendars"("type", "organizationalUnitId");

CREATE UNIQUE INDEX "central_calendars_type_serviceId_key"
ON "central_calendars"("type", "serviceId");

CREATE INDEX "central_calendars_ownerUserId_isActive_idx"
ON "central_calendars"("ownerUserId", "isActive");

CREATE INDEX "central_calendars_departmentId_isActive_idx"
ON "central_calendars"("departmentId", "isActive");

CREATE INDEX "central_calendars_organizationalUnitId_isActive_idx"
ON "central_calendars"("organizationalUnitId", "isActive");

CREATE INDEX "central_calendars_serviceId_isActive_idx"
ON "central_calendars"("serviceId", "isActive");

CREATE UNIQUE INDEX "central_calendar_members_calendarId_userId_key"
ON "central_calendar_members"("calendarId", "userId");

CREATE INDEX "central_calendar_members_userId_role_idx"
ON "central_calendar_members"("userId", "role");

CREATE UNIQUE INDEX "central_calendar_events_sourceType_sourceReferenceId_key"
ON "central_calendar_events"("sourceType", "sourceReferenceId");

CREATE INDEX "central_calendar_events_calendarId_startAt_idx"
ON "central_calendar_events"("calendarId", "startAt");

CREATE INDEX "central_calendar_events_ownerUserId_startAt_idx"
ON "central_calendar_events"("ownerUserId", "startAt");

CREATE INDEX "central_calendar_events_status_startAt_idx"
ON "central_calendar_events"("status", "startAt");

CREATE INDEX "central_calendar_events_protocolId_idx"
ON "central_calendar_events"("protocolId");

CREATE INDEX "central_calendar_events_protocolStageId_idx"
ON "central_calendar_events"("protocolStageId");

CREATE INDEX "central_calendar_events_departmentId_startAt_idx"
ON "central_calendar_events"("departmentId", "startAt");

CREATE INDEX "central_calendar_events_organizationalUnitId_startAt_idx"
ON "central_calendar_events"("organizationalUnitId", "startAt");

CREATE INDEX "central_calendar_event_participants_eventId_targetType_idx"
ON "central_calendar_event_participants"("eventId", "targetType");

CREATE INDEX "central_calendar_event_participants_userId_idx"
ON "central_calendar_event_participants"("userId");

CREATE INDEX "central_calendar_event_participants_departmentId_idx"
ON "central_calendar_event_participants"("departmentId");

CREATE INDEX "central_calendar_event_participants_organizationalUnitId_idx"
ON "central_calendar_event_participants"("organizationalUnitId");

CREATE INDEX "central_calendar_event_visibility_eventId_scope_idx"
ON "central_calendar_event_visibility"("eventId", "scope");

CREATE INDEX "central_calendar_event_visibility_userId_idx"
ON "central_calendar_event_visibility"("userId");

CREATE INDEX "central_calendar_event_visibility_departmentId_idx"
ON "central_calendar_event_visibility"("departmentId");

CREATE INDEX "central_calendar_event_visibility_organizationalUnitId_idx"
ON "central_calendar_event_visibility"("organizationalUnitId");

CREATE INDEX "central_calendar_event_links_eventId_idx"
ON "central_calendar_event_links"("eventId");

CREATE INDEX "central_calendar_event_links_linkType_linkedId_idx"
ON "central_calendar_event_links"("linkType", "linkedId");

ALTER TABLE "central_calendars"
ADD CONSTRAINT "central_calendars_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendars"
ADD CONSTRAINT "central_calendars_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendars"
ADD CONSTRAINT "central_calendars_organizationalUnitId_fkey"
FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendars"
ADD CONSTRAINT "central_calendars_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "services_simplified"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_members"
ADD CONSTRAINT "central_calendar_members_calendarId_fkey"
FOREIGN KEY ("calendarId") REFERENCES "central_calendars"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_members"
ADD CONSTRAINT "central_calendar_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_members"
ADD CONSTRAINT "central_calendar_members_addedByUserId_fkey"
FOREIGN KEY ("addedByUserId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_calendarId_fkey"
FOREIGN KEY ("calendarId") REFERENCES "central_calendars"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_protocolStageId_fkey"
FOREIGN KEY ("protocolStageId") REFERENCES "protocol_stages"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "services_simplified"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_events"
ADD CONSTRAINT "central_calendar_events_organizationalUnitId_fkey"
FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_participants"
ADD CONSTRAINT "central_calendar_event_participants_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "central_calendar_events"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_participants"
ADD CONSTRAINT "central_calendar_event_participants_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_participants"
ADD CONSTRAINT "central_calendar_event_participants_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_participants"
ADD CONSTRAINT "central_calendar_event_participants_organizationalUnitId_fkey"
FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_visibility"
ADD CONSTRAINT "central_calendar_event_visibility_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "central_calendar_events"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_visibility"
ADD CONSTRAINT "central_calendar_event_visibility_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_visibility"
ADD CONSTRAINT "central_calendar_event_visibility_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_visibility"
ADD CONSTRAINT "central_calendar_event_visibility_organizationalUnitId_fkey"
FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "central_calendar_event_links"
ADD CONSTRAINT "central_calendar_event_links_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "central_calendar_events"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
