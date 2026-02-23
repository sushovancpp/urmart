# 🛒 UR MART — Full-Stack Grocery Delivery App

A modern grocery delivery web app with a **Flask + SQLite** backend and a **Next.js 14 + TypeScript + Tailwind CSS** frontend.

---

## 📸 Pages at a Glance

| Page | Description |
|---|---|
| `/` | Home — hero, categories, deals, trending |
| `/products` | Catalog — search, filter by category, sort |
| `/products/:id` | Product detail — reviews, add to cart, wishlist |
| `/cart` | Checkout — address, coupon codes, payment |
| `/orders` | Order history with expandable details |
| `/wishlist` | Saved products |
| `/profile` | Edit profile, change password, manage addresses |
| `/admin` | Dashboard — revenue, orders, top products |
| `/admin/orders` | Manage & update order statuses |
| `/admin/products` | Add / edit / deactivate products |
| `/admin/users` | Customer directory |

---

## 🗂️ Project Structure

```
urmart/
├── app.py                  ← Flask backend (single file)
├── urmart.db               ← SQLite database (auto-created)
│
└── frontend/               ← Next.js app
    ├── app/
    │   ├── layout.tsx      ← Root layout (Navbar + CartDrawer)
    │   ├── page.tsx        ← Home
    │   ├── globals.css
    │   ├── products/
    │   │   ├── page.tsx        ← Product listing
    │   │   └── [id]/page.tsx   ← Product detail
    │   ├── cart/page.tsx
    │   ├── wishlist/page.tsx
    │   ├── orders/page.tsx
    │   ├── profile/page.tsx
    │   ├── auth/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── admin/
    │       ├── layout.tsx      ← Sidebar layout (admin only)
    │       ├── page.tsx        ← Dashboard
    │       ├── orders/page.tsx
    │       ├── products/page.tsx
    │       └── users/page.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   ├── CartDrawer.tsx
    │   └── ProductCard.tsx
    ├── lib/
    │   ├── api.ts          ← All API calls + TypeScript types
    │   └── context.tsx     ← Global state (auth + cart)
    ├── next.config.mjs
    ├── tailwind.config.ts
    └── package.json
```

---

## ⚙️ Tech Stack

### Backend
| | |
|---|---|
| **Runtime** | Python 3.10+ |
| **Framework** | Flask |
| **Database** | SQLite (via `sqlite3`) |
| **Auth** | JWT (`PyJWT`) — 72-hour tokens |
| **Password hashing** | SHA-256 |

### Frontend
| | |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **State** | React Context + `useReducer` |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

---

### 1. Clone & set up

```bash
git clone https://github.com/your-username/urmart.git
cd urmart
```

---

### 2. Backend

```bash
# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install flask pyjwt

# Start the server
python app.py
```

The backend runs at **http://localhost:5000** and auto-creates `urmart.db` with seed data on first run.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at **http://localhost:3000** and proxies all `/api/*` requests to the Flask backend via `next.config.mjs`.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@urmart.com` | `admin123` |
| Test user | `john@example.com` | `pass123` |

> The test user is not seeded by default — register a new account or use the admin credentials.

---

## 🎟️ Promo Codes

| Code | Discount |
|---|---|
| `WELCOME10` | 10% off any order |
| `SAVE50` | ₹50 flat off on orders ₹299+ |
| `FRESH20` | 20% off on orders ₹499+ |

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | — | List products (filter, search, sort, paginate) |
| `GET` | `/api/products/:id` | — | Get product + reviews |
| `GET` | `/api/products/featured` | — | Featured deals (discount ≥ 15%) |
| `GET` | `/api/products/trending` | — | Most reviewed products |
| `POST` | `/api/products/:id/reviews` | ✅ | Submit a review |

**Query params for `/api/products`:**
- `category` — category id (e.g. `fruits`, `dairy`)
- `search` — text search
- `sort` — `default` \| `price_asc` \| `price_desc` \| `rating` \| `discount` \| `newest`
- `page` / `per_page`

### Cart
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | ✅ | Get cart with totals |
| `POST` | `/api/cart` | ✅ | Add item |
| `PUT` | `/api/cart/:item_id` | ✅ | Update quantity |
| `DELETE` | `/api/cart/:item_id` | ✅ | Remove item |
| `DELETE` | `/api/cart/clear` | ✅ | Empty cart |
| `POST` | `/api/cart/sync` | ✅ | Sync guest cart after login |

### Wishlist
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/wishlist` | ✅ | Get wishlist |
| `POST` | `/api/wishlist/:product_id` | ✅ | Toggle (add/remove) |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/orders` | ✅ | Place order |
| `GET` | `/api/orders` | ✅ | List user's orders |
| `GET` | `/api/orders/:id` | ✅ | Get single order |

### Addresses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/addresses` | ✅ | List addresses |
| `POST` | `/api/addresses` | ✅ | Add address |
| `DELETE` | `/api/addresses/:id` | ✅ | Delete address |
| `PUT` | `/api/addresses/:id/default` | ✅ | Set as default |

### Coupons
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/coupons/apply` | ✅ | Validate & apply coupon |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard stats |
| `GET` | `/api/admin/users` | All users |
| `GET` | `/api/admin/products` | All products |
| `POST` | `/api/admin/products` | Add product |
| `PUT` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Deactivate product |
| `GET` | `/api/admin/orders` | All orders (filterable by status) |
| `PUT` | `/api/admin/orders/:id/status` | Update order status |

**Order statuses:** `confirmed` → `packed` → `out_for_delivery` → `delivered` / `cancelled`

---

## 🌱 Seed Data

On first run `app.py` seeds the database with:

- **1 admin** user
- **9 categories** — Fruits & Veg, Dairy, Bakery, Snacks, Beverages, Meat & Fish, Frozen, Household, Personal Care
- **26 products** across all categories
- **3 coupon codes**

---

## 🔧 Environment Variables

### Backend
| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | Random on startup | JWT signing secret — set a fixed value in production |

### Frontend
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend base URL |

Create a `.env.local` file in the `frontend/` directory:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🏗️ Deployment Notes

- In production, set a stable `SECRET_KEY` env var on the backend so JWTs survive restarts.
- The Next.js proxy in `next.config.mjs` is for local dev. In production, point `NEXT_PUBLIC_API_URL` directly at your Flask server or use a reverse proxy (nginx).
- SQLite is fine for small/medium loads. For higher traffic, swap the db layer for PostgreSQL.

