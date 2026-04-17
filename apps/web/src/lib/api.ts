import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://paynoybackend-production.up.railway.app';

const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Required for httpOnly cookies
});

// Force credentials on every request
client.interceptors.request.use((config: any) => {
    config.withCredentials = true;
    return config;
});

// Interceptor to handle errors
client.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            // Unauthenticated
        }
        return Promise.reject(error.response?.data || error);
    }
);

export const api = {
    /**
     * Get current user profile
     */
    async getMe() {
        // Cache bust for Vercel edge/CDN
        const { data } = await client.get(`/api/me?t=${Date.now()}`);
        return { user: data };
    },

    /**
     * Refresh guilds cache from Discord
     * In this implementation, we return the cached guilds from the user profile
     */
    async refreshGuilds() {
        const { data } = await client.get(`/api/me?t=${Date.now()}`);
        // The backend auth/callback already populates guilds_cache
        // Here we can simply return what is in the cache
        return { guilds: data.guilds_cache || [] };
    },

    /**
     * Get specific server details
     */
    async getServer(id: string) {
        const { data } = await client.get(`/api/server/${id}`);
        return { server: data };
    },

    /**
     * Get products for a server
     */
    async getProducts(guildId: string) {
        // getServer returns products in this schema
        const { data } = await client.get(`/api/server/${guildId}`);
        return { products: data.products || [] };
    },

    /**
     * Get orders for a server
     */
    async getOrders(guildId: string, page = 1, limit = 10) {
        const { data } = await client.get(`/api/orders?guildId=${guildId}&page=${page}&limit=${limit}`);
        return data;
    },

    /**
     * Update server PromptPay settings
     */
    async updateServerSettings(guildId: string, settings: { promptpay_name: string; promptpay_account: string }) {
        const { data } = await client.post(`/api/server/${guildId}/settings`, settings);
        return data;
    },

    /**
     * Logout
     */
    async logout() {
        await client.post('/auth/logout');
    },

    /**
     * Bot invite URL
     */
    getBotInviteUrl(guildId: string) {
        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1493590565504286740';
        const perms = '8'; // Admin
        return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&guild_id=${guildId}&permissions=${perms}&scope=bot%20applications.commands`;
    }
};
