const prisma = require('../models/prisma');

const createTransaction = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja tidak boleh kosong.' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Metode pembayaran wajib diisi.' });
    }

    // Interactive Transaction menggunakan Prisma
    // Ini memastikan jika ada error di tengah jalan (misal stok kurang), maka semua perubahan dibatalkan (rollback)
    const result = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const transactionItemsData = [];

      for (const item of items) {
        // 1. Cek produk dan sisa stok
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId) }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk produk: ${product.name}. Sisa stok: ${product.stock}`);
        }

        // 2. Kalkulasi harga item saat ini (jaga-jaga harga produk berubah di masa depan, kita simpan harga saat transaksi terjadi)
        const itemTotalPrice = product.price * item.quantity;
        totalPrice += itemTotalPrice;

        // 3. Kurangi stok produk
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity }
        });

        // 4. Siapkan data item untuk disimpan ke TransactionItem
        transactionItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price // Save snapshot of the price
        });
      }

      // 5. Buat Record Transaction utama
      const transaction = await tx.transaction.create({
        data: {
          totalPrice,
          paymentMethod,
          userId,
          items: {
            create: transactionItemsData
          }
        },
        include: {
          items: true
        }
      });

      return transaction;
    });

    // Emit event realtime ke semua client yang terhubung
    const io = req.app.get('io');
    if (io) {
      // Kirim data produk yang stoknya berubah
      const updatedProducts = await prisma.product.findMany({
        include: { category: { select: { name: true } } }
      });
      io.emit('stock:updated', updatedProducts);

      // Kirim notifikasi transaksi baru
      io.emit('transaction:new', {
        id: result.id,
        totalPrice: result.totalPrice,
        paymentMethod: result.paymentMethod,
        itemCount: result.items.length
      });
    }

    res.status(201).json({
      message: 'Transaksi berhasil diproses',
      transaction: result
    });

  } catch (error) {
    console.error('Transaction Error:', error.message);
    res.status(400).json({ message: error.message || 'Gagal memproses transaksi.' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        _count: { select: { items: true } }
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { name: true, role: true } },
        items: {
          include: {
            product: { select: { name: true, barcode: true } }
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById
};
