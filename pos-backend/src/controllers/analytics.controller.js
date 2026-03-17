const prisma = require('../models/prisma');

const getAnalytics = async (req, res) => {
  try {
    // 1. Grafik penjualan 7 hari terakhir
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayData = await prisma.transaction.aggregate({
        where: {
          createdAt: { gte: date, lt: nextDate }
        },
        _sum: { totalPrice: true },
        _count: true
      });

      salesChart.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        revenue: dayData._sum.totalPrice || 0,
        transactions: dayData._count || 0
      });
    }

    // 2. Produk terlaris (top 5 berdasarkan jumlah terjual)
    const topProducts = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true }
        });
        return {
          name: product?.name || 'Produk Dihapus',
          price: product?.price || 0,
          totalSold: item._sum.quantity || 0,
          totalRevenue: (product?.price || 0) * (item._sum.quantity || 0)
        };
      })
    );

    // 3. Penjualan per metode pembayaran
    const paymentMethods = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      _sum: { totalPrice: true },
      _count: true
    });

    const paymentBreakdown = paymentMethods.map((pm) => ({
      method: pm.paymentMethod,
      revenue: pm._sum.totalPrice || 0,
      count: pm._count || 0
    }));

    // 4. Rata-rata transaksi per hari (30 hari terakhir)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const last30Days = await prisma.transaction.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalPrice: true },
      _count: true
    });

    const avgDailyRevenue = Math.round((last30Days._sum.totalPrice || 0) / 30);
    const avgDailyTransactions = Math.round((last30Days._count || 0) / 30);

    res.json({
      salesChart,
      topProducts: topProductsWithNames,
      paymentBreakdown,
      insights: {
        avgDailyRevenue,
        avgDailyTransactions,
        totalProducts: await prisma.product.count(),
        totalCategories: await prisma.category.count()
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Gagal mengambil data analytics.' });
  }
};

module.exports = { getAnalytics };
