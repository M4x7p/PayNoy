'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../layout';
import { api } from '@/lib/api';

export default function OnboardingPage() {
    const router = useRouter();
    const { guilds, user, refreshGuilds } = useDashboard();
    const [step, setStep] = useState(1);
    const [selectedGuild, setSelectedGuild] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [settings, setSettings] = useState({
        promptpay_name: '',
        promptpay_account: ''
    });

    const handleNext = () => {
        if (step === 1 && !selectedGuild) {
            setError('กรุณาเลือกเซิร์ฟเวอร์');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings.promptpay_name || !settings.promptpay_account) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.updateServerSettings(selectedGuild, settings);
            await refreshGuilds();
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboard-container">
            <div className="onboard-card">
                <div className="onboard-header">
                    <h1>ยินดีต้อนรับสู่ เปย์หน่อย</h1>
                    <p>ตั้งค่าเริ่มต้นสำหรับระบบรับเงินของคุณ</p>
                </div>

                <div className="onboard-steps">
                    <div className={`onboard-step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="onboard-divider" />
                    <div className={`onboard-step ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                {error && <div className="onboard-error">{error}</div>}

                {step === 1 ? (
                    <div className="onboard-content">
                        <h2>เลือกเซิร์ฟเวอร์หลัก</h2>
                        <p>เลือกเซิร์ฟเวอร์ Discord ที่คุณต้องการติดตั้งระบบ</p>
                        <div className="onboard-guild-list">
                            {guilds.map((g: any) => (
                                <button
                                    key={g.id}
                                    className={`onboard-guild-item ${selectedGuild === g.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedGuild(g.id)}
                                >
                                    {g.icon ? (
                                        <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=48`} alt="" />
                                    ) : (
                                        <div className="guild-icon-ph">{g.name.charAt(0)}</div>
                                    )}
                                    <span>{g.name}</span>
                                </button>
                            ))}
                        </div>
                        <button className="onboard-btn primary" onClick={handleNext}>ถัดไป</button>
                    </div>
                ) : (
                    <form className="onboard-content" onSubmit={handleSubmit}>
                        <h2>ตั้งค่าการรับเงิน</h2>
                        <p>ข้อมูล PromptPay สำหรับให้ลูกค้าโอนเงินเข้าโดยตรง (Seamless SaaS)</p>

                        <div className="onboard-form-group">
                            <label>ชื่อบัญชี PromptPay</label>
                            <input
                                type="text"
                                placeholder="เช่น นายสมชาย ใจดี"
                                value={settings.promptpay_name}
                                onChange={(e) => setSettings({ ...settings, promptpay_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="onboard-form-group">
                            <label>เบอร์โทรศัพท์ / เลขบัตรประชาชน (PromptPay)</label>
                            <input
                                type="text"
                                placeholder="เช่น 0812345678"
                                value={settings.promptpay_account}
                                onChange={(e) => setSettings({ ...settings, promptpay_account: e.target.value })}
                                required
                            />
                        </div>

                        <div className="onboard-actions">
                            <button type="button" className="onboard-btn" onClick={() => setStep(1)}>ย้อนกลับ</button>
                            <button type="submit" className="onboard-btn primary" disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : 'เริ่มใช้งานเปย์หน่อย'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style jsx>{`
                .onboard-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    padding: 20px;
                }
                .onboard-card {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    width: 100%;
                    max-width: 500px;
                }
                .onboard-header { text-align: center; margin-bottom: 30px; }
                .onboard-header h1 { font-size: 24px; color: #1e293b; margin-bottom: 8px; }
                .onboard-header p { color: #64748b; }
                
                .onboard-steps { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; }
                .onboard-step {
                    width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0;
                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #64748b;
                }
                .onboard-step.active { background: #5865f2; color: white; }
                .onboard-divider { width: 40px; height: 2px; background: #e2e8f0; margin: 0 10px; }

                .onboard-guild-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; max-height: 300px; overflow-y: auto; }
                .onboard-guild-item {
                    display: flex; flex-direction: column; align-items: center; padding: 16px;
                    border: 2px solid #e2e8f0; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s;
                }
                .onboard-guild-item:hover { border-color: #5865f2; }
                .onboard-guild-item.selected { border-color: #5865f2; background: #f5f3ff; }
                .onboard-guild-item img { width: 48px; height: 48px; border-radius: 50%; margin-bottom: 8px; }
                .guild-icon-ph { width: 48px; height: 48px; border-radius: 50%; background: #5865f2; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 8px; }

                .onboard-form-group { margin-bottom: 20px; }
                .onboard-form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #1e293b; }
                .onboard-form-group input {
                    width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;
                    font-size: 16px; transition: border-color 0.2s;
                }
                .onboard-form-group input:focus { outline: none; border-color: #5865f2; }

                .onboard-btn {
                    padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    border: 1px solid #e2e8f0; background: white; color: #1e293b; width: 100%;
                }
                .onboard-btn.primary { background: #5865f2; color: white; border: none; }
                .onboard-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .onboard-actions { display: grid; grid-template-columns: 100px 1fr; gap: 12px; margin-top: 30px; }
                .onboard-error { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
            `}</style>
        </div>
    );
}
