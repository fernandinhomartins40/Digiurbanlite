/**
 * Configurações de Segurança Centralizadas
 * Todas as constantes de segurança do sistema
 */

export const SECURITY_CONFIG = {
  /**
   * Bcrypt - Rounds de hashing de senha
   * Recomendação OWASP 2024: 12 rounds
   * Mais rounds = mais seguro mas mais lento
   */
  BCRYPT_ROUNDS: 12,

  /**
   * JWT - Tempo de expiração dos tokens
   */
  JWT: {
    // Admin: 1 hora (recomendado para maior segurança)
    ADMIN_EXPIRES_IN: '1h',

    // Cidadão: 8 horas (balance entre UX e segurança)
    CITIZEN_EXPIRES_IN: '8h',

    // Super Admin: 30 minutos (máxima segurança para privilégios elevados)
    SUPER_ADMIN_EXPIRES_IN: '30m',

    // Refresh token: 7 dias (futuro)
    REFRESH_EXPIRES_IN: '7d'
        },

  /**
   * Rate Limiting - Proteção contra brute force
   */
  RATE_LIMIT: {
    // Janela de tempo em milissegundos
    WINDOW_MS: 5 * 60 * 1000, // 5 minutos

    // Máximo de tentativas por janela
    // ✅ CORRIGIDO: Ajustado para produção (era 50 no modo teste)
    MAX_ATTEMPTS: process.env.NODE_ENV === 'production' ? 10 : 50,

    // Mensagem de erro
    MESSAGE: 'Muitas tentativas. Tente novamente em 5 minutos.'
        },

  /**
   * Account Lockout - Bloqueio de conta
   */
  ACCOUNT_LOCKOUT: {
    // Máximo de tentativas falhas antes de bloquear
    MAX_FAILED_ATTEMPTS: 5,

    // Tempo de bloqueio em minutos
    LOCKOUT_DURATION_MINUTES: 30,

    // Resetar contador após sucesso
    RESET_ON_SUCCESS: true
        },

  /**
   * Password Policy - Política de senhas
   */
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*(),.?":{}|<>',

    // Password History (futuro)
    HISTORY_COUNT: 5,
    EXPIRY_DAYS: 90, // Opcional para admins
  },

  /**
   * Session Management
   */
  SESSION: {
    // Timeout de inatividade em minutos
    INACTIVITY_TIMEOUT_MINUTES: 30,

    // Renovar sessão automaticamente
    AUTO_RENEW: true
        },

  /**
   * Audit Log - Registro de auditoria
   */
  AUDIT: {
    // Eventos críticos que devem ser registrados
    CRITICAL_EVENTS: [
      'login',
      'logout',
      'failed_login',
      'password_change',
      'password_reset',
      'account_locked',
      'account_unlocked',
      'permission_change',
      'data_export',
      'sensitive_data_access',
    ],

    // Retenção de logs em dias (LGPD: mínimo 6 meses)
    RETENTION_DAYS: 365
        },

  /**
   * CORS Configuration
   */
  CORS: {
    ALLOWED_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    CREDENTIALS: true,
    MAX_AGE: 86400, // 24 horas
  },

  /**
   * Data Protection (LGPD)
   */
  LGPD: {
    // Campos sensíveis que devem ser criptografados
    SENSITIVE_FIELDS: ['cpf', 'rg', 'birthDate', 'phone'],

    // Campos que devem ter log de acesso
    AUDIT_ACCESS_FIELDS: ['cpf', 'email', 'phone', 'address']
        }
        } as const;

/**
 * Validação de senha forte
 * Retorna objeto com resultado e erros específicos
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
} {
  const errors: string[] = [];
  let strengthScore = 0;

  // Validações obrigatórias
  if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} caracteres`);
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (password.length >= 16) strengthScore += 1;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    strengthScore += 1;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    strengthScore += 1;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  } else {
    strengthScore += 1;
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL) {
    const specialChars = SECURITY_CONFIG.PASSWORD.SPECIAL_CHARS;
    const hasSpecial = specialChars.split('').some(char => password.includes(char));
    if (!hasSpecial) {
      errors.push(`Senha deve conter pelo menos um caractere especial (${specialChars})`);
    } else {
      strengthScore += 1;
    }
  }

  // Determinar força
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (strengthScore >= 6) strength = 'very-strong';
  else if (strengthScore >= 5) strength = 'strong';
  else if (strengthScore >= 3) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength
        };
}

/**
 * Exportar constantes individuais para facilitar imports
 */
export const { BCRYPT_ROUNDS, JWT, RATE_LIMIT, ACCOUNT_LOCKOUT, PASSWORD, SESSION, AUDIT, CORS, LGPD } = SECURITY_CONFIG;
