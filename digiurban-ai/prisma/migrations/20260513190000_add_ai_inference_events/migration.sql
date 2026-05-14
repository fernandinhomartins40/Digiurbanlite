CREATE TABLE "ai_inference_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "userId" TEXT,
    "source" TEXT,
    "routeKind" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "firstTokenLatencyMs" INTEGER,
    "deterministicResponse" BOOLEAN NOT NULL DEFAULT false,
    "toolFirst" BOOLEAN NOT NULL DEFAULT false,
    "webSearch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_inference_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_inference_events_tenantId_createdAt_idx" ON "ai_inference_events"("tenantId", "createdAt");
CREATE INDEX "ai_inference_events_routeKind_createdAt_idx" ON "ai_inference_events"("routeKind", "createdAt");
CREATE INDEX "ai_inference_events_model_createdAt_idx" ON "ai_inference_events"("model", "createdAt");
