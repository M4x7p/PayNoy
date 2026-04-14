import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { getSupabaseClient } from '@paynoy/db';
import { OmiseWebhookPayload, OrderStatus, AuditEventType } from '@paynoy/types';
import { enqueueRoleAssignment } from '../workers/queue';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger';

export const webhookRoutes: FastifyPluginAsync = async (fastify: any) => {
    // Register raw body parser for signature verification
    fastify.addContentTypeParser(
        'application/json',
        { parseAs: 'buffer' },
        (_req: any, body: any, done: any) => {
            done(null, body);
        }
    );

    fastify.post('/webhook/omise', async (request: any, reply: any) => {
        const reqLog = logger.child({ requestId: (request as any).requestId });

        // ── 1. Verify HMAC Signature ────────────────────────────

        const rawBody = request.body as Buffer;
        const signature = request.headers['x-omise-webhook-signature'] as string | undefined;
        const webhookSecret = process.env.WEBHOOK_SECRET;

        if (!webhookSecret) {
            reqLog.error('WEBHOOK_SECRET not configured');
            return reply.status(500).send({ error: 'Server configuration error' });
        }

        if (signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (!crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            )) {
                reqLog.warn('Invalid webhook signature');
                return reply.status(401).send({ error: 'Invalid signature' });
            }
        } else {
            // In production, you MUST require the signature
            if (process.env.NODE_ENV === 'production') {
                reqLog.warn('Missing webhook signature in production');
                return reply.status(401).send({ error: 'Missing signature' });
            }
            reqLog.warn('No signature header — skipping verification (dev mode)');
        }

        // ── 2. Parse payload ────────────────────────────────────

        let payload: OmiseWebhookPayload;
        try {
            payload = JSON.parse(rawBody.toString('utf-8'));
        } catch {
            return reply.status(400).send({ error: 'Invalid JSON' });
        }

        // Webhook Replay Protection: Reject events older than 5 minutes
        const eventAgeMs = Date.now() - new Date(payload.created_at || new Date()).getTime();
        if (eventAgeMs > 5 * 60 * 1000) {
            reqLog.warn({ eventId: payload.id, eventAgeMs }, 'Webhook event too old (replay protection)');
            return reply.status(400).send({ error: 'Event too old' });
        }

        reqLog.info({ eventId: payload.id, eventKey: payload.key }, 'Webhook received');

        // ── 3. Deduplicate events ───────────────────────────────

        const db = getSupabaseClient();

        const { data: existingEvent } = await db
            .from('webhook_events')
            .select('id')
            .eq('event_id', payload.id)
            .single();

        if (existingEvent) {
            reqLog.info({ eventId: payload.id }, 'Duplicate webhook event — ignoring');
            return reply.status(200).send({ status: 'duplicate' });
        }

        // ── 4. Store event for dedup ────────────────────────────

        await db.from('webhook_events').insert({
            event_id: payload.id,
            event_type: payload.key,
        });

        await writeAuditLog({
            event_type: AuditEventType.WEBHOOK_RECEIVED,
            metadata: { event_id: payload.id, event_key: payload.key },
        });

        // ── 5. Handle charge events ─────────────────────────────

        const chargeId = payload.data?.id;
        if (!chargeId) {
            reqLog.warn('Webhook payload missing charge ID');
            return reply.status(200).send({ status: 'no_charge' });
        }

        if (payload.key === 'charge.complete' && payload.data.paid) {
            // ── Charge successful ──────────────────────────────

            const { data: order } = await db
                .from('orders')
                .select('*, products(*), servers(discord_guild_id)')
                .eq('omise_charge_id', chargeId)
                .single();

            if (!order) {
                reqLog.warn({ chargeId }, 'Order not found for charge');
                return reply.status(200).send({ status: 'order_not_found' });
            }

            // Expiry Check (State machine)
            if (order.status === OrderStatus.EXPIRED) {
                reqLog.warn({ orderId: order.id }, 'Order is already expired, rejecting charge');
                return reply.status(200).send({ status: 'order_expired' });
            }

            // Valid status check (State machine)
            if (order.status === OrderStatus.FAILED) {
                reqLog.warn({ orderId: order.id }, 'Order already marked as failed');
                return reply.status(200).send({ status: 'already_failed' });
            }

            // Payment Validation: Ensure amount and currency match
            if (payload.data.amount !== order.amount || payload.data.currency !== 'thb') {
                reqLog.warn({ orderId: order.id, expectedAmt: order.amount, actualAmt: payload.data.amount }, 'Amount or currency mismatch');
                return reply.status(200).send({ status: 'fraud_amount_or_currency_mismatch' });
            }

            // Validation: Bind Omise source to order
            if (payload.data.source && payload.data.source.id !== order.omise_source_id) {
                reqLog.warn({ expectedSource: order.omise_source_id, actualSource: payload.data.source.id }, 'Omise source mismatch');
                return reply.status(200).send({ status: 'fraud_source_mismatch' });
            }

            // Idempotent: skip if already paid
            if (order.status === OrderStatus.PAID) {
                reqLog.info({ orderId: order.id }, 'Order already paid — skipping');
                return reply.status(200).send({ status: 'already_paid' });
            }

            // Update order status
            await db
                .from('orders')
                .update({ status: OrderStatus.PAID })
                .eq('id', order.id);

            // Track Revenue
            const chargeData = payload.data as any;
            const grossAmount = chargeData.amount;
            const fee = chargeData.fee || 0;
            const netAmount = chargeData.net || (grossAmount - fee);

            await db.from('revenue_logs').insert({
                order_id: order.id,
                gross_amount: grossAmount,
                fee: fee,
                net_amount: netAmount,
            });

            // Insert payment record
            await db.from('payments').insert({
                order_id: order.id,
                event_type: payload.key,
                raw_data: payload.data as unknown as Record<string, unknown>,
            });

            await writeAuditLog({
                server_id: order.server_id,
                event_type: AuditEventType.PAYMENT_SUCCESS,
                actor_id: order.user_discord_id,
                metadata: {
                    order_id: order.id,
                    charge_id: chargeId,
                    amount: order.amount,
                },
            });

            // Enqueue role assignment
            await enqueueRoleAssignment({
                order_id: order.id,
                guild_id: order.servers.discord_guild_id,
                user_id: order.user_discord_id,
                role_id: order.products.role_id,
            });

            reqLog.info({ orderId: order.id }, 'Payment successful — role assignment enqueued');
            return reply.status(200).send({ status: 'success' });

        } else if (payload.key === 'charge.complete' && !payload.data.paid) {
            // ── Charge failed ──────────────────────────────────

            const { data: order } = await db
                .from('orders')
                .select('id, server_id, user_discord_id')
                .eq('omise_charge_id', chargeId)
                .single();

            if (order && order.id) {
                await db
                    .from('orders')
                    .update({ status: OrderStatus.FAILED })
                    .eq('id', order.id);

                await db.from('payments').insert({
                    order_id: order.id,
                    event_type: payload.key,
                    raw_data: payload.data as unknown as Record<string, unknown>,
                });

                await writeAuditLog({
                    server_id: order.server_id,
                    event_type: AuditEventType.PAYMENT_FAILED,
                    actor_id: order.user_discord_id,
                    metadata: { order_id: order.id, charge_id: chargeId },
                });
            }

            reqLog.info({ chargeId }, 'Payment failed');
            return reply.status(200).send({ status: 'failed' });
        }

        // Unknown event type — acknowledge
        reqLog.info({ key: payload.key }, 'Unhandled webhook event type');
        return reply.status(200).send({ status: 'ignored' });
    });
};
