"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingCart, ChevronRight, Plus, Minus } from "lucide-react";
import { api, Product, Review } from "@/lib/api";
import { useApp } from "@/lib/context";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { user, addToCart } = useApp();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    api.products.get(params.id)
      .then((r: unknown) => { const res = r as { data: Product }; setProduct(res.data); })
      .catch(() => router.push("/products"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (user && product) {
      api.wishlist.get().then((r: unknown) => {
        const res = r as { data: Array<{ id: string }> };
        setWishlisted(res.data.some(p => p.id === product.id));
      });
    }
  }, [user, product]);

  const handleAddToCart = async () => {
    if (!user) { router.push("/auth/login"); return; }
    setAdding(true);
    try { await addToCart(product!.id, qty); }
    catch { /* ignore */ }
    finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!user) { router.push("/auth/login"); return; }
    const res = await api.wishlist.toggle(product!.id) as { data: { wishlisted: boolean } };
    setWishlisted(res.data.wishlisted);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth/login"); return; }
    setSubmitting(true);
    try {
      const r = await api.products.addReview(product!.id, reviewForm.rating, reviewForm.comment) as { data: Review };
      setProduct(prev => prev ? {
        ...prev,
        reviews: [r.data, ...(prev.reviews || [])],
      } : prev);
      setReviewForm({ rating: 5, comment: "" });
      setReviewMsg("Review submitted!");
      setTimeout(() => setReviewMsg(""), 3000);
    } catch (err: unknown) {
      setReviewMsg(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded-xl w-3/4" />
            <div className="h-5 bg-gray-100 rounded-xl w-1/2" />
            <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-gray-600">Products</Link>
        <ChevronRight className="w-4 h-4" />
        {product.category && (
          <>
            <Link href={`/products?category=${product.category_id}`} className="hover:text-gray-600">{product.category.name}</Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-gray-700 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl aspect-square flex items-center justify-center relative">
          <span className="text-[140px]">{product.emoji}</span>
          {product.discount > 0 && (
            <div className="absolute top-5 left-5 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
              {product.discount}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-sm text-primary-600 font-medium mb-1">{product.brand}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded-full">{product.weight}</span>
              {product.category && (
                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                  {product.category.emoji} {product.category.name}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
              ))}
            </div>
            <span className="font-semibold">{product.rating}</span>
            <span className="text-gray-400 text-sm">({product.review_count} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">₹{product.mrp}</span>
                <span className="text-green-600 font-bold text-lg">Save ₹{product.mrp - product.price}</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : product.stock <= 10 ? "text-orange-500" : "text-green-600"}`}>
            {product.stock === 0 ? "Out of Stock" : product.stock <= 10 ? `Only ${product.stock} left!` : "In Stock"}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Qty + Add */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={adding}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base font-semibold">
                <ShoppingCart className="w-5 h-5" />
                {adding ? "Adding..." : "Add to Cart"}
              </button>
              <button onClick={handleWishlist}
                className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>
          )}

          {/* Free delivery info */}
          <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-700">
            🚚 {product.price >= 299 ? "Eligible for FREE delivery!" : `Add ₹${299 - product.price} more for free delivery`}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Review form */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            {!user && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">Sign in</Link> to write a review.
              </div>
            )}
            {user && (
              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                        <Star className={`w-7 h-7 transition-colors ${s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <textarea required rows={3}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience..."
                    className="input resize-none" />
                </div>
                {reviewMsg && <p className={`text-sm ${reviewMsg.includes("!") ? "text-green-600" : "text-red-600"}`}>{reviewMsg}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>

          {/* Reviews list */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {(!product.reviews || product.reviews.length === 0) ? (
              <div className="text-center py-10 text-gray-400">
                <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p>No reviews yet. Be the first!</p>
              </div>
            ) : product.reviews.map(review => (
              <div key={review.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                      {review.user_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.user_name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
