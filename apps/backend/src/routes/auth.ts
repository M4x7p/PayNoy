import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { signToken } from '../lib/jwt';
import { logger } from '../lib/logger';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const authRoutes: FastifyPluginAsync = async (fastify) => {

    // 1. Initial OAuth Redirect
    fastify.get('/auth/discord', async (request, reply) => {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = `${process.env.API_BASE_URL}/auth/callback`;

        if (!clientId || !redirectUri) {
            return reply.status(500).send({ error: 'OAuth not configured correctly' });
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'identify guilds', // Only the scopes we need
        });

        return reply.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    });

    // 2. OAuth Callback Handle
    fastify.get('/auth/callback', async (request, reply) => {
        const { code, error } = request.query as { code?: string; error?: string };

        if (error) {
            logger.warn({ error }, 'Discord OAuth error');
            return reply.redirect(`${process.env.DASHBOARD_URL}/dashboard/login?error=oauth_rejected`);
        }

        if (!code) {
            return reply.status(400).send({ error: 'Missing code parameter' });
        }

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = `${process.env.API_BASE_URL}/auth/callback`;

        try {
            // Step 1: Exchange code for access token (Ephemeral)
            const tokenRes = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri!,
                }),
            });

            if (!tokenRes.ok) {
                const body = await tokenRes.text();
                logger.error({ status: tokenRes.status, body }, 'Failed to exchange Discord code');
                return reply.redirect(`${process.env.DASHBOARD_URL}/dashboard/login?error=auth_failed`);
            }

            const tokenData: any = await tokenRes.json();
            const accessToken = tokenData.access_token; // NEVER STORE THIS IN DB

            // Step 2: Fetch User Profile
            const userRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userRes.ok) throw new Error('Failed to fetch Discord user');
            const discordUser: any = await userRes.json();

            // Step 3: Fetch Guilds where the user is Admin (0x8)
            const guildsRes = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!guildsRes.ok) throw new Error('Failed to fetch Discord guilds');
            const discordGuilds = await guildsRes.json() as any[];

            // Filter for ADMINISTRATOR permission (0x8)
            const adminGuilds = discordGuilds.filter((g: any) => (BigInt(g.permissions) & BigInt(0x8)) !== BigInt(0));
            const guildsCache = adminGuilds.map((g: any) => ({
                id: g.id,
                name: g.name,
                icon: g.icon
            }));

            // Step 4: Upsert User into Database (without tokens)
            const db = getSupabaseClient();

            // Check if user already exists
            let { data: existingUser, error: findError } = await db
                .from('users')
                .select('id, onboarded')
                .eq('discord_id', discordUser.id)
                .single();

            let userId: string;
            let onboarded = false;

            if (findError && findError.code !== 'PGRST116') {
                throw findError;
            }

            if (existingUser) {
                // Update existing user cache
                userId = existingUser.id;
                onboarded = existingUser.onboarded;

                await db.from('users').update({
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    guilds_cache: guildsCache,
                    guilds_cache_updated_at: new Date().toISOString()
                }).eq('id', userId);
            } else {
                // Create new user
                const { data: newUser, error: insertError } = await db.from('users').insert({
                    discord_id: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    guilds_cache: guildsCache,
                    guilds_cache_updated_at: new Date().toISOString()
                }).select('id, onboarded').single();

                if (insertError) throw insertError;
                userId = newUser.id;
                onboarded = newUser.onboarded;
            }

            // Step 5: Issue JWT and Set Cookie
            const jwtToken = signToken({ id: userId, discord_id: discordUser.id });

            reply.setCookie('paynoi_token', jwtToken, {
                path: '/',
                httpOnly: true,
                secure: true, // Required for SameSite=None
                sameSite: 'none', // Cross-origin: frontend (Vercel) ↔ backend (Railway)
                maxAge: 24 * 60 * 60, // 24 hours
            });

            // Redirect user to the dashboard or onboarding flow
            const redirectTarget = onboarded ? '/dashboard' : '/dashboard/onboarding';
            return reply.redirect(`${process.env.DASHBOARD_URL}${redirectTarget}`);

        } catch (err: any) {
            logger.error({ err: err.message, stack: err.stack, code: err.code, details: err.details, hint: err.hint }, 'Auth callback unhandled error');
            return reply.redirect(`${process.env.DASHBOARD_URL}/dashboard/login?error=server_error`);
        }
    });

    // 3. Logout
    fastify.post('/auth/logout', async (request, reply) => {
        reply.clearCookie('paynoi_token', { path: '/' });
        return reply.send({ success: true });
    });
};
