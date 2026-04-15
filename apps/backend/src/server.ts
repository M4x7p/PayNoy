import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './lib/logger';
import { requestIdPlugin } from './plugins/request-id';
import { subscriptionGuard } from './middleware/subscription-guard';
import { orderRoutes } from './routes/order';
import { webhookRoutes } from './routes/webhook';
import { adminRoutes } from './routes/admin';
import { serverRoutes } from './routes/server';
import { authRoutes } from './routes/auth';
import { dashboardRoutes } from './routes/dashboard';
import { startRoleAssignmentWorker } from './workers/role-assigner';
import { startExpireOrdersCron } from './cron/expire-orders';
import { startReconcilePaymentsCron } from './cron/reconcile-payments';
import { getSupabaseClient } from '@paynoy/db';
import { getRedisConnection } from './workers/queue';
import fastifyCookie from '@fastify/cookie';

// ── Build Fastify App ──────────────────────────────────────

async function buildApp() {
    const app = Fastify({
        logger: false, // We use our own Pino instance
        trustProxy: true,
    });

    // ── Global Plugins ────────────────────────────────────────

    await app.register(cors, {
        origin: process.env.DASHBOARD_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true, // Required for httpOnly cookie auth
    });

    await app.register(helmet);

    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: (request: any) => {
            // Use X-Forwarded-For or remote IP
            return request.ip;
        },
    });

    await app.register(requestIdPlugin);

    // Register cookie parser
    await app.register(fastifyCookie, {
        secret: process.env.JWT_SECRET || 'fallback-secret', // For signed cookies if ever needed
        hook: 'onRequest',
    });

    // ── Request Logging ───────────────────────────────────────

    app.addHook('onRequest', async (request: any) => {
        logger.info(
            {
                requestId: (request as any).requestId,
                method: request.method,
                url: request.url,
                ip: request.ip,
            },
            'Incoming request'
        );
    });

    app.addHook('onResponse', async (request: any, reply: any) => {
        logger.info(
            {
                requestId: (request as any).requestId,
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: reply.elapsedTime,
            },
            'Request completed'
        );
    });

    // ── Health Check ──────────────────────────────────────────

    app.get('/health', async (_request: any, reply: any) => {
        try {
            const db = getSupabaseClient();
            const redis = getRedisConnection();

            // Check DB
            const { error: dbError } = await db.from('servers').select('id').limit(1);
            if (dbError) throw new Error(`DB Error: ${dbError.message}`);

            // Check Redis
            const ping = await redis.ping();
            if (ping !== 'PONG') throw new Error('Redis ping failed');

            return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (error: any) {
            logger.error({ err: error.message }, 'Health check failed');
            return reply.status(503).send({ status: 'service_unavailable', error: error.message });
        }
    });

    // ── Webhook Routes (no subscription guard, no body parsing) ─

    await app.register(webhookRoutes);

    // ── Protected Routes ──────────────────────────────────────

    await app.register(async (protectedApp: any) => {
        await protectedApp.register(subscriptionGuard);
        await protectedApp.register(orderRoutes);
    });

    // ── Admin Routes ──────────────────────────────────────────

    await app.register(adminRoutes, { prefix: '' });
    await app.register(serverRoutes);

    // ── Dashboard & Auth Routes ───────────────────────────────

    await app.register(authRoutes);
    await app.register(dashboardRoutes, { prefix: '/api' });

    // ── Error Handler ─────────────────────────────────────────

    app.setErrorHandler((error: any, request: any, reply: any) => {
        const requestId = (request as any).requestId;

        logger.error(
            {
                requestId,
                err: error.message,
                stack: error.stack,
                statusCode: error.statusCode,
            },
            'Unhandled error'
        );

        const statusCode = error.statusCode || 500;
        reply.status(statusCode).send({
            error: statusCode >= 500 ? 'Internal server error' : error.message,
            requestId,
        });
    });

    return app;
}

// ── Start Server ───────────────────────────────────────────

async function start() {
    try {
        const app = await buildApp();
        const port = parseInt(process.env.PORT || '3001', 10);
        const host = '0.0.0.0';

        // Start BullMQ worker
        startRoleAssignmentWorker();

        // Start cron jobs
        startExpireOrdersCron();
        startReconcilePaymentsCron();

        await app.listen({ port, host });
        logger.info({ port, host }, `🚀 PayNoy backend running`);
    } catch (err) {
        logger.fatal({ err }, 'Failed to start server');
        process.exit(1);
    }
}

start();
