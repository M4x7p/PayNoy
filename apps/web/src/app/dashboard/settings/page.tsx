'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const { activeServer, refreshGuilds } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');

    const [settings, setSettings] = useState({
        promptpay_name: '',
        promptpay_account: ''
    });

    useEffect(() => {
        if (activeServer) {
            setSettings({
                promptpay_name: activeServer.promptpay_name || '',
                promptpay_account: activeServer.promptpay_account || ''
            });
        }
    }, [activeServer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeServer) return;

        setLoading(true);
        setError('');
        setSaveSuccess(false);

        try {
            await api.updateServerSettings(activeServer.discord_guild_id, settings);
            await refreshGuilds();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    if (!activeServer) {
        return <div className="dash-empty-state">กรุณาเลือกเซิร์ฟเวอร์ก่อนเข้าหน้าตั้งค่า</div>;
    }

    return (
        <div className="dash-page">
            <h1 className="dash-page-title">ตั้งค่า</h1>

            <div className="dash-section">
                <div className="settings-card">
                    <h2 className="settings-title">ข้อมูลการรับเงิน (PromptPay)</h2>
                    <p className="settings-description">
                        ตั้งค่าบัญชีเพื่อให้ลูกค้าโอนเงินเข้าโดยตรง ระบบจะตรวจสอบสลิปอัตโนมัติจากข้อมูลที่คุณระบุไว้ที่นี่
                    </p>

                    <form onSubmit={handleSubmit} className="settings-form">
                        <div className="form-group">
                            <label>ชื่อบัญชี PromptPay</label>
                            <input
                                type="text"
                                placeholder="เช่น นายสมชาย ใจดี"
                                value={settings.promptpay_name}
                                onChange={(e) => setSettings({ ...settings, promptpay_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>เบอร์โทรศัพท์ / เลขบัตรประชาชน (PromptPay)</label>
                            <input
                                type="text"
                                placeholder="เช่น 0812345678"
                                value={settings.promptpay_account}
                                onChange={(e) => setSettings({ ...settings, promptpay_account: e.target.value })}
                                required
                            />
                        </div>

                        {error && <div className="settings-error">{error}</div>}
                        {saveSuccess && <div className="settings-success">✅ บันทึกข้อมูลเรียบร้อยแล้ว</div>}

                        <div className="settings-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .settings-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
                    max-width: 600px;
                }
                .settings-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
                .settings-description { color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
                
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #475569; }
                .form-group input {
                    width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
                    font-size: 15px; transition: border-color 0.2s;
                }
                .form-group input:focus { outline: none; border-color: #5865f2; }

                .save-btn {
                    background: #5865f2; color: white; padding: 10px 20px; border: none;
                    border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                }
                .save-btn:hover { background: #4752c4; }
                .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .settings-error { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
                .settings-success { background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            `}</style>
        </div>
    );
}
