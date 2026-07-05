import pino from 'pino';

export function createLogger(level: string = 'info') {
  return pino({
    level,
    redact: {
      paths: ['req.headers.authorization', 'apiKey', 'password'],
      remove: true,
    },
  });
}
