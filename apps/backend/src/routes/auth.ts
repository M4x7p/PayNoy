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
            logger.info('Auth callback: Step 1 - Exchanging code for token');
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
            logger.info('Auth callback: Step 1 DONE - Got access token');

            // Step 2: Fetch User Profile
            logger.info('Auth callback: Step 2 - Fetching user profile');
            const userRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userRes.ok) throw new Error('Failed to fetch Discord user');
            const discordUser: any = await userRes.json();
            logger.info({ discordId: discordUser.id, username: discordUser.username }, 'Auth callback: Step 2 DONE - Got user');

            // Step 3: Fetch Guilds where the user is Admin (0x8)
            logger.info('Auth callback: Step 3 - Fetching guilds');
            const guildsRes = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!guildsRes.ok) throw new Error('Failed to fetch Discord guilds');
            const discordGuilds = await guildsRes.json() as any[];
            logger.info({ totalGuilds: discordGuilds.length }, 'Auth callback: Step 3 DONE - Got guilds');

            // Filter for ADMINISTRATOR permission (0x8)
            const adminGuilds = discordGuilds.filter((g: any) => {
                try {
                    return (BigInt(g.permissions) & BigInt(0x8)) !== BigInt(0);
                } catch {
                    return false; // Skip guilds with invalid permissions
                }
            });
            const guildsCache = adminGuilds.map((g: any) => ({
                id: g.id,
                name: g.name,
                icon: g.icon
            }));
            logger.info({ adminGuilds: adminGuilds.length }, 'Auth callback: Step 3b DONE - Filtered admin guilds');

            // Step 4: Upsert User into Database (without tokens)
            logger.info('Auth callback: Step 4 - Upserting user in DB');
            const db = getSupabaseClient();

            // Check if user already exists
            let { data: existingUser, error: findError } = await db
                .from('users')
                .select('id, onboarded')
                .eq('discord_id', discordUser.id)
                .single();

            logger.info({ existingUser: !!existingUser, findError: findError?.code }, 'Auth callback: Step 4a - User lookup result');

            let userId: string;
            let onboarded = false;

            if (findError && findError.code !== 'PGRST116') {
                throw findError;
            }

            if (existingUser) {
                // Update existing user cache
                userId = existingUser.id;
                onboarded = existingUser.onboarded;

                const { error: updateError } = await db.from('users').update({
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    guilds_cache: guildsCache,
                    guilds_cache_updated_at: new Date().toISOString()
                }).eq('id', userId);

                if (updateError) {
                    logger.error({ error: updateError }, 'Auth callback: Step 4b - Update user failed');
                    throw updateError;
                }
                logger.info({ userId }, 'Auth callback: Step 4b DONE - Updated existing user');
            } else {
                // Create new user
                const { data: newUser, error: insertError } = await db.from('users').insert({
                    discord_id: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    guilds_cache: guildsCache,
                    guilds_cache_updated_at: new Date().toISOString()
                }).select('id, onboarded').single();

                if (insertError) {
                    logger.error({ error: insertError }, 'Auth callback: Step 4b - Insert user failed');
                    throw insertError;
                }
                userId = newUser.id;
                onboarded = newUser.onboarded;
                logger.info({ userId }, 'Auth callback: Step 4b DONE - Created new user');
            }

            // Step 5: Issue JWT and Set Cookie
            logger.info({ userId }, 'Auth callback: Step 5 - Issuing JWT');
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
            logger.info({ redirectTarget }, 'Auth callback: Step 5 DONE - Redirecting');
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

    // TEMPORARY: Debug endpoint to test DB connectivity
    fastify.get('/auth/debug', async (request, reply) => {
        try {
            const db = getSupabaseClient();

            // Test 1: Can we query the users table?
            const { data, error } = await db.from('users').select('id, discord_id, username, avatar, onboarded, guilds_cache').limit(1);

            if (error) {
                return reply.send({
                    status: 'DB_ERROR',
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
            }

            return reply.send({
                status: 'OK',
                userCount: data?.length || 0,
                columns: data && data.length > 0 ? Object.keys(data[0]) : 'no_rows',
                env: {
                    API_BASE_URL: process.env.API_BASE_URL ? 'SET' : 'MISSING',
                    DASHBOARD_URL: process.env.DASHBOARD_URL ? 'SET' : 'MISSING',
                    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'SET' : 'MISSING',
                    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'MISSING',
                    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
                    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
                    SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET' : 'MISSING',
                }
            });
        } catch (err: any) {
            return reply.send({ status: 'CRASH', error: err.message, stack: err.stack });
        }
    });
};
