import { getSupabaseClient } from '@paynoy/db';
import { AuditEventType } from '@paynoy/types';
import { logger } from './logger';

interface AuditEntry {
    server_id?: string;
    event_type: AuditEventType;
    actor_id?: string;
    metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
    const db = getSupabaseClient();

    try {
        const { error } = await db.from('audit_logs').insert({
            server_id: entry.server_id || null,
            event_type: entry.event_type,
            actor_id: entry.actor_id || null,
            metadata: entry.metadata || {},
        });

        if (error) {
            logger.error({ err: error, entry }, 'Failed to write audit log');
        }
    } catch (err) {
        // Audit logging should never crash the main flow
        logger.error({ err, entry }, 'Audit log write exception');
    }
}
