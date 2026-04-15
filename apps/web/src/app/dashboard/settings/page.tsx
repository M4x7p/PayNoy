'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '../layout';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const { activeServer } = useDashboard();
    const [promptpayName, setPromptpayName] = useState('');
    const [promptpayAccount, setPromptpayAccount] = useState('');
    const [supportChannelId, setSupportChannelId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!activeServer) return;
        setPromptpayName(activeServer.promptpay_name || '');
        setPromptpayAccount(activeServer.promptpay_account || '');
        setSupportChannelId(activeServer.support_channel_id || '');
        setLoading(false);
    }, [activeServer]);

    const maskAccount = (acc: string) => {
        if (!acc || acc.length < 6) return acc;
        return `${acc.slice(0, 3)}-xxx-${acc.slice(-4)}`;
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await api.updateSettings(activeServer.id, {
                promptpay_name: promptpayName,
                promptpay_account: promptpayAccount,
                support_channel_id: supportChannelId,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert(err.message || 'Error saving settings');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="dash-page-loading"><div className="dash-spinner" /><p>กำลังโหลด...</p></div>;
    }

    return (
        <div className="dash-page">
            <h1 className="dash-page-title">ตั้งค่า</h1>
            <p className="dash-page-subtitle">การตั้งค่าเซิร์ฟเวอร์และการชำระเงิน</p>

            <div className="dash-settings-card">
                <h2>PromptPay</h2>

                <label>
                    <span>ชื่อผู้รับเงิน</span>
                    <input
                        type="text"
                        value={promptpayName}
                        onChange={(e) => setPromptpayName(e.target.value)}
                        className="dash-input"
                        placeholder="เช่น นายสมชาย ใจดี"
                    />
                </label>

                <label>
                    <span>หมายเลข PromptPay</span>
                    <input
                        type="text"
                        value={promptpayAccount}
                        onChange={(e) => setPromptpayAccount(e.target.value)}
                        className="dash-input"
                        placeholder="เช่น 0812345678"
                    />
                    {promptpayAccount && (
                        <p className="dash-settings-hint">แสดงผล: {maskAccount(promptpayAccount)}</p>
                    )}
                </label>
            </div>

            <div className="dash-settings-card">
                <h2>Discord</h2>

                <label>
                    <span>Support Channel ID</span>
                    <input
                        type="text"
                        value={supportChannelId}
                        onChange={(e) => setSupportChannelId(e.target.value)}
                        className="dash-input"
                        placeholder="เช่น 1234567890123456789"
                    />
                    <p className="dash-settings-hint">Channel ที่จะส่งข้อความแจ้งเตือนเมื่อมีคำสั่งซื้อ</p>
                </label>
            </div>

            <div className="dash-settings-card">
                <h2>ข้อมูลเซิร์ฟเวอร์</h2>
                <div className="dash-settings-info">
                    <p><strong>Plan:</strong> <span className="dash-plan-badge">{activeServer?.plan || 'free'}</span></p>
                    <p><strong>Status:</strong> {activeServer?.status}</p>
                    <p><strong>Guild ID:</strong> <code>{activeServer?.discord_guild_id}</code></p>
                    <p><strong>สมัครเมื่อ:</strong> {activeServer?.created_at ? new Date(activeServer.created_at).toLocaleDateString('th-TH') : '-'}</p>
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="dash-btn-primary dash-btn-lg">
                {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : '💾 บันทึกการตั้งค่า'}
            </button>
        </div>
    );
}
