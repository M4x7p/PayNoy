import { logger } from './logger';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

function getHeaders(): Record<string, string> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('Missing DISCORD_BOT_TOKEN');

    return {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Assign a role to a guild member.
 */
export async function assignRole(
    guildId: string,
    userId: string,
    roleId: string
): Promise<void> {
    const url = `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`;

    const res = await fetch(url, {
        method: 'PUT',
        headers: getHeaders(),
    });

    if (!res.ok) {
        const body = await res.text();
        logger.error({ guildId, userId, roleId, status: res.status, body }, 'Failed to assign role');
        throw new Error(`Discord API error ${res.status}: ${body}`);
    }

    logger.info({ guildId, userId, roleId }, 'Role assigned successfully');
}

/**
 * Get the bot's highest role position in a guild.
 * Used to validate that the bot can assign the target role.
 */
export async function getBotRolePosition(guildId: string): Promise<number> {
    const botUser = await getBotUser();
    const memberUrl = `${DISCORD_API_BASE}/guilds/${guildId}/members/${botUser.id}`;

    const memberRes = await fetch(memberUrl, { headers: getHeaders() });
    if (!memberRes.ok) throw new Error(`Failed to get bot member: ${memberRes.status}`);
    const member = (await memberRes.json()) as { roles: string[] };

    const rolesUrl = `${DISCORD_API_BASE}/guilds/${guildId}/roles`;
    const rolesRes = await fetch(rolesUrl, { headers: getHeaders() });
    if (!rolesRes.ok) throw new Error(`Failed to get guild roles: ${rolesRes.status}`);
    const roles = (await rolesRes.json()) as Array<{ id: string; position: number }>;

    const botRoles = roles.filter((r) => member.roles.includes(r.id));
    return Math.max(0, ...botRoles.map((r) => r.position));
}

/**
 * Check whether the bot can assign a specific role (hierarchy check).
 */
export async function canAssignRole(guildId: string, roleId: string): Promise<boolean> {
    try {
        const rolesUrl = `${DISCORD_API_BASE}/guilds/${guildId}/roles`;
        const rolesRes = await fetch(rolesUrl, { headers: getHeaders() });
        if (!rolesRes.ok) return false;

        const roles = (await rolesRes.json()) as Array<{ id: string; position: number }>;
        const targetRole = roles.find((r) => r.id === roleId);
        if (!targetRole) return false;

        const botHighest = await getBotRolePosition(guildId);
        return botHighest > targetRole.position;
    } catch (err) {
        logger.error({ err, guildId, roleId }, 'Error checking role hierarchy');
        return false;
    }
}

/**
 * Get the bot's own user object (cached).
 */
let cachedBotUser: { id: string; username: string } | null = null;

async function getBotUser(): Promise<{ id: string; username: string }> {
    if (cachedBotUser) return cachedBotUser;

    const res = await fetch(`${DISCORD_API_BASE}/users/@me`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to get bot user: ${res.status}`);

    cachedBotUser = (await res.json()) as { id: string; username: string };
    return cachedBotUser;
}

/**
 * Send a direct message (DM) to a user via Discord REST API
 */
export async function sendDirectMessage(userId: string, payload: { content?: string; embeds?: any[] }): Promise<void> {
    try {
        // Step 1: Initialize/get the DM channel ID
        const dmChannelRes = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ recipient_id: userId }),
        });

        if (!dmChannelRes.ok) {
            logger.warn({ userId, status: dmChannelRes.status }, 'Failed to open DM channel with user');
            return; // Usually means user has DMs disabled
        }

        const channel = (await dmChannelRes.json()) as { id: string };

        // Step 2: Send the message payload
        const msgRes = await fetch(`${DISCORD_API_BASE}/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!msgRes.ok) {
            logger.warn({ userId, status: msgRes.status }, 'Failed to send DM message payload');
        }
    } catch (err) {
        logger.error({ err, userId }, 'Error attempting to send DM');
    }
}

/**
 * Update an existing interaction message using its token.
 * Interactions are valid for 15 minutes.
 */
export async function updateInteractionMessage(interactionToken: string, payload: any): Promise<void> {
    try {
        const appId = process.env.DISCORD_APP_ID;
        if (!appId) throw new Error('Missing DISCORD_APP_ID');

        const url = `${DISCORD_API_BASE}/webhooks/${appId}/${interactionToken}/messages/@original`;

        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = await res.text();
            logger.warn({ status: res.status, body }, 'Failed to update interaction message');
        }
    } catch (err) {
        logger.error({ err }, 'Error updating interaction message');
    }
}

/**
 * Send a message to a specific channel (fallback/notification).
 */
export async function sendChannelMessage(channelId: string, payload: any): Promise<void> {
    try {
        const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`;

        const res = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = await res.text();
            logger.warn({ channelId, status: res.status, body }, 'Failed to send channel message');
        }
    } catch (err) {
        logger.error({ err, channelId }, 'Error sending channel message');
    }
}
