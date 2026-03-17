'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineDocumentDownload, HiOutlineFilter } from 'react-icons/hi';

interface Transaction {
  id: number; totalPrice: number; paymentMethod: string; createdAt: string; user: { name: string }; _count: { items: number };
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
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    api.get('/transactions').then((res) => {
      setTransactions(res.data);
      setFilteredTransactions(res.data);
    }).catch(() => toast.error('Gagal memuat transaksi')).finally(() => setLoading(false));
  }, []);

  const viewDetail = async (id: number) => {
    try { const res = await api.get(`/transactions/${id}`); setDetail(res.data); } catch { toast.error('Gagal memuat detail'); }
  };

  // Filter by date range
  const applyFilter = () => {
    if (!startDate && !endDate) {
      setFilteredTransactions(transactions);
      return;
    }
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.createdAt);
      if (startDate && txDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
    setFilteredTransactions(filtered);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredTransactions(transactions);
  };

  // Export download handler
  const handleExport = (type: 'pdf' | 'excel') => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/export/${type}?${params.toString()}`;

    // Use fetch with auth header then trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Export gagal');
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = type === 'pdf' ? 'laporan-transaksi.pdf' : 'laporan-transaksi.xlsx';
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Export ${type.toUpperCase()} berhasil! 📄`);
      })
      .catch(() => toast.error(`Gagal export ${type.toUpperCase()}`));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Riwayat Transaksi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Semua catatan penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: showFilter ? 'var(--accent-light)' : 'var(--bg-card)', color: showFilter ? 'var(--accent-text)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <HiOutlineFilter className="w-4 h-4" /> Filter
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white active:scale-[0.98]" style={{ background: '#ef4444' }}>
            <HiOutlineDocumentDownload className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => handleExport('excel')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white active:scale-[0.98]" style={{ background: '#10b981' }}>
            <HiOutlineDocumentDownload className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="rounded-2xl p-4 mb-4 flex items-end gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <button onClick={applyFilter} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>Terapkan</button>
          <button onClick={clearFilter} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-secondary)' }}>Reset</button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ID</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tanggal</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Kasir</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Item</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Bayar</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aksi</th>
          </tr></thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td className="px-5 py-3.5 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(t.createdAt)}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-primary)' }}>{t.user.name}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{t._count.items} item</td>
                <td className="px-5 py-3.5 font-semibold text-sm" style={{ color: 'var(--accent-text)' }}>{formatCurrency(t.totalPrice)}</td>
                <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{t.paymentMethod}</span></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => viewDetail(t.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                    <HiOutlineEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi dalam periode ini'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-modal-overlay)' }}>
          <div className="rounded-2xl w-full max-w-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Transaksi #{detail.id}</h2>
              <button onClick={() => setDetail(null)} className="text-xl leading-none" style={{ color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <div className="space-y-1.5 mb-4 text-sm">
              <p style={{ color: 'var(--text-muted)' }}>Tanggal: <span style={{ color: 'var(--text-primary)' }}>{formatDate(detail.createdAt)}</span></p>
              <p style={{ color: 'var(--text-muted)' }}>Kasir: <span style={{ color: 'var(--text-primary)' }}>{detail.user.name}</span></p>
              <p style={{ color: 'var(--text-muted)' }}>Pembayaran: <span style={{ color: 'var(--accent-text)' }}>{detail.paymentMethod}</span></p>
            </div>
            <div className="rounded-xl overflow-hidden mb-4" style={{ background: 'var(--bg-hover)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-muted)' }}>Produk</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-muted)' }}>Qty</th>
                  <th className="px-4 py-2 text-right" style={{ color: 'var(--text-muted)' }}>Harga</th>
                  <th className="px-4 py-2 text-right" style={{ color: 'var(--text-muted)' }}>Subtotal</th>
                </tr></thead>
                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{item.product.name}</td>
                      <td className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-right font-medium" style={{ color: 'var(--accent-text)' }}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>TOTAL</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(detail.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
