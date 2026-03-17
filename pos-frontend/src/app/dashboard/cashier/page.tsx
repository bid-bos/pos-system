'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlineShoppingCart } from 'react-icons/hi';
import { useSocket } from '@/context/SocketContext';

interface Product {
  id: number; name: string; price: number; stock: number; category: { name: string };
}

interface CartItem {
  product: Product; quantity: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processing, setProcessing] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data)).catch(() => toast.error('Gagal memuat produk'));
  }, []);

  // Realtime: listen for stock updates from other cashiers
  useEffect(() => {
    if (!socket) return;
    const handleStockUpdate = (updatedProducts: Product[]) => {
      setProducts(updatedProducts);
    };
    const handleNewTransaction = (data: { id: number; totalPrice: number; itemCount: number }) => {
      toast(`Transaksi #${data.id} baru diproses (${data.itemCount} item)`, { icon: '🔔' });
    };
    socket.on('stock:updated', handleStockUpdate);
    socket.on('transaction:new', handleNewTransaction);
    return () => {
      socket.off('stock:updated', handleStockUpdate);
      socket.off('transaction:new', handleNewTransaction);
    };
  }, [socket]);

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error(`Stok ${product.name} tidak cukup`); return prev; }
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.product.stock) { toast.error('Stok tidak cukup'); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((item) => item.product.id !== productId));

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang masih kosong');
    setProcessing(true);
    try {
      const items = cart.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
      await api.post('/transactions/checkout', { items, paymentMethod });
      toast.success('Transaksi berhasil! 🎉');
      setCart([]);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal memproses transaksi');
    } finally { setProcessing(false); }
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-3rem)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Kasir</h1>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start pr-1">
          {filteredProducts.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} className="rounded-xl p-4 text-left active:scale-[0.98]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{product.category.name}</p>
              <div className="flex justify-between items-end mt-3">
                <p className="font-semibold text-sm" style={{ color: 'var(--accent-text)' }}>{formatCurrency(product.price)}</p>
                <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: product.stock < 10 ? 'var(--warning-light)' : 'var(--success-light)', color: product.stock < 10 ? 'var(--warning)' : 'var(--success)' }}>{product.stock}</span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && <div className="col-span-full text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada produk ditemukan</div>}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 rounded-2xl flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <HiOutlineShoppingCart className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Keranjang
            {cart.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{cart.length}</span>}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <HiOutlineShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada item</p>
              <p className="text-xs mt-0.5">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.product.price)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1" style={{ color: 'var(--text-muted)' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--danger)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-md text-white" style={{ background: 'var(--accent)' }}><HiOutlineMinus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-7 text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-md text-white" style={{ background: 'var(--accent)' }}><HiOutlinePlus className="w-3 h-3" /></button>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--accent-text)' }}>{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <option value="CASH">Cash</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
          </select>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalPrice)}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || processing} className="w-full py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]" style={{ background: 'var(--accent)' }}>
            {processing ? 'Memproses...' : 'Proses Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}
