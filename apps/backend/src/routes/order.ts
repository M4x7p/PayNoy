import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '@paynoy/db';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    OrderStatus,
    AuditEventType,
} from '@paynoy/types';
import { createPromptPaySource, createCharge } from '../lib/omise';
import { canAssignRole } from '../lib/discord';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger';

// ── JSON Schema for input validation ───────────────────────

const createOrderSchema = {
    body: {
        type: 'object',
        required: ['discord_guild_id', 'product_id', 'discord_user_id', 'idempotency_key'],
        properties: {
            discord_guild_id: { type: 'string', minLength: 1 },
            product_id: { type: 'string', minLength: 1 },
            discord_user_id: { type: 'string', minLength: 1 },
            idempotency_key: { type: 'string', minLength: 1, maxLength: 128 },
            discord_channel_id: { type: 'string' },
            interaction_token: { type: 'string' },
        },
        additionalProperties: false,
    },
};

export const orderRoutes: FastifyPluginAsync = async (fastify: any) => {
    fastify.post(
        '/create-order',
        { schema: createOrderSchema },
        async (request: any, reply: any) => {
            const body = request.body as any;
            logger.info({ body }, 'Incoming /create-order request body');

            const discord_guild_id = body.discord_guild_id;
            const { product_id, discord_user_id, idempotency_key, discord_channel_id, interaction_token } = body;

            const reqLog = logger.child({
                requestId: (request as any).requestId,
                guildId: discord_guild_id,
                productId: product_id,
                userId: discord_user_id,
                channelId: discord_channel_id,
            });

            const db = getSupabaseClient();

            // Resolve server_id from discord_guild_id
            const { data: serverResult } = await db
                .from('servers')
                .select('id, promptpay_name, promptpay_account, omise_secret_key')
                .eq('discord_guild_id', discord_guild_id)
                .single();

            if (!serverResult) {
                reqLog.warn('Server not registered');
                return reply.status(404).send({ error: 'Server not registered' });
            }
            const server_id = serverResult.id;
            const receiverName = serverResult.promptpay_name || 'N/A';
            const rawAccount = serverResult.promptpay_account || '0000000000';
            const receiverAccountMasked = rawAccount.length >= 10
                ? `${rawAccount.slice(0, 3)}-xxx-${rawAccount.slice(-4)}`
                : 'xxx-xxx-xxxx';

            // ── 1. Idempotency check ──────────────────────────────

            const { data: existingByKey } = await db
                .from('orders')
                .select('id, status, omise_charge_id, expires_at')
                .eq('idempotency_key', idempotency_key)
                .single();

            if (existingByKey) {
                reqLog.info({ orderId: existingByKey.id }, 'Idempotent request — returning existing order');

                // If the existing order is still pending, return it
                if (existingByKey.status === OrderStatus.PENDING) {
                    // Fetch the QR code from existing charge
                    return reply.status(200).send({
                        order_id: existingByKey.id,
                        qr_code_url: '', // Client should re-render from cache
                        amount: 0,
                        expires_at: existingByKey.expires_at,
                        message: 'Order already exists',
                    });
                }

                return reply.status(409).send({
                    error: 'Order already processed',
                    order_id: existingByKey.id,
                    status: existingByKey.status,
                });
            }

            // ── 2. Rate limit: max 1 pending order per user+product ─

            const { data: pendingOrder } = await db
                .from('orders')
                .select('id')
                .eq('user_discord_id', discord_user_id)
                .eq('product_id', product_id)
                .eq('status', OrderStatus.PENDING)
                .single();

            if (pendingOrder) {
                reqLog.warn('User already has a pending order for this product');
                return reply.status(429).send({
                    error: 'Pending order exists',
                    message: 'You already have a pending payment for this product. Please complete or wait for it to expire.',
                    existing_order_id: pendingOrder.id,
                });
            }

            // ── 2b. Global Anti-Fraud Limit: max 3 pending orders across all products

            const { count: globalPendingCount } = await db
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_discord_id', discord_user_id)
                .eq('status', OrderStatus.PENDING);

            if (globalPendingCount && globalPendingCount >= 3) {
                reqLog.warn({ globalPendingCount }, 'User hit global pending order limit (fraud protection)');
                return reply.status(429).send({
                    error: 'Rate limit exceeded',
                    message: 'You have too many unpaid orders pending. Please complete or wait for them to expire.',
                });
            }

            // ── 3. Fetch product ──────────────────────────────────

            const { data: product, error: productError } = await db
                .from('products')
                .select('*')
                .eq('id', product_id)
                .eq('server_id', server_id)
                .single();

            if (productError || !product) {
                reqLog.warn('Product not found');
                return reply.status(404).send({ error: 'Product not found' });
            }

            // ── 4. Validate bot can assign the role ───────────────

            const canAssign = await canAssignRole(discord_guild_id, product.role_id);
            if (!canAssign) {
                reqLog.warn('Bot cannot assign the target role (hierarchy check failed)');
                return reply.status(400).send({
                    error: 'Role assignment not possible',
                    message: 'The bot does not have permission to assign this role. Check role hierarchy.',
                });
            }

            // ── 5. Create Omise source + charge ───────────────────

            if (!serverResult.omise_secret_key) {
                reqLog.warn('Omise keys not configured for this server');
                return reply.status(400).send({
                    error: 'Payment not configured',
                    message: 'This server has not configured their Omise payment keys yet.'
                });
            }

            let source, charge;
            try {
                source = await createPromptPaySource(serverResult.omise_secret_key, product.price);
                charge = await createCharge(serverResult.omise_secret_key, source.id, product.price, {
                    server_id,
                    product_id,
                    discord_user_id,
                });
            } catch (err: any) {
                reqLog.error({ err: err.message, code: err.code }, 'Omise API error');
                const isAuthError = err.message?.toLowerCase().includes('authentication') || err.code === 'authentication_failure';
                const errorMsg = isAuthError
                    ? 'Omise Authentication Failed. Please check your Secret Key in Railway variables.'
                    : (err.message || 'Payment gateway error');
                return reply.status(isAuthError ? 401 : 502).send({
                    error: 'Payment gateway error',
                    message: errorMsg,
                    detail: err.message
                });
            }


            // ── 6. Insert order ───────────────────────────────────

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // +5 minutes

            const { data: order, error: orderError } = await db
                .from('orders')
                .insert({
                    server_id,
                    product_id,
                    user_discord_id: discord_user_id,
                    amount: product.price,
                    status: OrderStatus.PENDING,
                    omise_source_id: source.id,
                    omise_charge_id: charge.id,
                    idempotency_key,
                    discord_channel_id,
                    interaction_token,
                    expires_at: expiresAt,
                })
                .select('id')
                .single();

            if (orderError || !order) {
                reqLog.error({ err: orderError }, 'Failed to insert order');
                return reply.status(500).send({ error: 'Failed to create order' });
            }

            // ── 7. Audit log ──────────────────────────────────────

            await writeAuditLog({
                server_id,
                event_type: AuditEventType.ORDER_CREATED,
                actor_id: discord_user_id,
                metadata: {
                    order_id: order.id,
                    product_id,
                    amount: product.price,
                    charge_id: charge.id,
                },
            });

            reqLog.info({ orderId: order.id, chargeId: charge.id }, 'Order created');

            // ── 8. Response ───────────────────────────────────────

            const response: CreateOrderResponse = {
                order_id: order.id,
                qr_code_url: source.scannable_code.image.download_uri,
                amount: product.price,
                expires_at: expiresAt,
                receiver_name: receiverName,
                receiver_account_masked: receiverAccountMasked,
            };

            return reply.status(201).send(response);
        }
    );
};
