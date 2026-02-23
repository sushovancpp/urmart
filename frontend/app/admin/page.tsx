"use client";
import { useEffect, useState } from "react";
import { Users, ShoppingBag, Package, TrendingUp, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  orders: number;
  revenue: number;
  products: number;
  recent_orders: Array<{ id: string; user_name: string; total: number; status: string; created_at: string }>;
  top_products: Array<{ name: string; emoji: string; sold: number }>;
  orders_by_status: Array<{ status: string; count: number }>;
}

const statusColors: Record<string, string> = {
  confirmed:        "bg-blue-100 text-blue-700",
  packed:           "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.admin.stats().then((r: unknown) => { const res = r as { data: Stats }; setStats(res.data); });
  }, []);

  if (!stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: <TrendingUp className="w-6 h-6" />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Orders", value: stats.orders, icon: <ShoppingBag className="w-6 h-6" />, color: "text-blue-600 bg-blue-50" },
          { label: "Products", value: stats.products, icon: <Package className="w-6 h-6" />, color: "text-purple-600 bg-purple-50" },
          { label: "Customers", value: stats.users, icon: <Users className="w-6 h-6" />, color: "text-orange-600 bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Recent Orders
          </h2>
          <div className="space-y-3">
            {stats.recent_orders.map(order => (
              <div key={order.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-mono font-bold text-gray-500">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-gray-700">{order.id}</span>
                    <span className={`badge text-xs ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{order.user_name} · {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-primary-700 text-sm">₹{order.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold mb-4">🏆 Top Products</h2>
            <div className="space-y-3">
              {stats.top_products.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i+1}</span>
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-sm flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold mb-4">Orders by Status</h2>
            <div className="space-y-2.5">
              {stats.orders_by_status.map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className={`badge text-xs ${statusColors[s.status] || "bg-gray-100 text-gray-600"}`}>
                    {s.status.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (s.count / stats.orders) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
