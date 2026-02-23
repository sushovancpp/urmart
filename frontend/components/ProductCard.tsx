"use client";
import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { useState } from "react";
import { Product } from "@/lib/api";
import { useApp } from "@/lib/context";

interface ProductCardProps {
  product: Product;
  wishlisted?: boolean;
  onWishlistToggle?: (id: string) => void;
}

export default function ProductCard({ product, wishlisted, onWishlistToggle }: ProductCardProps) {
  const { addToCart, user } = useApp();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = "/auth/login"; return; }
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch { /* ignore */ }
    finally { setAdding(false); }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/auth/login"; return; }
    onWishlistToggle?.(product.id);
  };

  return (
    <Link href={`/products/${product.id}`}
      className="card group flex flex-col overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Image area */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center overflow-hidden">
        <span className="text-6xl transition-transform duration-200 group-hover:scale-110">{product.emoji}</span>
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {product.discount}% OFF
          </div>
        )}
        {onWishlistToggle && (
          <button onClick={handleWishlist}
            className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2 left-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Only {product.stock} left
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-gray-500 font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-xs text-gray-400 font-medium">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mt-0.5">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{product.weight}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.review_count})</span>
        </div>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <div className="font-bold text-gray-900">₹{product.price}</div>
            {product.mrp > product.price && (
              <div className="text-xs text-gray-400 line-through">₹{product.mrp}</div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className={`p-2 rounded-xl transition-all duration-200 font-semibold text-sm flex items-center gap-1.5 ${
              added
                ? "bg-green-100 text-green-700"
                : product.stock === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700 active:scale-95"
            }`}
          >
            {added ? "✓" : adding ? "..." : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}
