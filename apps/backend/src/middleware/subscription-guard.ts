import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../lib/logger';

/**
 * Subscription guard middleware.
 * Checks that the server's subscription is active before allowing API access.
 * Applied to routes that require an active subscription.
 */
export const subscriptionGuard: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', async (request, reply) => {
        const body = request.body as { server_id?: string } | undefined;
        const serverId = body?.server_id;

        if (!serverId) {
            // Routes without server_id don't need subscription check
            return;
        }

        const db = getSupabaseClient();
        const { data: subscription, error } = await db
            .from('subscriptions')
            .select('status')
            .eq('server_id', serverId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found
            logger.error({ err: error, serverId }, 'Error checking subscription');
            return reply.status(500).send({ error: 'Internal server error' });
        }

        // If no subscription exists, it defaults to free plan — allow access
        if (!subscription) return;

        if (subscription.status !== 'active') {
            logger.warn({ serverId, status: subscription.status }, 'Subscription inactive');
            return reply.status(403).send({
                error: 'Subscription inactive',
                message: 'Your server subscription is not active. Please renew to continue.',
            });
        }
    });
};
