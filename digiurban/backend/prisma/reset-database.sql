-- Script para resetar completamente o banco de dados
-- ATENÇÃO: Este script DELETE TODOS OS DADOS!

-- Drop todas as tabelas (em ordem de dependências)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
