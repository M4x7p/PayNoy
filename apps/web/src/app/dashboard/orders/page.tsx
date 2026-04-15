'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '../layout';
import { api } from '@/lib/api';

export default function OrdersPage() {
    const { activeServer } = useDashboard();
    const [orders, setOrders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 20;

    const loadOrders = async (p: number) => {
        if (!activeServer?.id) return;
        setLoading(true);
        try {
            const res = await api.getOrders(activeServer.id, p, limit);
            setOrders(res.orders || []);
            setTotal(res.total || 0);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { loadOrders(page); }, [activeServer?.id, page]);

    const formatBaht = (satang: number) => `฿${(satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    const totalPages = Math.ceil(total / limit);

    const statusMap: Record<string, string> = {
        pending: '⏳ รอชำระ',
        paid: '✅ ชำระแล้ว',
        expired: '⏰ หมดอายุ',
        failed: '❌ ล้มเหลว',
    };

    if (loading) {
        return <div className="dash-page-loading"><div className="dash-spinner" /><p>กำลังโหลด...</p></div>;
    }

    return (
        <div className="dash-page">
            <h1 className="dash-page-title">ออเดอร์</h1>
            <p className="dash-page-subtitle">{total} รายการ</p>

            {orders.length === 0 ? (
                <div className="dash-empty-card">
                    <p>ยังไม่มีออเดอร์</p>
                </div>
            ) : (
                <>
                    <div className="dash-table-wrap">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th>ผู้ซื้อ</th>
                                    <th>จำนวน</th>
                                    <th>สถานะ</th>
                                    <th>วันที่</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o: any) => (
                                    <tr key={o.id}>
                                        <td>{o.products?.name || '-'}</td>
                                        <td><code className="dash-code">{o.user_discord_id}</code></td>
                                        <td>{formatBaht(o.amount)}</td>
                                        <td><span className={`dash-status-badge ${o.status}`}>{statusMap[o.status] || o.status}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="dash-pagination">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="dash-btn-sm">← ก่อนหน้า</button>
                            <span className="dash-page-info">หน้า {page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="dash-btn-sm">ถัดไป →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
