# 🛒 UR MART — Frontend (Next.js)

A modern, full-featured grocery delivery app frontend built with **Next.js 14 + TypeScript + Tailwind CSS**.

## ✨ Features

### Customer Pages
- **Home** — Hero banner, category grid, featured deals, trending products, coupon showcase
- **Products** — Searchable, filterable, sortable product catalog with sidebar filters
- **Product Detail** — Full product page with reviews, ratings, add to cart, wishlist
- **Cart** — Full checkout with address management, coupon codes, payment methods
- **Orders** — Order history with expandable order details
- **Wishlist** — Saved products with one-click cart add
- **Profile** — Edit name/phone, change password, manage delivery addresses

### Admin Panel (`/admin`)
- **Dashboard** — Revenue, orders, users, products stats + recent orders + top products
- **Orders** — Full order management with inline status updates
- **Products** — Add/Edit/Deactivate products in a modal form
- **Users** — Customer directory

### Technical Highlights
- JWT auth with auto-restore from localStorage
- Cart state synced with backend, cart drawer accessible site-wide
- Optimistic UI updates
- Responsive design — mobile-first
- Admin sidebar layout separate from customer layout

## 🚀 Setup

### 1. Install dependencies
```bash
cd urmart-frontend
npm install
```

### 2. Configure API URL (optional)
By default the frontend proxies `/api/*` calls to `http://localhost:5000`.
To change this, edit `next.config.mjs`.

Or set env:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start the backend
```bash
cd ..
python app.py
```

### 4. Start the frontend
```bash
npm run dev
```

Visit: **http://localhost:3000**

## 🔑 Demo Credentials

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@urmart.com   | admin123  |
| User  | john@example.com   | pass123   |

## 🗂️ Project Structure

```
app/
├── page.tsx              ← Home
├── layout.tsx            ← Root layout (Navbar + CartDrawer)
├── globals.css
├── products/
│   ├── page.tsx          ← Product listing
│   └── [id]/page.tsx     ← Product detail
├── cart/page.tsx         ← Cart + Checkout
├── wishlist/page.tsx
├── orders/page.tsx
├── profile/page.tsx
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── admin/
    ├── layout.tsx        ← Admin sidebar layout
    ├── page.tsx          ← Dashboard
    ├── orders/page.tsx
    ├── products/page.tsx
    └── users/page.tsx

components/
├── Navbar.tsx
├── CartDrawer.tsx
└── ProductCard.tsx

lib/
├── api.ts                ← All API calls + TypeScript types
└── context.tsx           ← Global state (auth + cart)
```

## 🎨 Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icons)
- **React Context + useReducer** (state management)
