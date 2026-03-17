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
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('Gagal memuat kategori'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name });
        toast.success('Kategori berhasil diupdate');
      } else {
        await api.post('/categories', { name });
        toast.success('Kategori berhasil ditambahkan');
      }
      setShowModal(false);
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch { toast.error('Gagal menyimpan kategori'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Kategori berhasil dihapus');
      fetchCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setShowModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Kategori</h1>
          <p className="text-slate-400 mt-1">Kelola kategori produk</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingId(null); setName(''); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/25">
            <HiOutlinePlus className="w-5 h-5" /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Kategori</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Produk</th>
            {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>}
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{cat.name}</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm">{cat._count.products} produk</span></td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(cat)} className="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-800"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 ml-1"><HiOutlineTrash className="w-4 h-4" /></button>
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Belum ada kategori</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Kategori" required className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500" />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">Batal</button>
                <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium">{editingId ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
