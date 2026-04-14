import pino from 'pino';

export const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
        process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    base: { service: 'paynoy-backend' },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = pino.Logger;
