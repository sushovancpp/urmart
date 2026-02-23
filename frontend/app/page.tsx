"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Leaf } from "lucide-react";
import { api, Product, Category } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useApp } from "@/lib/context";

export default function HomePage() {
  const { user } = useApp();
  const [featured, setFeatured]   = useState<Product[]>([]);
  const [trending, setTrending]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.products.featured().then((r: unknown) => { const res = r as { data: Product[] }; setFeatured(res.data); });
    api.products.trending().then((r: unknown) => { const res = r as { data: Product[] }; setTrending(res.data); });
    api.categories.list().then((r: unknown) => { const res = r as { data: Category[] }; setCategories(res.data); });
  }, []);

  useEffect(() => {
    if (user) {
      api.wishlist.get().then((r: unknown) => {
        const res = r as { data: Array<{ id: string }> };
        setWishlistIds(new Set(res.data.map(p => p.id)));
      });
    }
  }, [user]);

  const toggleWishlist = async (pid: string) => {
    await api.wishlist.toggle(pid);
    setWishlistIds(prev => {
      const n = new Set(prev);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> 30-minute delivery
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
              Fresh Groceries<br />
              <span className="text-primary-200">At Your Door</span>
            </h1>
            <p className="text-primary-100 text-lg mb-8 max-w-md">
              Shop from thousands of products with unbeatable prices. Free delivery on orders above ₹299.
            </p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link href="/products" className="bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              {!user && (
                <Link href="/auth/register" className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                  Sign Up Free
                </Link>
              )}
            </div>
          </div>
          <div className="text-9xl hidden md:block animate-bounce-slow">🛒</div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Zap className="w-5 h-5 text-yellow-500" />, title: "Fast Delivery", desc: "30 min to your door" },
            { icon: <Leaf className="w-5 h-5 text-green-500" />, title: "Fresh & Organic", desc: "Farm to table quality" },
            { icon: <Shield className="w-5 h-5 text-blue-500" />, title: "Secure Payments", desc: "100% safe & protected" },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">{f.icon}</div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link href="/products" className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.id}`}
              className="flex flex-col items-center gap-2 p-4 card hover:border-primary-200 hover:bg-primary-50 transition-all group cursor-pointer">
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-xs font-medium text-center text-gray-700 leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Deals */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">🔥 Best Deals</h2>
              <p className="text-sm text-gray-500">Biggest discounts today</p>
            </div>
            <Link href="/products?sort=discount" className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.slice(0, 5).map(p => (
              <ProductCard key={p.id} product={p}
                wishlisted={wishlistIds.has(p.id)} onWishlistToggle={toggleWishlist} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">⭐ Trending Now</h2>
            <p className="text-sm text-gray-500">Most popular products</p>
          </div>
          <Link href="/products?sort=rating" className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.slice(0, 12).map(p => (
            <ProductCard key={p.id} product={p}
              wishlisted={wishlistIds.has(p.id)} onWishlistToggle={toggleWishlist} />
          ))}
        </div>
      </section>

      {/* Coupon Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Use Promo Codes for Extra Savings!</h3>
            <div className="flex flex-wrap gap-3">
              {["WELCOME10", "SAVE50", "FRESH20"].map(code => (
                <span key={code} className="bg-white/20 backdrop-blur px-3 py-1 rounded-lg font-mono font-bold text-sm">
                  {code}
                </span>
              ))}
            </div>
          </div>
          <Link href="/products" className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors shrink-0">
            Shop & Save
          </Link>
        </div>
      </section>
    </div>
  );
}
