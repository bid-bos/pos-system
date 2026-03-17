const prisma = require('../models/prisma');

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true }
        }
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, stock, categoryId, barcode } = req.body;
    
    if (!name || price === undefined || stock === undefined || !categoryId) {
      return res.status(400).json({ message: 'Nama, harga, stok, dan ID kategori wajib diisi.' });
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!categoryExists) {
      return res.status(400).json({ message: 'Kategori tidak ditemukan.' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseInt(price),
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
        barcode: barcode || null
      }
    });

    res.status(201).json({ message: 'Produk berhasil dibuat', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, categoryId, barcode } = req.body;

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });
      if (!categoryExists) return res.status(400).json({ message: 'Kategori tidak ditemukan.' });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { 
        ...(name && { name }),
        ...(price !== undefined && { price: parseInt(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(barcode !== undefined && { barcode }) // Can be null
      }
    });

    res.json({ message: 'Produk berhasil diupdate', product });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
