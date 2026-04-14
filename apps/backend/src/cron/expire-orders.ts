import cron from 'node-cron';
import { getSupabaseClient } from '@paynoy/db';
import { OrderStatus, AuditEventType } from '@paynoy/types';
import { writeAuditLog } from '../lib/audit';
import { sendDirectMessage, updateInteractionMessage, sendChannelMessage } from '../lib/discord';
import { logger } from '../lib/logger';

/**
 * Expires pending orders that have passed their expiry time.
 * Runs every 1 minute.
 */
export function startExpireOrdersCron(): void {
    cron.schedule('*/1 * * * *', async () => {
        const log = logger.child({ cron: 'expire-orders' });

        try {
            const db = getSupabaseClient();

            const { data: expiredOrders, error } = await db
                .from('orders')
                .update({ status: OrderStatus.EXPIRED })
                .eq('status', OrderStatus.PENDING)
                .lt('expires_at', new Date().toISOString())
                .select('id, server_id, user_discord_id, interaction_token, discord_channel_id');

            if (error) {
                log.error({ err: error }, 'Failed to expire orders');
                return;
            }

            if (expiredOrders && expiredOrders.length > 0) {
                log.info({ count: expiredOrders.length }, 'Expired stale orders');

                for (const order of expiredOrders) {
                    await writeAuditLog({
                        server_id: order.server_id,
                        event_type: AuditEventType.ORDER_EXPIRED,
                        actor_id: order.user_discord_id,
                        metadata: { order_id: order.id },
                    });

                    // Real-time Update
                    if (order.interaction_token) {
                        await updateInteractionMessage(order.interaction_token, {
                            content: `❌ **Order Expired**\nThis QR code is no longer valid. Please generate a new one if you still wish to purchase.`,
                            embeds: [],
                            components: [],
                        });
                    }

                    // Send Expiry DM & Fallback
                    try {
                        await sendDirectMessage(order.user_discord_id, {
                            content: `⚠️ **Order Expired**\nYour pending PayNoy order ran out of time. If you still want the role, please trigger the purchase button again. Do **NOT** pay using the old QR code!`,
                        });
                    } catch (dmErr) {
                        if (order.discord_channel_id) {
                            await sendChannelMessage(order.discord_channel_id, {
                                content: `⚠️ <@${order.user_discord_id}>, your pending order has expired. Please do not use the previous QR code.`,
                            });
                        }
                    }
                }
            }
        } catch (err) {
            log.error({ err }, 'Expire orders cron error');
        }
    });

    logger.info('Expire orders cron started (every 1 minute)');
}
