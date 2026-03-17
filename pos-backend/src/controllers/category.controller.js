const prisma = require('../models/prisma');

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { products: true }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json({ message: 'Kategori berhasil dibuat', category });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json({ message: 'Kategori berhasil diupdate', category });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if there are products using this category
    const productsCount = await prisma.product.count({
      where: { categoryId: parseInt(id) }
    });

    if (productsCount > 0) {
      return res.status(400).json({ message: 'Tidak bisa menghapus kategori ini karena masih ada produk yang menggunakan kategori ini.' });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
