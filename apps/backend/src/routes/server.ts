import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../lib/logger';

export const serverRoutes: FastifyPluginAsync = async (fastify: any) => {
    fastify.get('/server/:guildId/config', async (request: any, reply: any) => {
        const { guildId } = request.params as { guildId: string };
        const db = getSupabaseClient();

        const { data, error } = await db
            .from('servers')
            .select('support_channel_id')
            .eq('discord_guild_id', guildId)
            .single();

        if (error || !data) {
            return reply.status(404).send({ error: 'Server not found' });
        }

        return reply.send({
            support_channel_id: data.support_channel_id,
        });
    });

    // Endpoint for bot to update its channel configs directly
    fastify.post('/server/:guildId/config', async (request: any, reply: any) => {
        const { guildId } = request.params as { guildId: string };
        const { support_channel_id } = request.body as { support_channel_id: string };
        const db = getSupabaseClient();

        const { error } = await db
            .from('servers')
            .update({ support_channel_id })
            .eq('discord_guild_id', guildId);

        if (error) {
            logger.error({ err: error, guildId }, 'Failed to update server config');
            return reply.status(500).send({ error: 'Failed to update config' });
        }

        return reply.send({ status: 'ok' });
    });
};
