import { ChatInputCommandInteraction } from 'discord.js';
import { Logger } from 'pino';

const BACKEND_URL = process.env.BACKEND_URL || 'https://paynoybackend-production.up.railway.app';

export async function handleSetupCommand(
    interaction: ChatInputCommandInteraction,
    logger: Logger
): Promise<void> {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (!guildId) {
        await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true,
        });
        return;
    }

    // Check admin rights
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({
            content: 'You need Administrator permissions to setup PayNoy.',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const supportChannel = interaction.options.getChannel('support_channel');

    try {
        // Sync with backend
        logger.info({ guildId, userId, supportChannelId: supportChannel?.id }, 'Processing /setup command');

        // 1. Basic registration (simulated)
        // 2. Update support channel if provided
        if (supportChannel) {
            await fetch(`${BACKEND_URL}/server/${guildId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ support_channel_id: supportChannel.id }),
            });
        }

        await interaction.editReply({
            content: `✅ **Setup Initialized**\n\nYour Discord server has been linked. Please visit the [Dashboard](${process.env.DASHBOARD_URL || 'http://localhost:3000'}) to finish configuration and create products.`,
        });
    } catch (err) {
        logger.error({ err }, 'Error handling setup command');
        await interaction.editReply({
            content: '❌ **Setup Failed**\n\nFailed to register server. Please try again later.',
        });
    }
}
