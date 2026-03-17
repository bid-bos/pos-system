const prisma = require('../models/prisma');

const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Penjualan & Total Pemasukan Sepanjang Waktu
    const totalTransactionsAllTime = await prisma.transaction.count();
    const sumAllTime = await prisma.transaction.aggregate({
      _sum: { totalPrice: true }
    });
    
    // 2. Total Penjualan & Pemasukan HARI INI
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Mulai dari jam 00:00:00 hari ini

    const totalTransactionsToday = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: today // Lebih besar atau sama dengan hari ini pukul 00:00
        }
      }
    });

    const sumToday = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: today
        }
      },
      _sum: { totalPrice: true }
    });

    // 3. Item yang memiliki stok menipis (misal di bawah 10)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 10 } },
      select: { id: true, name: true, stock: true },
      take: 5
    });

    res.json({
      allTime: {
        revenue: sumAllTime._sum.totalPrice || 0,
        transactionsCount: totalTransactionsAllTime
      },
      today: {
        revenue: sumToday._sum.totalPrice || 0,
        transactionsCount: totalTransactionsToday
      },
      alerts: {
        lowStockProducts
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data dashboard.' });
  }
};

module.exports = {
  getDashboardStats
};
