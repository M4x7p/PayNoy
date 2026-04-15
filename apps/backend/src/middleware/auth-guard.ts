import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { verifyToken, signToken, shouldRefresh, JwtPayload } from '../lib/jwt';
import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../lib/logger';

// Augment FastifyRequest to include user and user details (cached)
declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
        dbUser?: any; // To avoid refetching in onboarding-guard
    }
}

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            // 1. Extract token from httpOnly cookie
            const token = request.cookies.paynoi_token;

            if (!token) {
                reply.status(401).send({ error: 'Unauthorized', message: 'No session cookie' });
                return;
            }

            // 2. Verify token
            const decoded = verifyToken(token);
            request.user = decoded;

            // 3. Sliding Session: Auto-renew if expiring soon (< 6 hours)
            if (shouldRefresh(decoded)) {
                logger.info({ userId: decoded.id }, 'Sliding session: renewing JWT token');
                const newToken = signToken({ id: decoded.id, discord_id: decoded.discord_id });

                reply.setCookie('paynoi_token', newToken, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 24 * 60 * 60,
                });
            }

        } catch (err: any) {
            logger.warn({ err: err.message }, 'Auth guard: JWT verification failed');
            reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session' });
            return;
        }
    });
};

export const authGuard = fp(authGuardPlugin);
