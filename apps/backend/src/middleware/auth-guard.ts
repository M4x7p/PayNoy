import { FastifyPluginAsync } from 'fastify';
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

export const authGuard: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            // 1. Extract token from httpOnly cookie
            const token = request.cookies.paynoi_token;

            if (!token) {
                return reply.status(401).send({ error: 'Unauthorized', message: 'No session cookie' });
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
                    secure: true, // Required for SameSite=None
                    sameSite: 'none', // Cross-origin: frontend (Vercel) ↔ backend (Railway)
                    maxAge: 24 * 60 * 60, // 24 hours
                });
            }

        } catch (err: any) {
            logger.warn({ err: err.message }, 'Auth guard failed');
            return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session' });
        }
    });
};
