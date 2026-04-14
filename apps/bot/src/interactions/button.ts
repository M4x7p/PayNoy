import { ButtonInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, CreateOrderResponse } from '@paynoy/types';
import { Logger } from 'pino';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function handleButtonInteraction(
    interaction: ButtonInteraction,
    logger: Logger
): Promise<void> {
    const customId = interaction.customId;

    // We only handle button IDs starting with "buy_"
    if (!customId.startsWith('buy_')) return;

    const productId = customId.replace('buy_', '');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (!guildId) {
        await interaction.reply({
            content: 'This button can only be used in a server.',
            ephemeral: true,
        });
        return;
    }

    // Defer reply as API call might take a moment
    await interaction.deferReply({ ephemeral: true });

    try {
        const idempotencyKey = uuidv4();
        const payload: CreateOrderRequest = {
            server_id: guildId, // Wait, backend expects server_id (UUID), but we only have guildId (Discord Snowflake).
            product_id: productId,
            discord_user_id: userId,
            idempotency_key: idempotencyKey,
        };

        logger.info({ guildId, productId, userId }, 'Calling backend for order creation');

        // Make API call to backend
        // NOTE: Backend needs to be updated to accept discord_guild_id instead of server_id UUID,
        // or bot needs to translate it. For this implementation, we assume backend route
        // order.ts was expecting the UUID. Let me fix this in the payload mapping:
        // the backend order.ts expects `server_id` to be the UUID, so we need a way
        // to map it. Actually, the easiest fix is that the bot shouldn't know the DB UUID.
        // I should tweak the backend to accept discord_guild_id OR the bot should fetch it.
        // To keep bot stateless, we'll send it as `discord_guild_id` and I'll create a tiny backend tweak via multi-replace or just pass guild_id here and let backend handle it.

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

        await interaction.editReply({ embeds: [embed] });

    } catch (err) {
        logger.error({ err }, 'Error handling button click');
        await interaction.editReply({
            content: '❌ **Internal Error**\n\nFailed to contact payment system.',
        });
    }
}
