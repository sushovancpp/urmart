"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { api, Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useApp } from "@/lib/context";

export default function WishlistPage() {
  const { user } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    api.wishlist.get()
      .then((r: unknown) => { const res = r as { data: Product[] }; setProducts(res.data); })
      .finally(() => setLoading(false));
  }, [user, router]);

  const toggleWishlist = async (pid: string) => {
    await api.wishlist.toggle(pid);
    setProducts(prev => prev.filter(p => p.id !== pid));
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 fill-red-500 text-red-500" /> Wishlist
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card aspect-[3/4] animate-pulse bg-gray-50" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love for later.</p>
          <Link href="/products" className="btn-primary px-8 py-3">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} wishlisted onWishlistToggle={toggleWishlist} />
          ))}
        </div>
      )}
    </div>
  );
}
