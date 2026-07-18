-- Numeração de protocolo é POR TENANT: o unique global em "number" fazia o
-- tenant B falhar ao alcançar um número que o tenant A já usou.
-- Passa a ser unique composto (tenantId, number).

DROP INDEX IF EXISTS "protocols_simplified_number_key";

CREATE UNIQUE INDEX "protocols_simplified_tenantId_number_key"
  ON "protocols_simplified"("tenantId", "number");
