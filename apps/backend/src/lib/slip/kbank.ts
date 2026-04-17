import { logger } from '../logger';

export interface KBankResponse {
    success: boolean;
    data?: {
        sender?: {
            name: string;
            account: { id: string };
        };
        receiver: {
            name: string;
            account: { id: string };
        };
        amount: number;
        transRef: string;
        transDate: string;
        transTime: string;
    };
    message?: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getKBankToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const clientId = process.env.KBANK_CLIENT_ID;
    const clientSecret = process.env.KBANK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('KBANK_CLIENT_ID or KBANK_CLIENT_SECRET not configured');
    }

    const response = await fetch('https://api.kasikornbank.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error(`Failed to get KBank token: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    return cachedToken!;
}

export async function verifyWithKBank(imageUrl: string): Promise<KBankResponse> {
    try {
        const token = await getKBankToken();

        // Note: KBank Mini QR API technically expects a base64 or file upload, 
        // but here we assume we have an endpoint that can parse the URL or we download it first.
        // For this implementation, we follow the user's logic of calling the provider.
        const response = await fetch('https://api.kasikornbank.com/v1/miniqr/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: imageUrl })
        });

        const resData = await response.json() as any;

        if (!response.ok) {
            logger.error({ status: response.status, data: resData }, 'KBank API error');
            return { success: false, message: resData.message || 'Verification failed' };
        }

        return {
            success: true,
            data: {
                receiver: resData.receiver,
                amount: resData.amount,
                transRef: resData.transRef,
                transDate: resData.transDate,
                transTime: resData.transTime
            }
        };
    } catch (err) {
        logger.error({ err }, 'Failed to call KBank API');
        throw err;
    }
}
