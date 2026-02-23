"use client";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/context";

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, updateCartItem, removeFromCart } = useApp();

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={closeCart} />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-lg">My Cart</h2>
            {cart && cart.count > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {cart.count} items
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!cart || cart.items.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <span className="text-6xl">🛒</span>
              <div>
                <p className="font-semibold text-gray-800">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-1">Add items to get started</p>
              </div>
              <button onClick={closeCart}>
                <Link href="/products" className="btn-primary text-sm">Browse Products</Link>
              </button>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.weight}</p>
                  <p className="text-primary-600 font-semibold text-sm">₹{item.price}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => item.qty > 1 ? updateCartItem(item.id, item.qty - 1) : removeFromCart(item.id)}
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.qty}</span>
                    <button
                      onClick={() => item.qty < item.stock && updateCartItem(item.id, item.qty + 1)}
                      disabled={item.qty >= item.stock}
                      className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-5 space-y-4 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cart.subtotal}</span>
              </div>
              {cart.loyalty_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Loyalty discount (5%)</span>
                  <span>-₹{cart.loyalty_discount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>{cart.delivery_fee === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${cart.delivery_fee}`}</span>
              </div>
              {cart.delivery_fee > 0 && (
                <p className="text-xs text-gray-400">Add ₹{299 - cart.subtotal} more for free delivery</p>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary-700">₹{cart.total}</span>
              </div>
            </div>
            <Link href="/cart" onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
