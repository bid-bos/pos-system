'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

interface Category { id: number; name: string; }
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  categoryId: number;
  category: { name: string };
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

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch { toast.error('Gagal memuat produk'); } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { name: form.name, price: Number(form.price), stock: Number(form.stock), categoryId: Number(form.categoryId), barcode: form.barcode || null };
      if (editingId) {
        await api.put(`/products/${editingId}`, data);
        toast.success('Produk berhasil diupdate');
      } else {
        await api.post('/products', data);
        toast.success('Produk berhasil ditambahkan');
      }
      setShowModal(false);
      setForm({ name: '', price: '', stock: '', categoryId: '', barcode: '' });
      setEditingId(null);
      fetchProducts();
    } catch { toast.error('Gagal menyimpan produk'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produk berhasil dihapus');
      fetchProducts();
    } catch { toast.error('Gagal menghapus produk'); }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), categoryId: String(p.categoryId), barcode: p.barcode || '' });
    setShowModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Produk</h1>
          <p className="text-slate-400 mt-1">Kelola produk dan stok barang</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingId(null); setForm({ name: '', price: '', stock: '', categoryId: '', barcode: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/25">
            <HiOutlinePlus className="w-5 h-5" /> Tambah Produk
          </button>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Produk</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Harga</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok</th>
            {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>}
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{p.name}</p>
                  {p.barcode && <p className="text-xs text-slate-500 mt-0.5">{p.barcode}</p>}
                </td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm">{p.category.name}</span></td>
                <td className="px-6 py-4 text-white">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${p.stock < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{p.stock}</span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-800"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 ml-1"><HiOutlineTrash className="w-4 h-4" /></button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nama Produk" required className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500" />
              <div className="grid grid-cols-2 gap-4">
                <input value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="Harga (Rp)" type="number" required className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500" />
                <input value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} placeholder="Stok" type="number" required className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500" />
              </div>
              <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})} required className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white">
                <option value="">Pilih Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} placeholder="Barcode (opsional)" className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500" />
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
