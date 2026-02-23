"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, CheckCircle, Clock, Truck, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { api, Order } from "@/lib/api";
import { useApp } from "@/lib/context";
import { Suspense } from "react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed:         { label: "Confirmed",        color: "text-blue-600 bg-blue-50",   icon: <CheckCircle className="w-4 h-4" /> },
  packed:            { label: "Packed",            color: "text-purple-600 bg-purple-50", icon: <Package className="w-4 h-4" /> },
  out_for_delivery:  { label: "Out for Delivery",  color: "text-orange-600 bg-orange-50", icon: <Truck className="w-4 h-4" /> },
  delivered:         { label: "Delivered",         color: "text-green-600 bg-green-50",  icon: <CheckCircle className="w-4 h-4" /> },
  cancelled:         { label: "Cancelled",         color: "text-red-600 bg-red-50",      icon: <XCircle className="w-4 h-4" /> },
};

function OrdersContent() {
  const { user } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const successId = searchParams.get("success");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(successId);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    api.orders.list()
      .then((r: unknown) => { const res = r as { data: Order[] }; setOrders(res.data); })
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-primary-600" /> My Orders
      </h1>

      {successId && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Order placed successfully! 🎉</p>
            <p className="text-sm text-green-600 mt-0.5">Order ID: <span className="font-mono font-bold">{successId}</span></p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-50" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
          <Link href="/products" className="btn-primary px-8 py-3">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const s = statusConfig[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50", icon: <Clock className="w-4 h-4" /> };
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Header */}
                <button className="w-full text-left p-5 flex items-start justify-between gap-4"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                      {s.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm">{order.id}</span>
                        <span className={`badge ${s.color}`}>{s.icon} {s.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold text-gray-900">₹{order.total}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-500 capitalize">{order.payment_method.replace("_", " ")}</span>
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-1" />}
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-4">
                    {/* Items */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="text-2xl">{item.emoji}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.weight} · ×{item.qty}</p>
                            </div>
                            <span className="text-sm font-semibold">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Delivery Address</p>
                      <p className="text-sm text-gray-700">{order.address_line}, {order.city} - {order.pincode}</p>
                      <p className="text-sm text-gray-500">{order.phone}</p>
                    </div>

                    {/* Price breakdown */}
                    <div className="text-sm space-y-1 border-t pt-3">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                      {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
                      <div className="flex justify-between text-gray-500"><span>Delivery</span><span>{order.delivery_fee === 0 ? "FREE" : `₹${order.delivery_fee}`}</span></div>
                      <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="text-primary-700">₹{order.total}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersContent /></Suspense>;
}
