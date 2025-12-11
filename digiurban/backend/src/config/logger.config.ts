/**
 * 📝 Sistema de Logging Profissional - Winston
 *
 * ✅ Logs estruturados com níveis (error, warn, info, debug)
 * ✅ Persistência em arquivos rotativos (7 dias de histórico)
 * ✅ Logs separados por tipo (error.log, combined.log)
 * ✅ Formato JSON para parsing fácil
 * ✅ Timestamp e metadata automática
 * ✅ Sanitização de dados sensíveis
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Diretório de logs
const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

// 🔧 CRÍTICO: Criar diretório de logs se não existir (evitar crash no Docker)
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
    console.log(`✅ Diretório de logs criado: ${logsDir}`);
  }
} catch (error) {
  console.warn(`⚠️ Não foi possível criar diretório de logs: ${error}`);
  console.warn('   Continuando sem persistência de logs em arquivo...');
}

/**
 * Formatar erro com stack trace completo
 */
const errorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      level: info.level,
      message: info.message,
      stack: info.stack,
      timestamp: new Date().toISOString()
    };
  }

  if (info.error instanceof Error) {
    info.error = {
      message: info.error.message,
      stack: info.error.stack,
      name: info.error.name
    };
  }

  return info;
});

/**
 * Sanitizar dados sensíveis antes de logar
 */
const sanitizeFormat = winston.format((info) => {
  const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'apiKey'];

  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitize(sanitized[key]);
      }
    }

    return sanitized;
  };

  return sanitize(info);
});

/**
 * Configuração de transporte para arquivos rotativos de ERRO
 */
let errorFileTransport: DailyRotateFile | null = null;
let combinedFileTransport: DailyRotateFile | null = null;
let httpFileTransport: DailyRotateFile | null = null;

try {
  errorFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '7d', // Manter 7 dias de logs
    format: winston.format.combine(
      winston.format.timestamp(),
      errorFormat(),
      sanitizeFormat(),
      winston.format.json()
    )
  });

  /**
   * Configuração de transporte para arquivos rotativos COMBINADOS
   */
  combinedFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    format: winston.format.combine(
      winston.format.timestamp(),
      errorFormat(),
      sanitizeFormat(),
      winston.format.json()
    )
  });

  /**
   * Configuração de transporte para arquivos rotativos HTTP
   */
  httpFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '50m',
    maxFiles: '3d', // Logs HTTP são volumosos, manter apenas 3 dias
    format: winston.format.combine(
      winston.format.timestamp(),
      sanitizeFormat(),
      winston.format.json()
    )
  });
} catch (error) {
  console.error('❌ Erro ao criar transporte de logs para arquivos:', error);
  console.warn('⚠️ Continuando apenas com logs no console...');
}

/**
 * Configuração de transporte para console (desenvolvimento)
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;

      // Adicionar metadata se existir
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }

      return msg;
    })
  )
});

/**
 * Logger principal
 */
const transports: winston.transport[] = [consoleTransport];
if (errorFileTransport) transports.push(errorFileTransport);
if (combinedFileTransport) transports.push(combinedFileTransport);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  // Tratamento de exceções não capturadas (opcional se logs de arquivo falharam)
  exceptionHandlers: errorFileTransport ? [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ] : [consoleTransport],
  // Tratamento de promises rejeitadas não tratadas (opcional se logs de arquivo falharam)
  rejectionHandlers: errorFileTransport ? [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ] : [consoleTransport]
});

/**
 * Logger específico para requisições HTTP
 */
const httpTransports: winston.transport[] = [consoleTransport];
if (httpFileTransport) httpTransports.push(httpFileTransport);

export const httpLogger = winston.createLogger({
  level: 'info',
  transports: httpTransports
});

/**
 * Helper functions para logging estruturado
 */
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  http: (message: string, meta?: any) => {
    httpLogger.info(message, meta);
  }
};

/**
 * Logging de requisições HTTP com contexto completo
 */
export const logRequest = (req: any, statusCode?: number, responseTime?: number) => {
  httpLogger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
};

/**
 * Logging de erros com contexto completo
 */
export const logError = (error: Error, req?: any, additionalContext?: any) => {
  logger.error('Application Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: req ? {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userId: req.user?.id
    } : undefined,
    ...additionalContext,
    timestamp: new Date().toISOString()
  });
};

// Log de inicialização
logger.info('Logger configurado com sucesso', {
  logsDir,
  level: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development'
});

export default logger;
