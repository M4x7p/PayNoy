'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Step = 'server' | 'invite' | 'setup' | 'done';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('server');
    const [guilds, setGuilds] = useState<any[]>([]);
    const [selectedGuild, setSelectedGuild] = useState<any>(null);
    const [promptpayName, setPromptpayName] = useState('');
    const [promptpayAccount, setPromptpayAccount] = useState('');
    const [omiseSecretKey, setOmiseSecretKey] = useState('');
    const [omisePublicKey, setOmisePublicKey] = useState('');
    const [omiseWebhookSecret, setOmiseWebhookSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const { guilds: g } = await api.refreshGuilds();
                setGuilds(g);
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleSelectGuild = (guild: any) => {
        setSelectedGuild(guild);
        if (guild.bot_present) {
            setStep('setup');
        } else {
            setStep('invite');
        }
    };

    const [checking, setChecking] = useState(false);

    const handleCheckBot = async () => {
        setChecking(true);
        try {
            const { guilds: g } = await api.refreshGuilds();
            setGuilds(g);
            const updated = g.find((x: any) => x.id === selectedGuild?.id);
            if (updated?.bot_present) {
                setSelectedGuild(updated);
                setStep('setup');
            }
        } catch { }
        setChecking(false);
    };

    // Auto-poll for bot presence when on the invite step
    useEffect(() => {
        if (step !== 'invite' || !selectedGuild) return;

        // Poll every 5 seconds
        const interval = setInterval(async () => {
            try {
                const { guilds: g } = await api.refreshGuilds();
                setGuilds(g);
                const updated = g.find((x: any) => x.id === selectedGuild?.id);
                if (updated?.bot_present) {
                    setSelectedGuild(updated);
                    setStep('setup');
                }
            } catch { }
        }, 5000);

        // Also check immediately when the tab regains focus (user returns from Discord)
        const handleFocus = () => {
            handleCheckBot();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [step, selectedGuild?.id]);

    const handleComplete = async () => {
        if (!promptpayName || !promptpayAccount || !omiseSecretKey || !omisePublicKey) return;
        setSaving(true);
        try {
            await api.completeOnboarding({
                guild_id: selectedGuild.id,
                guild_name: selectedGuild.name,
                promptpay_name: promptpayName,
                promptpay_account: promptpayAccount,
                omise_secret_key: omiseSecretKey,
                omise_public_key: omisePublicKey,
                omise_webhook_secret: omiseWebhookSecret,
            });
            router.push('/dashboard');
        } catch (err) {
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <h1>🎉 ยินดีต้อนรับสู่เปย์หน่อย</h1>
                    <p>ตั้งค่าเบื้องต้นเพื่อเริ่มรับเงินผ่าน Discord</p>
                </div>

                {/* Steps indicator */}
                <div className="onboarding-steps">
                    <div className={`onboarding-step ${step === 'server' ? 'active' : 'done'}`}>
                        <span className="step-num">1</span>
                        <span>เลือกเซิร์ฟเวอร์</span>
                    </div>
                    <div className="step-line" />
                    <div className={`onboarding-step ${step === 'invite' ? 'active' : ['setup', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">2</span>
                        <span>เชิญบอท</span>
                    </div>
                    <div className="step-line" />
                    <div className={`onboarding-step ${step === 'setup' ? 'active' : step === 'done' ? 'done' : ''}`}>
                        <span className="step-num">3</span>
                        <span>ตั้งค่า PromptPay</span>
                    </div>
                </div>

                {/* Step 1: Select Server */}
                {step === 'server' && (
                    <div className="onboarding-card">
                        <h2>เลือกเซิร์ฟเวอร์ที่ต้องการใช้งาน</h2>
                        <p className="onboarding-hint">แสดงเฉพาะเซิร์ฟเวอร์ที่คุณเป็น Admin</p>
                        <div className="onboarding-guild-list">
                            {guilds.map((g: any) => (
                                <button key={g.id} className="onboarding-guild" onClick={() => handleSelectGuild(g)}>
                                    {g.icon ? (
                                        <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=48`} alt="" className="onboarding-guild-icon" />
                                    ) : (
                                        <div className="onboarding-guild-icon-ph">{g.name?.charAt(0)}</div>
                                    )}
                                    <div>
                                        <span className="onboarding-guild-name">{g.name}</span>
                                        {g.bot_present && <span className="onboarding-bot-badge">✓ บอทอยู่แล้ว</span>}
                                    </div>
                                </button>
                            ))}
                            {guilds.length === 0 && <p className="onboarding-empty">ไม่พบเซิร์ฟเวอร์ที่คุณเป็น Admin</p>}
                        </div>
                    </div>
                )}

                {/* Step 2: Invite Bot */}
                {step === 'invite' && selectedGuild && (
                    <div className="onboarding-card">
                        <h2>เชิญบอทเข้า {selectedGuild.name}</h2>
                        <p>คลิกปุ่มด้านล่างเพื่อเชิญบอทเข้าเซิร์ฟเวอร์ ระบบจะตรวจสอบให้อัตโนมัติ</p>
                        <div className="onboarding-invite-actions">
                            <a href={api.getBotInviteUrl(selectedGuild.id)} target="_blank" rel="noreferrer" className="onboarding-invite-btn">
                                🤖 เชิญบอทเข้าเซิร์ฟเวอร์
                            </a>
                            <button onClick={handleCheckBot} disabled={checking} className="onboarding-check-btn">
                                {checking ? '⏳ กำลังตรวจสอบ...' : '🔄 ตรวจสอบ'}
                            </button>
                        </div>
                        <p className="onboarding-auto-check">🔍 กำลังตรวจสอบอัตโนมัติ...</p>
                        <button onClick={() => setStep('server')} className="onboarding-back">← เลือกเซิร์ฟเวอร์อื่น</button>
                    </div>
                )}

                {/* Step 3: Setup PromptPay */}
                {step === 'setup' && (
                    <div className="onboarding-card">
                        <h2>ตั้งค่า PromptPay</h2>
                        <p>ข้อมูลนี้จะแสดงให้ผู้ซื้อเห็นเมื่อชำระเงิน</p>
                        <div className="onboarding-form">
                            <label>
                                <span>ชื่อผู้รับเงิน</span>
                                <input
                                    type="text"
                                    placeholder="เช่น นายสมชาย ใจดี"
                                    value={promptpayName}
                                    onChange={(e) => setPromptpayName(e.target.value)}
                                    className="onboarding-input"
                                />
                            </label>
                            <label>
                                <span>หมายเลข PromptPay</span>
                                <input
                                    type="text"
                                    placeholder="เช่น 0812345678"
                                    value={promptpayAccount}
                                    onChange={(e) => setPromptpayAccount(e.target.value)}
                                    className="onboarding-input"
                                />
                            </label>

                            <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🔐 ตั้งค่า Omise (สำหรับเจ้าของเซิร์ฟเวอร์)</h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>เงินจะเข้าบัญชี Omise ของคุณโดยตรง</p>

                            <label>
                                <span>Omise Public Key</span>
                                <input
                                    type="text"
                                    placeholder="pkey_test_..."
                                    value={omisePublicKey}
                                    onChange={(e) => setOmisePublicKey(e.target.value)}
                                    className="onboarding-input"
                                />
                            </label>

                            <label>
                                <span>Omise Secret Key</span>
                                <input
                                    type="password"
                                    placeholder="skey_test_..."
                                    value={omiseSecretKey}
                                    onChange={(e) => setOmiseSecretKey(e.target.value)}
                                    className="onboarding-input"
                                />
                            </label>

                            <label>
                                <span>Omise Webhook Secret (ถ้ามี)</span>
                                <input
                                    type="password"
                                    placeholder="whs_..."
                                    value={omiseWebhookSecret}
                                    onChange={(e) => setOmiseWebhookSecret(e.target.value)}
                                    className="onboarding-input"
                                />
                            </label>

                            <button
                                onClick={handleComplete}
                                disabled={!promptpayName || !promptpayAccount || !omiseSecretKey || !omisePublicKey || saving}
                                className="onboarding-submit"
                            >
                                {saving ? 'กำลังบันทึก...' : '✓ เสร็จสิ้น เริ่มใช้งาน'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
