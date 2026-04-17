import { ButtonInteraction, MessageCollector, TextChannel } from 'discord.js';
import { Logger } from 'pino';

const BACKEND_URL = process.env.BACKEND_URL || 'https://paynoybackend-production.up.railway.app';

export async function handleSlipVerification(
    interaction: ButtonInteraction,
    logger: Logger
): Promise<void> {
    const orderId = interaction.customId.replace('verify_slip_', '');
    const userId = interaction.user.id;

    logger.info({ orderId, userId }, 'Starting slip verification flow');

    try {
        await interaction.reply({
            content: '📸 **กรุณาอัปโหลดรูปภาพสลิปการโอนเงินที่นี่** (ภายใน 10 นาที)\nบอทจะทำการตรวจสอบโดยอัตโนมัติครับ',
            ephemeral: true
        });

        const filter = (m: any) => m.author.id === userId && m.attachments.size > 0;
        const channel = interaction.channel as TextChannel;
        const collector = channel?.createMessageCollector({
            filter,
            max: 1,
            time: 600000 // 10 minutes
        });

        collector?.on('collect', async (message: any) => {
            const attachment = message.attachments.first();
            if (!attachment) return;

            logger.info({ orderId, url: attachment.url }, 'Slip attachment collected');

            const statusMsg = await message.reply('⏳ **กำลังตรวจสอบสลิปของคุณ...** โปรดรอสักครู่');

            try {
                const res = await fetch(`${BACKEND_URL}/verify-slip`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: orderId,
                        slip_url: attachment.url,
                        uploader_discord_id: userId
                    })
                });

                const resData = await res.json() as any;

                if (res.ok && resData.success) {
                    await statusMsg.edit('✅ **ตรวจสอบสำเร็จ!** ระบบกำลังอัปเดตสถานะและมอบยศให้คุณครับ');
                    logger.info({ orderId }, 'Slip verified successfully via bot');
                } else {
                    await statusMsg.edit(`❌ **ตรวจสอบไม่สำเร็จ**\n\nเหตุผล: ${resData.error || 'ข้อมูลสลิปไม่ถูกต้อง'}`);
                    logger.warn({ orderId, error: resData.error }, 'Slip verification failed via bot');
                }
            } catch (err) {
                logger.error({ err }, 'Error during slip verification call');
                await statusMsg.edit('❌ **ผิดพลาด**\nไม่สามารถติดต่อระบบตรวจสอบได้ในขณะนี้');
            }
        });

        collector?.on('end', (collected: any) => {
            if (collected.size === 0) {
                interaction.followUp({
                    content: '⏰ **หมดเวลาการส่งสลิป** หากคุณโอนเงินแล้วและติดปัญหากรุณาติดต่อ Admin ครับ',
                    ephemeral: true
                }).catch(() => { });
            }
        });

    } catch (err) {
        logger.error({ err }, 'Failed to initiate slip verification flow');
        await interaction.followUp({
            content: '❌ **เกิดข้อผิดพลาด** ไม่สามารถเริ่มการตรวจสอบได้',
            ephemeral: true
        });
    }
}
