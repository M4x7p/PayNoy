import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { verifyToken } from '../lib/jwt';
import { logger } from '../lib/logger';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
    // Middleware to verify JWT from cookie
    fastify.addHook('preHandler', async (request, reply) => {
        const token = request.cookies.paynoi_token;
        if (!token) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        try {
            const payload = verifyToken(token);
            (request as any).user = payload;
        } catch (err) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
    });

    /**
     * Get current user profile and their guild cache
     */
    fastify.get('/api/me', async (request, reply) => {
        const user = (request as any).user;
        const db = getSupabaseClient();

        const { data, error } = await db
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            logger.error({ err: error.message, userId: user.id }, 'Failed to fetch user profile');
            return reply.status(500).send({ error: 'Failed to fetch profile' });
        }

        // Return user data along with their guilds_cache
        return data;
    });

    /**
     * Get detailed info for a specific server (including products)
     */
    fastify.get('/api/server/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = (request as any).user;
        const db = getSupabaseClient();

        // Fetch server and its products
        // Ensure the requester is the owner
        const { data: server, error } = await db
            .from('servers')
            .select(`
                *,
                products (
                    *
                )
            `)
            .eq('discord_guild_id', id)
            .eq('owner_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return reply.status(404).send({ error: 'Server not found or you are not the owner' });
            }
            logger.error({ err: error.message, guildId: id }, 'Failed to fetch server details');
            return reply.status(500).send({ error: 'Internal server error' });
        }

        return server;
    });

    /**
     * Get orders for a specific server (with pagination)
     */
    fastify.get('/api/orders', async (request, reply) => {
        const { guildId, page = 1, limit = 10 } = request.query as { guildId: string, page?: number, limit?: number };
        const user = (request as any).user;
        const db = getSupabaseClient();

        // Ensure owner
        const { data: server, error: serverError } = await db
            .from('servers')
            .select('id')
            .eq('discord_guild_id', guildId)
            .eq('owner_id', user.id)
            .single();

        if (serverError) {
            return reply.status(403).send({ error: 'Unauthorized' });
        }

        const offset = (page - 1) * limit;

        const { data: orders, error, count } = await db
            .from('orders')
            .select('*, products(name)', { count: 'exact' })
            .eq('server_id', server.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error({ err: error.message }, 'Failed to fetch orders');
            return reply.status(500).send({ error: 'Internal server error' });
        }

        return {
            orders,
            total: count || 0,
            page,
            limit
        };
    });

    /**
     * Update server settings (PromptPay)
     */
    fastify.post('/api/server/:id/settings', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { promptpay_name, promptpay_account } = request.body as { promptpay_name: string; promptpay_account: string };
        const user = (request as any).user;
        const db = getSupabaseClient();

        // Update settings
        const { error } = await db
            .from('servers')
            .update({
                promptpay_name,
                promptpay_account
            })
            .eq('discord_guild_id', id)
            .eq('owner_id', user.id);

        if (error) {
            logger.error({ err: error.message, guildId: id }, 'Failed to update server settings');
            return reply.status(500).send({ error: 'Failed to save settings' });
        }

        // Also mark user as onboarded if they are not already
        await db.from('users').update({ onboarded: true }).eq('id', user.id);

        return { success: true };
    });
};
