import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { RoleAssignmentPayload } from '@paynoy/types';
import { logger } from '../lib/logger';

const QUEUE_NAME = 'role-assignment';

// ── Redis Connection ───────────────────────────────────────

function getRedisConnection(): IORedis {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    return new IORedis(url, { maxRetriesPerRequest: null });
}

// ── Queue ──────────────────────────────────────────────────

let queue: Queue<RoleAssignmentPayload> | null = null;

export function getRoleAssignmentQueue(): Queue<RoleAssignmentPayload> {
    if (!queue) {
        queue = new Queue<RoleAssignmentPayload>(QUEUE_NAME, {
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000, // 2s, 4s, 8s
                },
                removeOnComplete: { age: 3600 * 24 }, // keep 24h
                removeOnFail: false, // keep for failed_jobs recovery
            },
        });
    }
    return queue;
}

/**
 * Enqueue a role assignment job.
 */
export async function enqueueRoleAssignment(
    payload: RoleAssignmentPayload
): Promise<Job<RoleAssignmentPayload>> {
    const q = getRoleAssignmentQueue();

    logger.info({ payload }, 'Enqueuing role assignment job');

    return q.add('assign-role', payload, {
        jobId: `role-${payload.order_id}`, // deduplicate by order
        delay: 3000,
    });
}

/**
 * Create and return the Redis connection for external use (e.g. worker).
 */
export { getRedisConnection, QUEUE_NAME };
