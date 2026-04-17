import {
    Client,
    GatewayIntentBits,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
} from 'discord.js';
import pino from 'pino';
import { handleButtonInteraction } from './interactions/button';
import { handleSetupCommand } from './commands/setup';
import { handleSupportCommand } from './commands/support';

// ── Logger ──────────────────────────────────────────────────

const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
        process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    base: { service: 'paynoy-bot' },
});

// ── Environment validation ──────────────────────────────────

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!DISCORD_BOT_TOKEN) {
    logger.fatal('Missing DISCORD_BOT_TOKEN');
    process.exit(1);
}

if (!DISCORD_CLIENT_ID) {
    logger.fatal('Missing DISCORD_CLIENT_ID');
    process.exit(1);
}

// ── Register Slash Commands ─────────────────────────────────

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Register this server with PayNoy')
            .addChannelOption((option: any) =>
                option
                    .setName('support_channel')
                    .setDescription('Channel where support/refund requests should be sent')
                    .setRequired(false)
            )
            .setDefaultMemberPermissions('0') // Admin only
            .toJSON(),
        new SlashCommandBuilder()
            .setName('support')
            .setDescription('Get help with a payment or request a refund')
            .toJSON(),
    ];

    try {
        await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID!), {
            body: commands,
        });
        logger.info('Slash commands registered');
    } catch (err) {
        logger.error({ err }, 'Failed to register slash commands');
    }
}

// ── Create Bot Client ───────────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

// ── Ready Event ─────────────────────────────────────────────

client.once(Events.ClientReady, (readyClient: any) => {
    logger.info({ tag: readyClient.user.tag }, `🤖 Bot logged in`);
});

// ── Interaction Handler ─────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction: any) => {
    logger.info({
        id: interaction.id,
        type: interaction.type,
        isButton: interaction.isButton(),
        isCommand: interaction.isChatInputCommand(),
        guildId: interaction.guildId
    }, 'Received Interaction');

    try {
        // Handle button clicks
        if (interaction.isButton()) {
            logger.info({ customId: interaction.customId }, 'Handling button interaction');
            await handleButtonInteraction(interaction, logger);
            return;
        }

        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'setup') {
                await handleSetupCommand(interaction, logger);
                return;
            }
            if (interaction.commandName === 'support') {
                await handleSupportCommand(interaction, logger);
                return;
            }
        }
    } catch (err) {
        logger.error({ err, interactionId: interaction.id }, 'Interaction handler error');

        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred. Please try again later.',
                ephemeral: true,
            }).catch(() => { });
        }
    }
});

// ── Start (DIAGNOSTIC MINIMAL MODE) ───────────────────────────

async function start() {
    logger.info({
        hasToken: !!DISCORD_BOT_TOKEN,
        hasClientId: !!DISCORD_CLIENT_ID,
        nodeVersion: process.version,
        env: process.env.NODE_ENV
    }, 'Bot diagnostic startup initiated');

    try {
        // Temporarily skip command registration to avoid API issues on boot
        logger.info('Skipping command registration for diagnostics...');

        logger.info('Attempting Discord login...');
        await client.login(DISCORD_BOT_TOKEN);

        logger.info('🚀 PayNoy bot login command sent successfully');
    } catch (err: any) {
        logger.fatal({ err: err.message, stack: err.stack }, 'FAILED TO LOGIN TO DISCORD');
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection at Bot Process');
});

process.on('uncaughtException', (err, origin) => {
    logger.error({ err, origin }, 'Uncaught Exception at Bot Process');
});

start().catch((err) => {
    logger.fatal({ err }, 'Failed to start bot');
    process.exit(1);
});
