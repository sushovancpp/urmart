"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Heart, User, Search, Menu, X, LayoutDashboard, LogOut, Package } from "lucide-react";
import { useApp } from "@/lib/context";

export default function Navbar() {
  const { user, cartCount, logout, openCart } = useApp();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Hide navbar in admin
  if (pathname.startsWith("/admin")) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-700 shrink-0">
          <span className="text-2xl">🛒</span>
          <span className="hidden sm:inline">UR MART</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for groceries, brands..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Wishlist */}
          <Link href="/wishlist" className="p-2 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors">
            <Heart className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name.split(" ")[0]}</span>
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}
                  <Link href="/orders" onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link href="/profile" onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={() => { logout(); setUserOpen(false); router.push("/"); }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm hidden sm:flex items-center gap-1.5">
              <User className="w-4 h-4" /> Sign In
            </Link>
          )}

          {/* Mobile menu */}
          <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Category bar */}
      <div className="border-t border-gray-50 bg-gray-50 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto py-2 text-sm">
          {[
            { href: "/products", label: "All" },
            { href: "/products?category=fruits", label: "🥦 Fruits & Veg" },
            { href: "/products?category=dairy", label: "🥛 Dairy" },
            { href: "/products?category=bakery", label: "🍞 Bakery" },
            { href: "/products?category=snacks", label: "🍿 Snacks" },
            { href: "/products?category=beverages", label: "🧃 Beverages" },
            { href: "/products?category=meat", label: "🐟 Meat & Fish" },
            { href: "/products?category=frozen", label: "🧊 Frozen" },
            { href: "/products?category=household", label: "🧹 Household" },
            { href: "/products?category=personal", label: "🧴 Personal Care" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="whitespace-nowrap text-gray-600 hover:text-primary-700 font-medium transition-colors py-0.5">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white px-4 py-4 space-y-3">
          {!user && (
            <Link href="/auth/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <User className="w-4 h-4" /> Sign In
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { href: "/products", label: "🛍️ All Products" },
              { href: "/orders", label: "📦 My Orders" },
              { href: "/wishlist", label: "❤️ Wishlist" },
              { href: "/profile", label: "👤 Profile" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-gray-700 py-2 px-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {userOpen && <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />}
    </header>
  );
}
