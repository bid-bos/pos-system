'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HiOutlineViewGrid, HiOutlineCube, HiOutlineTag, HiOutlineShoppingCart, HiOutlineDocumentText, HiOutlineLogout } from 'react-icons/hi';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { href: '/dashboard/products', label: 'Produk', icon: HiOutlineCube },
  { href: '/dashboard/categories', label: 'Kategori', icon: HiOutlineTag },
  { href: '/dashboard/cashier', label: 'Kasir', icon: HiOutlineShoppingCart },
  { href: '/dashboard/transactions', label: 'Transaksi', icon: HiOutlineDocumentText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col z-40">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">POS System</h1>
            <p className="text-xs text-slate-500">Sistem Kasir UMKM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
