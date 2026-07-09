-- ============================================================================
-- FASE 2 MULTI-TENANT - ONDA 6: filhas sensiveis herdam tenantId do pai
-- ============================================================================
-- Fecha os acessos DIRETOS a dados sensiveis nao-escopados (prontuario,
-- composicao familiar, beneficios, TFD). Backfill via JOIN no pai ja escopado
-- (ondas 1-5) - nao depende de tenant-default cegamente.
-- Condicional por tabela (drift). O pai pode nao ter a tabela em bancos exoticos.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'acompanhamentos_beneficio') THEN
    ALTER TABLE "acompanhamentos_beneficio" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'acompanhamentos_beneficio_tenantId_fkey') THEN
      ALTER TABLE "acompanhamentos_beneficio" ADD CONSTRAINT "acompanhamentos_beneficio_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inscricoes_programas_sociais' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acompanhamentos_beneficio' AND column_name='inscricaoId') THEN
      EXECUTE 'UPDATE "acompanhamentos_beneficio" c SET "tenantId" = p."tenantId" FROM "inscricoes_programas_sociais" p WHERE c."inscricaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "acompanhamentos_beneficio" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "acompanhamentos_beneficio_tenantId_idx" ON "acompanhamentos_beneficio"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamento_externo_tfd') THEN
    ALTER TABLE "agendamento_externo_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agendamento_externo_tfd_tenantId_fkey') THEN
      ALTER TABLE "agendamento_externo_tfd" ADD CONSTRAINT "agendamento_externo_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamento_externo_tfd' AND column_name='solicitacaoId') THEN
      EXECUTE 'UPDATE "agendamento_externo_tfd" c SET "tenantId" = p."tenantId" FROM "solicitacoes_tfd" p WHERE c."solicitacaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "agendamento_externo_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "agendamento_externo_tfd_tenantId_idx" ON "agendamento_externo_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alergias_reacoes') THEN
    ALTER TABLE "alergias_reacoes" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'alergias_reacoes_tenantId_fkey') THEN
      ALTER TABLE "alergias_reacoes" ADD CONSTRAINT "alergias_reacoes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alergias_reacoes' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "alergias_reacoes" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "alergias_reacoes" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "alergias_reacoes_tenantId_idx" ON "alergias_reacoes"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alergias_cidadao') THEN
    ALTER TABLE "alergias_cidadao" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'alergias_cidadao_tenantId_fkey') THEN
      ALTER TABLE "alergias_cidadao" ADD CONSTRAINT "alergias_cidadao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alergias_cidadao' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "alergias_cidadao" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "alergias_cidadao" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "alergias_cidadao_tenantId_idx" ON "alergias_cidadao"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anexo_prontuario') THEN
    ALTER TABLE "anexo_prontuario" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'anexo_prontuario_tenantId_fkey') THEN
      ALTER TABLE "anexo_prontuario" ADD CONSTRAINT "anexo_prontuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='atendimentos_medicos' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='anexo_prontuario' AND column_name='atendimentoId') THEN
      EXECUTE 'UPDATE "anexo_prontuario" c SET "tenantId" = p."tenantId" FROM "atendimentos_medicos" p WHERE c."atendimentoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "anexo_prontuario" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "anexo_prontuario_tenantId_idx" ON "anexo_prontuario"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aprovacao_gestao_tfd') THEN
    ALTER TABLE "aprovacao_gestao_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'aprovacao_gestao_tfd_tenantId_fkey') THEN
      ALTER TABLE "aprovacao_gestao_tfd" ADD CONSTRAINT "aprovacao_gestao_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='aprovacao_gestao_tfd' AND column_name='solicitacaoId') THEN
      EXECUTE 'UPDATE "aprovacao_gestao_tfd" c SET "tenantId" = p."tenantId" FROM "solicitacoes_tfd" p WHERE c."solicitacaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "aprovacao_gestao_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "aprovacao_gestao_tfd_tenantId_idx" ON "aprovacao_gestao_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_conversations') THEN
    ALTER TABLE "bot_conversations" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bot_conversations_tenantId_fkey') THEN
      ALTER TABLE "bot_conversations" ADD CONSTRAINT "bot_conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_conversations' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "bot_conversations" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "bot_conversations" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "bot_conversations_tenantId_idx" ON "bot_conversations"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_messages') THEN
    ALTER TABLE "bot_messages" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bot_messages_tenantId_fkey') THEN
      ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_messages' AND column_name='conversationId') THEN
      EXECUTE 'UPDATE "bot_messages" c SET "tenantId" = p."tenantId" FROM "conversations" p WHERE c."conversationId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "bot_messages" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "bot_messages_tenantId_idx" ON "bot_messages"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_uploads') THEN
    ALTER TABLE "bot_uploads" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bot_uploads_tenantId_fkey') THEN
      ALTER TABLE "bot_uploads" ADD CONSTRAINT "bot_uploads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_uploads' AND column_name='conversationId') THEN
      EXECUTE 'UPDATE "bot_uploads" c SET "tenantId" = p."tenantId" FROM "conversations" p WHERE c."conversationId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "bot_uploads" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "bot_uploads_tenantId_idx" ON "bot_uploads"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chamada_painel') THEN
    ALTER TABLE "chamada_painel" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chamada_painel_tenantId_fkey') THEN
      ALTER TABLE "chamada_painel" ADD CONSTRAINT "chamada_painel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_saude' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chamada_painel' AND column_name='unidadeId') THEN
      EXECUTE 'UPDATE "chamada_painel" c SET "tenantId" = p."tenantId" FROM "unidades_saude" p WHERE c."unidadeId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "chamada_painel" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "chamada_painel_tenantId_idx" ON "chamada_painel"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_deliveries') THEN
    ALTER TABLE "channel_deliveries" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'channel_deliveries_tenantId_fkey') THEN
      ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channel_deliveries' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "channel_deliveries" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "channel_deliveries" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "channel_deliveries_tenantId_idx" ON "channel_deliveries"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_subscriptions') THEN
    ALTER TABLE "channel_subscriptions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'channel_subscriptions_tenantId_fkey') THEN
      ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channel_subscriptions' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "channel_subscriptions" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "channel_subscriptions" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "channel_subscriptions_tenantId_idx" ON "channel_subscriptions"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_category_assignments') THEN
    ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_category_assignments_tenantId_fkey') THEN
      ALTER TABLE "citizen_category_assignments" ADD CONSTRAINT "citizen_category_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocols_simplified' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_category_assignments' AND column_name='protocolId') THEN
      EXECUTE 'UPDATE "citizen_category_assignments" c SET "tenantId" = p."tenantId" FROM "protocols_simplified" p WHERE c."protocolId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_category_assignments" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_category_assignments_tenantId_idx" ON "citizen_category_assignments"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_category_audit_log') THEN
    ALTER TABLE "citizen_category_audit_log" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_category_audit_log_tenantId_fkey') THEN
      ALTER TABLE "citizen_category_audit_log" ADD CONSTRAINT "citizen_category_audit_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employee_assignments' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_category_audit_log' AND column_name='assignmentId') THEN
      EXECUTE 'UPDATE "citizen_category_audit_log" c SET "tenantId" = p."tenantId" FROM "employee_assignments" p WHERE c."assignmentId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_category_audit_log" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_category_audit_log_tenantId_idx" ON "citizen_category_audit_log"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_category_badges') THEN
    ALTER TABLE "citizen_category_badges" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_category_badges_tenantId_fkey') THEN
      ALTER TABLE "citizen_category_badges" ADD CONSTRAINT "citizen_category_badges_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_categories' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_category_badges' AND column_name='categoryId') THEN
      EXECUTE 'UPDATE "citizen_category_badges" c SET "tenantId" = p."tenantId" FROM "citizen_categories" p WHERE c."categoryId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_category_badges" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_category_badges_tenantId_idx" ON "citizen_category_badges"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_category_protocol_history') THEN
    ALTER TABLE "citizen_category_protocol_history" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_category_protocol_history_tenantId_fkey') THEN
      ALTER TABLE "citizen_category_protocol_history" ADD CONSTRAINT "citizen_category_protocol_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocols_simplified' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_category_protocol_history' AND column_name='protocolId') THEN
      EXECUTE 'UPDATE "citizen_category_protocol_history" c SET "tenantId" = p."tenantId" FROM "protocols_simplified" p WHERE c."protocolId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_category_protocol_history" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_category_protocol_history_tenantId_idx" ON "citizen_category_protocol_history"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_privacy_settings') THEN
    ALTER TABLE "citizen_privacy_settings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_privacy_settings_tenantId_fkey') THEN
      ALTER TABLE "citizen_privacy_settings" ADD CONSTRAINT "citizen_privacy_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_privacy_settings' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "citizen_privacy_settings" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_privacy_settings" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_privacy_settings_tenantId_idx" ON "citizen_privacy_settings"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizen_transfer_requests') THEN
    ALTER TABLE "citizen_transfer_requests" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizen_transfer_requests_tenantId_fkey') THEN
      ALTER TABLE "citizen_transfer_requests" ADD CONSTRAINT "citizen_transfer_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizen_transfer_requests' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "citizen_transfer_requests" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "citizen_transfer_requests" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "citizen_transfer_requests_tenantId_idx" ON "citizen_transfer_requests"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comorbidades_cidadao') THEN
    ALTER TABLE "comorbidades_cidadao" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comorbidades_cidadao_tenantId_fkey') THEN
      ALTER TABLE "comorbidades_cidadao" ADD CONSTRAINT "comorbidades_cidadao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comorbidades_cidadao' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "comorbidades_cidadao" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "comorbidades_cidadao" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "comorbidades_cidadao_tenantId_idx" ON "comorbidades_cidadao"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultas_pre_natal') THEN
    ALTER TABLE "consultas_pre_natal" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'consultas_pre_natal_tenantId_fkey') THEN
      ALTER TABLE "consultas_pre_natal" ADD CONSTRAINT "consultas_pre_natal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acompanhamento_pre_natal' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultas_pre_natal' AND column_name='preNatalId') THEN
      EXECUTE 'UPDATE "consultas_pre_natal" c SET "tenantId" = p."tenantId" FROM "acompanhamento_pre_natal" p WHERE c."preNatalId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "consultas_pre_natal" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "consultas_pre_natal_tenantId_idx" ON "consultas_pre_natal"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_tenantId_fkey') THEN
      ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocols_simplified' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='protocolId') THEN
      EXECUTE 'UPDATE "conversations" c SET "tenantId" = p."tenantId" FROM "protocols_simplified" p WHERE c."protocolId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "conversations" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "conversations_tenantId_idx" ON "conversations"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_metrics') THEN
    ALTER TABLE "department_metrics" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'department_metrics_tenantId_fkey') THEN
      ALTER TABLE "department_metrics" ADD CONSTRAINT "department_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='department_metrics' AND column_name='departmentId') THEN
      EXECUTE 'UPDATE "department_metrics" c SET "tenantId" = p."tenantId" FROM "departments" p WHERE c."departmentId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "department_metrics" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "department_metrics_tenantId_idx" ON "department_metrics"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documento_tfd') THEN
    ALTER TABLE "documento_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'documento_tfd_tenantId_fkey') THEN
      ALTER TABLE "documento_tfd" ADD CONSTRAINT "documento_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documento_tfd' AND column_name='solicitacaoId') THEN
      EXECUTE 'UPDATE "documento_tfd" c SET "tenantId" = p."tenantId" FROM "solicitacoes_tfd" p WHERE c."solicitacaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "documento_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "documento_tfd_tenantId_idx" ON "documento_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
    ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'emails_tenantId_fkey') THEN
      ALTER TABLE "emails" ADD CONSTRAINT "emails_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emails' AND column_name='userId') THEN
      EXECUTE 'UPDATE "emails" c SET "tenantId" = p."tenantId" FROM "users" p WHERE c."userId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "emails" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "emails_tenantId_idx" ON "emails"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_auth_attempts') THEN
    ALTER TABLE "email_auth_attempts" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_auth_attempts_tenantId_fkey') THEN
      ALTER TABLE "email_auth_attempts" ADD CONSTRAINT "email_auth_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_auth_attempts' AND column_name='userId') THEN
      EXECUTE 'UPDATE "email_auth_attempts" c SET "tenantId" = p."tenantId" FROM "users" p WHERE c."userId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "email_auth_attempts" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "email_auth_attempts_tenantId_idx" ON "email_auth_attempts"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_drafts') THEN
    ALTER TABLE "email_drafts" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_drafts_tenantId_fkey') THEN
      ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_drafts' AND column_name='userId') THEN
      EXECUTE 'UPDATE "email_drafts" c SET "tenantId" = p."tenantId" FROM "users" p WHERE c."userId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "email_drafts" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "email_drafts_tenantId_idx" ON "email_drafts"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exames_pre_natal') THEN
    ALTER TABLE "exames_pre_natal" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'exames_pre_natal_tenantId_fkey') THEN
      ALTER TABLE "exames_pre_natal" ADD CONSTRAINT "exames_pre_natal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acompanhamento_pre_natal' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exames_pre_natal' AND column_name='preNatalId') THEN
      EXECUTE 'UPDATE "exames_pre_natal" c SET "tenantId" = p."tenantId" FROM "acompanhamento_pre_natal" p WHERE c."preNatalId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "exames_pre_natal" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "exames_pre_natal_tenantId_idx" ON "exames_pre_natal"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'face_recognition_identities') THEN
    ALTER TABLE "face_recognition_identities" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'face_recognition_identities_tenantId_fkey') THEN
      ALTER TABLE "face_recognition_identities" ADD CONSTRAINT "face_recognition_identities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='face_recognition_identities' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "face_recognition_identities" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "face_recognition_identities" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "face_recognition_identities_tenantId_idx" ON "face_recognition_identities"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_executions') THEN
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'flow_executions_tenantId_fkey') THEN
      ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flow_executions' AND column_name='conversationId') THEN
      EXECUTE 'UPDATE "flow_executions" c SET "tenantId" = p."tenantId" FROM "conversations" p WHERE c."conversationId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "flow_executions" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "flow_executions_tenantId_idx" ON "flow_executions"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imunizacao_cidadao') THEN
    ALTER TABLE "imunizacao_cidadao" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'imunizacao_cidadao_tenantId_fkey') THEN
      ALTER TABLE "imunizacao_cidadao" ADD CONSTRAINT "imunizacao_cidadao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_saude' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='imunizacao_cidadao' AND column_name='unidadeId') THEN
      EXECUTE 'UPDATE "imunizacao_cidadao" c SET "tenantId" = p."tenantId" FROM "unidades_saude" p WHERE c."unidadeId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "imunizacao_cidadao" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "imunizacao_cidadao_tenantId_idx" ON "imunizacao_cidadao"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membros_familia') THEN
    ALTER TABLE "membros_familia" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'membros_familia_tenantId_fkey') THEN
      ALTER TABLE "membros_familia" ADD CONSTRAINT "membros_familia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cadunico_familias' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='membros_familia' AND column_name='familiaId') THEN
      EXECUTE 'UPDATE "membros_familia" c SET "tenantId" = p."tenantId" FROM "cadunico_familias" p WHERE c."familiaId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "membros_familia" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "membros_familia_tenantId_idx" ON "membros_familia"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_tenantId_fkey') THEN
      ALTER TABLE "messages" ADD CONSTRAINT "messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversationId') THEN
      EXECUTE 'UPDATE "messages" c SET "tenantId" = p."tenantId" FROM "conversations" p WHERE c."conversationId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "messages" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "messages_tenantId_idx" ON "messages"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_logs') THEN
    ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'message_logs_tenantId_fkey') THEN
      ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='message_logs' AND column_name='conversationId') THEN
      EXECUTE 'UPDATE "message_logs" c SET "tenantId" = p."tenantId" FROM "conversations" p WHERE c."conversationId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "message_logs" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "message_logs_tenantId_idx" ON "message_logs"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
    ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notification_logs_tenantId_fkey') THEN
      ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_logs' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "notification_logs" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "notification_logs" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "notification_logs_tenantId_idx" ON "notification_logs"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'official_channels') THEN
    ALTER TABLE "official_channels" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'official_channels_tenantId_fkey') THEN
      ALTER TABLE "official_channels" ADD CONSTRAINT "official_channels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='official_channels' AND column_name='departmentId') THEN
      EXECUTE 'UPDATE "official_channels" c SET "tenantId" = p."tenantId" FROM "departments" p WHERE c."departmentId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "official_channels" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "official_channels_tenantId_idx" ON "official_channels"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos_beneficio') THEN
    ALTER TABLE "pagamentos_beneficio" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pagamentos_beneficio_tenantId_fkey') THEN
      ALTER TABLE "pagamentos_beneficio" ADD CONSTRAINT "pagamentos_beneficio_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inscricoes_programas_sociais' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagamentos_beneficio' AND column_name='inscricaoId') THEN
      EXECUTE 'UPDATE "pagamentos_beneficio" c SET "tenantId" = p."tenantId" FROM "inscricoes_programas_sociais" p WHERE c."inscricaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "pagamentos_beneficio" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "pagamentos_beneficio_tenantId_idx" ON "pagamentos_beneficio"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parecer_regulacao_tfd') THEN
    ALTER TABLE "parecer_regulacao_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'parecer_regulacao_tfd_tenantId_fkey') THEN
      ALTER TABLE "parecer_regulacao_tfd" ADD CONSTRAINT "parecer_regulacao_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parecer_regulacao_tfd' AND column_name='solicitacaoId') THEN
      EXECUTE 'UPDATE "parecer_regulacao_tfd" c SET "tenantId" = p."tenantId" FROM "solicitacoes_tfd" p WHERE c."solicitacaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "parecer_regulacao_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "parecer_regulacao_tfd_tenantId_idx" ON "parecer_regulacao_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'participantes_atividades') THEN
    ALTER TABLE "participantes_atividades" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'participantes_atividades_tenantId_fkey') THEN
      ALTER TABLE "participantes_atividades" ADD CONSTRAINT "participantes_atividades_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participantes_atividades' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "participantes_atividades" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "participantes_atividades" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "participantes_atividades_tenantId_idx" ON "participantes_atividades"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'passageiro_viagem_tfd') THEN
    ALTER TABLE "passageiro_viagem_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'passageiro_viagem_tfd_tenantId_fkey') THEN
      ALTER TABLE "passageiro_viagem_tfd" ADD CONSTRAINT "passageiro_viagem_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='passageiro_viagem_tfd' AND column_name='solicitacaoId') THEN
      EXECUTE 'UPDATE "passageiro_viagem_tfd" c SET "tenantId" = p."tenantId" FROM "solicitacoes_tfd" p WHERE c."solicitacaoId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "passageiro_viagem_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "passageiro_viagem_tfd_tenantId_idx" ON "passageiro_viagem_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prestacao_contas_tfd') THEN
    ALTER TABLE "prestacao_contas_tfd" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'prestacao_contas_tfd_tenantId_fkey') THEN
      ALTER TABLE "prestacao_contas_tfd" ADD CONSTRAINT "prestacao_contas_tfd_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='viagens_tfd' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prestacao_contas_tfd' AND column_name='viagemId') THEN
      EXECUTE 'UPDATE "prestacao_contas_tfd" c SET "tenantId" = p."tenantId" FROM "viagens_tfd" p WHERE c."viagemId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "prestacao_contas_tfd" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "prestacao_contas_tfd_tenantId_idx" ON "prestacao_contas_tfd"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proactive_notifications') THEN
    ALTER TABLE "proactive_notifications" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'proactive_notifications_tenantId_fkey') THEN
      ALTER TABLE "proactive_notifications" ADD CONSTRAINT "proactive_notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proactive_notifications' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "proactive_notifications" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "proactive_notifications" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "proactive_notifications_tenantId_idx" ON "proactive_notifications"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problemas_condicoes') THEN
    ALTER TABLE "problemas_condicoes" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'problemas_condicoes_tenantId_fkey') THEN
      ALTER TABLE "problemas_condicoes" ADD CONSTRAINT "problemas_condicoes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citizens' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='problemas_condicoes' AND column_name='citizenId') THEN
      EXECUTE 'UPDATE "problemas_condicoes" c SET "tenantId" = p."tenantId" FROM "citizens" p WHERE c."citizenId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "problemas_condicoes" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "problemas_condicoes_tenantId_idx" ON "problemas_condicoes"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'protocol_citizen_links') THEN
    ALTER TABLE "protocol_citizen_links" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'protocol_citizen_links_tenantId_fkey') THEN
      ALTER TABLE "protocol_citizen_links" ADD CONSTRAINT "protocol_citizen_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocols_simplified' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocol_citizen_links' AND column_name='protocolId') THEN
      EXECUTE 'UPDATE "protocol_citizen_links" c SET "tenantId" = p."tenantId" FROM "protocols_simplified" p WHERE c."protocolId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "protocol_citizen_links" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "protocol_citizen_links_tenantId_idx" ON "protocol_citizen_links"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_performance') THEN
    ALTER TABLE "server_performance" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'server_performance_tenantId_fkey') THEN
      ALTER TABLE "server_performance" ADD CONSTRAINT "server_performance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='server_performance' AND column_name='userId') THEN
      EXECUTE 'UPDATE "server_performance" c SET "tenantId" = p."tenantId" FROM "users" p WHERE c."userId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "server_performance" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "server_performance_tenantId_idx" ON "server_performance"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specialized_pages') THEN
    ALTER TABLE "specialized_pages" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'specialized_pages_tenantId_fkey') THEN
      ALTER TABLE "specialized_pages" ADD CONSTRAINT "specialized_pages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='specialized_pages' AND column_name='departmentId') THEN
      EXECUTE 'UPDATE "specialized_pages" c SET "tenantId" = p."tenantId" FROM "departments" p WHERE c."departmentId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "specialized_pages" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "specialized_pages_tenantId_idx" ON "specialized_pages"("tenantId");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_departments') THEN
    ALTER TABLE "user_departments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_departments_tenantId_fkey') THEN
      ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenantId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_departments' AND column_name='userId') THEN
      EXECUTE 'UPDATE "user_departments" c SET "tenantId" = p."tenantId" FROM "users" p WHERE c."userId" = p."id" AND c."tenantId" IS NULL AND p."tenantId" IS NOT NULL';
    END IF;
    -- fallback: default para linhas que sobraram (pai sem tenant)
    IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
      EXECUTE 'UPDATE "user_departments" SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL';
    END IF;
    CREATE INDEX IF NOT EXISTS "user_departments_tenantId_idx" ON "user_departments"("tenantId");
  END IF;
END $$;
