-- Fluxos do bot são POR MUNICÍPIO: o nome se repete entre municípios.
-- A migration 20260121 criava um índice único só em "name"; ela falhava a cada
-- boot e o fallback do entrypoint reaplicava o SQL, recriando o índice que o
-- backend já tinha removido (wave8). Resultado: o seeder não conseguia criar os
-- fluxos de um município novo e todo POST /bot-flow/message dava 500.
DROP INDEX IF EXISTS "flow_definitions_name_key";
