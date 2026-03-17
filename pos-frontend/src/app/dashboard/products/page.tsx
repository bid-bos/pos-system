'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

interface Category { id: number; name: string; }
interface Product {
  id: number; name: string; price: number; stock: number; barcode: string | null; categoryId: number; category: { name: string };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', categoryId: '', barcode: '' });

  const fetchProducts = async () => { try { const res = await api.get('/products'); setProducts(res.data); } catch { toast.error('Gagal memuat produk'); } finally { setLoading(false); } };
  const fetchCategories = async () => { try { const res = await api.get('/categories'); setCategories(res.data); } catch { /* silent */ } };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { name: form.name, price: Number(form.price), stock: Number(form.stock), categoryId: Number(form.categoryId), barcode: form.barcode || null };
      if (editingId) { await api.put(`/products/${editingId}`, data); toast.success('Produk berhasil diupdate'); }
      else { await api.post('/products', data); toast.success('Produk berhasil ditambahkan'); }
      setShowModal(false); setForm({ name: '', price: '', stock: '', categoryId: '', barcode: '' }); setEditingId(null); fetchProducts();
    } catch { toast.error('Gagal menyimpan produk'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Produk berhasil dihapus'); fetchProducts(); } catch { toast.error('Gagal menghapus produk'); }
  };

  const openEdit = (p: Product) => { setEditingId(p.id); setForm({ name: p.name, price: String(p.price), stock: String(p.stock), categoryId: String(p.categoryId), barcode: p.barcode || '' }); setShowModal(true); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Produk</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Kelola produk dan stok barang</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingId(null); setForm({ name: '', price: '', stock: '', categoryId: '', barcode: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium text-sm active:scale-[0.98]" style={{ background: 'var(--accent)' }}>
            <HiOutlinePlus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Produk</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Kategori</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Harga</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Stok</th>
            {isAdmin && <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aksi</th>}
          </tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  {p.barcode && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.barcode}</p>}
                </td>
                <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{p.category.name}</span></td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.price)}</td>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-sm" style={{ color: p.stock < 10 ? 'var(--warning)' : 'var(--success)' }}>{p.stock}</span>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg ml-1" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}><HiOutlineTrash className="w-4 h-4" /></button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-modal-overlay)' }}>
          <div className="rounded-2xl w-full max-w-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nama Produk" required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="Harga (Rp)" type="number" required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                <input value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} placeholder="Stok" type="number" required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="">Pilih Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} placeholder="Barcode (opsional)" className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-secondary)' }}>Batal</button>
                <button type="submit" className="px-4 py-2 text-white rounded-xl font-medium text-sm" style={{ background: 'var(--accent)' }}>{editingId ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
