"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { api, Product, Category } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useApp } from "@/lib/context";
import { Suspense } from "react";

function ProductsContent() {
  const { user } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const category = searchParams.get("category") || "";
  const search   = searchParams.get("search") || "";
  const sort     = searchParams.get("sort") || "default";

  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.products.list({ category, search, sort, per_page: 50 }) as { data: Product[]; total: number };
      setProducts(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
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

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "search") params.delete("search");
    router.push(`/products?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (category) params.set("category", category);
    router.push(`/products?${params}`);
  };

  const toggleWishlist = async (pid: string) => {
    await api.wishlist.toggle(pid);
    setWishlistIds(prev => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n; });
  };

  const activeCategory = categories.find(c => c.id === category);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.name}` : search ? `Results for "${search}"` : "All Products"}
          </h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} products found</p>}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="input pl-9 w-56"
            />
          </div>
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="card p-4 sticky top-24">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </h3>

            {/* Categories */}
            <div className="mb-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Category</p>
              <div className="space-y-1">
                <button onClick={() => setParam("category", "")}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${!category ? "bg-primary-100 text-primary-700 font-medium" : "hover:bg-gray-50 text-gray-600"}`}>
                  All Products
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setParam("category", cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat.id ? "bg-primary-100 text-primary-700 font-medium" : "hover:bg-gray-50 text-gray-600"}`}>
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Sort By</p>
              <div className="space-y-1">
                {[
                  { value: "default", label: "Popularity" },
                  { value: "price_asc", label: "Price: Low–High" },
                  { value: "price_desc", label: "Price: High–Low" },
                  { value: "rating", label: "Highest Rated" },
                  { value: "discount", label: "Best Deals" },
                  { value: "newest", label: "Newest" },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("sort", opt.value); router.push(`/products?${p}`); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${sort === opt.value ? "bg-primary-100 text-primary-700 font-medium" : "hover:bg-gray-50 text-gray-600"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Active filters */}
          {(category || search) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <span className="bg-primary-100 text-primary-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  {activeCategory?.emoji} {activeCategory?.name}
                  <button onClick={() => setParam("category", "")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {search && (
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  &quot;{search}&quot;
                  <button onClick={() => { router.push("/products"); setSearchInput(""); }}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card aspect-[3/4] animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-semibold text-lg">No products found</h3>
              <p className="text-gray-500 text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p.id} product={p}
                  wishlisted={wishlistIds.has(p.id)} onWishlistToggle={toggleWishlist} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
