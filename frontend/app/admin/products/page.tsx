"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { api, Product, Category } from "@/lib/api";

type ProductForm = {
  name: string; description: string; category_id: string; emoji: string;
  brand: string; weight: string; price: string; mrp: string;
  discount: string; stock: string; is_active: boolean;
};

const EMPTY_FORM: ProductForm = {
  name:"", description:"", category_id:"fruits", emoji:"", brand:"",
  weight:"", price:"", mrp:"", discount:"0", stock:"100", is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin.products.list().then((r: unknown) => { const res = r as { data: Product[] }; setProducts(res.data); setLoading(false); });
    api.categories.list().then((r: unknown) => { const res = r as { data: Category[] }; setCategories(res.data); });
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(""); setModal("add"); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description, category_id: p.category_id,
      emoji: p.emoji, brand: p.brand, weight: p.weight,
      price: String(p.price), mrp: String(p.mrp), discount: String(p.discount),
      stock: String(p.stock), is_active: p.is_active,
    });
    setEditId(p.id); setError(""); setModal("edit");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, price: +form.price, mrp: +form.mrp, discount: +form.discount, stock: +form.stock };
      if (modal === "add") {
        const r = await api.admin.products.add(payload) as { data: Product };
        setProducts(prev => [r.data, ...prev]);
      } else if (editId) {
        const r = await api.admin.products.update(editId, payload) as { data: Product };
        setProducts(prev => prev.map(p => p.id === editId ? r.data : p));
      }
      setModal(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this product?")) return;
    await api.admin.products.delete(id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
  };

  const f = (key: keyof ProductForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 w-44" />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product","Brand","Category","Price","Stock","Status","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.weight}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.brand}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{p.category_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">₹{p.price}</p>
                    {p.discount > 0 && <p className="text-xs text-green-600">{p.discount}% off</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock === 0 ? "text-red-500" : p.stock <= 10 ? "text-orange-500" : "text-gray-700"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {p.is_active && (
                        <button onClick={() => deactivate(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400">No products found.</div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{modal === "add" ? "Add Product" : "Edit Product"}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-2 text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                  <input required {...f("name")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Emoji *</label>
                  <input required placeholder="🍎" {...f("emoji")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category *</label>
                  <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brand</label>
                  <input {...f("brand")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Weight</label>
                  <input placeholder="500g" {...f("weight")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
                  <input required type="number" min="0" step="0.01" {...f("price")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">MRP (₹) *</label>
                  <input required type="number" min="0" step="0.01" {...f("mrp")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discount (%)</label>
                  <input type="number" min="0" max="100" {...f("discount")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock</label>
                  <input type="number" min="0" {...f("stock")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea rows={3} {...f("description")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
                </div>
                {modal === "edit" && (
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="is_active" checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                    <label htmlFor="is_active" className="text-sm font-medium">Active (visible to customers)</label>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? "Saving..." : modal === "add" ? "Add Product" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setModal(null)} className="btn-outline px-4 py-2.5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
