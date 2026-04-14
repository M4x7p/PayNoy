import cron from 'node-cron';
import { getSupabaseClient } from '@paynoy/db';
import { OrderStatus, AuditEventType } from '@paynoy/types';
import { retrieveCharge } from '../lib/omise';
import { enqueueRoleAssignment } from '../workers/queue';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger';

/**
 * Payment reconciliation job.
 * Queries pending orders and verifies payment status with Omise API.
 * Catches payments that webhook might have missed.
 * Runs every 2 minutes.
 */
export function startReconcilePaymentsCron(): void {
    cron.schedule('*/2 * * * *', async () => {
        const log = logger.child({ cron: 'reconcile-payments' });

        try {
            const db = getSupabaseClient();

            // Get all pending orders that have an Omise charge ID and haven't expired
            const { data: pendingOrders, error } = await db
                .from('orders')
                .select('*, products(role_id), servers(discord_guild_id)')
                .eq('status', OrderStatus.PENDING)
                .not('omise_charge_id', 'is', null)
                .gt('expires_at', new Date().toISOString());

            if (error) {
                log.error({ err: error }, 'Failed to fetch pending orders for reconciliation');
                return;
            }

            if (!pendingOrders || pendingOrders.length === 0) {
                return; // Nothing to reconcile
            }

            log.info({ count: pendingOrders.length }, 'Reconciling pending orders');

            const batchSize = 5;
            for (let i = 0; i < pendingOrders.length; i += batchSize) {
                const batch = pendingOrders.slice(i, i + batchSize);

                await Promise.allSettled(batch.map(async (order) => {
                    try {
                        const charge = await retrieveCharge(order.omise_charge_id!);

                        if (charge.paid && charge.status === 'successful') {
                            log.info({ orderId: order.id, chargeId: charge.id }, 'Reconciliation: payment found');

                            await db
                                .from('orders')
                                .update({ status: OrderStatus.PAID })
                                .eq('id', order.id);

                            await db.from('payments').insert({
                                order_id: order.id,
                                event_type: 'reconciliation.paid',
                                raw_data: charge as unknown as Record<string, unknown>,
                            });

                            await writeAuditLog({
                                server_id: order.server_id,
                                event_type: AuditEventType.PAYMENT_SUCCESS,
                                actor_id: order.user_discord_id,
                                metadata: { order_id: order.id, charge_id: charge.id, source: 'reconciliation' },
                            });

                            await enqueueRoleAssignment({
                                order_id: order.id,
                                guild_id: order.servers.discord_guild_id,
                                user_id: order.user_discord_id,
                                role_id: order.products.role_id,
                            });
                        } else if (charge.status === 'failed' || charge.status === 'expired') {
                            log.info({ orderId: order.id, status: charge.status }, 'Reconciliation: charge failed/expired');

                            await db
                                .from('orders')
                                .update({ status: OrderStatus.FAILED })
                                .eq('id', order.id);
                        }
                    } catch (err) {
                        log.error({ err, orderId: order.id }, 'Reconciliation error for order');
                    }
                }));

                // Sleep to avoid rate limit spikes
                if (i + batchSize < pendingOrders.length) {
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
        } catch (err) {
            log.error({ err }, 'Reconcile payments cron error');
        }
    });

    logger.info('Reconcile payments cron started (every 2 minutes)');
}
