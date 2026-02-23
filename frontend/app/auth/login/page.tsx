"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useApp } from "@/lib/context";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500 mt-1">Sign in to your UR MART account</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? "text" : "password"} required placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base font-semibold">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary-600 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Quick demo */}
          <div className="mt-6 border-t pt-5">
            <p className="text-xs text-gray-400 text-center mb-3">Quick demo logins</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ email: "admin@urmart.com", password: "admin123" })}
                className="text-xs border border-gray-200 rounded-xl py-2 px-3 hover:bg-gray-50 text-gray-600 transition-colors">
                👑 Admin
              </button>
              <button type="button" onClick={() => setForm({ email: "john@example.com", password: "pass123" })}
                className="text-xs border border-gray-200 rounded-xl py-2 px-3 hover:bg-gray-50 text-gray-600 transition-colors">
                👤 Test User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
