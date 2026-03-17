const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Default role to CASHIER if not provided
    const userRole = role || 'CASHIER';

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole
      }
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    // Buat token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
