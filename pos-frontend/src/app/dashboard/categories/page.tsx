'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

interface Category {
  id: number;
  name: string;
  _count: { products: number };
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data); } catch { toast.error('Gagal memuat kategori'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) { await api.put(`/categories/${editingId}`, { name }); toast.success('Kategori berhasil diupdate'); }
      else { await api.post('/categories', { name }); toast.success('Kategori berhasil ditambahkan'); }
      setShowModal(false); setName(''); setEditingId(null); fetchCategories();
    } catch { toast.error('Gagal menyimpan kategori'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Kategori berhasil dihapus'); fetchCategories(); }
    catch (err: unknown) { const error = err as { response?: { data?: { message?: string } } }; toast.error(error.response?.data?.message || 'Gagal menghapus'); }
  };

  const openEdit = (cat: Category) => { setEditingId(cat.id); setName(cat.name); setShowModal(true); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Kategori</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Kelola kategori produk</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingId(null); setName(''); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium text-sm active:scale-[0.98]" style={{ background: 'var(--accent)' }}>
            <HiOutlinePlus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nama Kategori</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Jumlah Produk</th>
            {isAdmin && <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aksi</th>}
          </tr></thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td className="px-5 py-3.5 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{cat.name}</td>
                <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{cat._count.products} produk</span></td>
                {isAdmin && (
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg ml-1" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}><HiOutlineTrash className="w-4 h-4" /></button>
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada kategori</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-modal-overlay)' }}>
          <div className="rounded-2xl w-full max-w-md p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Kategori" required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
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
