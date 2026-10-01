-- Segredos da plataforma geridos pelo painel (token interno bot ↔ backend)
CREATE TABLE IF NOT EXISTS "platform_secrets" (
    "key" TEXT NOT NULL,
    "valueEnc" TEXT NOT NULL,
    "previousEnc" TEXT,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_secrets_pkey" PRIMARY KEY ("key")
);
