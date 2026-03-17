const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Simpan instance io agar bisa diakses dari controller
app.set('io', io);

app.use(cors());
app.use(express.json());

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/export', require('./routes/export.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS API is running!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
