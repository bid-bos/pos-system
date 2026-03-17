'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlineShoppingCart } from 'react-icons/hi';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: { name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
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

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data)).catch(() => toast.error('Gagal memuat produk'));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Stok ${product.name} tidak cukup`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              toast.error('Stok tidak cukup');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang belanja masih kosong');
    setProcessing(true);
    try {
      const items = cart.map((item) => ({ productId: item.product.id, quantity: item.quantity }));
      await api.post('/transactions/checkout', { items, paymentMethod });
      toast.success('Transaksi berhasil diproses! 🎉');
      setCart([]);
      // Refresh product list biar stok nya terupdate
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-4">Kasir</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start pr-2">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all group"
            >
              <p className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">{product.name}</p>
              <p className="text-xs text-slate-500 mt-1">{product.category.name}</p>
              <div className="flex justify-between items-end mt-3">
                <p className="text-indigo-400 font-semibold text-sm">{formatCurrency(product.price)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-md ${product.stock < 10 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {product.stock}
                </span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">Tidak ada produk ditemukan</div>
          )}
        </div>
      </div>

      {/* Cart / Keranjang */}
      <div className="w-96 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HiOutlineShoppingCart className="w-5 h-5 text-indigo-400" />
            Keranjang
            {cart.length > 0 && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{cart.length}</span>}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <HiOutlineShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada item</p>
              <p className="text-xs mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.product.price)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-slate-500 hover:text-red-400 p-1">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg"><HiOutlineMinus className="w-3 h-3" /></button>
                    <span className="text-white font-medium text-sm w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg"><HiOutlinePlus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-indigo-400 font-semibold text-sm">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
          </select>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-400">Total</span>
            <span className="text-white font-bold">{formatCurrency(totalPrice)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
          >
            {processing ? 'Memproses...' : 'Proses Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}
