import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../lib/logger';

/**
 * Ensures the logged-in user is the owner of the requested server.
 * Requires `authGuard` to run first to populate `request.user`.
 * Expects the route to provide `:id` (which maps to servers.id).
 */
const serverOwnerGuardPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.user) return; // Should not happen if auth-guard is registered before

        const { id } = request.params as { id?: string };
        if (!id) {
            return reply.status(400).send({ error: 'Missing server ID in params' });
        }

        const db = getSupabaseClient();

        // Support both UUID and Discord guild ID formats
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const column = isUUID ? 'id' : 'discord_guild_id';

        const { data: server, error } = await db
            .from('servers')
            .select('id, owner_id')
            .eq(column, id)
            .single();

        if (error || !server) {
            return reply.status(404).send({ error: 'Server not found' });
        }

        // Attach resolved UUID for downstream handlers
        (request as any).serverId = server.id;

        if (server.owner_id !== request.user.id) {
            logger.warn(
                { userId: request.user.id, targetServer: id, actualOwner: server.owner_id },
                'User attempted to access a server they do not own'
            );
            return reply.status(403).send({ error: 'Forbidden', message: 'You do not own this server' });
        }
    });
};

export const serverOwnerGuard = fp(serverOwnerGuardPlugin);
