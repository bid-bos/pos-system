'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineExclamation } from 'react-icons/hi';

interface DashboardStats {
  allTime: { revenue: number; transactionsCount: number };
  today: { revenue: number; transactionsCount: number };
  alerts: { lowStockProducts: { id: number; name: string; stock: number }[] };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  const cards = [
    { title: 'Penjualan Hari Ini', value: formatCurrency(stats?.today.revenue || 0), sub: `${stats?.today.transactionsCount || 0} transaksi`, icon: HiOutlineCurrencyDollar, color: 'var(--accent)' },
    { title: 'Total Penjualan', value: formatCurrency(stats?.allTime.revenue || 0), sub: `${stats?.allTime.transactionsCount || 0} transaksi`, icon: HiOutlineShoppingCart, color: 'var(--success)' },
    { title: 'Stok Menipis', value: `${stats?.alerts.lowStockProducts.length || 0} produk`, sub: 'stok < 10', icon: HiOutlineExclamation, color: 'var(--warning)' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Ringkasan performa toko</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${card.color} 15%, transparent)`, color: card.color }}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats?.alerts.lowStockProducts && stats.alerts.lowStockProducts.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--warning-light)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)' }}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--warning)' }}>
            <HiOutlineExclamation className="w-4 h-4" />
            Peringatan Stok Menipis
          </h3>
          <div className="space-y-2">
            {stats.alerts.lowStockProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center py-2 px-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                <span className="font-medium text-sm" style={{ color: 'var(--warning)' }}>Sisa: {product.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
