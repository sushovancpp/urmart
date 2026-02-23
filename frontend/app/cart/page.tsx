"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, Tag, MapPin, CreditCard, Truck } from "lucide-react";
import { api, Address } from "@/lib/api";
import { useApp } from "@/lib/context";

export default function CartPage() {
  const { user, cart, updateCartItem, removeFromCart, fetchCart } = useApp();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState("");
  const [payment, setPayment] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [newAddr, setNewAddr] = useState({ label:"Home", line1:"", city:"", state:"", pincode:"" });
  const [showAddrForm, setShowAddrForm] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    fetchCart();
    api.addresses.list().then((r: unknown) => {
      const res = r as { data: Address[] };
      setAddresses(res.data);
      const def = res.data.find(a => a.is_default);
      if (def) setSelectedAddr(def.id);
    });
  }, [user, router, fetchCart]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const r = await api.coupons.apply(coupon.trim(), cart?.subtotal || 0) as { data: { discount: number }; message: string };
      setCouponDiscount(r.data.discount);
      setCouponMsg(`✅ ${r.message}`);
    } catch (e: unknown) {
      setCouponMsg(`❌ ${e instanceof Error ? e.message : "Invalid coupon"}`);
      setCouponDiscount(0);
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api.addresses.add(newAddr) as { data: Address };
    setAddresses(prev => [...prev, r.data]);
    setSelectedAddr(r.data.id);
    setShowAddrForm(false);
    setNewAddr({ label:"Home", line1:"", city:"", state:"", pincode:"" });
  };

  const placeOrder = async () => {
    const addr = addresses.find(a => a.id === selectedAddr);
    if (!addr) { alert("Please select a delivery address"); return; }
    if (!user?.phone) { alert("Please add a phone number in your profile"); return; }
    setPlacing(true);
    try {
      const r = await api.orders.place({
        address: { line1: addr.line1, city: addr.city, pincode: addr.pincode, phone: user.phone },
        payment_method: payment,
        coupon_code: coupon,
        notes,
      }) as { data: { id: string } };
      router.push(`/orders?success=${r.data.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Order failed");
    } finally {
      setPlacing(false);
    }
  };

  if (!user) return null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
        <Link href="/products" className="btn-primary px-8 py-3">Start Shopping</Link>
      </div>
    );
  }

  const finalTotal = cart.total + cart.delivery_fee - cart.loyalty_discount - couponDiscount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items + Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart items */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Items ({cart.count})</h2>
            <div className="space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.weight} · {item.brand}</p>
                    <p className="text-primary-600 font-bold mt-1">₹{item.price} × {item.qty} = ₹{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => item.qty > 1 ? updateCartItem(item.id, item.qty - 1) : removeFromCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={() => item.qty < item.stock && updateCartItem(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stock}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" /> Delivery Address
            </h2>
            <div className="space-y-3 mb-4">
              {addresses.map(addr => (
                <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddr === addr.id ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" name="address" value={addr.id} checked={selectedAddr === addr.id}
                    onChange={() => setSelectedAddr(addr.id)} className="mt-1" />
                  <div>
                    <span className="font-semibold text-sm">{addr.label}</span>
                    <p className="text-sm text-gray-600 mt-0.5">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                </label>
              ))}
            </div>
            {!showAddrForm ? (
              <button onClick={() => setShowAddrForm(true)} className="text-primary-600 text-sm font-medium hover:underline">
                + Add new address
              </button>
            ) : (
              <form onSubmit={addAddress} className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <select value={newAddr.label} onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                    className="input col-span-2">
                    <option>Home</option><option>Work</option><option>Other</option>
                  </select>
                  <input required placeholder="Address line" value={newAddr.line1} onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })} className="input col-span-2" />
                  <input required placeholder="City" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} className="input" />
                  <input required placeholder="State" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} className="input" />
                  <input required placeholder="Pincode" value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} className="input col-span-2" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm px-4 py-2">Save</button>
                  <button type="button" onClick={() => setShowAddrForm(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" /> Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: "cod", label: "Cash on Delivery", icon: "💵" },
                { value: "upi", label: "UPI", icon: "📱" },
                { value: "card", label: "Credit/Debit Card", icon: "💳" },
              ].map(p => (
                <label key={p.value} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${payment === p.value ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" name="payment" value={p.value} checked={payment === p.value} onChange={() => setPayment(p.value)} />
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-sm font-medium">{p.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Order Notes (optional)</label>
              <textarea rows={2} placeholder="Special instructions..."
                value={notes} onChange={e => setNotes(e.target.value)}
                className="input resize-none" />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="font-semibold text-lg">Order Summary</h2>

            {/* Coupon */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Coupon code" value={coupon}
                    onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponMsg(""); setCouponDiscount(0); }}
                    className="input pl-9 text-sm" />
                </div>
                <button onClick={applyCoupon} className="btn-primary text-sm px-3">Apply</button>
              </div>
              {couponMsg && <p className={`text-xs mt-1.5 ${couponMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{couponMsg}</p>}
              <div className="flex gap-2 mt-2">
                {["WELCOME10","SAVE50","FRESH20"].map(c => (
                  <button key={c} onClick={() => setCoupon(c)}
                    className="text-xs border border-dashed border-gray-300 px-2 py-1 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors font-mono">
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 text-sm border-t pt-5">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{cart.subtotal}</span></div>
              {cart.loyalty_discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Loyalty (5%)</span><span>-₹{cart.loyalty_discount}</span></div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Coupon ({coupon})</span><span>-₹{couponDiscount}</span></div>
              )}
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Delivery</span>
                <span>{cart.delivery_fee === 0 ? <span className="text-green-600">FREE</span> : `₹${cart.delivery_fee}`}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-700">₹{Math.max(0, cart.subtotal + cart.delivery_fee - cart.loyalty_discount - couponDiscount)}</span>
              </div>
            </div>

            <button onClick={placeOrder} disabled={placing || !selectedAddr}
              className="btn-primary w-full py-4 text-base font-bold">
              {placing ? "Placing Order..." : "Place Order"}
            </button>
            <p className="text-xs text-center text-gray-400">Secure checkout · Free returns</p>
          </div>
        </div>
      </div>
    </div>
  );
}
