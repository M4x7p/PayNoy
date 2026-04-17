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
    logger.info({ customId }, 'Handling button interaction (MINIMAL MODE)');

    try {
        // ULTRA MINIMAL RESPONSE TEST
        if (customId.startsWith('buy_')) {
            await interaction.reply({
                content: `✅ บอทได้รับคำสั่งแล้ว! (ID: ${customId})`,
                ephemeral: true
            });
            logger.info('Immediate reply sent successfully');
            return;
        }
    } catch (err) {
        logger.error({ err }, 'Failed to send minimal reply');
    }
}
