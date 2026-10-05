-- E-mail da equipe DigiUrban que recebe avisos de leads/contato (configurado no painel)
ALTER TABLE "transactional_mail_settings" ADD COLUMN IF NOT EXISTS "teamEmail" TEXT;
