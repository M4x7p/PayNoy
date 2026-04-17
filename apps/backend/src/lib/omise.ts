import Omise from 'omise';
import { OmiseSource, OmiseCharge } from '@paynoy/types';
import { logger } from './logger';

const omiseClient = Omise({
    secretKey: process.env.OMISE_SECRET_KEY!,
    omiseVersion: '2019-05-29',
});

/**
 * Create a PromptPay source for the given amount.
 * @param amount Amount in satang (e.g. 10000 = 100 THB)
 */
export async function createPromptPaySource(amount: number): Promise<OmiseSource> {
    logger.info({ amount }, 'Creating PromptPay source');

    const source = await omiseClient.sources.create({
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
    sourceId: string,
    amount: number,
    metadata: Record<string, string> = {}
): Promise<OmiseCharge> {
    logger.info({ sourceId, amount }, 'Creating charge');

    const charge = await omiseClient.charges.create({
        amount,
        currency: 'thb',
        source: sourceId,
        metadata,
    });

    return charge as unknown as OmiseCharge;
}

/**
 * Retrieve a charge by ID (used for reconciliation).
 */
export async function retrieveCharge(chargeId: string): Promise<OmiseCharge> {
    const charge = await omiseClient.charges.retrieve(chargeId);
    return charge as unknown as OmiseCharge;
}
