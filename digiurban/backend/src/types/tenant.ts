// Types específicos para campos JSON do modelo Tenant

export interface TenantLimits {
  users: number;
  protocols: number;
  services: number;
  storage?: number; // MB
  customFields?: number;
}

export interface UsageStats {
  users: number;
  protocols: number;
  services: number;
  storage?: number; // MB usado
  lastUpdated?: string; // ISO date
}

export interface TenantSettings {
  theme?: string;
  language?: string;
  timezone?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features?: {
    analytics: boolean;
    reporting: boolean;
    integrations: boolean;
  };
}

export interface TenantMetadata {
  setupCompleted?: boolean;
  lastLogin?: string;
  onboardingStep?: number;
  customData?: Record<string, unknown>;
}

// Type guards para validação segura
export function isTenantLimits(value: unknown): value is TenantLimits {
  return (
    typeof value === 'object' &&
    value !== null &&
    'users' in value &&
    'protocols' in value &&
    'services' in value &&
    typeof (value as Record<string, unknown>).users === 'number' &&
    typeof (value as Record<string, unknown>).protocols === 'number' &&
    typeof (value as Record<string, unknown>).services === 'number'
  );
}

export function isUsageStats(value: unknown): value is UsageStats {
  return (
    typeof value === 'object' &&
    value !== null &&
    'users' in value &&
    'protocols' in value &&
    'services' in value &&
    typeof (value as Record<string, unknown>).users === 'number' &&
    typeof (value as Record<string, unknown>).protocols === 'number' &&
    typeof (value as Record<string, unknown>).services === 'number'
  );
}

export function isTenantSettings(value: unknown): value is TenantSettings {
  return typeof value === 'object' && value !== null;
}

export function isTenantMetadata(value: unknown): value is TenantMetadata {
  return typeof value === 'object' && value !== null;
}

// Helper functions para criar valores padrão
export function getDefaultLimits(): TenantLimits {
  return {
    users: 5,
    protocols: 100,
    services: 10,
    storage: 1024, // 1GB
    customFields: 5
        };
}

export function getDefaultUsageStats(): UsageStats {
  return {
    users: 0,
    protocols: 0,
    services: 0,
    storage: 0,
    lastUpdated: new Date().toISOString()
        };
}

export function getDefaultSettings(): TenantSettings {
  return {
    theme: 'light',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    notifications: {
      email: true,
      sms: false,
      push: true
        },
    features: {
      analytics: true,
      reporting: true,
      integrations: false
        }
        };
}

export function getDefaultMetadata(): TenantMetadata {
  return {
    setupCompleted: false,
    onboardingStep: 0,
    customData: {}
        };
}
