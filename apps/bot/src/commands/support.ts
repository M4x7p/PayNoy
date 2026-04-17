import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from 'discord.js';
import { Logger } from 'pino';

const BACKEND_URL = process.env.BACKEND_URL || 'https://paynoybackend-production.up.railway.app';

export async function handleSupportCommand(
    interaction: ChatInputCommandInteraction,
    logger: Logger
): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) return;

    await interaction.deferReply({ ephemeral: true });

    try {
        // Fetch support config
        const res = await fetch(`${BACKEND_URL}/server/${guildId}/config`);
        const data = await res.json() as any;

        const supportChannelId = data.support_channel_id;

        if (!supportChannelId) {
            await interaction.editReply({
                content: '❌ **Support Not Configured**\nThe server administrators haven\'t set up a support channel yet. Please contact a server moderator or the owner directly for assistance.',
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('PayNoy Support')
            .setDescription('Need help with a payment, role assignment, or refund? Click the button below to notify the support team.')
            .setColor(0x5865F2);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('request_support')
                .setLabel('Request Support / Refund')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
        );

        const response = await interaction.editReply({
            embeds: [embed],
            components: [row],
        });

        // Handle button collector for the support request
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });

        collector.on('collect', async (i: any) => {
            if (i.customId === 'request_support') {
                await i.deferUpdate();

                // Notify support channel
                const supportChannel = await interaction.guild?.channels.fetch(supportChannelId);
                if (supportChannel?.isTextBased()) {
                    const supportEmbed = new EmbedBuilder()
                        .setTitle('New Support Request')
                        .addFields(
                            { name: 'User', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                            { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true }
                        )
                        .setColor(0xFFA500)
                        .setTimestamp();

                    await supportChannel.send({
                        content: `🔔 **Support Needed** — <@&${interaction.guild?.ownerId}> (or staff)`,
                        embeds: [supportEmbed],
                    });

                    await i.editReply({
                        content: '✅ **Request Sent**\nThe support team has been notified. They will contact you or post in the support channel soon.',
                        embeds: [],
                        components: [],
                    });
                } else {
                    await i.editReply({
                        content: '❌ **Support Channel Error**\nThe configured support channel is invalid or inaccessible. Please contact staff directly.',
                        embeds: [],
                        components: [],
                    });
                }
            }
        });

    } catch (err) {
        logger.error({ err }, 'Error handling support command');
        await interaction.editReply({
            content: '❌ **Error**\nFailed to load support settings. Please try again later.',
        });
    }
}
