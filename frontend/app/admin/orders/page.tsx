"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { api, Order } from "@/lib/api";

const STATUSES = ["confirmed","packed","out_for_delivery","delivered","cancelled"];
const STATUS_COLORS: Record<string, string> = {
  confirmed:        "bg-blue-100 text-blue-700",
  packed:           "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = (status?: string) => {
    setLoading(true);
    api.admin.orders.list(status)
      .then((r: unknown) => { const res = r as { data: Order[] }; setOrders(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter || undefined); }, [filter]);

  const updateStatus = async (oid: string, status: string) => {
    setUpdating(oid);
    try {
      await api.admin.orders.updateStatus(oid, status);
      setOrders(prev => prev.map(o => o.id === oid ? { ...o, status } : o));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o =>
    !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
    (o.user_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 w-48" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="flex-1 flex items-center gap-4 text-left">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-700">{order.id}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.user_name || "—"}</p>
                      <p className="text-xs text-gray-400">{order.user_email}</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary-700">₹{order.total}</p>
                      <p className="text-xs text-gray-400">{order.items.length} items · {order.payment_method}</p>
                    </div>
                    <div>
                      <span className={`badge text-xs ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} />
                </button>

                {/* Status update */}
                <select value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  disabled={updating === order.id}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white disabled:opacity-50">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>

              {expanded === order.id && (
                <div className="border-t bg-gray-50 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="text-xl">{item.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.weight} · ×{item.qty}</p>
                          </div>
                          <span className="text-sm font-semibold">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Delivery Info</h3>
                    <p className="text-sm">{order.address_line}</p>
                    <p className="text-sm text-gray-500">{order.city} · {order.pincode}</p>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                    {order.notes && <p className="text-xs text-gray-400 mt-2 italic">&ldquo;{order.notes}&rdquo;</p>}
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                      <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Delivery</span><span>{order.delivery_fee === 0 ? "FREE" : `₹${order.delivery_fee}`}</span></div>
                      <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>₹{order.total}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
