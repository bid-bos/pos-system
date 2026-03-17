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
    api.get('/dashboard/stats').then((res) => {
      setStats(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { title: 'Penjualan Hari Ini', value: formatCurrency(stats?.today.revenue || 0), sub: `${stats?.today.transactionsCount || 0} transaksi`, icon: HiOutlineCurrencyDollar, gradient: 'from-indigo-600 to-indigo-400' },
    { title: 'Total Penjualan', value: formatCurrency(stats?.allTime.revenue || 0), sub: `${stats?.allTime.transactionsCount || 0} transaksi`, icon: HiOutlineShoppingCart, gradient: 'from-cyan-600 to-cyan-400' },
    { title: 'Stok Menipis', value: `${stats?.alerts.lowStockProducts.length || 0} produk`, sub: 'stok < 10', icon: HiOutlineExclamation, gradient: 'from-amber-600 to-amber-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Ringkasan performa toko hari ini</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm text-slate-400 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats?.alerts.lowStockProducts && stats.alerts.lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <HiOutlineExclamation className="w-5 h-5" />
            Peringatan Stok Menipis
          </h3>
          <div className="space-y-2">
            {stats.alerts.lowStockProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center py-2 px-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300 text-sm">{product.name}</span>
                <span className="text-amber-400 font-medium text-sm">Sisa: {product.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
