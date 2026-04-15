'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from './layout';
import { api } from '@/lib/api';

export default function DashboardOverview() {
    const { activeServer } = useDashboard();
    const [stats, setStats] = useState({ totalOrders: 0, paidOrders: 0, revenue: 0, products: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeServer?.id) return;

        async function load() {
            setLoading(true);
            try {
                const [ordersRes, productsRes] = await Promise.all([
                    api.getOrders(activeServer.id, 1, 5),
                    api.getProducts(activeServer.id),
                ]);

                setRecentOrders(ordersRes.orders || []);

                const totalOrders = ordersRes.total || 0;
                const paidOrders = (ordersRes.orders || []).filter((o: any) => o.status === 'paid').length;
                const revenue = (ordersRes.orders || [])
                    .filter((o: any) => o.status === 'paid')
                    .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

                setStats({
                    totalOrders,
                    paidOrders,
                    revenue,
                    products: (productsRes.products || []).length,
                });
            } catch { }
            setLoading(false);
        }
        load();
    }, [activeServer?.id]);

    if (loading) {
        return <div className="dash-page-loading"><div className="dash-spinner" /><p>กำลังโหลด...</p></div>;
    }

    const formatBaht = (satang: number) => `฿${(satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

    return (
        <div className="dash-page">
            <h1 className="dash-page-title">แดชบอร์ด</h1>
            <p className="dash-page-subtitle">{activeServer?.discord_guild_id ? `Server: ${activeServer.discord_guild_id}` : ''}</p>

            {/* Stats Cards */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card">
                    <span className="dash-stat-icon">🧾</span>
                    <div>
                        <p className="dash-stat-value">{stats.totalOrders}</p>
                        <p className="dash-stat-label">ออเดอร์ทั้งหมด</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon">✅</span>
                    <div>
                        <p className="dash-stat-value">{stats.paidOrders}</p>
                        <p className="dash-stat-label">ชำระแล้ว</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon">💰</span>
                    <div>
                        <p className="dash-stat-value">{formatBaht(stats.revenue)}</p>
                        <p className="dash-stat-label">รายได้</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon">📦</span>
                    <div>
                        <p className="dash-stat-value">{stats.products}</p>
                        <p className="dash-stat-label">สินค้า</p>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="dash-section">
                <h2 className="dash-section-title">ออเดอร์ล่าสุด</h2>
                {recentOrders.length === 0 ? (
                    <div className="dash-empty-card">
                        <p>ยังไม่มีออเดอร์</p>
                    </div>
                ) : (
                    <div className="dash-table-wrap">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th>จำนวน</th>
                                    <th>สถานะ</th>
                                    <th>วันที่</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((o: any) => (
                                    <tr key={o.id}>
                                        <td>{o.products?.name || '-'}</td>
                                        <td>{formatBaht(o.amount)}</td>
                                        <td><span className={`dash-status-badge ${o.status}`}>{o.status}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
