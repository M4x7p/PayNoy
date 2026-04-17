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
            const { guild_id, guild_name, promptpay_name, promptpay_account } = request.body as {
                guild_id: string;
                guild_name: string;
                promptpay_name: string;
                promptpay_account: string;
            };

            if (!guild_id || !promptpay_name || !promptpay_account) {
                return reply.status(400).send({ error: 'Missing required fields: guild_id, promptpay_name, promptpay_account' });
            }

            const db = getSupabaseClient();
            const userId = request.user!.id;

            // 1. Upsert server record (create if not exists, update if exists)
            const { error: serverError } = await db.from('servers').upsert({
                discord_guild_id: guild_id,
                owner_id: userId,
                promptpay_name,
                promptpay_account,
            }, { onConflict: 'discord_guild_id' });

            if (serverError) {
                logger.error({ err: serverError, guildId: guild_id }, 'Failed to upsert server during onboarding');
                return reply.status(500).send({ error: 'Failed to create server', detail: serverError.message });
            }

            // 2. Mark user as onboarded
            const { error: userError } = await db.from('users').update({ onboarded: true }).eq('id', userId);

            if (userError) {
                logger.error({ err: userError, userId }, 'Failed to mark user as onboarded');
                return reply.status(500).send({ error: 'Failed to complete onboarding' });
            }

            logger.info({ userId, guildId: guild_id }, 'Onboarding completed');
            return reply.send({ success: true });
        });

        // ---------------------------------------------------------
        // 2. Guilds & Bot Checks
        // ---------------------------------------------------------

        // Helper to refresh guilds and bot status from Discord
        async function refreshGuilds(userId: string) {
            const db = getSupabaseClient();
            const { data } = await db.from('users').select('guilds_cache').eq('id', userId).single();
            if (!data) return [];

            const cachedGuilds = data.guilds_cache || [];

            // Check bot status for each guild using the bot token
            const botToken = process.env.DISCORD_BOT_TOKEN;
            if (!botToken) {
                logger.warn('DISCORD_BOT_TOKEN not set — cannot check bot presence');
                return cachedGuilds.map((g: any) => ({ ...g, bot_present: false }));
            }

            const updatedGuilds = await Promise.all(
                cachedGuilds.map(async (guild: any) => {
                    let botPresent = false;
                    try {
                        // Simple check: if the bot can fetch the guild, it's a member
                        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guild.id}`, {
                            headers: { Authorization: `Bot ${botToken}` }
                        });
                        botPresent = res.ok;
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
                const serverId = (request as any).serverId;
                const db = getSupabaseClient();

                const { data: server } = await db.from('servers').select('*').eq('id', serverId).single();
                return reply.send({ server });
            });

            serverApp.post('/server/:id/settings', async (request, reply) => {
                const serverId = (request as any).serverId;
                const { promptpay_name, promptpay_account, support_channel_id } = request.body as any;

                const db = getSupabaseClient();
                await db.from('servers').update({ promptpay_name, promptpay_account, support_channel_id }).eq('id', serverId);
                return reply.send({ success: true });
            });

            // -----------------------------------------------------
            // Products CRUD
            // -----------------------------------------------------

            serverApp.get('/server/:id/products', async (request, reply) => {
                const serverId = (request as any).serverId;
                const db = getSupabaseClient();
                const { data: products } = await db.from('products').select('*').eq('server_id', serverId).order('created_at', { ascending: false });
                return reply.send({ products });
            });

            serverApp.post('/server/:id/products', async (request, reply) => {
                const serverId = (request as any).serverId;
                const payload = request.body as any;
                const db = getSupabaseClient();

                const { data: product, error } = await db.from('products').insert({
                    server_id: serverId,
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
                const serverId = (request as any).serverId;
                const { pid } = request.params as { id: string; pid: string };
                const payload = request.body as any;
                const db = getSupabaseClient();

                const { data: product, error } = await db.from('products').update({
                    name: payload.name,
                    price: payload.price,
                    role_id: payload.role_id,
                    embed_json: payload.embed_json,
                    button_config: payload.button_config
                }).eq('id', pid).eq('server_id', serverId).select().single();

                if (error) return reply.status(400).send({ error: error.message });
                return reply.send({ product });
            });

            serverApp.delete('/server/:id/products/:pid', async (request, reply) => {
                const serverId = (request as any).serverId;
                const { pid } = request.params as { id: string; pid: string };
                const db = getSupabaseClient();
                await db.from('products').delete().eq('id', pid).eq('server_id', serverId);
                return reply.send({ success: true });
            });

            // -----------------------------------------------------
            // Orders
            // -----------------------------------------------------

            serverApp.get('/server/:id/orders', async (request, reply) => {
                const serverId = (request as any).serverId;
                const { page = 1, limit = 20 } = request.query as any;

                const db = getSupabaseClient();
                const from = (page - 1) * limit;
                const to = from + limit - 1;

                const { data: orders, count } = await db
                    .from('orders')
                    .select('*, products(name)', { count: 'exact' })
                    .eq('server_id', serverId)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                return reply.send({ orders, total: count, page, limit });
            });

            // -----------------------------------------------------
            // Discord Utils
            // -----------------------------------------------------

            serverApp.get('/server/:id/channels', async (request, reply) => {
                const serverId = (request as any).serverId;
                const db = getSupabaseClient();
                const { data: server } = await db.from('servers').select('discord_guild_id').eq('id', serverId).single();

                if (!server) return reply.status(404).send({ error: 'Server not found' });

                const botToken = process.env.DISCORD_BOT_TOKEN;
                if (!botToken) return reply.status(500).send({ error: 'DISCORD_BOT_TOKEN not configured' });

                const res = await fetch(`${DISCORD_API_BASE}/guilds/${server.discord_guild_id}/channels`, {
                    headers: { Authorization: `Bot ${botToken}` }
                });

                if (!res.ok) {
                    const err = await res.json() as any;
                    return reply.status(res.status).send({ error: 'Discord API error', detail: err });
                }

                const channels = await res.json() as any[];
                return reply.send({
                    channels: channels
                        .filter(c => (c.type === 0 || c.type === 5)) // Text or Announcement
                        .map(c => ({ id: c.id, name: c.name }))
                });
            });

            serverApp.post('/server/:id/products/:pid/post', async (request, reply) => {
                const serverId = (request as any).serverId;
                const { pid } = request.params as { id: string; pid: string };
                const { channel_id } = request.body as { channel_id: string };

                if (!channel_id) return reply.status(400).send({ error: 'channel_id is required' });

                const db = getSupabaseClient();
                const { data: product } = await db.from('products').select('*').eq('id', pid).eq('server_id', serverId).single();

                if (!product) return reply.status(404).send({ error: 'Product not found' });

                const botToken = process.env.DISCORD_BOT_TOKEN;
                if (!botToken) return reply.status(500).send({ error: 'DISCORD_BOT_TOKEN not configured' });

                // Build Embed
                const embed: any = {
                    title: product.embed_json?.title || product.name,
                    description: product.embed_json?.description || undefined,
                    color: product.embed_json?.color || 5793266, // Default Blurple
                    fields: [
                        { name: 'ราคา', value: `฿ ${(product.price / 100).toFixed(2)}`, inline: true }
                    ]
                };

                if (product.embed_json?.image) {
                    embed.image = { url: product.embed_json.image };
                }

                // Build Button
                const btnConfig = product.button_config || {};
                const button = {
                    type: 2, // BUTTON
                    style: btnConfig.style ? parseInt(btnConfig.style) : 1, // PRIMARY
                    label: btnConfig.label || 'สั่งซื้อสินค้า',
                    custom_id: `buy_${product.id}`
                };

                if (btnConfig.emoji) {
                    (button as any).emoji = { name: btnConfig.emoji };
                }

                logger.info({ pid, channel_id, embed: !!embed.image }, 'Posting product to Discord');

                const res = await fetch(`${DISCORD_API_BASE}/channels/${channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bot ${botToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        embeds: [embed],
                        components: [{
                            type: 1, // ACTION_ROW
                            components: [button]
                        }]
                    })
                });

                if (!res.ok) {
                    const errBody = await res.text();
                    let errDetail;
                    try {
                        errDetail = JSON.parse(errBody);
                    } catch {
                        errDetail = errBody;
                    }
                    logger.error({ err: errDetail, pid, channel_id, status: res.status }, 'Discord API error during product posting');
                    return reply.status(res.status).send({
                        error: 'Discord API error',
                        message: `Discord returned ${res.status}: ${errDetail.message || 'Unknown error'}`,
                        detail: errDetail
                    });
                }

                logger.info({ pid, channel_id }, 'Product posted successfully to Discord');
                return reply.send({ success: true });
            });
        });
    }, { prefix: '/api' });
};
