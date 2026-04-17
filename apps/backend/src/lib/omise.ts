import Omise from 'omise';
import { OmiseSource, OmiseCharge } from '@paynoy/types';
import { logger } from './logger';

/**
 * Gets an Omise client instance for a specific secret key.
 */
function getClient(secretKey: string) {
    return Omise({
        secretKey,
        omiseVersion: '2019-05-29',
    });
}

/**
 * Create a PromptPay source for the given amount.
 */
export async function createPromptPaySource(secretKey: string, amount: number): Promise<OmiseSource> {
    logger.info({ amount }, 'Creating PromptPay source');
    const client = getClient(secretKey);

    const source = await client.sources.create({
        type: 'promptpay',
        amount,
        currency: 'thb',
    });

    return source as unknown as OmiseSource;
}

/**
 * Create a charge from a source.
 */
export async function createCharge(
    secretKey: string,
    sourceId: string,
    amount: number,
    metadata: Record<string, string> = {}
): Promise<OmiseCharge> {
    logger.info({ sourceId, amount }, 'Creating charge');
    const client = getClient(secretKey);

    const charge = await client.charges.create({
        amount,
        currency: 'thb',
        source: sourceId,
        metadata,
    });

    return charge as unknown as OmiseCharge;
}

/**
 * Retrieve a charge by ID.
 */
export async function retrieveCharge(secretKey: string, chargeId: string): Promise<OmiseCharge> {
    const client = getClient(secretKey);
    const charge = await client.charges.retrieve(chargeId);
    return charge as unknown as OmiseCharge;
}
