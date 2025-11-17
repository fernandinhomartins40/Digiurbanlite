-- Script para resetar o status da migração 20251116_add_unique_module_type
-- Execute este script APENAS se a migração falhou e você corrigiu o SQL
--
-- ATENÇÃO: Este script deve ser executado no banco de produção ANTES do próximo deploy
--
-- Como usar:
-- psql -U postgres -d digiurban -f prisma/reset-migration-status.sql

-- Deletar o registro de falha da migração
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251116_add_unique_module_type';

-- Verificar se foi removido
SELECT migration_name, finished_at, success, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name = '20251116_add_unique_module_type';
-- Deve retornar 0 linhas

-- Agora a migração será executada novamente no próximo deploy
