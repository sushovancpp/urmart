"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, MapPin, Plus, Trash2, Star } from "lucide-react";
import { api, Address } from "@/lib/api";
import { useApp } from "@/lib/context";

export default function ProfilePage() {
  const { user, logout } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<"profile"|"password"|"addresses">("profile");

  // Profile form
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [profileMsg, setProfileMsg] = useState({ text: "", ok: false });

  // Password form
  const [pw, setPw] = useState({ old: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState({ label:"Home", line1:"", city:"", state:"", pincode:"" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    setProfile({ name: user.name, phone: user.phone || "" });
    api.addresses.list().then((r: unknown) => { const res = r as { data: Address[] }; setAddresses(res.data); });
  }, [user, router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.updateProfile(profile);
      setProfileMsg({ text: "Profile updated!", ok: true });
    } catch (err: unknown) {
      setProfileMsg({ text: err instanceof Error ? err.message : "Failed", ok: false });
    }
    setTimeout(() => setProfileMsg({ text: "", ok: false }), 3000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { setPwMsg({ text: "Passwords don't match", ok: false }); return; }
    try {
      await api.users.changePassword(pw.old, pw.newPw);
      setPwMsg({ text: "Password changed!", ok: true });
      setPw({ old: "", newPw: "", confirm: "" });
    } catch (err: unknown) {
      setPwMsg({ text: err instanceof Error ? err.message : "Failed", ok: false });
    }
    setTimeout(() => setPwMsg({ text: "", ok: false }), 3000);
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api.addresses.add(newAddr) as { data: Address };
    setAddresses(prev => [...prev, r.data]);
    setShowForm(false);
    setNewAddr({ label:"Home", line1:"", city:"", state:"", pincode:"" });
  };

  const deleteAddress = async (id: string) => {
    await api.addresses.delete(id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefault = async (id: string) => {
    await api.addresses.setDefault(id);
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id ? 1 : 0 })));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {user.role === "admin" && (
            <span className="badge bg-amber-100 text-amber-700 mt-1"><Star className="w-3 h-3" /> Admin</span>
          )}
        </div>
        <button onClick={() => { logout(); router.push("/"); }}
          className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium">
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
        {[
          { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
          { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
          { id: "addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-5">Edit Profile</h2>
          {profileMsg.text && (
            <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${profileMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input value={user.email} disabled className="input opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+91 98765 43210" className="input" />
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5">Save Changes</button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-5">Change Password</h2>
          {pwMsg.text && (
            <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${pwMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={changePassword} className="space-y-4">
            {[
              { key: "old", label: "Current Password", value: pw.old },
              { key: "newPw", label: "New Password", value: pw.newPw },
              { key: "confirm", label: "Confirm New Password", value: pw.confirm },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                <input type="password" required minLength={f.key !== "old" ? 6 : undefined}
                  value={f.value} onChange={e => setPw({ ...pw, [f.key]: e.target.value })}
                  className="input" />
              </div>
            ))}
            <button type="submit" className="btn-primary px-6 py-2.5">Update Password</button>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === "addresses" && (
        <div className="space-y-4">
          {addresses.map(addr => (
            <div key={addr.id} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                {addr.label === "Home" ? "🏠" : addr.label === "Work" ? "🏢" : "📍"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{addr.label}</span>
                  {addr.is_default === 1 && (
                    <span className="badge bg-primary-100 text-primary-700">Default</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{addr.line1}</p>
                <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              <div className="flex gap-2">
                {addr.is_default !== 1 && (
                  <button onClick={() => setDefault(addr.id)}
                    className="text-xs text-primary-600 hover:underline font-medium">Set default</button>
                )}
                <button onClick={() => deleteAddress(addr.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="card p-5 w-full flex items-center gap-3 text-primary-600 hover:bg-primary-50 transition-colors border-2 border-dashed border-primary-200">
              <Plus className="w-5 h-5" /> Add New Address
            </button>
          ) : (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">New Address</h3>
              <form onSubmit={addAddress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={newAddr.label} onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                    className="input col-span-2">
                    <option>Home</option><option>Work</option><option>Other</option>
                  </select>
                  <input required placeholder="Address line" value={newAddr.line1}
                    onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })} className="input col-span-2" />
                  <input required placeholder="City" value={newAddr.city}
                    onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} className="input" />
                  <input required placeholder="State" value={newAddr.state}
                    onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} className="input" />
                  <input required placeholder="Pincode" value={newAddr.pincode}
                    onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} className="input col-span-2" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm px-4 py-2">Save Address</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
