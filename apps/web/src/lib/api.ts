const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
    params?: Record<string, string | number>;
}

class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${API_BASE}${path}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => searchParams.set(key, String(value)));
        url += `?${searchParams.toString()}`;
    }

    const res = await fetch(url, {
        ...fetchOptions,
        credentials: 'include', // Send httpOnly cookies
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        // Redirect to login on 401
        if (res.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/dashboard/login';
            throw new ApiError('Session expired', 401);
        }

        throw new ApiError(body.message || body.error || 'Request failed', res.status, body.code);
    }

    return res.json();
}

// ── Public API ─────────────────────────────────────────────

export const api = {
    // Auth
    getLoginUrl: () => `${API_BASE}/auth/discord`,
    logout: () => request('/auth/logout', { method: 'POST' }),

    // User
    getMe: () => request<{ user: any }>('/api/me'),

    // Guilds
    getGuilds: () => request<{ guilds: any[] }>('/api/guilds'),
    refreshGuilds: () => request<{ guilds: any[] }>('/api/guilds/refresh'),

    // Server
    getServer: (id: string) => request<{ server: any }>(`/api/server/${id}`),
    updateSettings: (id: string, data: any) =>
        request(`/api/server/${id}/settings`, { method: 'POST', body: JSON.stringify(data) }),

    // Products
    getProducts: (serverId: string) => request<{ products: any[] }>(`/api/server/${serverId}/products`),
    createProduct: (serverId: string, data: any) =>
        request<{ product: any }>(`/api/server/${serverId}/products`, { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (serverId: string, productId: string, data: any) =>
        request<{ product: any }>(`/api/server/${serverId}/products/${productId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (serverId: string, productId: string) =>
        request(`/api/server/${serverId}/products/${productId}`, { method: 'DELETE' }),

    // Orders
    getOrders: (serverId: string, page = 1, limit = 20) =>
        request<{ orders: any[]; total: number; page: number; limit: number }>(
            `/api/server/${serverId}/orders`, { params: { page, limit } }
        ),

    completeOnboarding: (data: {
        guild_id: string;
        guild_name: string;
        promptpay_name: string;
        promptpay_account: string;
        omise_secret_key?: string;
        omise_public_key?: string;
        omise_webhook_secret?: string;
    }) =>
        request('/api/onboarding/complete', { method: 'POST', body: JSON.stringify(data) }),

    // Discord Utils
    getChannels: (serverId: string) => request<{ channels: any[] }>(`/api/server/${serverId}/channels`),
    postProduct: (serverId: string, productId: string, channelId: string) =>
        request<{ success: true }>(`/api/server/${serverId}/products/${productId}/post`, {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId })
        }),

    // Bot invite URL
    getBotInviteUrl: (guildId: string) =>
        `https://discord.com/oauth2/authorize?client_id=1493590565504286740&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}`,
};

export { ApiError };
