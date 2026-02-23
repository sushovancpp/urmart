"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/context";

const navItems = [
  { href: "/admin",          label: "Dashboard",  icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/admin/orders",   label: "Orders",     icon: <ShoppingBag className="w-5 h-5" /> },
  { href: "/admin/products", label: "Products",   icon: <Package className="w-5 h-5" /> },
  { href: "/admin/users",    label: "Users",      icon: <Users className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="text-white font-bold text-xl">🛒 UR MART</div>
          <div className="text-xs text-gray-500 mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))
                  ? "bg-primary-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              }`}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user.name[0]}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-gray-500 text-xs">Admin</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm px-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
