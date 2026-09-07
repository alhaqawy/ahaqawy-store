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
  const [cartOpen, setCartOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("");
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

  const [paymentLoading, setPaymentLoading] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState("");
  const [moyasarOpen, setMoyasarOpen] = React.useState(false);
  const [moyasarOrder, setMoyasarOrder] = React.useState(null);

  async function handlePayment() {
    if (!user) {
      setPaymentError("يجب تسجيل الدخول أولاً");
      setShowLogin(true);
      return;
    }

    if (!cart.length || !paymentMethod) return;

    setPaymentLoading(true);
    setPaymentError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("انتهت جلسة تسجيل الدخول");
      }

      const response = await fetch(
        "https://ixliaqeyrsuclsyymvel.supabase.co/functions/v1/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            payment_method: paymentMethod,
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: 1,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "تعذر إنشاء الطلب");
      }

      console.log("ORDER CREATED:", result.order);

      setMoyasarOrder(result.order);
      setMoyasarOpen(true);
      setPaymentError("");
    } catch (error) {
      console.error("PAYMENT ERROR:", error);
      setPaymentError(error?.message || "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setPaymentLoading(false);
    }
  }

  React.useEffect(() => {
    async function verifyPaymentReturn() {
      const params = new URLSearchParams(window.location.search);
      const paymentReturn = params.get("payment_return");
      const orderId = params.get("order_id");
      const paymentId = params.get("id");

      if (paymentReturn !== "1" || !orderId || !paymentId) return;

      try {
        setPaymentLoading(true);
        setPaymentError("");

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          throw new Error("انتهت جلسة تسجيل الدخول");
        }

        const response = await fetch(
          "https://ixliaqeyrsuclsyymvel.supabase.co/functions/v1/verify-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              order_id: orderId,
              payment_id: paymentId,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "تعذر التحقق من عملية الدفع"
          );
        }

        alert(`تم الدفع بنجاح للطلب رقم ${orderId}`);

        setCart([]);
        setPaymentMethod("");
        setCartOpen(false);
        setMoyasarOpen(false);
        setMoyasarOrder(null);

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error("PAYMENT VERIFY ERROR:", error);
        setPaymentError(
          error?.message || "تعذر التحقق من عملية الدفع"
        );
      } finally {
        setPaymentLoading(false);
      }
    }

    verifyPaymentReturn();
  }, []);

  React.useEffect(() => {
    if (!moyasarOpen || !moyasarOrder || !window.Moyasar) return;

    const amount = Math.round(Number(moyasarOrder.total || 0) * 100);

    if (amount < 100) {
      setPaymentError("الحد الأدنى للدفع هو 1 SAR");
      return;
    }

    const formElement = document.querySelector(".mysr-form");
    if (!formElement) return;

    formElement.innerHTML = "";

    const publishableKey =
      import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;

    if (!publishableKey) {
      setPaymentError("مفتاح Moyasar غير موجود");
      return;
    }

    const baseConfig = {
      element: ".mysr-form",
      amount,
      currency: "SAR",
      description: `طلب متجرنا #${moyasarOrder.id}`,
      publishable_api_key: publishableKey,
      language: "ar",
      metadata: {
        order_id: String(moyasarOrder.id),
      },
      callback_url:
        `${window.location.origin}/?payment_return=1&order_id=${encodeURIComponent(
          moyasarOrder.id
        )}`,
      on_completed: function (payment) {
        console.log("MOYASAR PAYMENT COMPLETED:", payment);
      },
      on_failure: function (error) {
        console.error("MOYASAR PAYMENT FAILED:", error);
        setPaymentError("تعذر إتمام عملية الدفع");
      },
    };

    if (paymentMethod === "mada") {
      baseConfig.methods = ["creditcard"];
      baseConfig.supported_networks = ["mada"];
    } else if (paymentMethod === "visa") {
      baseConfig.methods = ["creditcard"];
      baseConfig.supported_networks = ["visa"];
    } else if (paymentMethod === "apple") {
      baseConfig.methods = ["applepay"];
      baseConfig.apple_pay = {
        country: "SA",
        label: "متجرنا",
        validate_merchant_url:
          "https://api.moyasar.com/v1/applepay/initiate",
      };
    } else {
      setPaymentError("وسيلة الدفع هذه لا تستخدم Moyasar حاليًا");
      return;
    }

    try {
      window.Moyasar.init(baseConfig);
    } catch (error) {
      console.error("MOYASAR INIT ERROR:", error);
      setPaymentError("تعذر فتح بوابة الدفع");
    }
  }, [moyasarOpen, moyasarOrder, paymentMethod]);

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

          <button
            type="button"
            className="cart-button"
            onClick={() => setCartOpen(true)}
          >
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

      {cartOpen && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9997,
            background: "#fff",
            padding: "24px 20px",
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            style={{
              border: 0,
              background: "none",
              fontSize: "28px",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div style={{ maxWidth: "600px", margin: "20px auto" }}>
            <h2 style={{ textAlign: "center" }}>🛒 سلة المشتريات</h2>

            {cart.length === 0 ? (
              <p style={{ textAlign: "center", marginTop: "50px" }}>
                السلة فارغة
              </p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px",
                      marginBottom: "10px",
                      background: "#f8f8ff",
                      borderRadius: "14px",
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <div>SAR {item.price}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCart((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                    >
                      حذف
                    </button>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    fontWeight: "700",
                  }}
                >
                  <span>الإجمالي</span>
                  <span>
                    SAR{" "}
                    {cart.reduce(
                      (total, item) => total + Number(item.price || 0),
                      0
                    )}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "28px",
                    paddingTop: "20px",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <h3 style={{ marginBottom: "14px" }}>
                    💳 اختر وسيلة الدفع
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    {[
                      ["mada", "💳 مدى"],
                      ["visa", "💳 Visa"],
                      ["apple", " Apple Pay"],
                      ["stc", "🏦 STC Bank"],
                      ["bank", "🏦 تحويل بنكي"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        style={{
                          padding: "14px 10px",
                          borderRadius: "14px",
                          border:
                            paymentMethod === value
                              ? "2px solid #4f46e5"
                              : "1px solid #ddd",
                          background:
                            paymentMethod === value
                              ? "#eef2ff"
                              : "#fff",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod && (
                    <>
                      {paymentError && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px",
                            borderRadius: "12px",
                            background: "#fff1f2",
                            color: "#be123c",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          {paymentError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="primary-button"
                        disabled={!paymentMethod || paymentLoading}
                        onClick={handlePayment}
                        style={{
                          width: "100%",
                          marginTop: "18px",
                          opacity: paymentMethod && !paymentLoading ? 1 : 0.5,
                        }}
                      >
                        {paymentLoading
                          ? "جاري إنشاء الطلب..."
                          : "متابعة الدفع ←"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {moyasarOpen && moyasarOrder && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "22px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <strong style={{ fontSize: "20px" }}>
                  💳 إتمام الدفع
                </strong>
                <div
                  style={{
                    marginTop: "5px",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  الطلب #{moyasarOrder.id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMoyasarOpen(false);
                  setMoyasarOrder(null);
                  setPaymentError("");
                }}
                style={{
                  border: "0",
                  background: "#f3f4f6",
                  borderRadius: "12px",
                  width: "40px",
                  height: "40px",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#f8f8ff",
                borderRadius: "14px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              الإجمالي: SAR {moyasarOrder.total}
            </div>

            {paymentError && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "12px",
                  background: "#fff1f2",
                  color: "#be123c",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                {paymentError}
              </div>
            )}

            <div className="mysr-form"></div>
          </div>
        </div>
      )}

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
