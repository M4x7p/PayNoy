import { logger } from '../logger';

export interface SlipOKResponse {
    success: boolean;
    data?: {
        sender: {
            name: string;
            account: {
                id: string;
            };
        };
        receiver: {
            name: string;
            account: {
                id: string;
            };
        };
        amount: number;
        transRef: string;
        transDate: string;
        transTime: string;
    };
    message?: string;
}

export async function verifyWithSlipOK(imageUrl: string): Promise<SlipOKResponse> {
    const apiKey = process.env.SLIPOK_API_KEY;
    if (!apiKey) {
        throw new Error('SLIPOK_API_KEY is not configured');
    }

    try {
        const response = await fetch('https://api.slipok.com/api/line/apikey/28839', {
            method: 'POST',
            headers: {
                'x-lib-apikey': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: imageUrl,
                log_p_id: 'PayNoy'
            })
        });

        const resData = await response.json() as any;

        if (!response.ok) {
            logger.error({ status: response.status, data: resData }, 'SlipOK API error');
            return { success: false, message: resData.message || 'Verification failed' };
        }

        return {
            success: true,
            data: {
                sender: resData.data.sender,
                receiver: resData.data.receiver,
                amount: resData.data.amount,
                transRef: resData.data.transRef,
                transDate: resData.data.transDate,
                transTime: resData.data.transTime
            }
        };
    } catch (err) {
        logger.error({ err }, 'Failed to call SlipOK API');
        throw err;
    }
}
