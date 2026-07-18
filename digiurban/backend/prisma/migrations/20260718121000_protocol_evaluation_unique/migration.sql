-- Uma avaliação por protocolo. Antes de criar o unique, remove duplicatas
-- mantendo a avaliação mais recente (desempate por id).

DELETE FROM "protocol_evaluations_simplified" a
USING "protocol_evaluations_simplified" b
WHERE a."protocolId" = b."protocolId"
  AND (a."createdAt" < b."createdAt"
       OR (a."createdAt" = b."createdAt" AND a."id" < b."id"));

CREATE UNIQUE INDEX "protocol_evaluations_simplified_protocolId_key"
  ON "protocol_evaluations_simplified"("protocolId");
