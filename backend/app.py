"""
UR MART - Full Stack Grocery Delivery App
Backend: Flask + SQLite + JWT Authentication
"""

import os
import sqlite3
import hashlib
import jwt
import json
import time
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g

# ─── Config ───────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(BASE_DIR, "urmart.db")
FRONTEND   = os.path.join(BASE_DIR, "..", "frontend")
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
JWT_EXP_H  = 72   # token expires in 72 hours

app = Flask(__name__, static_folder=FRONTEND, static_url_path="")
app.config["SECRET_KEY"] = SECRET_KEY

# ─── CORS (manual, no flask-cors needed) ──────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    return response

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        return response, 200

# ─── Database ─────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db:
        db.close()

def query(sql, params=(), one=False):
    db  = get_db()
    cur = db.execute(sql, params)
    db.commit()
    if one:
        row = cur.fetchone()
        return dict(row) if row else None
    return [dict(r) for r in cur.fetchall()]

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    cur = db.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            phone       TEXT,
            password    TEXT NOT NULL,
            role        TEXT DEFAULT 'user',
            avatar      TEXT DEFAULT '',
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS addresses (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            label       TEXT DEFAULT 'Home',
            line1       TEXT NOT NULL,
            city        TEXT NOT NULL,
            state       TEXT NOT NULL,
            pincode     TEXT NOT NULL,
            is_default  INTEGER DEFAULT 0,
            created_at  TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS categories (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            emoji       TEXT NOT NULL,
            sort_order  INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS products (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT DEFAULT '',
            category_id TEXT NOT NULL,
            emoji       TEXT NOT NULL,
            brand       TEXT DEFAULT '',
            weight      TEXT DEFAULT '',
            price       REAL NOT NULL,
            mrp         REAL NOT NULL,
            discount    INTEGER DEFAULT 0,
            stock       INTEGER DEFAULT 100,
            rating      REAL DEFAULT 4.0,
            review_count INTEGER DEFAULT 0,
            is_active   INTEGER DEFAULT 1,
            created_at  TEXT NOT NULL,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS product_images (
            id          TEXT PRIMARY KEY,
            product_id  TEXT NOT NULL,
            url         TEXT NOT NULL,
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS cart (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            product_id  TEXT NOT NULL,
            qty         INTEGER NOT NULL DEFAULT 1,
            added_at    TEXT NOT NULL,
            UNIQUE(user_id, product_id),
            FOREIGN KEY(user_id)    REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS wishlist (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            product_id  TEXT NOT NULL,
            added_at    TEXT NOT NULL,
            UNIQUE(user_id, product_id),
            FOREIGN KEY(user_id)    REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            address_line    TEXT NOT NULL,
            city            TEXT NOT NULL,
            pincode         TEXT NOT NULL,
            phone           TEXT NOT NULL,
            subtotal        REAL NOT NULL,
            delivery_fee    REAL NOT NULL,
            discount        REAL NOT NULL,
            total           REAL NOT NULL,
            payment_method  TEXT NOT NULL,
            payment_status  TEXT DEFAULT 'pending',
            status          TEXT DEFAULT 'confirmed',
            notes           TEXT DEFAULT '',
            created_at      TEXT NOT NULL,
            updated_at      TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id          TEXT PRIMARY KEY,
            order_id    TEXT NOT NULL,
            product_id  TEXT NOT NULL,
            name        TEXT NOT NULL,
            emoji       TEXT NOT NULL,
            weight      TEXT NOT NULL,
            price       REAL NOT NULL,
            qty         INTEGER NOT NULL,
            FOREIGN KEY(order_id)   REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id          TEXT PRIMARY KEY,
            product_id  TEXT NOT NULL,
            user_id     TEXT NOT NULL,
            user_name   TEXT NOT NULL,
            rating      INTEGER NOT NULL,
            comment     TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(user_id)    REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS coupons (
            id          TEXT PRIMARY KEY,
            code        TEXT UNIQUE NOT NULL,
            type        TEXT NOT NULL,
            value       REAL NOT NULL,
            min_order   REAL DEFAULT 0,
            max_uses    INTEGER DEFAULT 100,
            used_count  INTEGER DEFAULT 0,
            expires_at  TEXT,
            is_active   INTEGER DEFAULT 1
        );
    """)
    db.commit()
    _seed(db)
    db.close()

# ─── Seed ─────────────────────────────────────────────────────────────────────
def _seed(db):
    # Admin user
    if not db.execute("SELECT 1 FROM users WHERE email='admin@urmart.com'").fetchone():
        db.execute("""INSERT INTO users VALUES (?,?,?,?,?,?,?,?)""",
            ("admin", "Admin", "admin@urmart.com", "9999999999",
             _hash("admin123"), "admin", "", _now()))

    # Categories
    cats = [
        ("fruits","Fruits & Veg","🥦",1),("dairy","Dairy & Eggs","🥛",2),
        ("bakery","Bakery","🍞",3),("snacks","Snacks","🍿",4),
        ("beverages","Beverages","🧃",5),("meat","Meat & Fish","🐟",6),
        ("frozen","Frozen","🧊",7),("household","Household","🧹",8),
        ("personal","Personal Care","🧴",9),
    ]
    for c in cats:
        if not db.execute("SELECT 1 FROM categories WHERE id=?", (c[0],)).fetchone():
            db.execute("INSERT INTO categories VALUES (?,?,?,?)", c)

    # Products
    products = [
        ("p1","Organic Avocados","Creamy organic avocados sourced from premium farms. Rich in healthy fats.","fruits","🥑","FreshFarms","4 pcs",349,420,17,50,4.5,128),
        ("p2","Baby Spinach","Tender baby spinach leaves, triple-washed and ready to eat.","fruits","🥬","GreenLeaf","200g",89,110,19,30,4.2,89),
        ("p3","Strawberries","Sweet, juicy strawberries picked at peak ripeness.","fruits","🍓","FreshFarms","500g",249,300,17,25,4.7,203),
        ("p4","Cherry Tomatoes","Sweet and tangy cherry tomatoes, perfect for salads.","fruits","🍅","OrganicCo","400g",129,150,14,40,4.3,67),
        ("p5","Alphonso Mango","The king of fruits. Naturally ripened alphonso mangoes.","fruits","🥭","MangoKing","1kg",199,240,17,35,4.9,623),
        ("p6","Whole Milk","Fresh whole milk from grass-fed cows. Rich and creamy.","dairy","🥛","MilkFresh","1L",75,80,6,100,4.6,312),
        ("p7","Free Range Eggs","Farm fresh free-range eggs. Hens raised in humane conditions.","dairy","🥚","HappyFarm","12 pcs",189,210,10,60,4.8,445),
        ("p8","Greek Yogurt","Thick, creamy Greek yogurt with live cultures. High in protein.","dairy","🫙","YogoLand","400g",149,180,17,45,4.4,98),
        ("p9","Cheddar Cheese","Aged sharp cheddar cheese. Perfect for sandwiches and cooking.","dairy","🧀","CheeseHouse","200g",299,340,12,35,4.5,176),
        ("p10","Butter","Creamy salted butter churned fresh from farm milk.","dairy","🧈","CreamyFarm","500g",299,330,9,45,4.7,398),
        ("p11","Sourdough Bread","Artisan sourdough baked fresh daily. Crispy crust, soft inside.","bakery","🍞","ArtisanBake","500g",199,230,13,20,4.7,234),
        ("p12","Croissants","Buttery, flaky croissants baked fresh every morning.","bakery","🥐","BoulangerieCo","4 pcs",249,280,11,15,4.6,189),
        ("p13","Blueberry Muffins","Moist blueberry muffins packed with real blueberries.","bakery","🧁","SweetBake","6 pcs",299,340,12,18,4.5,142),
        ("p14","Potato Chips","Classic salted potato chips, crispy and light.","snacks","🥔","CrispyCo","200g",99,120,18,80,4.2,567),
        ("p15","Trail Mix","Energizing trail mix with nuts, seeds, and dried fruits.","snacks","🥜","NutriSnack","300g",249,290,14,55,4.4,123),
        ("p16","Dark Chocolate","70% dark chocolate. Rich flavor, smooth texture.","snacks","🍫","ChocoCraft","100g",199,230,13,70,4.8,388),
        ("p17","Orange Juice","Freshly squeezed orange juice. No added sugar.","beverages","🍊","FreshSqueeze","1L",149,170,12,65,4.5,267),
        ("p18","Green Tea","Premium Japanese green tea. Rich in antioxidants.","beverages","🍵","TeaHouse","25 bags",199,240,17,90,4.6,198),
        ("p19","Sparkling Water","Natural sparkling mineral water. Refreshing and crisp.","beverages","💧","AquaFizz","6×500ml",249,280,11,75,4.3,134),
        ("p20","Chicken Breast","Boneless skinless chicken breast. Antibiotic-free.","meat","🍗","PrimeMeat","500g",349,400,13,30,4.6,312),
        ("p21","Salmon Fillet","Fresh Atlantic salmon fillet. Rich in Omega-3.","meat","🐟","OceanFresh","300g",599,680,12,20,4.7,198),
        ("p22","Frozen Peas","Sweet garden peas. Flash-frozen at peak freshness.","frozen","🫛","FrozenGarden","500g",99,120,18,60,4.2,145),
        ("p23","Vanilla Ice Cream","Rich, creamy vanilla ice cream with real vanilla beans.","frozen","🍦","ColdCraft","500ml",299,340,12,40,4.8,489),
        ("p24","Dish Soap","Powerful dish soap. Cuts through grease effortlessly.","household","🧴","CleanPro","750ml",129,150,14,85,4.3,234),
        ("p25","Laundry Detergent","Concentrated laundry detergent. Works in cold water.","household","🧺","WashWell","2kg",599,680,12,50,4.5,312),
        ("p26","Shampoo","Nourishing shampoo for all hair types. Sulfate-free.","personal","🚿","HairLux","400ml",349,400,13,65,4.4,267),
    ]
    for p in products:
        if not db.execute("SELECT 1 FROM products WHERE id=?", (p[0],)).fetchone():
            db.execute("""INSERT INTO products
                (id,name,description,category_id,emoji,brand,weight,price,mrp,discount,stock,rating,review_count,is_active,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)""", (*p, _now()))

    # Coupons
    coupons = [
        ("c1","WELCOME10","percent",10,0,1000,0,None,1),
        ("c2","SAVE50","flat",50,299,500,0,None,1),
        ("c3","FRESH20","percent",20,499,200,0,None,1),
    ]
    for c in coupons:
        if not db.execute("SELECT 1 FROM coupons WHERE id=?", (c[0],)).fetchone():
            db.execute("INSERT INTO coupons VALUES (?,?,?,?,?,?,?,?,?)", c)

    db.commit()

# ─── Helpers ──────────────────────────────────────────────────────────────────
def _now():
    return datetime.now(timezone.utc).isoformat()

def _id():
    return secrets.token_hex(8)

def _hash(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def make_token(user_id, role):
    payload = {
        "sub":  user_id,
        "role": role,
        "exp":  datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_H),
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def ok(data=None, msg="Success", **kwargs):
    r = {"success": True, "message": msg}
    if data is not None:
        r["data"] = data
    r.update(kwargs)
    return jsonify(r)

def err(msg, code=400):
    return jsonify({"success": False, "message": msg}), code

# ─── Auth Middleware ───────────────────────────────────────────────────────────
def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return err("Missing token", 401)
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user_id = payload["sub"]
            g.role    = payload["role"]
        except jwt.ExpiredSignatureError:
            return err("Token expired", 401)
        except jwt.InvalidTokenError:
            return err("Invalid token", 401)
        return f(*args, **kwargs)
    return wrapper

def require_admin(f):
    @wraps(f)
    @require_auth
    def wrapper(*args, **kwargs):
        if g.role != "admin":
            return err("Forbidden", 403)
        return f(*args, **kwargs)
    return wrapper

def product_row(p):
    """Format a product row for API response"""
    return {
        "id":          p["id"],
        "name":        p["name"],
        "description": p["description"],
        "category_id": p["category_id"],
        "emoji":       p["emoji"],
        "brand":       p["brand"],
        "weight":      p["weight"],
        "price":       p["price"],
        "mrp":         p["mrp"],
        "discount":    p["discount"],
        "stock":       p["stock"],
        "rating":      p["rating"],
        "review_count":p["review_count"],
        "is_active":   bool(p["is_active"]),
        "created_at":  p["created_at"],
    }

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json or {}
    name     = (d.get("name") or "").strip()
    email    = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""
    phone    = (d.get("phone") or "").strip()

    if not all([name, email, password]):
        return err("Name, email and password are required")
    if len(password) < 6:
        return err("Password must be at least 6 characters")
    if query("SELECT 1 FROM users WHERE email=?", (email,), one=True):
        return err("Email already registered")

    uid = _id()
    query("INSERT INTO users VALUES (?,?,?,?,?,?,?,?)",
          (uid, name, email, phone, _hash(password), "user", "", _now()))

    user = query("SELECT * FROM users WHERE id=?", (uid,), one=True)
    token = make_token(uid, "user")
    return ok({"token": token, "user": _safe_user(user)}, "Account created", code=201)


@app.route("/api/auth/login", methods=["POST"])
def login():
    d        = request.json or {}
    email    = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""

    user = query("SELECT * FROM users WHERE email=? AND password=?",
                 (email, _hash(password)), one=True)
    if not user:
        return err("Invalid email or password", 401)

    token = make_token(user["id"], user["role"])
    return ok({"token": token, "user": _safe_user(user)})


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    user = query("SELECT * FROM users WHERE id=?", (g.user_id,), one=True)
    if not user:
        return err("User not found", 404)
    return ok(_safe_user(user))


def _safe_user(u):
    return {k: v for k, v in u.items() if k != "password"}

# ═══════════════════════════════════════════════════════════════════════════════
# USER ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/users/profile", methods=["PUT"])
@require_auth
def update_profile():
    d    = request.json or {}
    name  = (d.get("name") or "").strip()
    phone = (d.get("phone") or "").strip()
    if not name:
        return err("Name is required")
    query("UPDATE users SET name=?, phone=? WHERE id=?", (name, phone, g.user_id))
    user = query("SELECT * FROM users WHERE id=?", (g.user_id,), one=True)
    return ok(_safe_user(user))


@app.route("/api/users/change-password", methods=["PUT"])
@require_auth
def change_password():
    d       = request.json or {}
    old_pw  = d.get("old_password") or ""
    new_pw  = d.get("new_password") or ""
    if len(new_pw) < 6:
        return err("New password must be at least 6 characters")
    user = query("SELECT * FROM users WHERE id=? AND password=?",
                 (g.user_id, _hash(old_pw)), one=True)
    if not user:
        return err("Old password is incorrect", 401)
    query("UPDATE users SET password=? WHERE id=?", (_hash(new_pw), g.user_id))
    return ok(msg="Password changed")

# ═══════════════════════════════════════════════════════════════════════════════
# ADDRESSES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/addresses", methods=["GET"])
@require_auth
def get_addresses():
    rows = query("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC", (g.user_id,))
    return ok(rows)

@app.route("/api/addresses", methods=["POST"])
@require_auth
def add_address():
    d = request.json or {}
    for f in ("line1","city","state","pincode"):
        if not d.get(f):
            return err(f"{f} is required")
    aid = _id()
    # If first address, make it default
    existing = query("SELECT COUNT(*) as c FROM addresses WHERE user_id=?", (g.user_id,), one=True)
    is_default = 1 if existing["c"] == 0 else 0
    query("INSERT INTO addresses VALUES (?,?,?,?,?,?,?,?,?)",
          (aid, g.user_id, d.get("label","Home"), d["line1"], d["city"],
           d["state"], d["pincode"], is_default, _now()))
    return ok(query("SELECT * FROM addresses WHERE id=?", (aid,), one=True))

@app.route("/api/addresses/<aid>", methods=["DELETE"])
@require_auth
def delete_address(aid):
    query("DELETE FROM addresses WHERE id=? AND user_id=?", (aid, g.user_id))
    return ok(msg="Address deleted")

@app.route("/api/addresses/<aid>/default", methods=["PUT"])
@require_auth
def set_default_address(aid):
    query("UPDATE addresses SET is_default=0 WHERE user_id=?", (g.user_id,))
    query("UPDATE addresses SET is_default=1 WHERE id=? AND user_id=?", (aid, g.user_id))
    return ok(msg="Default address set")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/categories", methods=["GET"])
def get_categories():
    rows = query("SELECT * FROM categories ORDER BY sort_order")
    return ok(rows)

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    search   = request.args.get("search", "").strip()
    sort     = request.args.get("sort", "default")
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    offset   = (page - 1) * per_page

    sql    = "SELECT * FROM products WHERE is_active=1"
    params = []

    if category:
        sql += " AND category_id=?";  params.append(category)
    if search:
        sql += " AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)"
        params += [f"%{search}%", f"%{search}%", f"%{search}%"]

    sort_map = {
        "price_asc":  "price ASC",
        "price_desc": "price DESC",
        "rating":     "rating DESC",
        "discount":   "discount DESC",
        "newest":     "created_at DESC",
        "default":    "review_count DESC",
    }
    sql += f" ORDER BY {sort_map.get(sort, 'review_count DESC')}"

    total = len(query(sql, params))
    sql  += f" LIMIT {per_page} OFFSET {offset}"
    rows  = query(sql, params)
    return ok([product_row(r) for r in rows], total=total, page=page, per_page=per_page)


@app.route("/api/products/<pid>", methods=["GET"])
def get_product(pid):
    p = query("SELECT * FROM products WHERE id=? AND is_active=1", (pid,), one=True)
    if not p:
        return err("Product not found", 404)
    cat  = query("SELECT * FROM categories WHERE id=?", (p["category_id"],), one=True)
    revs = query("SELECT * FROM reviews WHERE product_id=? ORDER BY created_at DESC LIMIT 20", (pid,))
    data = product_row(p)
    data["category"] = cat
    data["reviews"]  = revs
    return ok(data)


@app.route("/api/products/featured", methods=["GET"])
def featured_products():
    rows = query("SELECT * FROM products WHERE is_active=1 AND discount>=15 ORDER BY discount DESC LIMIT 8")
    return ok([product_row(r) for r in rows])


@app.route("/api/products/trending", methods=["GET"])
def trending_products():
    rows = query("SELECT * FROM products WHERE is_active=1 ORDER BY review_count DESC LIMIT 12")
    return ok([product_row(r) for r in rows])

# ═══════════════════════════════════════════════════════════════════════════════
# CART (server-side per user)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/cart", methods=["GET"])
@require_auth
def get_cart():
    rows = query("""
        SELECT c.id, c.qty, c.added_at,
               p.id as product_id, p.name, p.emoji, p.weight,
               p.price, p.mrp, p.discount, p.stock, p.brand
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id=?
        ORDER BY c.added_at DESC
    """, (g.user_id,))
    items = [dict(r) for r in rows]
    subtotal = sum(r["price"] * r["qty"] for r in items)
    delivery = 0 if subtotal >= 299 else 49
    discount = round(subtotal * 0.05)
    return ok({
        "items": items,
        "subtotal": subtotal,
        "delivery_fee": delivery,
        "loyalty_discount": discount,
        "total": subtotal + delivery - discount,
        "count": sum(r["qty"] for r in items),
    })


@app.route("/api/cart", methods=["POST"])
@require_auth
def add_to_cart():
    d      = request.json or {}
    pid    = d.get("product_id")
    qty    = int(d.get("qty", 1))
    if not pid:
        return err("product_id required")
    p = query("SELECT * FROM products WHERE id=? AND is_active=1", (pid,), one=True)
    if not p:
        return err("Product not found", 404)
    existing = query("SELECT * FROM cart WHERE user_id=? AND product_id=?", (g.user_id, pid), one=True)
    if existing:
        new_qty = existing["qty"] + qty
        if new_qty > p["stock"]:
            return err(f"Only {p['stock']} in stock")
        query("UPDATE cart SET qty=? WHERE id=?", (new_qty, existing["id"]))
    else:
        query("INSERT INTO cart VALUES (?,?,?,?,?)",
              (_id(), g.user_id, pid, qty, _now()))
    return ok(msg="Added to cart")


@app.route("/api/cart/<item_id>", methods=["PUT"])
@require_auth
def update_cart(item_id):
    d   = request.json or {}
    qty = int(d.get("qty", 1))
    if qty < 1:
        return err("qty must be >= 1")
    query("UPDATE cart SET qty=? WHERE id=? AND user_id=?", (qty, item_id, g.user_id))
    return ok(msg="Updated")


@app.route("/api/cart/<item_id>", methods=["DELETE"])
@require_auth
def remove_from_cart(item_id):
    query("DELETE FROM cart WHERE id=? AND user_id=?", (item_id, g.user_id))
    return ok(msg="Removed")


@app.route("/api/cart/clear", methods=["DELETE"])
@require_auth
def clear_cart():
    query("DELETE FROM cart WHERE user_id=?", (g.user_id,))
    return ok(msg="Cart cleared")


@app.route("/api/cart/sync", methods=["POST"])
@require_auth
def sync_cart():
    """Sync guest cart to server after login"""
    items = (request.json or {}).get("items", [])
    for item in items:
        pid = item.get("product_id")
        qty = int(item.get("qty", 1))
        if not pid:
            continue
        existing = query("SELECT * FROM cart WHERE user_id=? AND product_id=?", (g.user_id, pid), one=True)
        if existing:
            query("UPDATE cart SET qty=? WHERE id=?", (existing["qty"] + qty, existing["id"]))
        else:
            query("INSERT OR IGNORE INTO cart VALUES (?,?,?,?,?)", (_id(), g.user_id, pid, qty, _now()))
    return ok(msg="Synced")

# ═══════════════════════════════════════════════════════════════════════════════
# WISHLIST
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/wishlist", methods=["GET"])
@require_auth
def get_wishlist():
    rows = query("""
        SELECT p.id, p.name, p.emoji, p.weight, p.price, p.mrp, p.discount,
               p.brand, p.rating, p.review_count, p.stock, p.category_id, w.added_at
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id=?
        ORDER BY w.added_at DESC
    """, (g.user_id,))
    return ok(rows)


@app.route("/api/wishlist/<pid>", methods=["POST"])
@require_auth
def toggle_wishlist(pid):
    existing = query("SELECT id FROM wishlist WHERE user_id=? AND product_id=?", (g.user_id, pid), one=True)
    if existing:
        query("DELETE FROM wishlist WHERE id=?", (existing["id"],))
        return ok({"wishlisted": False}, "Removed from wishlist")
    else:
        query("INSERT INTO wishlist VALUES (?,?,?,?)", (_id(), g.user_id, pid, _now()))
        return ok({"wishlisted": True}, "Added to wishlist")

# ═══════════════════════════════════════════════════════════════════════════════
# REVIEWS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/products/<pid>/reviews", methods=["POST"])
@require_auth
def add_review(pid):
    d       = request.json or {}
    rating  = int(d.get("rating", 5))
    comment = (d.get("comment") or "").strip()
    if not comment:
        return err("Comment is required")
    if not (1 <= rating <= 5):
        return err("Rating must be 1-5")
    user = query("SELECT name FROM users WHERE id=?", (g.user_id,), one=True)
    rid  = _id()
    query("INSERT INTO reviews VALUES (?,?,?,?,?,?,?)",
          (rid, pid, g.user_id, user["name"], rating, comment, _now()))
    # Update product rating
    avg = query("SELECT AVG(rating) as a, COUNT(*) as c FROM reviews WHERE product_id=?", (pid,), one=True)
    query("UPDATE products SET rating=?, review_count=? WHERE id=?",
          (round(avg["a"], 1), avg["c"], pid))
    return ok(query("SELECT * FROM reviews WHERE id=?", (rid,), one=True))

# ═══════════════════════════════════════════════════════════════════════════════
# COUPONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/coupons/apply", methods=["POST"])
@require_auth
def apply_coupon():
    d    = request.json or {}
    code = (d.get("code") or "").strip().upper()
    amount = float(d.get("subtotal", 0))
    if not code:
        return err("Coupon code required")
    c = query("SELECT * FROM coupons WHERE code=? AND is_active=1", (code,), one=True)
    if not c:
        return err("Invalid or expired coupon")
    if amount < c["min_order"]:
        return err(f"Minimum order ₹{c['min_order']} required for this coupon")
    if c["max_uses"] and c["used_count"] >= c["max_uses"]:
        return err("Coupon usage limit reached")

    discount = 0
    if c["type"] == "percent":
        discount = round(amount * c["value"] / 100)
    elif c["type"] == "flat":
        discount = c["value"]

    return ok({"discount": discount, "coupon": dict(c)}, f"Coupon applied! Save ₹{discount}")

# ═══════════════════════════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/orders", methods=["POST"])
@require_auth
def place_order():
    d = request.json or {}
    addr    = d.get("address") or {}
    payment = d.get("payment_method", "cod")
    coupon  = d.get("coupon_code", "")
    notes   = d.get("notes", "")

    for f in ("line1","city","pincode","phone"):
        if not addr.get(f):
            return err(f"Address {f} is required")

    # Get cart
    cart_items = query("""
        SELECT c.qty, p.id as product_id, p.name, p.emoji, p.weight,
               p.price, p.stock
        FROM cart c JOIN products p ON c.product_id=p.id
        WHERE c.user_id=?
    """, (g.user_id,))

    if not cart_items:
        return err("Cart is empty")

    # Check stock
    for item in cart_items:
        if item["qty"] > item["stock"]:
            return err(f"Only {item['stock']} units of {item['name']} available")

    subtotal     = sum(i["price"] * i["qty"] for i in cart_items)
    delivery_fee = 0 if subtotal >= 299 else 49
    discount     = round(subtotal * 0.05)

    # Apply coupon
    coupon_discount = 0
    if coupon:
        c = query("SELECT * FROM coupons WHERE code=? AND is_active=1", (coupon.upper(),), one=True)
        if c and subtotal >= c["min_order"]:
            if c["type"] == "percent":
                coupon_discount = round(subtotal * c["value"] / 100)
            else:
                coupon_discount = c["value"]
            query("UPDATE coupons SET used_count=used_count+1 WHERE id=?", (c["id"],))

    total_discount = discount + coupon_discount
    total = subtotal + delivery_fee - total_discount

    oid = "ORD" + secrets.token_hex(4).upper()
    query("""INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
          (oid, g.user_id, addr["line1"], addr["city"], addr["pincode"], addr["phone"],
           subtotal, delivery_fee, total_discount, total, payment,
           "paid" if payment != "cod" else "pending",
           "confirmed", notes, _now(), _now()))

    for item in cart_items:
        query("INSERT INTO order_items VALUES (?,?,?,?,?,?,?,?)",
              (_id(), oid, item["product_id"], item["name"], item["emoji"],
               item["weight"], item["price"], item["qty"]))
        # Decrement stock
        query("UPDATE products SET stock=stock-? WHERE id=?", (item["qty"], item["product_id"]))

    # Clear cart
    query("DELETE FROM cart WHERE user_id=?", (g.user_id,))

    order = _get_full_order(oid)
    return ok(order, "Order placed successfully", code=201)


@app.route("/api/orders", methods=["GET"])
@require_auth
def get_orders():
    rows = query("""
        SELECT * FROM orders WHERE user_id=?
        ORDER BY created_at DESC
    """, (g.user_id,))
    result = []
    for row in rows:
        items = query("SELECT * FROM order_items WHERE order_id=?", (row["id"],))
        result.append({**dict(row), "items": items})
    return ok(result)


@app.route("/api/orders/<oid>", methods=["GET"])
@require_auth
def get_order(oid):
    order = _get_full_order(oid)
    if not order:
        return err("Order not found", 404)
    if order["user_id"] != g.user_id and g.role != "admin":
        return err("Forbidden", 403)
    return ok(order)


def _get_full_order(oid):
    o = query("SELECT * FROM orders WHERE id=?", (oid,), one=True)
    if not o:
        return None
    items = query("SELECT * FROM order_items WHERE order_id=?", (oid,))
    return {**o, "items": items}

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — USERS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/users", methods=["GET"])
@require_admin
def admin_users():
    rows = query("SELECT id,name,email,phone,role,created_at FROM users ORDER BY created_at DESC")
    return ok(rows)

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/products", methods=["GET"])
@require_admin
def admin_products():
    rows = query("SELECT * FROM products ORDER BY created_at DESC")
    return ok([product_row(r) for r in rows])


@app.route("/api/admin/products", methods=["POST"])
@require_admin
def admin_add_product():
    d = request.json or {}
    for f in ("name","category_id","price","mrp","emoji"):
        if not d.get(str(f)):
            return err(f"{f} is required")
    pid = _id()
    query("""INSERT INTO products
        (id,name,description,category_id,emoji,brand,weight,price,mrp,discount,stock,rating,review_count,is_active,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (pid, d["name"], d.get("description",""), d["category_id"],
         d["emoji"], d.get("brand",""), d.get("weight",""),
         float(d["price"]), float(d["mrp"]),
         int(d.get("discount",0)), int(d.get("stock",100)),
         float(d.get("rating",4.0)), 0, 1, _now()))
    return ok(product_row(query("SELECT * FROM products WHERE id=?", (pid,), one=True)), code=201)


@app.route("/api/admin/products/<pid>", methods=["PUT"])
@require_admin
def admin_update_product(pid):
    d = request.json or {}
    p = query("SELECT * FROM products WHERE id=?", (pid,), one=True)
    if not p:
        return err("Not found", 404)
    query("""UPDATE products SET name=?,description=?,category_id=?,emoji=?,brand=?,
             weight=?,price=?,mrp=?,discount=?,stock=?,is_active=? WHERE id=?""",
          (d.get("name",p["name"]), d.get("description",p["description"]),
           d.get("category_id",p["category_id"]), d.get("emoji",p["emoji"]),
           d.get("brand",p["brand"]), d.get("weight",p["weight"]),
           float(d.get("price",p["price"])), float(d.get("mrp",p["mrp"])),
           int(d.get("discount",p["discount"])), int(d.get("stock",p["stock"])),
           int(d.get("is_active",p["is_active"])), pid))
    return ok(product_row(query("SELECT * FROM products WHERE id=?", (pid,), one=True)))


@app.route("/api/admin/products/<pid>", methods=["DELETE"])
@require_admin
def admin_delete_product(pid):
    query("UPDATE products SET is_active=0 WHERE id=?", (pid,))
    return ok(msg="Product deactivated")

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — ORDERS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/orders", methods=["GET"])
@require_admin
def admin_orders():
    status = request.args.get("status")
    sql    = "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id=u.id"
    params = []
    if status:
        sql += " WHERE o.status=?"; params.append(status)
    sql += " ORDER BY o.created_at DESC"
    rows = query(sql, params)
    result = []
    for row in rows:
        items = query("SELECT * FROM order_items WHERE order_id=?", (row["id"],))
        result.append({**dict(row), "items": items})
    return ok(result)


@app.route("/api/admin/orders/<oid>/status", methods=["PUT"])
@require_admin
def admin_update_order_status(oid):
    d      = request.json or {}
    status = d.get("status")
    valid  = ["confirmed","packed","out_for_delivery","delivered","cancelled"]
    if status not in valid:
        return err(f"Status must be one of: {valid}")
    query("UPDATE orders SET status=?, updated_at=? WHERE id=?", (status, _now(), oid))
    return ok(msg=f"Order status updated to {status}")


@app.route("/api/admin/stats", methods=["GET"])
@require_admin
def admin_stats():
    users     = query("SELECT COUNT(*) as c FROM users WHERE role='user'", one=True)["c"]
    orders    = query("SELECT COUNT(*) as c FROM orders", one=True)["c"]
    revenue   = query("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status!='cancelled'", one=True)["s"]
    products  = query("SELECT COUNT(*) as c FROM products WHERE is_active=1", one=True)["c"]
    recent    = query("""
        SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id=u.id
        ORDER BY o.created_at DESC LIMIT 5
    """)
    top_prods = query("""
        SELECT p.name, p.emoji, SUM(oi.qty) as sold
        FROM order_items oi JOIN products p ON oi.product_id=p.id
        GROUP BY p.id ORDER BY sold DESC LIMIT 5
    """)
    by_status = query("""
        SELECT status, COUNT(*) as count FROM orders GROUP BY status
    """)
    return ok({
        "users": users, "orders": orders, "revenue": revenue,
        "products": products, "recent_orders": recent,
        "top_products": top_prods, "orders_by_status": by_status,
    })

# ═══════════════════════════════════════════════════════════════════════════════
# SERVE FRONTEND
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    full = os.path.join(FRONTEND, path)
    if path and os.path.exists(full):
        return send_from_directory(FRONTEND, path)
    return send_from_directory(FRONTEND, "index.html")

# ─── Boot ─────────────────────────────────────────────────────────────────────
init_db()

if __name__ == "__main__":
    print("\n" + "═"*50)
    print("  UR MART Backend — Flask + SQLite")
    print("  http://localhost:3000")
    print("  Admin: admin@urmart.com / admin123")
    print("═"*50 + "\n")
    app.run(debug=True, port=5000, host="0.0.0.0")
