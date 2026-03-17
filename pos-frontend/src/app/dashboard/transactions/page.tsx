'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineEye } from 'react-icons/hi';

interface Transaction {
  id: number;
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  user: { name: string };
  _count: { items: number };
}

interface TransactionDetail extends Transaction {
  items: { id: number; quantity: number; price: number; product: { name: string } }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    api.get('/transactions').then((res) => setTransactions(res.data)).catch(() => toast.error('Gagal memuat transaksi')).finally(() => setLoading(false));
  }, []);

  const viewDetail = async (id: number) => {
    try {
      const res = await api.get(`/transactions/${id}`);
      setDetail(res.data);
    } catch { toast.error('Gagal memuat detail transaksi'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Riwayat Transaksi</h1>
        <p className="text-slate-400 mt-1">Semua catatan penjualan</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kasir</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Item</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Pembayaran</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 text-slate-300 font-mono text-sm">#{t.id}</td>
                <td className="px-6 py-4 text-slate-300 text-sm">{formatDate(t.createdAt)}</td>
                <td className="px-6 py-4 text-white text-sm">{t.user.name}</td>
                <td className="px-6 py-4"><span className="text-sm text-slate-400">{t._count.items} item</span></td>
                <td className="px-6 py-4 text-indigo-400 font-semibold">{formatCurrency(t.totalPrice)}</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-medium">{t.paymentMethod}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewDetail(t.id)} className="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-800"><HiOutlineEye className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Belum ada transaksi</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Detail Transaksi #{detail.id}</h2>
              <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <p className="text-slate-400">Tanggal: <span className="text-white">{formatDate(detail.createdAt)}</span></p>
              <p className="text-slate-400">Kasir: <span className="text-white">{detail.user.name}</span></p>
              <p className="text-slate-400">Pembayaran: <span className="text-cyan-400">{detail.paymentMethod}</span></p>
            </div>
            <div className="bg-slate-800/50 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-700">
                  <th className="px-4 py-2 text-left text-slate-400">Produk</th>
                  <th className="px-4 py-2 text-center text-slate-400">Qty</th>
                  <th className="px-4 py-2 text-right text-slate-400">Harga</th>
                  <th className="px-4 py-2 text-right text-slate-400">Subtotal</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-700">
                  {detail.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-white">{item.product.name}</td>
                      <td className="px-4 py-2 text-center text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-right text-indigo-400 font-medium">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-semibold">TOTAL</span>
              <span className="text-xl text-white font-bold">{formatCurrency(detail.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
