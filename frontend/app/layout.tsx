import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "UR MART — Fresh Groceries Delivered",
  description: "Order fresh groceries and get delivery in 30 minutes.",
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-white font-bold text-xl mb-3">🛒 UR MART</div>
                  <p className="text-sm leading-relaxed">Fresh groceries delivered to your doorstep in 30 minutes. Quality products at the best prices.</p>
                </div>
                <div>
                  <div className="text-white font-semibold mb-3">Quick Links</div>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/products" className="hover:text-white transition-colors">All Products</a></li>
                    <li><a href="/orders" className="hover:text-white transition-colors">My Orders</a></li>
                    <li><a href="/wishlist" className="hover:text-white transition-colors">Wishlist</a></li>
                    <li><a href="/profile" className="hover:text-white transition-colors">Profile</a></li>
                  </ul>
                </div>
                <div>
                  <div className="text-white font-semibold mb-3">Coupons</div>
                  <ul className="space-y-1 text-sm font-mono">
                    <li><span className="text-primary-400">WELCOME10</span> — 10% off any order</li>
                    <li><span className="text-primary-400">SAVE50</span> — ₹50 off on ₹299+</li>
                    <li><span className="text-primary-400">FRESH20</span> — 20% off on ₹499+</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
                © {new Date().getFullYear()} UR MART. Built with ❤️ using Next.js + Flask.
              </div>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
