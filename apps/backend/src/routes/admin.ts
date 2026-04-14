import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import { FailedJobStatus } from '@paynoy/types';
import { enqueueRoleAssignment } from '../workers/queue';
import { logger } from '../lib/logger';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
    // ── GET /admin/failed-jobs ─────────────────────────────────

    fastify.get('/admin/failed-jobs', async (_request, reply) => {
        const db = getSupabaseClient();

        const { data, error } = await db
            .from('failed_jobs')
            .select('*')
            .eq('status', FailedJobStatus.PENDING)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            logger.error({ err: error }, 'Failed to fetch failed jobs');
            return reply.status(500).send({ error: 'Internal server error' });
        }

        return reply.send({ jobs: data || [] });
    });

    // ── POST /admin/retry-job/:id ──────────────────────────────

    fastify.post<{ Params: { id: string } }>(
        '/admin/retry-job/:id',
        async (request, reply) => {
            const { id } = request.params;
            const reqLog = logger.child({ requestId: (request as any).requestId, jobId: id });

            const db = getSupabaseClient();

            const { data: job, error } = await db
                .from('failed_jobs')
                .select('*')
                .eq('id', id)
                .eq('status', FailedJobStatus.PENDING)
                .single();

            if (error || !job) {
                return reply.status(404).send({ error: 'Failed job not found or already resolved' });
            }

            if (job.job_type === 'role-assignment') {
                try {
                    await enqueueRoleAssignment(job.payload as any);

                    await db
                        .from('failed_jobs')
                        .update({ status: FailedJobStatus.RETRIED })
                        .eq('id', id);

                    reqLog.info('Failed job re-enqueued');
                    return reply.send({ status: 'retried', job_id: id });
                } catch (err: any) {
                    reqLog.error({ err: err.message }, 'Failed to re-enqueue job');
                    return reply.status(500).send({ error: 'Failed to retry job' });
                }
            }

            return reply.status(400).send({ error: `Unknown job type: ${job.job_type}` });
        }
    );

    // ── POST /admin/resolve-job/:id ────────────────────────────

    fastify.post<{ Params: { id: string } }>(
        '/admin/resolve-job/:id',
        async (request, reply) => {
            const { id } = request.params;

            const db = getSupabaseClient();
            const { error } = await db
                .from('failed_jobs')
                .update({ status: FailedJobStatus.RESOLVED })
                .eq('id', id);

            if (error) {
                return reply.status(500).send({ error: 'Failed to resolve job' });
            }

            return reply.send({ status: 'resolved', job_id: id });
        }
    );

    // ── GET /admin/orders ──────────────────────────────────────

    fastify.get<{ Querystring: { status?: string; limit?: string } }>(
        '/admin/orders',
        async (request, reply) => {
            const { status, limit } = request.query;
            const db = getSupabaseClient();

            let query = db.from('orders').select('*').order('created_at', { ascending: false });

            if (status) query = query.eq('status', status);
            query = query.limit(limit ? parseInt(limit, 10) : 50);

            const { data, error } = await query;
            if (error) return reply.status(500).send({ error: 'Database fetch error' });
            return reply.send({ orders: data || [] });
        }
    );

    // ── GET /admin/payments ────────────────────────────────────

    fastify.get<{ Querystring: { limit?: string } }>(
        '/admin/payments',
        async (request, reply) => {
            const { limit } = request.query;
            const db = getSupabaseClient();

            const { data, error } = await db
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit ? parseInt(limit, 10) : 50);

            if (error) return reply.status(500).send({ error: 'Database fetch error' });
            return reply.send({ payments: data || [] });
        }
    );

    // ── POST /admin/retry-order/:id ────────────────────────────

    fastify.post<{ Params: { id: string } }>(
        '/admin/retry-order/:id',
        async (request, reply) => {
            const { id } = request.params;
            const db = getSupabaseClient();

            // Set order status back to pending, extend expiration by 5 minutes
            const { data: order, error } = await db
                .from('orders')
                .update({
                    status: 'pending',
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
                })
                .eq('id', id)
                .select('id')
                .single();

            if (error || !order) return reply.status(404).send({ error: 'Order not found or update failed' });

            logger.info({ orderId: id }, 'Order status manually reset to pending');
            return reply.send({ status: 'retried', order_id: id });
        }
    );

    // ── POST /admin/reassign-role/:order_id ────────────────────

    fastify.post<{ Params: { order_id: string } }>(
        '/admin/reassign-role/:order_id',
        async (request, reply) => {
            const { order_id } = request.params;
            const db = getSupabaseClient();

            const { data: order, error } = await db
                .from('orders')
                .select('id, user_discord_id, products(role_id), servers(discord_guild_id)')
                .eq('id', order_id)
                .single();

            if (error || !order) return reply.status(404).send({ error: 'Order not found' });

            // Override idempotency field to allow enqueue again safely or let worker do it?
            // Actually, the worker checks role_assigned_at. So we MUST clear it.
            await db
                .from('orders')
                .update({ role_assigned_at: null })
                .eq('id', order_id);

            await enqueueRoleAssignment({
                order_id: order.id,
                guild_id: (order as any).servers.discord_guild_id,
                user_id: order.user_discord_id,
                role_id: (order as any).products.role_id,
            });

            logger.info({ orderId: order_id }, 'Role assignment manually forced');
            return reply.send({ status: 'reassigned', order_id: order_id });
        }
    );
};
