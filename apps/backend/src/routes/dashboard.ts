import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../lib/logger';
import { authGuard } from '../middleware/auth-guard';
import { onboardingGuard } from '../middleware/onboarding-guard';
import { serverOwnerGuard } from '../middleware/server-owner-guard';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
    // Top-level prefix context for all dashboard routes
    await app.register(async (protectedApp) => {
        // Register guards
        await protectedApp.register(authGuard);
        await protectedApp.register(onboardingGuard); // Blocks access if not onboarded (with allowlist)

        // ---------------------------------------------------------
        // 1. User Profile & Onboarding
        // ---------------------------------------------------------

        protectedApp.get('/me', async (request, reply) => {
            const user = request.dbUser || request.user;

            // Re-fetch to guarantee freshness if dbUser isn't cached
            const db = getSupabaseClient();
            const { data: dbData } = await db
                .from('users')
                .select('id, discord_id, username, avatar, onboarded')
                .eq('id', request.user!.id)
                .single();

            return reply.send({ user: dbData });
        });

        protectedApp.post('/onboarding/complete', async (request, reply) => {
            const db = getSupabaseClient();
            await db.from('users').update({ onboarded: true }).eq('id', request.user!.id);
            return reply.send({ success: true });
        });

        // ---------------------------------------------------------
        // 2. Guilds & Bot Checks
        // ---------------------------------------------------------

        // Helper to refresh guilds and bot status from Discord
        async function refreshGuilds(userId: string) {
            // Because we don't store tokens, we can't fetch on behalf of the user easily if token is gone.
            // Wait, we decided NOT to store tokens. If we don't store the user's token, we CANNOT fetch 
            // `users/@me/guilds` later in a background job or refresh automatically!
            // Ephemeral tokens means guilds are frozen at login time.

            // However, we CAN check if the bot is present in the cached guilds live.
            const db = getSupabaseClient();
            const { data } = await db.from('users').select('guilds_cache').eq('id', userId).single();
            if (!data) return [];

            const cachedGuilds = data.guilds_cache || [];

            // Check bot status for each
            const botToken = process.env.DISCORD_BOT_TOKEN;
            const updatedGuilds = await Promise.all(
                cachedGuilds.map(async (guild: any) => {
                    let botPresent = false;
                    try {
                        const botUserRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
                            headers: { Authorization: `Bot ${botToken}` }
                        });
                        const botData: any = await botUserRes.json();

                        const memberRes = await fetch(`${DISCORD_API_BASE}/guilds/${guild.id}/members/${botData.id}`, {
                            headers: { Authorization: `Bot ${botToken}` }
                        });
                        botPresent = memberRes.ok;
                    } catch (e) {
                        logger.error({ guildId: guild.id }, 'Failed to check bot status');
                    }
                    return { ...guild, bot_present: botPresent };
                })
            );

            // Update cache timestamp
            await db.from('users').update({ guilds_cache_updated_at: new Date().toISOString() }).eq('id', userId);

            return updatedGuilds;
        }

        protectedApp.get('/guilds', async (request, reply) => {
            const db = getSupabaseClient();
            const { data } = await db
                .from('users')
                .select('guilds_cache, guilds_cache_updated_at')
                .eq('id', request.user!.id)
                .single();

            const lastUpdated = data?.guilds_cache_updated_at ? new Date(data.guilds_cache_updated_at).getTime() : 0;
            const now = Date.now();
            const tenMinutes = 10 * 60 * 1000;

            // TTL check
            if (now - lastUpdated > tenMinutes) {
                const updated = await refreshGuilds(request.user!.id);
                return reply.send({ guilds: updated });
            }

            // Return cache + we ideally should check bot_present live, but we'll trust the 10 min cache
            return reply.send({ guilds: data?.guilds_cache || [] });
        });

        protectedApp.get('/guilds/refresh', async (request, reply) => {
            const updated = await refreshGuilds(request.user!.id);
            return reply.send({ guilds: updated });
        });

        // ---------------------------------------------------------
        // 3. Server Management (Requires serverOwnerGuard)
        // ---------------------------------------------------------

        protectedApp.register(async (serverApp) => {
            // Apply owner guard to all routes in this block
            serverApp.register(serverOwnerGuard);

            serverApp.get('/server/:id', async (request, reply) => {
                const { id } = request.params as { id: string };
                const db = getSupabaseClient();

                const { data: server } = await db.from('servers').select('*').eq('id', id).single();
                return reply.send({ server });
            });

            serverApp.post('/server/:id/settings', async (request, reply) => {
                const { id } = request.params as { id: string };
                const { promptpay_name, promptpay_account, support_channel_id } = request.body as any;

                const db = getSupabaseClient();
                await db.from('servers').update({ promptpay_name, promptpay_account, support_channel_id }).eq('id', id);
                return reply.send({ success: true });
            });

            // -----------------------------------------------------
            // Products CRUD
            // -----------------------------------------------------

            serverApp.get('/server/:id/products', async (request, reply) => {
                const { id } = request.params as { id: string };
                const db = getSupabaseClient();
                const { data: products } = await db.from('products').select('*').eq('server_id', id).order('created_at', { ascending: false });
                return reply.send({ products });
            });

            serverApp.post('/server/:id/products', async (request, reply) => {
                const { id } = request.params as { id: string };
                const payload = request.body as any;
                const db = getSupabaseClient();

                const { data: product, error } = await db.from('products').insert({
                    server_id: id,
                    name: payload.name,
                    price: payload.price,
                    role_id: payload.role_id,
                    embed_json: payload.embed_json || {},
                    button_config: payload.button_config || {}
                }).select().single();

                if (error) return reply.status(400).send({ error: error.message });
                return reply.status(201).send({ product });
            });

            serverApp.put('/server/:id/products/:pid', async (request, reply) => {
                const { id, pid } = request.params as { id: string; pid: string };
                const payload = request.body as any;
                const db = getSupabaseClient();

                const { data: product, error } = await db.from('products').update({
                    name: payload.name,
                    price: payload.price,
                    role_id: payload.role_id,
                    embed_json: payload.embed_json,
                    button_config: payload.button_config
                }).eq('id', pid).eq('server_id', id).select().single();

                if (error) return reply.status(400).send({ error: error.message });
                return reply.send({ product });
            });

            serverApp.delete('/server/:id/products/:pid', async (request, reply) => {
                const { id, pid } = request.params as { id: string; pid: string };
                const db = getSupabaseClient();
                await db.from('products').delete().eq('id', pid).eq('server_id', id);
                return reply.send({ success: true });
            });

            // -----------------------------------------------------
            // Orders
            // -----------------------------------------------------

            serverApp.get('/server/:id/orders', async (request, reply) => {
                const { id } = request.params as { id: string };
                const { page = 1, limit = 20 } = request.query as any;

                const db = getSupabaseClient();
                const from = (page - 1) * limit;
                const to = from + limit - 1;

                const { data: orders, count } = await db
                    .from('orders')
                    .select('*, products(name)', { count: 'exact' })
                    .eq('server_id', id)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                return reply.send({ orders, total: count, page, limit });
            });
        });
    }, { prefix: '/api' });
};
