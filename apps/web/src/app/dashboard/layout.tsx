'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// ── Context ─────────────────────────────────────────────────
interface DashboardContextType {
    user: any;
    guilds: any[];
    activeServer: any | null;
    setActiveServerId: (id: string) => void;
    refreshGuilds: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
    user: null,
    guilds: [],
    activeServer: null,
    setActiveServerId: () => { },
    refreshGuilds: async () => { },
});

export const useDashboard = () => useContext(DashboardContext);

// ── Sidebar Items ───────────────────────────────────────────
const NAV_ITEMS = [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: '📊' },
    { label: 'สินค้า', path: '/dashboard/products', icon: '📦' },
    { label: 'ออเดอร์', path: '/dashboard/orders', icon: '🧾' },
    { label: 'ตั้งค่า', path: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<any>(null);
    const [guilds, setGuilds] = useState<any[]>([]);
    const [activeServerId, setActiveServerId] = useState<string>('');
    const [activeServer, setActiveServer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

    // Skip layout for login + onboarding pages
    const isLoginPage = pathname === '/dashboard/login';
    const isOnboardingPage = pathname === '/dashboard/onboarding';

    useEffect(() => {
        if (isLoginPage) { setLoading(false); return; }

        async function init() {
            try {
                const { user: u } = await api.getMe();
                setUser(u);

                // Redirect to onboarding if not done
                if (!u.onboarded && !isOnboardingPage) {
                    router.push('/dashboard/onboarding');
                    return;
                }

                // Load guilds with fresh bot status check
                const { guilds: g } = await api.refreshGuilds();
                console.log('[Dashboard] Raw guilds from API:', g);
                setGuilds(g);

                // Auto-select first bot-present guild
                const botGuilds = g.filter((gld: any) => gld.bot_present);
                if (botGuilds.length > 0 && !activeServerId) {
                    setActiveServerId(botGuilds[0].id);
                }
            } catch (err: any) {
                if (err?.status === 401) {
                    router.push('/dashboard/login');
                }
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [isLoginPage, isOnboardingPage]);

    // Fetch server config when active server changes
    useEffect(() => {
        if (!activeServerId) return;
        api.getServer(activeServerId).then(({ server }) => setActiveServer(server)).catch(() => { });
    }, [activeServerId]);

    const handleRefreshGuilds = async () => {
        const { guilds: g } = await api.refreshGuilds();
        setGuilds(g);
    };

    const handleLogout = async () => {
        await api.logout();
        router.push('/dashboard/login');
    };

    // For login/onboarding, render children without shell
    if (isLoginPage || isOnboardingPage) {
        return (
            <DashboardContext.Provider value={{ user, guilds, activeServer, setActiveServerId, refreshGuilds: handleRefreshGuilds }}>
                {children}
            </DashboardContext.Provider>
        );
    }

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    console.log('[Dashboard] Rendering with guilds:', guilds);
    console.log('[Dashboard] Bot presence check on first guild:', guilds[0]?.name, 'bot_present:', guilds[0]?.bot_present);
    const botGuilds = guilds.filter((g: any) => g.bot_present);
    console.log('[Dashboard] Bot guilds count:', botGuilds.length);
    const currentGuild = guilds.find((g: any) => g.id === activeServerId);

    return (
        <DashboardContext.Provider value={{ user, guilds, activeServer, setActiveServerId, refreshGuilds: handleRefreshGuilds }}>
            <div className="dash-root">
                {/* Mobile overlay */}
                {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

                {/* Sidebar */}
                <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="dash-sidebar-header">
                        <div className="dash-sidebar-brand">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="6" fill="url(#slg)" />
                                <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <defs><linearGradient id="slg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#5865f2" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
                            </svg>
                            <span>เปย์หน่อย</span>
                        </div>
                    </div>

                    <nav className="dash-nav">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => { router.push(item.path); setSidebarOpen(false); }}
                                className={`dash-nav-item ${pathname === item.path ? 'active' : ''}`}
                            >
                                <span className="dash-nav-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="dash-sidebar-footer">
                        <div className="dash-version-tag">v2.0.1 (DEBUG)</div>
                        <button onClick={handleLogout} className="dash-logout-btn">
                            🚪 ออกจากระบบ
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <div className="dash-main">
                    {/* Topbar */}
                    <header className="dash-topbar">
                        <button className="dash-hamburger" onClick={() => setSidebarOpen(true)}>
                            ☰
                        </button>

                        {/* Server Selector */}
                        <div className="dash-server-selector">
                            <button className="dash-server-btn" onClick={() => setServerDropdownOpen(!serverDropdownOpen)}>
                                {currentGuild?.icon ? (
                                    <img
                                        src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png?size=32`}
                                        alt=""
                                        className="dash-server-icon"
                                    />
                                ) : (
                                    <div className="dash-server-icon-placeholder">
                                        {currentGuild?.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <span className="dash-server-name">{currentGuild?.name || 'เลือกเซิร์ฟเวอร์'}</span>
                                <span className="dash-chevron">▾</span>
                            </button>

                            {serverDropdownOpen && (
                                <div className="dash-server-dropdown">
                                    {botGuilds.map((g: any) => (
                                        <button
                                            key={g.id}
                                            className={`dash-server-option ${g.id === activeServerId ? 'active' : ''}`}
                                            onClick={() => { setActiveServerId(g.id); setServerDropdownOpen(false); }}
                                        >
                                            {g.icon ? (
                                                <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=24`} alt="" className="dash-server-opt-icon" />
                                            ) : (
                                                <div className="dash-server-opt-icon-ph">{g.name?.charAt(0)}</div>
                                            )}
                                            <span>{g.name}</span>
                                        </button>
                                    ))}
                                    {guilds.filter((g: any) => !g.bot_present).length > 0 && (
                                        <>
                                            <div className="dash-server-divider" />
                                            <p className="dash-server-label">ยังไม่มีบอท</p>
                                            {guilds.filter((g: any) => !g.bot_present).map((g: any) => (
                                                <a
                                                    key={g.id}
                                                    href={api.getBotInviteUrl(g.id)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="dash-server-option invite"
                                                >
                                                    <div className="dash-server-opt-icon-ph">{g.name?.charAt(0)}</div>
                                                    <span>{g.name}</span>
                                                    <span className="dash-invite-badge">+ เชิญบอท</span>
                                                </a>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Avatar */}
                        <div className="dash-user">
                            {user?.avatar ? (
                                <img
                                    src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=32`}
                                    alt=""
                                    className="dash-avatar"
                                />
                            ) : (
                                <div className="dash-avatar-placeholder">{user?.username?.charAt(0)}</div>
                            )}
                            <span className="dash-username">{user?.username}</span>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="dash-content">
                        {!activeServerId && botGuilds.length === 0 ? (
                            <div className="dash-empty-state">
                                <h2>ยังไม่มีเซิร์ฟเวอร์ที่เชื่อมต่อ</h2>
                                <p>เชิญบอทเข้าเซิร์ฟเวอร์ Discord ของคุณเพื่อเริ่มใช้งาน</p>
                                <div className="dash-guild-list">
                                    {guilds.map((g: any) => (
                                        <a key={g.id} href={api.getBotInviteUrl(g.id)} target="_blank" rel="noreferrer" className="dash-guild-invite-card">
                                            <div className="dash-server-opt-icon-ph">{g.name?.charAt(0)}</div>
                                            <span>{g.name}</span>
                                            <span className="dash-invite-badge">+ เชิญบอท</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : children}
                    </main>
                </div>
            </div>
        </DashboardContext.Provider>
    );
}
