-- Criar tabelas de planos de email

-- 1. EmailPlanConfig
CREATE TABLE IF NOT EXISTS email_plan_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  max_emails_per_month INTEGER NOT NULL,
  max_accounts INTEGER NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. EmailPlanAllowedDomain
CREATE TABLE IF NOT EXISTS email_plan_allowed_domains (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES email_plan_configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_domain FOREIGN KEY (domain_id) REFERENCES email_domains(id) ON DELETE CASCADE,
  CONSTRAINT unique_plan_domain UNIQUE (plan_id, domain_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_allowed_domains_plan ON email_plan_allowed_domains(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_allowed_domains_domain ON email_plan_allowed_domains(domain_id);

-- 3. EmailSubscription (verificar se existe primeiro)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id TEXT PRIMARY KEY,
  email_server_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  plan_config_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  monthly_price DECIMAL(10,2) NOT NULL,
  max_emails_per_month INTEGER NOT NULL,
  max_accounts INTEGER NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_ends_at TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_server FOREIGN KEY (email_server_id) REFERENCES email_servers(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_config FOREIGN KEY (plan_config_id) REFERENCES email_plan_configs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_status ON email_subscriptions(status);

-- 4. EmailInvoice
CREATE TABLE IF NOT EXISTS email_invoices (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  due_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription FOREIGN KEY (subscription_id) REFERENCES email_subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_invoices_status ON email_invoices(status);
CREATE INDEX IF NOT EXISTS idx_email_invoices_due_date ON email_invoices(due_date);

-- 5. EmailAddon
CREATE TABLE IF NOT EXISTS email_addons (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_addon FOREIGN KEY (subscription_id) REFERENCES email_subscriptions(id) ON DELETE CASCADE
);
