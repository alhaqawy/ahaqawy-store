import React from "react";
import "./App.css";
import { supabase } from "./supabase";
import Login from "./Login.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

const products = [];

const categories = [
  { name: "المزيد", icon: "▦" },
  { name: "بطاقات Google", icon: "▶️" },
  { name: "بطاقات Apple", icon: "" },
  { name: "الاشتراكات", icon: "📺" },
  { name: "بطاقات الألعاب", icon: "🎮" },
];

function App() {

  const [storeProducts, setStoreProducts] = React.useState([]);
  const [productsLoading, setProductsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,icon,description,price,image_url,is_active,stock,created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("STORE PRODUCTS ERROR:", error);
        if (mounted) {
          setStoreProducts([]);
          setProductsLoading(false);
        }
        return;
      }

      if (mounted) {
        setStoreProducts(data || []);
        setProductsLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);


  const [cart, setCart] = React.useState([]);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [session, setSession] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [showLogin, setShowLogin] = React.useState(false);
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [showAccount, setShowAccount] = React.useState(false);


  React.useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentSession = data?.session ?? null;
      const currentUser = currentSession?.user ?? null;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select(
            "id,full_name,phone,email,account_type,is_active,is_admin,created_at,last_login_at,notes"
          )
          .eq("id", currentUser.id)
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error("PROFILE LOAD ERROR:", error);
            setProfile(null);
          } else {
            setProfile(profileData || null);
          }
        }
      } else {
        setProfile(null);
      }
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setShowAdmin(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,phone,email,account_type,is_active,is_admin,created_at,last_login_at,notes"
        )
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("PROFILE LOAD ERROR:", error);
        setProfile(null);
      } else {
        setProfile(profileData || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setShowAdmin(false);
    setShowAccount(false);
  }

  function handleAccountClick() {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (profile?.is_admin === true) {
      setShowAdmin(true);
      return;
    }

    setShowAccount(true);
  }

  const addToCart = (product) => {
    setCart((current) => [...current, product]);
  };

  if (showAdmin) {
    return (
      <AdminDashboard
        onExit={() => setShowAdmin(false)}
      />
    );
  }

  if (selectedProduct) {
    return (
      <div className="mobile-store" dir="rtl">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setSelectedProduct(null)}
          >
            ←
          </button>

          <div className="brand">
            <div className="brand-icon">🛍️</div>
            <strong>متجرنا</strong>
          </div>

          <div className="header-spacer" />
        </header>

        <main className="product-details">
          <button
            className="back-link"
            onClick={() => setSelectedProduct(null)}
          >
            → العودة للمنتجات
          </button>

          <div className="details-card">
            <div className="details-image">
              <span>{selectedProduct.icon}</span>
            </div>

            <div className="details-category">
              {selectedProduct.category}
            </div>

            <h1>{selectedProduct.name}</h1>

            <p>{selectedProduct.description}</p>

            <div className="details-price">
              SAR {selectedProduct.price}
            </div>

            <button
              className="primary-button details-cart"
              onClick={() => addToCart(selectedProduct)}
            >
              🛒 أضف للسلة
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mobile-store" dir="rtl">
      <header className="mobile-header">
        <button
          className="icon-button hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className="brand">
          <div>
            <strong>متجرنا</strong>
            <span>كل ما تحتاجه في مكان واحد</span>
          </div>
          <div className="brand-icon">🛍️</div>
        </div>

        <div className="header-actions">
          <button className="icon-button">⌕</button>

          <button className="cart-button">
            🛒
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <button>الرئيسية</button>
          <button>المنتجات</button>
          <button>العروض</button>
          <button>تواصل معنا</button>
        </div>
      )}

      <main>
        <section className="hero-mobile">
          <div className="hero-card-art">
            <div className="digital-card">DIGITAL STORE</div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">🔥 أفضل العروض الرقمية</div>

            <h1>
              بطاقاتك
              <br />
              واشتراكاتك
              <br />
              بكل سهولة
            </h1>

            <p>
              متجر رقمي لشراء بطاقات الشحن
              <br />
              والاشتراكات بسرعة وأمان.
            </p>

            <div className="hero-buttons">
              <button className="primary-button">
                تصفح المنتجات ←
              </button>

              <button className="secondary-button">
                مزيد من التفاصيل
              </button>
            </div>
          </div>
        </section>

        <div className="slider-dots">
          <span className="active" />
          <span />
          <span />
        </div>

        <section className="categories-mobile">
          {categories.map((category) => (
            <button className="category-card" key={category.name}>
              <span>{category.icon}</span>
              <strong>{category.name}</strong>
            </button>
          ))}
        </section>

        <section className="products-section">
          <div className="section-heading">
            <a href="#products">← عرض الكل</a>
            <h2>🔥 المنتجات الأكثر طلباً</h2>
          </div>

          <div className="products-mobile" id="products">
            {storeProducts.map((product) => (
              <article
                className="mobile-product-card"
                key={product.id}
                onClick={() => setSelectedProduct(product)}
              >
                <span className={`product-badge ${product.badgeType}`}>
                  {product.badge}
                </span>

                <button
                  className="favorite"
                  onClick={(e) => e.stopPropagation()}
                >
                  ♡
                </button>

                <div className={`product-image ${product.id === 3 ? "netflix" : ""}`}>
                  <span>{product.icon}</span>
                  {product.id === 1 && <small>Google Play</small>}
                  {product.id === 2 && <small>Apple</small>}
                  {product.id === 3 && <small>N</small>}
                  {product.id === 4 && <small>PS</small>}
                </div>

                <h3>{product.name}</h3>

                <p>{product.description}</p>

                <strong className="price">
                  SAR {product.price}
                </strong>

                <button
                  className="product-cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  🛒 أضف للسلة
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="benefits">
          <div>
            <span>⚡</span>
            <strong>تسليم فوري</strong>
            <small>خلال دقائق</small>
          </div>

          <div>
            <span>🛡️</span>
            <strong>دفع آمن</strong>
            <small>حماية 100%</small>
          </div>

          <div>
            <span>🎧</span>
            <strong>دعم العملاء</strong>
            <small>مستمر 24/7</small>
          </div>
        </section>
      </main>

      {showAccount && user && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "#fff",
            padding: "30px 20px",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => setShowAccount(false)}
            style={{
              border: 0,
              background: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <div style={{ fontSize: "48px" }}>♙</div>
            <h2>حسابي</h2>

            <p style={{ direction: "rtl", lineHeight: 1.8 }}>
              <strong>
                {profile?.full_name ||
                  user.user_metadata?.full_name ||
                  "العميل"}
              </strong>
              <br />
              {profile?.phone ||
                user.user_metadata?.phone ||
                ""}
              <br />
              {profile?.email || user.email || ""}
              <br />
              الحالة:{" "}
              {profile?.is_active === false
                ? "غير نشط"
                : "نشط"}
            </p>

            {profile?.is_admin === true && (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowAccount(false);
                  setShowAdmin(true);
                }}
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  marginBottom: "10px",
                }}
              >
                لوحة التحكم
              </button>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={handleLogout}
              style={{
                width: "100%",
                maxWidth: "360px",
              }}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}

      <nav className="bottom-nav">
        <button>
          <span>•••</span>
          المزيد
        </button>

        <button>
          <span>📦</span>
          الطلبات
        </button>

        <button className="active">
          <span>⌂</span>
          الرئيسية
        </button>

        <button>
          <span>♡</span>
          المفضلة
        </button>

        <button type="button" onClick={handleAccountClick}>
          <span>♙</span>
          حسابي
        </button>
      </nav>
    </div>
  );
}

export default App;
