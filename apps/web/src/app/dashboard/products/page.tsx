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
    button_config: {
        label: string;
        style: string;
        emoji: string;
    };
}

const emptyForm: ProductForm = {
    name: '', price: '', role_id: '',
    embed_json: { title: '', description: '', image: '', color: '#5865f2' },
    button_config: { label: 'สั่งซื้อสินค้า', style: '1', emoji: '' },
};

export default function ProductsPage() {
    const { activeServer } = useDashboard();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    // Discord Posting state
    const [channels, setChannels] = useState<any[]>([]);
    const [postModalOpen, setPostModalOpen] = useState(false);
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [postingId, setPostingId] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

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
            button_config: {
                label: p.button_config?.label || 'สั่งซื้อสินค้า',
                style: String(p.button_config?.style || '1'),
                emoji: p.button_config?.emoji || '',
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
                button_config: {
                    label: form.button_config.label,
                    style: parseInt(form.button_config.style),
                    emoji: form.button_config.emoji,
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

    const openPostModal = async (productId: string) => {
        setPostingId(productId);
        setPostModalOpen(true);
        if (channels.length === 0) {
            try {
                const { channels: c } = await api.getChannels(activeServer.id);
                setChannels(c || []);
                if (c && c.length > 0) setSelectedChannelId(c[0].id);
            } catch (err) {
                alert('ไม่สามารถโหลดรายการ Channel ได้');
            }
        }
    };

    const handlePost = async () => {
        if (!postingId || !selectedChannelId) return;
        setIsPosting(true);
        try {
            await api.postProduct(activeServer.id, postingId, selectedChannelId);
            alert('โพสต์สินค้าลง Discord สำเร็จ!');
            setPostModalOpen(false);
        } catch (err: any) {
            console.error('Failed to post product:', err);
            const errorMsg = err.detail?.message || err.message || 'เกิดข้อผิดพลาดในการโพสต์';
            alert(`ไม่สามารถโพสต์สินค้าได้: ${errorMsg}\n\n(Status: ${err.status})`);
        }
        setIsPosting(false);
    };


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
                            <div
                                className="dash-product-header"
                                style={{ borderLeftColor: `#${(p.embed_json?.color || 5793266).toString(16).padStart(6, '0')}` }}
                            >
                                <h3>{p.name}</h3>
                                <span className="dash-product-price">{formatBaht(p.price)}</span>
                            </div>
                            <div className="dash-product-body">
                                <p className="dash-product-meta">Role: <code>{p.role_id}</code></p>
                                {p.embed_json?.title && <p className="dash-product-meta">Embed: {p.embed_json.title}</p>}
                            </div>
                            <div className="dash-product-actions">
                                <button onClick={() => openPostModal(p.id)} className="dash-btn-sm discord">📢 โพสต์ลง Discord</button>
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

                                <hr className="dash-divider" />
                                <h3>Button Customization</h3>

                                <label>
                                    <span>ข้อความบนปุ่ม (Label)</span>
                                    <input type="text" value={form.button_config.label} onChange={(e) => setForm({ ...form, button_config: { ...form.button_config, label: e.target.value } })} className="dash-input" placeholder="เช่น สั่งซื้อเลย" />
                                </label>
                                <label>
                                    <span>Emoji (ชื่อ emoji)</span>
                                    <input type="text" value={form.button_config.emoji} onChange={(e) => setForm({ ...form, button_config: { ...form.button_config, emoji: e.target.value } })} className="dash-input" placeholder="เช่น 🛒" />
                                </label>
                                <label>
                                    <span>สไตล์ของปุ่ม (Color)</span>
                                    <select
                                        title="ปุ่มสไตล์"
                                        value={form.button_config.style}
                                        onChange={(e) => setForm({ ...form, button_config: { ...form.button_config, style: e.target.value } })}
                                        className="dash-input"
                                    >
                                        <option value="1">Primary (Blue)</option>
                                        <option value="2">Secondary (Gray)</option>
                                        <option value="3">Success (Green)</option>
                                        <option value="4">Danger (Red)</option>
                                    </select>
                                </label>
                            </div>

                            {/* Live Embed Preview */}
                            <div className="dash-embed-preview">
                                <h4>Preview</h4>
                                <div className="embed-card" style={{ borderLeftColor: form.embed_json.color }}>
                                    {form.embed_json.title && <div className="embed-title">{form.embed_json.title}</div>}
                                    {form.embed_json.description && <div className="embed-desc">{form.embed_json.description}</div>}
                                    {form.embed_json.image && (
                                        <img src={form.embed_json.image} alt="embed" className="embed-image" />
                                    )}
                                    <div className="embed-footer">
                                        <span>💰 {form.price || '0'} บาท</span>
                                    </div>
                                </div>
                                <button className={`discord-preview-btn btn-style-${form.button_config.style}`}>
                                    {form.button_config.emoji} {form.button_config.label || 'สั่งซื้อสินค้า'}
                                </button>
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

            {/* Post to Discord Modal */}
            {postModalOpen && (
                <div className="dash-modal-overlay" onClick={() => setPostModalOpen(false)}>
                    <div className="dash-modal sm" onClick={(e) => e.stopPropagation()}>
                        <h2>โพสต์สินค้าลง Discord</h2>
                        <div className="dash-modal-body">
                            <p>เลือก Channel ที่ต้องการให้บอทส่งข้อความสินค้าชิ้นนี้ไป:</p>
                            <select
                                title="เลือก Channel"
                                value={selectedChannelId}
                                onChange={(e) => setSelectedChannelId(e.target.value)}
                                className="dash-input"
                            >
                                {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                                {channels.length === 0 && <option disabled>กำลังโหลด Channel...</option>}
                            </select>
                        </div>
                        <div className="dash-modal-footer">
                            <button onClick={() => setPostModalOpen(false)} className="dash-btn-ghost">ยกเลิก</button>
                            <button onClick={handlePost} disabled={isPosting || !selectedChannelId} className="dash-btn-primary">
                                {isPosting ? 'กำลังส่ง...' : '🚀 โพสต์เลย'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .dash-page { padding: 40px; max-width: 1200px; margin: 0 auto; }
                .dash-page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
                .dash-page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
                .dash-page-subtitle { color: #64748b; }
                
                .dash-btn-primary { background: #5865f2; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
                .dash-btn-primary:hover { background: #4752c4; transform: translateY(-2px); }
                .dash-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .dash-empty-card { background: white; padding: 60px; border-radius: 16px; text-align: center; border: 2px dashed #e2e8f0; color: #64748b; }

                .dash-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
                .dash-product-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; }
                .dash-product-header { padding: 20px; border-left: 6px solid #5865f2; display: flex; justify-content: space-between; align-items: flex-start; }
                .dash-product-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; }
                .dash-product-price { font-weight: 700; color: #10b981; }

                .dash-product-body { padding: 0 20px 20px; flex: 1; }
                .dash-product-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
                .dash-product-meta code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }

                .dash-product-actions { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; }
                .dash-btn-sm { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: white; color: #475569; transition: all 0.2s; }
                .dash-btn-sm:hover { border-color: #cbd5e1; background: #f1f5f9; }
                .dash-btn-sm.danger:hover { color: #ef4444; border-color: #fca5a5; background: #fef2f2; }
                .dash-btn-sm.discord { background: #5865f2; color: white; border: none; }
                .dash-btn-sm.discord:hover { background: #4752c4; }

                .dash-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .dash-modal { background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
                .dash-modal.sm { max-width: 450px; }
                .dash-modal h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #1e293b; }

                .dash-modal-body { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .dash-modal.sm .dash-modal-body { display: block; }
                .dash-modal-form label { display: block; margin-bottom: 16px; }
                .dash-modal-form label span { display: block; font-size: 14px; font-weight: 500; color: #64748b; margin-bottom: 6px; }
                .dash-input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; }
                .dash-input:focus { outline: none; border-color: #5865f2; ring: 2px solid #5865f244; }
                .dash-textarea { height: 100px; resize: none; }
                .dash-divider { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }

                .dash-color-row { display: flex; align-items: center; gap: 12px; }
                .dash-color-input { width: 44px; height: 32px; border: none; padding: 0; background: none; cursor: pointer; }
                .dash-color-hex { font-family: monospace; font-size: 14px; color: #64748b; }

                .dash-embed-preview { background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
                .dash-embed-preview h4 { margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
                .embed-card { background: #2f3136; border-radius: 4px; padding: 12px 16px; border-left: 4px solid #5865f2; color: #dcddde; }
                .embed-title { font-weight: 600; font-size: 16px; color: white; margin-bottom: 8px; }
                .embed-desc { font-size: 14px; line-height: 1.4; }
                .embed-image { border-radius: 4px; margin-top: 16px; max-height: 200px; width: 100%; object-fit: cover; }
                .embed-footer { margin-top: 12px; font-size: 13px; color: #b9bbbe; }

                .discord-preview-btn { margin-top: 16px; padding: 10px 16px; border-radius: 3px; font-weight: 500; font-size: 14px; border: none; cursor: default; width: auto; color: white; }
                .btn-style-1 { background: #5865f2; }
                .btn-style-2 { background: #4f545c; }
                .btn-style-3 { background: #3ba55c; }
                .btn-style-4 { background: #ed4245; }

                .dash-modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
                .dash-btn-ghost { background: transparent; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #64748b; border: none; }
                .dash-btn-ghost:hover { background: #f1f5f9; }
            `}</style>
        </div>
    );
}
