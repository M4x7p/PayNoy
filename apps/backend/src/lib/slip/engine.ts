import { getSupabaseClient } from '@paynoy/db';
import { logger } from '../logger';
import { verifyWithKBank } from './kbank';
import { verifyWithSlipOK } from './slipok';

export interface VerificationResult {
    success: boolean;
    provider?: 'kbank' | 'slipok';
    message?: string;
    data?: any;
}

export async function verifySlip(
    orderId: string,
    uploaderDiscordId: string,
    imageUrl: string
): Promise<VerificationResult> {
    const db = getSupabaseClient();
    const reqLog = logger.child({ orderId, uploaderDiscordId });

    // 1. Fetch Order Data
    const { data: order, error: fetchError } = await db
        .from('orders')
        .select('*, servers(promptpay_account)')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        return { success: false, message: 'Order not found' };
    }

    // ── SECURITY RULES ──────────────────────────────────────

    // Rule 1: User Binding
    if (order.user_discord_id !== uploaderDiscordId) {
        reqLog.warn({ expected: order.user_discord_id, actual: uploaderDiscordId }, 'User binding violation');
        return { success: false, message: 'This slip does not belong to your order' };
    }

    // Rule 2: Time Validation (10-minute window)
    const orderTime = new Date(order.created_at).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    if (now - orderTime > tenMinutes) {
        reqLog.warn('Slip upload outside 10-minute window');
        return { success: false, message: 'Verification window expired (10 minutes max)' };
    }

    // Rule 3: Rate Limiting (Attempt tracking)
    if (order.verification_attempts >= 3) {
        return { success: false, message: 'Maximum verification attempts (3) exceeded' };
    }

    // ── VERIFICATION FLOW ────────────────────────────────────

    // Increment attempts immediately
    await db.from('orders').update({
        verification_attempts: order.verification_attempts + 1,
        last_attempt_at: new Date().toISOString()
    }).eq('id', orderId);

    let result: VerificationResult = { success: false };

    // Primary: KBank
    try {
        reqLog.info('Trying KBank verification...');
        const kBankRes = await verifyWithKBank(imageUrl);
        if (kBankRes.success && kBankRes.data) {
            result = { success: true, provider: 'kbank', data: kBankRes.data };
        } else {
            reqLog.warn({ msg: kBankRes.message }, 'KBank verification failed or returned no data');
        }
    } catch (err) {
        reqLog.error({ err }, 'KBank provider error - falling back to SlipOK');
    }

    // Fallback: SlipOK
    if (!result.success) {
        try {
            reqLog.info('Trying SlipOK verification (fallback)...');
            const slipOKRes = await verifyWithSlipOK(imageUrl);
            if (slipOKRes.success && slipOKRes.data) {
                result = { success: true, provider: 'slipok', data: slipOKRes.data };
            }
        } catch (err) {
            reqLog.error({ err }, 'SlipOK provider error');
        }
    }

    if (!result.success) {
        return { success: false, message: 'Could not verify slip with any provider' };
    }

    // ── DATA VALIDATION (Post-Provider) ──────────────────────

    const { data: vData } = result;
    const serverPromptPay = (order.servers as any)?.promptpay_account;

    // 1. Amount Check (Convert satang to Baht if needed)
    // order.amount is in satang (e.g. 10000 = 100 THB)
    const expectedBaht = order.amount / 100;
    if (Math.abs(vData.amount - expectedBaht) > 0.01) {
        reqLog.warn({ expected: expectedBaht, actual: vData.amount }, 'Amount mismatch');
        return { success: false, message: 'Amount on slip does not match order' };
    }

    // 2. Receiver Check
    if (serverPromptPay && vData.receiver.account.id !== serverPromptPay) {
        reqLog.warn({ expected: serverPromptPay, actual: vData.receiver.account.id }, 'Receiver mismatch');
        return { success: false, message: 'This slip was not paid to the correct seller account' };
    }

    // 3. Duplicate Check (Deduplication)
    const { data: existingTrans } = await db
        .from('orders')
        .select('id')
        .eq('slip_trans_ref', vData.transRef)
        .neq('id', orderId)
        .maybeSingle();

    if (existingTrans) {
        reqLog.warn({ transRef: vData.transRef }, 'Duplicate slip detected');
        return { success: false, message: 'This slip has already been used' };
    }

    // ── SUCCESS ──────────────────────────────────────────────

    // Update order to Success
    await db.from('orders').update({
        status: 'success',
        slip_url: imageUrl,
        slip_trans_ref: vData.transRef,
        verification_provider: result.provider,
        verification_data: vData
    }).eq('id', orderId);

    reqLog.info('Slip verified successfully');
    return { success: true, provider: result.provider, data: vData };
}
