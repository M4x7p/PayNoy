import { ButtonInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, CreateOrderResponse } from '@paynoy/types';
import { Logger } from 'pino';

const BACKEND_URL = process.env.BACKEND_URL || 'https://paynoybackend-production.up.railway.app';

export async function handleButtonInteraction(
    interaction: ButtonInteraction,
    logger: Logger
): Promise<void> {
    const customId = interaction.customId;
    logger.info({ customId }, 'Handling button interaction');

    // We only handle button IDs starting with "buy_"
    if (!customId.startsWith('buy_')) {
        logger.debug({ customId }, 'Ignored button (no buy_ prefix)');
        return;
    }

    const productId = customId.replace('buy_', '');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (!guildId) {
        logger.warn({ userId }, 'Button clicked outside of guild');
        await interaction.reply({
            content: '❌ This button can only be used in a server.',
            ephemeral: true,
        });
        return;
    }

    // Defer reply as API call might take a moment
    logger.info({ guildId, productId }, 'Deferring interaction reply');
    try {
        await interaction.deferReply({ ephemeral: true });
        logger.info('Interaction reply deferred successfully');

        // Immediate status update to user
        await interaction.editReply({ content: '⏳ **กำลังสร้าง QR Code สั่งซื้อสินค้า...**' });
    } catch (err) {
        logger.error({ err }, 'Failed to defer or edit initial reply');
        return;
    }

    try {
        const idempotencyKey = uuidv4();
        const payload: CreateOrderRequest = {
            server_id: guildId,
            product_id: productId,
            discord_user_id: userId,
            idempotency_key: idempotencyKey,
        };

        logger.info({ guildId, productId, userId, backend: BACKEND_URL }, 'Calling backend for order creation');

        const res = await fetch(`${BACKEND_URL}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...payload,
                discord_guild_id: guildId,
                discord_channel_id: interaction.channelId,
                interaction_token: interaction.token,
            }),
        });

        const data = await res.json() as any;

        if (!res.ok) {
            if (res.status === 429) {
                await interaction.editReply({
                    content: `⏳ **Pending Order Exists**\n\n${data.message}`,
                });
                return;
            }

            logger.warn({ status: res.status, data }, 'Backend returned error');
            await interaction.editReply({
                content: `❌ **Payment Error**\n\n${data.error || data.message || 'Payment gateway error. Please try again.'}`,
            });
            return;
        }

        const { amount, qr_code_url, expires_at, receiver_name, receiver_account_masked } = data as CreateOrderResponse;

        // Create Embed
        const embed = new EmbedBuilder()
            .setTitle('PromptPay QR Payment')
            .setDescription('Please scan the QR code within your banking app to complete the purchase.')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Receiver', value: `${receiver_name}\n${receiver_account_masked}`, inline: false },
                { name: 'Amount', value: `฿ ${(amount / 100).toFixed(2)}`, inline: true },
                { name: 'Expires At', value: `<t:${Math.floor(new Date(expires_at).getTime() / 1000)}:R>`, inline: true }
            )
            .setImage(qr_code_url)
            .setFooter({ text: '⚠️ Role is assigned automatically after payment. Do NOT pay after expiration.' });

        await interaction.editReply({ content: '', embeds: [embed] });

    } catch (err) {
        logger.error({ err }, 'Error handling button click');
        await interaction.editReply({
            content: '❌ **Internal Error**\n\nFailed to contact payment system.',
        });
    }
}

