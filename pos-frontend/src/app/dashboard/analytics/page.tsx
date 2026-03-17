'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineCube, HiOutlineCurrencyDollar } from 'react-icons/hi';

interface SalesData {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
}

interface TopProduct {
  name: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
}

interface PaymentData {
  method: string;
  revenue: number;
  count: number;
}

interface Analytics {
  salesChart: SalesData[];
  topProducts: TopProduct[];
  paymentBreakdown: PaymentData[];
  insights: {
    avgDailyRevenue: number;
    avgDailyTransactions: number;
    totalProducts: number;
    totalCategories: number;
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then((res) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!data) return null;

  const insightCards = [
    { title: 'Rata-rata Pendapatan/Hari', value: formatCurrency(data.insights.avgDailyRevenue), icon: HiOutlineCurrencyDollar },
    { title: 'Rata-rata Transaksi/Hari', value: `${data.insights.avgDailyTransactions} transaksi`, icon: HiOutlineTrendingUp },
    { title: 'Total Produk', value: `${data.insights.totalProducts} produk`, icon: HiOutlineCube },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Analisis dan insight penjualan</p>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {insightCards.map((card) => (
          <div key={card.title} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Penjualan 7 Hari Terakhir</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.salesChart} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px' }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
              />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🏆 Produk Terlaris</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Belum ada data penjualan</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: CHART_COLORS[index] || 'var(--accent)' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.totalSold} terjual</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>{formatCurrency(product.totalRevenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>💳 Metode Pembayaran</h2>
          {data.paymentBreakdown.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Belum ada data</p>
          ) : (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.paymentBreakdown} dataKey="revenue" nameKey="method" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {data.paymentBreakdown.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.paymentBreakdown.map((pm, index) => (
                  <div key={pm.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{pm.method}</span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pm.count}x — {formatCurrency(pm.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
