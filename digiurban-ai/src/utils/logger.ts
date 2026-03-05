type LogMeta = Record<string, unknown> | undefined;

function print(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: LogMeta): void {
  const payload = {
    timestamp: new Date().toISOString(),
    service: 'digiurban-ai',
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  if (level === 'ERROR') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'WARN') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

const logger = {
  info: (message: string, meta?: LogMeta) => print('INFO', message, meta),
  warn: (message: string, meta?: LogMeta) => print('WARN', message, meta),
  error: (message: string, meta?: LogMeta) => print('ERROR', message, meta),
};

export default logger;
