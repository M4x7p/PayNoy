import { Worker, Job } from 'bullmq';
import { RoleAssignmentPayload, AuditEventType, FailedJobStatus } from '@paynoy/types';
import { getSupabaseClient } from '@paynoy/db';
import { assignRole, sendDirectMessage, updateInteractionMessage, sendChannelMessage } from '../lib/discord';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger';
import { getRedisConnection, QUEUE_NAME } from './queue';

export function startRoleAssignmentWorker(): Worker<RoleAssignmentPayload> {
    const worker = new Worker<RoleAssignmentPayload>(
        QUEUE_NAME,
        async (job: Job<RoleAssignmentPayload>) => {
            const { order_id, guild_id, user_id, role_id } = job.data;
            const db = getSupabaseClient();

            // Check idempotency
            const { data: order } = await db
                .from('orders')
                .select('role_assigned_at, interaction_token, discord_channel_id')
                .eq('id', order_id)
                .single();

            if (order?.role_assigned_at) {
                logger.info({ orderId: order_id }, 'Role already assigned, skipping job');
                return;
            }

            await assignRole(guild_id, user_id, role_id);

            // Mark as assigned
            await db
                .from('orders')
                .update({ role_assigned_at: new Date().toISOString() })
                .eq('id', order_id);

            // Log success
            await writeAuditLog({
                event_type: AuditEventType.ROLE_ASSIGNED,
                actor_id: user_id,
                metadata: { order_id, guild_id, role_id },
            });

            // Update Interaction (Real-time Feedback)
            if (order?.interaction_token) {
                await updateInteractionMessage(order.interaction_token, {
                    content: '✅ **Role Assigned!**\nYour payment was successful and the role has been added to your profile.',
                    embeds: [], // Remove QR code
                    components: [], // Remove buttons
                });
            }

            // Send DM & Fallback
            try {
                await sendDirectMessage(user_id, {
                    content: `✅ **Payment Successful!**\nYour payment has been mapped and the role has been successfully assigned dynamically in the server. Thank you!`
                });
            } catch (dmErr) {
                logger.warn({ user_id, err: (dmErr as any).message }, 'Failed to DM user, falling back to channel message');
                if (order?.discord_channel_id) {
                    await sendChannelMessage(order.discord_channel_id, {
                        content: `✅ <@${user_id}>, your payment was successful and your role is now assigned! (Unable to DM you)`,
                    });
                }
            }

            logger.info({ orderId: order_id }, 'Role assignment completed');
        },
        {
            connection: getRedisConnection(),
            concurrency: 5,
        }
    );

    // ── Event Handlers ──────────────────────────────────────

    worker.on('completed', (job: any) => {
        logger.info({ jobId: job.id }, 'Role assignment job completed');
    });

    worker.on('failed', async (job: any, err: any) => {
        if (!job) return;
        const log = logger.child({ jobId: job.id });

        log.error({ err: err.message, attemptsMade: job.attemptsMade }, 'Role assignment job failed');

        // If all retries exhausted, persist to failed_jobs table
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            log.warn('All retries exhausted, persisting to failed_jobs');

            try {
                const db = getSupabaseClient();
                await db.from('failed_jobs').insert({
                    job_type: 'role-assignment',
                    payload: job.data,
                    error: err.message,
                    attempts: job.attemptsMade,
                    status: FailedJobStatus.PENDING,
                });

                await writeAuditLog({
                    event_type: AuditEventType.ROLE_ASSIGN_FAILED,
                    actor_id: job.data.user_id,
                    metadata: {
                        order_id: job.data.order_id,
                        error: err.message,
                        attempts: job.attemptsMade,
                    },
                });
            } catch (dbErr) {
                log.error({ err: dbErr }, 'Failed to persist failed job');
            }
        }
    });

    logger.info('Role assignment worker started');
    return worker;
}
