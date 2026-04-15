'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '../layout';
import { api } from '@/lib/api';

interface ProductForm {
    name: string;
    price: string;
    role_id: string;
    embed_json: {
        title: string;
        description: string;
        image: string;
        color: string;
    };
}

const emptyForm: ProductForm = {
    name: '', price: '', role_id: '',
    embed_json: { title: '', description: '', image: '', color: '#5865f2' },
};

export default function ProductsPage() {
    const { activeServer } = useDashboard();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadProducts = async () => {
        if (!activeServer?.id) return;
        setLoading(true);
        try {
            const { products: p } = await api.getProducts(activeServer.id);
            setProducts(p || []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { loadProducts(); }, [activeServer?.id]);

    const openCreate = () => {
        setForm(emptyForm);
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (p: any) => {
        setForm({
            name: p.name,
            price: String(p.price / 100),
            role_id: p.role_id,
            embed_json: {
                title: p.embed_json?.title || '',
                description: p.embed_json?.description || '',
                image: p.embed_json?.image || '',
                color: p.embed_json?.color ? `#${p.embed_json.color.toString(16).padStart(6, '0')}` : '#5865f2',
            },
        });
        setEditingId(p.id);
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = {
                name: form.name,
                price: Math.round(parseFloat(form.price) * 100),
                role_id: form.role_id,
                embed_json: {
                    title: form.embed_json.title,
                    description: form.embed_json.description,
                    image: form.embed_json.image,
                    color: parseInt(form.embed_json.color.replace('#', ''), 16),
                },
            };

            if (editingId) {
                await api.updateProduct(activeServer.id, editingId, data);
            } else {
                await api.createProduct(activeServer.id, data);
            }
            setModalOpen(false);
            loadProducts();
        } catch (err: any) {
            alert(err.message || 'Error saving product');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบสินค้านี้?')) return;
        await api.deleteProduct(activeServer.id, id);
        loadProducts();
    };

    const formatBaht = (satang: number) => `฿${(satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return <div className="dash-page-loading"><div className="dash-spinner" /><p>กำลังโหลด...</p></div>;
    }

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">สินค้า</h1>
                    <p className="dash-page-subtitle">{products.length} รายการ</p>
                </div>
                <button onClick={openCreate} className="dash-btn-primary">+ สร้างสินค้า</button>
            </div>

            {products.length === 0 ? (
                <div className="dash-empty-card">
                    <p>ยังไม่มีสินค้า</p>
                    <button onClick={openCreate} className="dash-btn-primary">สร้างสินค้าแรก</button>
                </div>
            ) : (
                <div className="dash-product-grid">
                    {products.map((p: any) => (
                        <div key={p.id} className="dash-product-card">
                            <div className="dash-product-header" style={{ borderLeftColor: `#${(p.embed_json?.color || 5793266).toString(16).padStart(6, '0')}` }}>
                                <h3>{p.name}</h3>
                                <span className="dash-product-price">{formatBaht(p.price)}</span>
                            </div>
                            <div className="dash-product-body">
                                <p className="dash-product-meta">Role: <code>{p.role_id}</code></p>
                                {p.embed_json?.title && <p className="dash-product-meta">Embed: {p.embed_json.title}</p>}
                            </div>
                            <div className="dash-product-actions">
                                <button onClick={() => openEdit(p)} className="dash-btn-sm">✏️ แก้ไข</button>
                                <button onClick={() => handleDelete(p.id)} className="dash-btn-sm danger">🗑️ ลบ</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="dash-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingId ? 'แก้ไขสินค้า' : 'สร้างสินค้าใหม่'}</h2>

                        <div className="dash-modal-body">
                            <div className="dash-modal-form">
                                <label>
                                    <span>ชื่อสินค้า</span>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="dash-input" placeholder="เช่น VIP Membership" />
                                </label>
                                <label>
                                    <span>ราคา (บาท)</span>
                                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="dash-input" placeholder="เช่น 199" />
                                </label>
                                <label>
                                    <span>Role ID</span>
                                    <input type="text" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="dash-input" placeholder="เช่น 1234567890" />
                                </label>

                                <hr className="dash-divider" />
                                <h3>Embed Builder</h3>

                                <label>
                                    <span>Title</span>
                                    <input type="text" value={form.embed_json.title} onChange={(e) => setForm({ ...form, embed_json: { ...form.embed_json, title: e.target.value } })} className="dash-input" />
                                </label>
                                <label>
                                    <span>Description</span>
                                    <textarea value={form.embed_json.description} onChange={(e) => setForm({ ...form, embed_json: { ...form.embed_json, description: e.target.value } })} className="dash-input dash-textarea" />
                                </label>
                                <label>
                                    <span>Image URL</span>
                                    <input type="url" value={form.embed_json.image} onChange={(e) => setForm({ ...form, embed_json: { ...form.embed_json, image: e.target.value } })} className="dash-input" />
                                </label>
                                <label>
                                    <span>Color</span>
                                    <div className="dash-color-row">
                                        <input type="color" value={form.embed_json.color} onChange={(e) => setForm({ ...form, embed_json: { ...form.embed_json, color: e.target.value } })} className="dash-color-input" />
                                        <span className="dash-color-hex">{form.embed_json.color}</span>
                                    </div>
                                </label>
                            </div>

                            {/* Live Embed Preview */}
                            <div className="dash-embed-preview">
                                <h4>Preview</h4>
                                <div className="embed-card" style={{ borderLeftColor: form.embed_json.color }}>
                                    {form.embed_json.title && <div className="embed-title">{form.embed_json.title}</div>}
                                    {form.embed_json.description && <div className="embed-desc">{form.embed_json.description}</div>}
                                    {form.embed_json.image && (
                                        <img src={form.embed_json.image} alt="embed" className="embed-image" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    )}
                                    <div className="embed-footer">
                                        <span>💰 {form.price || '0'} บาท</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dash-modal-footer">
                            <button onClick={() => setModalOpen(false)} className="dash-btn-ghost">ยกเลิก</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.role_id} className="dash-btn-primary">
                                {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'สร้าง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
