import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { getSupabaseClient } from '@paynoy/db';

const onboardingGuardPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', async (request, reply) => {
        if (!request.user) return; // Handled by auth-guard

        const db = getSupabaseClient();

        // Fetch user's onboarded status if we haven't already
        const { data: user, error } = await db
            .from('users')
            .select('*')
            .eq('id', request.user.id)
            .single();

        if (error || !user) {
            return reply.status(401).send({ error: 'User not found in DB' });
        }

        // Cache for subsequent guards/handlers to save DB trips
        request.dbUser = user;

        // If not onboarded, block access to paths EXCEPT allowed ones
        if (!user.onboarded) {
            const path = request.routerPath || request.url;

            // Allowlist rules (exact matches or startsWith)
            const isAllowed =
                path.startsWith('/api/me') ||
                path.startsWith('/api/guilds') ||
                path.startsWith('/api/onboarding') ||
                path.startsWith('/api/server'); // Allow server setup during onboarding

            if (!isAllowed) {
                return reply.status(403).send({
                    error: 'Onboarding required',
                    message: 'You must complete the onboarding flow before accessing this endpoint',
                    code: 'ONBOARDING_REQUIRED'
                });
            }
        }
    });
};

export const onboardingGuard = fp(onboardingGuardPlugin);
