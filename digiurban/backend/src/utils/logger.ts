/**
 * Logger Utilities - Sanitização de dados sensíveis em logs
 *
 * ✅ SEGURANÇA: Previne exposição de dados sensíveis (LGPD/GDPR compliance)
 */

/**
 * Sanitiza dados para logs, removendo/mascarando informações sensíveis
 * @param data Dados a serem sanitizados
 * @returns Dados sanitizados seguros para logging
 */
export const sanitizeForLog = (data: any): any => {
  if (!data) return data;

  // Evitar modificar o objeto original
  if (typeof data !== 'object') return data;

  // Clonar objeto para não modificar o original
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  // Lista de campos sensíveis a serem removidos/mascarados
  const sensitiveFields = [
    'password',
    'oldPassword',
    'newPassword',
    'currentPassword',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
    'apiKey',
    'privateKey',
  ];

  // Percorrer todos os campos
  for (const key in sanitized) {
    if (!sanitized.hasOwnProperty(key)) continue;

    const lowerKey = key.toLowerCase();

    // Remover completamente campos de senha
    if (lowerKey.includes('password')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Mascarar tokens (manter apenas início e fim)
    if (lowerKey.includes('token') && typeof sanitized[key] === 'string') {
      const tokenValue = sanitized[key];
      if (tokenValue.length > 20) {
        sanitized[key] = `${tokenValue.substring(0, 10)}...${tokenValue.substring(tokenValue.length - 10)}`;
      } else {
        sanitized[key] = '[TOKEN_REDACTED]';
      }
      continue;
    }

    // Mascarar email parcialmente (preservar domínio para debug)
    if (lowerKey === 'email' && typeof sanitized[key] === 'string') {
      const email = sanitized[key];
      const [user, domain] = email.split('@');
      if (user && domain) {
        const visibleChars = Math.min(2, user.length);
        sanitized[key] = `${user.substring(0, visibleChars)}***@${domain}`;
      }
      continue;
    }

    // Mascarar CPF (mostrar apenas primeiros 3 dígitos)
    if (lowerKey === 'cpf' && typeof sanitized[key] === 'string') {
      const cpf = sanitized[key];
      sanitized[key] = `${cpf.substring(0, 3)}.***.***-**`;
      continue;
    }

    // Mascarar telefone (mostrar apenas DDD)
    if ((lowerKey === 'phone' || lowerKey === 'telefone') && typeof sanitized[key] === 'string') {
      const phone = sanitized[key];
      if (phone.length >= 2) {
        sanitized[key] = `(${phone.substring(0, 2)}) *****-****`;
      }
      continue;
    }

    // Remover campos sensíveis genéricos
    if (sensitiveFields.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursivamente sanitizar objetos aninhados
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Logger wrapper que sanitiza automaticamente
 * @param message Mensagem de log
 * @param data Dados a serem logados (serão sanitizados)
 */
export const safeLog = (message: string, data?: any): void => {
  if (data) {
    console.log(message, sanitizeForLog(data));
  } else {
    console.log(message);
  }
};

/**
 * Logger de erro wrapper que sanitiza automaticamente
 * @param message Mensagem de erro
 * @param error Erro ou dados a serem logados
 */
export const safeError = (message: string, error?: any): void => {
  if (error) {
    // Se for um objeto Error, preservar stack trace mas sanitizar dados
    if (error instanceof Error) {
      console.error(message, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.cause ? { cause: sanitizeForLog(error.cause) } : {})
        });
    } else {
      console.error(message, sanitizeForLog(error));
    }
  } else {
    console.error(message);
  }
};

/**
 * Exemplos de uso:
 *
 * // Antes (INSEGURO):
 * console.log('Login attempt:', { email, password });
 *
 * // Depois (SEGURO):
 * safeLog('Login attempt:', { email, password });
 * // Output: Login attempt: { email: 'jo***@example.com', password: '[REDACTED]' }
 *
 * // Ou usar diretamente sanitizeForLog:
 * console.log('Login attempt:', sanitizeForLog({ email, password }));
 */
