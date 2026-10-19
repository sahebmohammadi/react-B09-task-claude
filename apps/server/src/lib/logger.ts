import { pino } from 'pino';
import { env } from '../config/env';

// Readable one-line logs while developing; JSON everywhere else so log tools can parse it.
const devTransport = {
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
};

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? devTransport : undefined,
});
